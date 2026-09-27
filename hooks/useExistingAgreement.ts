"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react"

import type {
  ExistingAgreementForm,
  ExistingFinancialPosition,
  Step,
} from "@/types/existing-agreement"

import type {
  Citizen,
} from "@/types/citizen"

import type {
  RevenueService,
} from "@/types/revenue/assessment"

/*
|--------------------------------------------------------------------------
| Initial State
|--------------------------------------------------------------------------
*/

const INITIAL_AGREEMENT: ExistingAgreementForm = {
  taxpayerId: "",
  revenueServiceId: "",
  source: "",
  notes: "",
}

const INITIAL_FINANCIAL: ExistingFinancialPosition = {
  originalObligation: "",
  amountAlreadyPaid: "",
  balanceAsOfDate: "",
}

/*
|--------------------------------------------------------------------------
| Service Field Types
|--------------------------------------------------------------------------
*/

export type ServiceFieldValue =
  | string
  | number
  | boolean

export type ServiceFieldValues = Record<
  string,
  Record<string, ServiceFieldValue>
>

/*
|--------------------------------------------------------------------------
| Validation Types
|--------------------------------------------------------------------------
*/

export type ValidationErrors = {
  agreement?: Record<string, string>

  financial?: Record<string, string>

  service?: Record<
    string,
    Record<string, string>
  >
}

/*
|--------------------------------------------------------------------------
| Hook Options
|--------------------------------------------------------------------------
*/

export interface UseExistingAgreementOptions {
  taxpayers: Citizen[]

  revenueServices: RevenueService[]

  /**
   * Undefined = CREATE
   * Defined   = UPDATE
   */
  assessmentId?: string

  /**
   * Existing assessment returned from API.
   *
   * Used only in UPDATE mode.
   */
  initialData?: unknown
}

/*
|--------------------------------------------------------------------------
| Generic API Types
|--------------------------------------------------------------------------
*/

type UnknownRecord =
  Record<string, unknown>

/*
|--------------------------------------------------------------------------
| Generic Helpers
|--------------------------------------------------------------------------
*/

function isRecord(
  value: unknown,
): value is UnknownRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  )
}

function isEmptyValue(
  value: unknown,
): boolean {
  return (
    value === undefined ||
    value === null ||
    (
      typeof value === "string" &&
      value.trim() === ""
    )
  )
}

function toStringValue(
  value: unknown,
): string {
  if (
    value === undefined ||
    value === null
  ) {
    return ""
  }

  return String(value)
}

function firstValue(
  data: UnknownRecord,
  keys: readonly string[],
): unknown {
  for (
    const key of keys
  ) {
    const value =
      data[key]

    if (
      !isEmptyValue(
        value,
      )
    ) {
      return value
    }
  }

  return undefined
}

/*
|--------------------------------------------------------------------------
| Normalize Service Field Value
|--------------------------------------------------------------------------
*/

function normalizeServiceFieldValue(
  value: unknown,
): ServiceFieldValue {
  if (
    typeof value === "boolean"
  ) {
    return value
  }

  if (
    typeof value === "number"
  ) {
    return value
  }

  if (
    typeof value === "string"
  ) {
    return value
  }

  /*
   * Dynamic service fields are expected
   * to contain primitive values.
   *
   * Keep an unexpected value serializable
   * rather than breaking hydration.
   */
  return String(
    value ?? "",
  )
}

/*
|--------------------------------------------------------------------------
| Assessment Services
|--------------------------------------------------------------------------
|
| Actual API:
|
| data.services[]
|
*/

function getAssessmentServices(
  data: UnknownRecord,
): UnknownRecord[] {
  if (
    !Array.isArray(
      data.services,
    )
  ) {
    return []
  }

  return data.services.filter(
    isRecord,
  )
}

/*
|--------------------------------------------------------------------------
| Revenue Service ID
|--------------------------------------------------------------------------
|
| Actual API:
|
| data.services[0].revenueServiceId
|
| Fallbacks:
|
| serviceId
| service_id
| revenue_service_id
|
*/

function resolveRevenueServiceId(
  services: UnknownRecord[],
): string {
  const service =
    services[0]

  if (!service) {
    return ""
  }

  const value =
    firstValue(
      service,
      [
        "revenueServiceId",
        "revenue_service_id",
        "serviceId",
        "service_id",
      ],
    )

  return toStringValue(
    value,
  )
}

/*
|--------------------------------------------------------------------------
| Find Matching Revenue Service
|--------------------------------------------------------------------------
*/

function findRevenueService(
  revenueServices: RevenueService[],
  serviceId: string,
): RevenueService | null {
  if (!serviceId) {
    return null
  }

  return (
    revenueServices.find(
      (service) =>
        String(
          service.id,
        ) ===
        String(
          serviceId,
        ),
    ) ?? null
  )
}

/*
|--------------------------------------------------------------------------
| Revenue Service Fields
|--------------------------------------------------------------------------
*/

function getRevenueServiceFields(
  service: RevenueService | null,
): UnknownRecord[] {
  if (!service) {
    return []
  }

  const fields =
    (
      service as RevenueService & {
        fields?: unknown
      }
    ).fields

  if (
    !Array.isArray(
      fields,
    )
  ) {
    return []
  }

  return fields.filter(
    isRecord,
  )
}

/*
|--------------------------------------------------------------------------
| Normalize Identifier
|--------------------------------------------------------------------------
*/

function normalizeIdentifier(
  value: unknown,
): string {
  if (
    value === undefined ||
    value === null
  ) {
    return ""
  }

  return String(
    value,
  ).trim()
}

/*
|--------------------------------------------------------------------------
| Frontend Field Key
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| The canonical frontend key should be:
|
|   key
|   code
|   fieldCode
|   field_code
|   name
|
| before falling back to UUID.
|
| This is important because the API sends:
|
|   fieldCode: "LAND_AREA"
|
| and the form should normally use:
|
|   LAND_AREA: 200
|
| rather than:
|
|   <field UUID>: 200
|
*/

function getFrontendFieldKey(
  field: UnknownRecord,
): string {
  const candidates = [
    field.key,
    field.code,
    field.fieldCode,
    field.field_code,
    field.name,
  ]

  for (
    const candidate of candidates
  ) {
    const normalized =
      normalizeIdentifier(
        candidate,
      )

    if (
      normalized
    ) {
      return normalized
    }
  }

  /*
   * UUID is the final fallback only.
   */
  return normalizeIdentifier(
    firstValue(
      field,
      [
        "id",
        "fieldId",
        "field_id",
      ],
    ),
  )
}

/*
|--------------------------------------------------------------------------
| Field Identifiers
|--------------------------------------------------------------------------
|
| Used to match API field identifiers
| against frontend field definitions.
|
*/

function getFieldIdentifiers(
  field: UnknownRecord,
): string[] {
  const candidates = [
    /*
     * Business identifiers first.
     */
    field.key,
    field.code,
    field.fieldCode,
    field.field_code,
    field.name,

    /*
     * UUID identifiers afterward.
     */
    field.id,
    field.fieldId,
    field.field_id,
  ]

  const identifiers: string[] = []

  for (
    const candidate of candidates
  ) {
    const normalized =
      normalizeIdentifier(
        candidate,
      )

    if (
      normalized &&
      !identifiers.includes(
        normalized,
      )
    ) {
      identifiers.push(
        normalized,
      )
    }
  }

  return identifiers
}

/*
|--------------------------------------------------------------------------
| Case-Insensitive Identifier Match
|--------------------------------------------------------------------------
*/

function identifiersMatch(
  left: string,
  right: string,
): boolean {
  if (
    !left ||
    !right
  ) {
    return false
  }

  return (
    left.trim().toLowerCase() ===
    right.trim().toLowerCase()
  )
}

/*
|--------------------------------------------------------------------------
| Resolve Persisted Field → Frontend Field Key
|--------------------------------------------------------------------------
|
| API value:
|
| {
|   revenueServiceFieldId: "...",
|   fieldCode: "LAND_AREA",
|   value: 200
| }
|
| Frontend field:
|
| {
|   id: "...",
|   key: "LAND_AREA"
| }
|
| Result:
|
| LAND_AREA
|
*/

function resolveFormFieldKey(
  persistedFieldId: string,
  persistedFieldCode: string,
  fields: UnknownRecord[],
): string {
  /*
   * --------------------------------------------------------------
   * 1. Match fieldCode against business identifiers first.
   * --------------------------------------------------------------
   *
   * This is the preferred path because the API explicitly
   * provides fieldCode.
   */

  if (
    persistedFieldCode
  ) {
    for (
      const field of fields
    ) {
      const businessIdentifiers = [
        field.key,
        field.code,
        field.fieldCode,
        field.field_code,
        field.name,
      ]
        .map(
          normalizeIdentifier,
        )
        .filter(Boolean)

      const matched =
        businessIdentifiers.some(
          (
            identifier,
          ) =>
            identifiersMatch(
              identifier,
              persistedFieldCode,
            ),
        )

      if (
        matched
      ) {
        return getFrontendFieldKey(
          field,
        )
      }
    }
  }

  /*
   * --------------------------------------------------------------
   * 2. Match revenueServiceFieldId against UUID identifiers.
   * --------------------------------------------------------------
   */

  if (
    persistedFieldId
  ) {
    for (
      const field of fields
    ) {
      const uuidIdentifiers = [
        field.id,
        field.fieldId,
        field.field_id,
      ]
        .map(
          normalizeIdentifier,
        )
        .filter(Boolean)

      const matched =
        uuidIdentifiers.some(
          (
            identifier,
          ) =>
            identifiersMatch(
              identifier,
              persistedFieldId,
            ),
        )

      if (
        matched
      ) {
        return getFrontendFieldKey(
          field,
        )
      }
    }
  }

  /*
   * --------------------------------------------------------------
   * 3. General identifier matching.
   * --------------------------------------------------------------
   *
   * This handles unusual but valid frontend field structures.
   */

  if (
    persistedFieldCode
  ) {
    for (
      const field of fields
    ) {
      const identifiers =
        getFieldIdentifiers(
          field,
        )

      const matched =
        identifiers.some(
          (
            identifier,
          ) =>
            identifiersMatch(
              identifier,
              persistedFieldCode,
            ),
        )

      if (
        matched
      ) {
        return getFrontendFieldKey(
          field,
        )
      }
    }
  }

  /*
   * --------------------------------------------------------------
   * 4. Fallback to API fieldCode.
   * --------------------------------------------------------------
   *
   * This is important.
   *
   * Even if the frontend field definition cannot be matched,
   * the value should not disappear.
   */

  if (
    persistedFieldCode
  ) {
    return persistedFieldCode
  }

  /*
   * --------------------------------------------------------------
   * 5. Final fallback to persisted UUID.
   * --------------------------------------------------------------
   */

  return persistedFieldId
}

/*
|--------------------------------------------------------------------------
| Extract Actual API Service Values
|--------------------------------------------------------------------------
|
| ACTUAL API:
|
| services: [
|   {
|     revenueServiceId: "...",
|     values: [
|       {
|         id: "...",
|         assessmentServiceId: "...",
|         revenueServiceFieldId: "...",
|         fieldCode: "LAND_AREA",
|         value: 200,
|         displayValue: "200"
|       }
|     ]
|   }
| ]
|
| IMPORTANT:
|
| We use "value".
|
| We DO NOT use "displayValue".
|
*/

function extractServiceFieldValues(
  services: UnknownRecord[],
  revenueServiceId: string,
  revenueServices: RevenueService[],
): ServiceFieldValues {
  const result: ServiceFieldValues = {}

  if (
    !revenueServiceId
  ) {
    return result
  }

  /*
   * --------------------------------------------------------------
   * Find assessment service
   * --------------------------------------------------------------
   */

  const assessmentService =
    services.find(
      (
        service,
      ) => {
        const serviceId =
          firstValue(
            service,
            [
              "revenueServiceId",
              "revenue_service_id",
              "serviceId",
              "service_id",
            ],
          )

        return identifiersMatch(
          toStringValue(
            serviceId,
          ),
          revenueServiceId,
        )
      },
    )

  if (
    !assessmentService
  ) {
    return result
  }

  /*
   * --------------------------------------------------------------
   * Actual persisted values
   * --------------------------------------------------------------
   */

  const persistedValues =
    assessmentService.values

  if (
    !Array.isArray(
      persistedValues,
    )
  ) {
    return result
  }

  /*
   * --------------------------------------------------------------
   * Selected revenue service
   * --------------------------------------------------------------
   */

  const revenueService =
    findRevenueService(
      revenueServices,
      revenueServiceId,
    )

  const serviceFields =
    getRevenueServiceFields(
      revenueService,
    )

  /*
   * --------------------------------------------------------------
   * Build frontend values
   * --------------------------------------------------------------
   */

  const values:
    Record<
      string,
      ServiceFieldValue
    > = {}

  for (
    const persistedValue
    of persistedValues
  ) {
    if (
      !isRecord(
        persistedValue,
      )
    ) {
      continue
    }

    /*
     * API field UUID.
     */
    const fieldId =
      toStringValue(
        firstValue(
          persistedValue,
          [
            "revenueServiceFieldId",
            "revenue_service_field_id",
          ],
        ),
      )

    /*
     * API business field code.
     */
    const fieldCode =
      toStringValue(
        firstValue(
          persistedValue,
          [
            "fieldCode",
            "field_code",
          ],
        ),
      )

    /*
     * IMPORTANT:
     *
     * Use the actual value.
     *
     * Examples:
     *
     * 200
     * "1FFAA"
     * "2009-09-11"
     * true
     * 60
     * 99
     * "GIDDUTT_GALA_MAGNALAA_(CKD)"
     * "boolee , adama , oromia"
     * 12344
     */
    const rawValue =
      persistedValue.value

    /*
     * Do not silently convert null into an empty
     * field because null means no persisted value.
     */
    if (
      rawValue === undefined ||
      rawValue === null
    ) {
      continue
    }

    /*
     * --------------------------------------------------------------
     * Resolve API field → frontend field key
     * --------------------------------------------------------------
     */

    const formFieldKey =
      resolveFormFieldKey(
        fieldId,
        fieldCode,
        serviceFields,
      )

    if (
      !formFieldKey
    ) {
      continue
    }

    /*
     * --------------------------------------------------------------
     * Store normalized primitive value
     * --------------------------------------------------------------
     */

    values[
      formFieldKey
    ] =
      normalizeServiceFieldValue(
        rawValue,
      )
  }

  /*
   * --------------------------------------------------------------
   * IMPORTANT:
   *
   * Always initialize the service entry when the service exists,
   * even if there are currently no values.
   *
   * This makes create/update state predictable.
   * --------------------------------------------------------------
   */

  result[
    revenueServiceId
  ] = values

  return result
}

/*
|--------------------------------------------------------------------------
| Resolve Financial Value
|--------------------------------------------------------------------------
|
| Actual API:
|
| services[0].originalObligation
| services[0].paidAmount
| services[0].remainingAmount
| services[0].balanceAsOfDate
|
*/

function resolveFinancialValue(
  data: UnknownRecord,
  services: UnknownRecord[],
  keys: readonly string[],
): string {
  /*
   * --------------------------------------------------------------
   * Assessment level
   * --------------------------------------------------------------
   */

  const assessmentValue =
    firstValue(
      data,
      keys,
    )

  if (
    !isEmptyValue(
      assessmentValue,
    )
  ) {
    return toStringValue(
      assessmentValue,
    )
  }

  /*
   * --------------------------------------------------------------
   * Assessment service
   * --------------------------------------------------------------
   */

  const service =
    services[0]

  if (!service) {
    return ""
  }

  const serviceValue =
    firstValue(
      service,
      keys,
    )

  if (
    !isEmptyValue(
      serviceValue,
    )
  ) {
    return toStringValue(
      serviceValue,
    )
  }

  return ""
}

/*
|--------------------------------------------------------------------------
| Build Backend Service Fields
|--------------------------------------------------------------------------
|
| IMPORTANT ARCHITECTURE:
|
| Frontend state:
|
| {
|   LAND_AREA: 2000,
|   SADARKA_LAFAA: "1FFAA",
|   AGREEMENT_DATE: "2009-09-11"
| }
|
| Backend API expects:
|
| {
|   "<RevenueServiceField UUID>": 2000,
|   "<RevenueServiceField UUID>": "1FFAA",
|   "<RevenueServiceField UUID>": "2009-09-11"
| }
|
| Therefore this function performs the boundary translation:
|
| field.key → field.id
|
| We keep the frontend state readable and only convert it
| when building the API payload.
|
*/

function buildBackendServiceFields(
  service: RevenueService | null,
  values: Record<string, ServiceFieldValue>,
): Record<string, ServiceFieldValue> {
  if (!service) {
    return {}
  }

  const result:
    Record<
      string,
      ServiceFieldValue
    > = {}

  const fields =
    getRevenueServiceFields(
      service,
    )

  for (
    const field of fields
  ) {
    /*
     * RevenueServiceField UUID expected by Laravel.
     *
     * Example:
     *
     * 01a0a71b-d3e1-7012-818e-df7a5d1e10df
     */
    const fieldId =
      normalizeIdentifier(
        firstValue(
          field,
          [
            "id",
            "fieldId",
            "field_id",
          ],
        ),
      )

    /*
     * Frontend business key.
     *
     * Example:
     *
     * LAND_AREA
     */
    const fieldKey =
      getFrontendFieldKey(
        field,
      )

    /*
     * Ignore malformed field definitions.
     */
    if (
      !fieldId ||
      !fieldKey
    ) {
      continue
    }

    /*
     * Only include fields that actually exist
     * in the current form state.
     *
     * This prevents unrelated/default fields from
     * being sent accidentally.
     */
    if (
      !Object.prototype.hasOwnProperty.call(
        values,
        fieldKey,
      )
    ) {
      continue
    }

    /*
     * API key = RevenueServiceField UUID
     *
     * API value = existing frontend value
     */
    result[
      fieldId
    ] =
      values[
        fieldKey
      ]
  }

  return result
}

/*
|--------------------------------------------------------------------------
| Hook
|--------------------------------------------------------------------------
*/

export function useExistingAgreement({
  taxpayers,
  revenueServices,
  assessmentId,
  initialData,
}: UseExistingAgreementOptions) {
  /*
   *----------------------------------------------------------------------
   * Mode
   *----------------------------------------------------------------------
   */

  const isEditMode =
    Boolean(
      assessmentId,
    )

  /*
   *----------------------------------------------------------------------
   * Workflow
   *----------------------------------------------------------------------
   */

  const [
    currentStep,
    setCurrentStep,
  ] = useState<Step>(1)

  /*
   *----------------------------------------------------------------------
   * Agreement
   *----------------------------------------------------------------------
   */

  const [
    agreement,
    setAgreement,
  ] = useState<ExistingAgreementForm>(
    INITIAL_AGREEMENT,
  )

  /*
   *----------------------------------------------------------------------
   * Financial Position
   *----------------------------------------------------------------------
   */

  const [
    financial,
    setFinancial,
  ] = useState<ExistingFinancialPosition>(
    INITIAL_FINANCIAL,
  )

  /*
   *----------------------------------------------------------------------
   * Dynamic Service Fields
   *----------------------------------------------------------------------
   */

  const [
    serviceFieldValues,
    setServiceFieldValues,
  ] = useState<ServiceFieldValues>(
    {},
  )

  /*
   *----------------------------------------------------------------------
   * Validation
   *----------------------------------------------------------------------
   */

  const [
    validationErrors,
    setValidationErrors,
  ] = useState<ValidationErrors>(
    {},
  )

  /*
   *----------------------------------------------------------------------
   * Edit Hydration
   *----------------------------------------------------------------------
   */

  useEffect(() => {
    /*
     * CREATE MODE
     *
     * Never hydrate from initialData.
     */
    if (
      !isEditMode
    ) {
      return
    }

    /*
     * UPDATE MODE
     *
     * Wait until assessment API data exists.
     */
    if (
      !isRecord(
        initialData,
      )
    ) {
      return
    }

    const data =
      initialData

    /*
     * --------------------------------------------------------------
     * Assessment services
     * --------------------------------------------------------------
     */

    const services =
      getAssessmentServices(
        data,
      )

    /*
     * --------------------------------------------------------------
     * Taxpayer
     * --------------------------------------------------------------
     *
     * Actual API:
     *
     * citizenId
     */

    const taxpayerId =
      toStringValue(
        firstValue(
          data,
          [
            "citizenId",
            "citizen_id",
            "taxpayerId",
            "taxpayer_id",
          ],
        ),
      )

    /*
     * --------------------------------------------------------------
     * Revenue service
     * --------------------------------------------------------------
     *
     * Actual API:
     *
     * services[0].revenueServiceId
     */

    const revenueServiceId =
      resolveRevenueServiceId(
        services,
      )

    /*
     * --------------------------------------------------------------
     * Source
     * --------------------------------------------------------------
     */

    const source =
      toStringValue(
        firstValue(
          data,
          [
            "sourceType",
            "source_type",
            "source",
          ],
        ),
      )

    /*
     * --------------------------------------------------------------
     * Notes
     * --------------------------------------------------------------
     */

    const notes =
      toStringValue(
        firstValue(
          data,
          [
            "notes",
          ],
        ),
      )

    /*
     * --------------------------------------------------------------
     * Update agreement state
     * --------------------------------------------------------------
     */

    setAgreement({
      taxpayerId,
      revenueServiceId,
      source,
      notes,
    })

    /*
     * --------------------------------------------------------------
     * Financial position
     * --------------------------------------------------------------
     */

    const originalObligation =
      resolveFinancialValue(
        data,
        services,
        [
          "originalObligation",
          "original_obligation",
          "computedAmount",
          "computed_amount",
        ],
      )

    const amountAlreadyPaid =
      resolveFinancialValue(
        data,
        services,
        [
          "paidAmount",
          "paid_amount",
          "amountAlreadyPaid",
          "amount_already_paid",
        ],
      )

    const balanceAsOfDate =
      resolveFinancialValue(
        data,
        services,
        [
          "balanceAsOfDate",
          "balance_as_of_date",
        ],
      )

    setFinancial({
      originalObligation,
      amountAlreadyPaid,
      balanceAsOfDate,
    })

    /*
     * --------------------------------------------------------------
     * Dynamic service fields
     * --------------------------------------------------------------
     *
     * ACTUAL API:
     *
     * services[0].values[]
     *
     * Example:
     *
     * {
     *   fieldCode: "LAND_AREA",
     *   value: 200
     * }
     *
     * becomes:
     *
     * {
     *   [revenueServiceId]: {
     *     LAND_AREA: 200
     *   }
     * }
     * --------------------------------------------------------------
     */

    const hydratedServiceFields =
      extractServiceFieldValues(
        services,
        revenueServiceId,
        revenueServices,
      )

    setServiceFieldValues(
      hydratedServiceFields,
    )

    /*
     * Clear old validation errors after
     * successful API hydration.
     */
    setValidationErrors({})

  }, [
    isEditMode,
    initialData,
    revenueServices,
  ])

  /*
   *----------------------------------------------------------------------
   * Selected Taxpayer
   *----------------------------------------------------------------------
   */

  const selectedTaxpayer =
    useMemo<Citizen | null>(
      () => {
        if (
          !agreement.taxpayerId
        ) {
          return null
        }

        return (
          taxpayers.find(
            (
              taxpayer,
            ) =>
              String(
                taxpayer.id,
              ) ===
              String(
                agreement.taxpayerId,
              ),
          ) ?? null
        )
      },
      [
        taxpayers,
        agreement.taxpayerId,
      ],
    )

  /*
   *----------------------------------------------------------------------
   * Selected Revenue Service
   *----------------------------------------------------------------------
   */

  const selectedRevenueService =
    useMemo<RevenueService | null>(
      () => {
        return findRevenueService(
          revenueServices,
          agreement.revenueServiceId,
        )
      },
      [
        revenueServices,
        agreement.revenueServiceId,
      ],
    )

  /*
   *----------------------------------------------------------------------
   * Revenue Code
   *----------------------------------------------------------------------
   */

  const revenueCode =
    (
      selectedRevenueService as
        | (
            RevenueService & {
              code?: string
            }
          )
        | null
        | undefined
    )?.code ??
    ""

  /*
   *----------------------------------------------------------------------
   * Outstanding Balance
   *----------------------------------------------------------------------
   */

  const outstandingBalance =
    useMemo(() => {
      const original =
        Number(
          financial.originalObligation,
        )

      const paid =
        Number(
          financial.amountAlreadyPaid,
        )

      if (
        !Number.isFinite(
          original,
        ) ||
        !Number.isFinite(
          paid,
        )
      ) {
        return 0
      }

      return Math.max(
        0,
        original - paid,
      )
    }, [
      financial.originalObligation,
      financial.amountAlreadyPaid,
    ])

  /*
   *----------------------------------------------------------------------
   * Clear Agreement Error
   *----------------------------------------------------------------------
   */

  const clearAgreementError =
    useCallback(
      (
        field: string,
      ) => {
        setValidationErrors(
          (
            previous,
          ) => {
            if (
              !previous.agreement?.[
                field
              ]
            ) {
              return previous
            }

            const agreementErrors =
              {
                ...previous.agreement,
              }

            delete agreementErrors[
              field
            ]

            return {
              ...previous,
              agreement:
                Object.keys(
                  agreementErrors,
                ).length > 0
                  ? agreementErrors
                  : undefined,
            }
          },
        )
      },
      [],
    )

  /*
   *----------------------------------------------------------------------
   * Clear Financial Error
   *----------------------------------------------------------------------
   */

  const clearFinancialError =
    useCallback(
      (
        field: string,
      ) => {
        setValidationErrors(
          (
            previous,
          ) => {
            if (
              !previous.financial?.[
                field
              ]
            ) {
              return previous
            }

            const financialErrors =
              {
                ...previous.financial,
              }

            delete financialErrors[
              field
            ]

            return {
              ...previous,
              financial:
                Object.keys(
                  financialErrors,
                ).length > 0
                  ? financialErrors
                  : undefined,
            }
          },
        )
      },
      [],
    )

  /*
   *----------------------------------------------------------------------
   * Update Agreement
   *----------------------------------------------------------------------
   */

  const updateAgreement =
    useCallback(
      (
        field:
          keyof ExistingAgreementForm,
        value: string,
      ) => {
        setAgreement(
          (
            previous,
          ) => ({
            ...previous,
            [field]:
              value,
          }),
        )

        clearAgreementError(
          String(
            field,
          ),
        )
      },
      [
        clearAgreementError,
      ],
    )

  /*
   *----------------------------------------------------------------------
   * Update Financial
   *----------------------------------------------------------------------
   */

  const updateFinancial =
    useCallback(
      (
        field:
          keyof ExistingFinancialPosition,
        value: string,
      ) => {
        setFinancial(
          (
            previous,
          ) => ({
            ...previous,
            [field]:
              value,
          }),
        )

        clearFinancialError(
          String(
            field,
          ),
        )
      },
      [
        clearFinancialError,
      ],
    )

  /*
   *----------------------------------------------------------------------
   * Select Taxpayer
   *----------------------------------------------------------------------
   */

  const selectTaxpayer =
    useCallback(
      (
        taxpayerId: string,
      ) => {
        setAgreement(
          (
            previous,
          ) => ({
            ...previous,
            taxpayerId,
          }),
        )

        clearAgreementError(
          "taxpayerId",
        )
      },
      [
        clearAgreementError,
      ],
    )

  /*
   *----------------------------------------------------------------------
   * Clear Taxpayer
   *----------------------------------------------------------------------
   */

  const clearTaxpayer =
    useCallback(
      () => {
        setAgreement(
          (
            previous,
          ) => ({
            ...previous,
            taxpayerId: "",
          }),
        )

        clearAgreementError(
          "taxpayerId",
        )
      },
      [
        clearAgreementError,
      ],
    )

  /*
   *----------------------------------------------------------------------
   * Select Revenue Service
   *----------------------------------------------------------------------
   */

  const selectRevenueService =
    useCallback(
      (
        revenueServiceId: string,
      ) => {
        setAgreement(
          (
            previous,
          ) => ({
            ...previous,
            revenueServiceId,
          }),
        )

        if (
          !revenueServiceId
        ) {
          setServiceFieldValues(
            {},
          )

          setValidationErrors(
            (
              previous,
            ) => ({
              ...previous,
              service:
                undefined,
            }),
          )

          clearAgreementError(
            "revenueServiceId",
          )

          return
        }

        /*
         * Preserve existing hydrated values
         * when switching back to a service.
         */
        setServiceFieldValues(
          (
            previous,
          ) => ({
            ...previous,

            [revenueServiceId]:
              previous[
                revenueServiceId
              ] ?? {},
          }),
        )

        /*
         * Clear selected service errors.
         */
        setValidationErrors(
          (
            previous,
          ) => {
            const currentErrors =
              previous.service?.[
                revenueServiceId
              ]

            if (
              !currentErrors
            ) {
              return previous
            }

            const serviceErrors =
              {
                ...(
                  previous.service ??
                  {}
                ),
              }

            delete serviceErrors[
              revenueServiceId
            ]

            return {
              ...previous,
              service:
                Object.keys(
                  serviceErrors,
                ).length > 0
                  ? serviceErrors
                  : undefined,
            }
          },
        )

        clearAgreementError(
          "revenueServiceId",
        )
      },
      [
        clearAgreementError,
      ],
    )

  /*
   *----------------------------------------------------------------------
   * Set Service Field Value
   *----------------------------------------------------------------------
   */

  const setServiceFieldValue =
    useCallback(
      (
        serviceId: string,
        field: string,
        value: ServiceFieldValue,
      ) => {
        setServiceFieldValues(
          (
            previous,
          ) => ({
            ...previous,

            [serviceId]: {
              ...(previous[
                serviceId
              ] ?? {}),

              [field]:
                value,
            },
          }),
        )

        setValidationErrors(
          (
            previous,
          ) => {
            const serviceErrors =
              previous.service?.[
                serviceId
              ]

            if (
              !serviceErrors?.[
                field
              ]
            ) {
              return previous
            }

            const updatedErrors =
              {
                ...serviceErrors,
              }

            delete updatedErrors[
              field
            ]

            const nextServiceErrors =
              {
                ...(previous.service ??
                  {}),
                [serviceId]:
                  updatedErrors,
              }

            return {
              ...previous,
              service:
                Object.keys(
                  updatedErrors,
                ).length > 0
                  ? nextServiceErrors
                  : (() => {
                      const copy =
                        {
                          ...(previous.service ??
                            {}),
                        }

                      delete copy[
                        serviceId
                      ]

                      return Object.keys(
                        copy,
                      ).length > 0
                        ? copy
                        : undefined
                    })(),
            }
          },
        )
      },
      [],
    )

  /*
   *----------------------------------------------------------------------
   * File Change
   *----------------------------------------------------------------------
   */

  const handleFileChange =
    useCallback(
      (
        serviceId: string,
        field: string,
        file: File | null,
      ) => {
        /*
         * Dynamic service values currently contain
         * primitive values.
         *
         * Binary upload handling should remain
         * separate from service_fields.
         */
        setServiceFieldValue(
          serviceId,
          field,
          file?.name ?? "",
        )
      },
      [
        setServiceFieldValue,
      ],
    )

  /*
   *----------------------------------------------------------------------
   * Remove File
   *----------------------------------------------------------------------
   */

  const removeFile =
    useCallback(
      (
        serviceId: string,
        field: string,
      ) => {
        setServiceFieldValue(
          serviceId,
          field,
          "",
        )
      },
      [
        setServiceFieldValue,
      ],
    )

  /*
   *----------------------------------------------------------------------
   * Remove Service
   *----------------------------------------------------------------------
   */

  const removeService =
    useCallback(
      (
        serviceId: string,
      ) => {
        setServiceFieldValues(
          (
            previous,
          ) => {
            const next = {
              ...previous,
            }

            delete next[
              serviceId
            ]

            return next
          },
        )

        setValidationErrors(
          (
            previous,
          ) => {
            if (
              !previous.service?.[
                serviceId
              ]
            ) {
              return previous
            }

            const serviceErrors =
              {
                ...(previous.service ??
                  {}),
              }

            delete serviceErrors[
              serviceId
            ]

            return {
              ...previous,
              service:
                Object.keys(
                  serviceErrors,
                ).length > 0
                  ? serviceErrors
                  : undefined,
            }
          },
        )

        if (
          agreement.revenueServiceId ===
          serviceId
        ) {
          setAgreement(
            (
              previous,
            ) => ({
              ...previous,
              revenueServiceId:
                "",
            }),
          )

          clearAgreementError(
            "revenueServiceId",
          )
        }
      },
      [
        agreement.revenueServiceId,
        clearAgreementError,
      ],
    )

  /*
   *----------------------------------------------------------------------
   * Validate Agreement Step
   *----------------------------------------------------------------------
   */

  const validateAgreementStep =
    useCallback(
      (): ValidationErrors => {
        const agreementErrors:
          Record<
            string,
            string
          > = {}

        const serviceErrors:
          Record<
            string,
            string
          > = {}

        /*
         * Taxpayer
         */
        if (
          isEmptyValue(
            agreement.taxpayerId,
          )
        ) {
          agreementErrors.taxpayerId =
            "Please select a taxpayer."
        }

        /*
         * Revenue service
         */
        if (
          isEmptyValue(
            agreement.revenueServiceId,
          )
        ) {
          agreementErrors.revenueServiceId =
            "Please select a revenue service."
        }

        /*
         * Dynamic service fields
         */
        const service =
          selectedRevenueService

        const serviceId =
          agreement.revenueServiceId

        if (
          service &&
          serviceId
        ) {
          const values =
            serviceFieldValues[
              serviceId
            ] ?? {}

          const fields =
            getRevenueServiceFields(
              service,
            )

          for (
            const field of fields
          ) {
            const required =
              field.required === true ||
              field.is_required === true

            if (
              !required
            ) {
              continue
            }

            /*
             * Use exactly the same canonical
             * field key used by hydration.
             */
            const fieldKey =
              getFrontendFieldKey(
                field,
              )

            if (
              !fieldKey
            ) {
              continue
            }

            const value =
              values[
                fieldKey
              ]

            if (
              isEmptyValue(
                value,
              )
            ) {
              const label =
                firstValue(
                  field,
                  [
                    "label",
                    "name",
                    "key",
                    "code",
                    "fieldCode",
                  ],
                )

              serviceErrors[
                fieldKey
              ] =
                `${toStringValue(
                  label ||
                    fieldKey,
                )} is required.`
            }
          }
        }

        const result:
          ValidationErrors = {}

        if (
          Object.keys(
            agreementErrors,
          ).length > 0
        ) {
          result.agreement =
            agreementErrors
        }

        if (
          serviceId &&
          Object.keys(
            serviceErrors,
          ).length > 0
        ) {
          result.service = {
            [serviceId]:
              serviceErrors,
          }
        }

        return result
      },
      [
        agreement.taxpayerId,
        agreement.revenueServiceId,
        selectedRevenueService,
        serviceFieldValues,
      ],
    )

  /*
   *----------------------------------------------------------------------
   * Validate Financial Step
   *----------------------------------------------------------------------
   */

  const validateFinancialStep =
    useCallback(
      (): ValidationErrors => {
        const errors:
          Record<
            string,
            string
          > = {}

        /*
         * Original obligation
         */
        if (
          isEmptyValue(
            financial.originalObligation,
          )
        ) {
          errors.originalObligation =
            "Original obligation is required."
        } else {
          const value =
            Number(
              financial.originalObligation,
            )

          if (
            !Number.isFinite(
              value,
            ) ||
            value < 0
          ) {
            errors.originalObligation =
              "Original obligation must be a valid non-negative amount."
          }
        }

        /*
         * Amount already paid
         */
        if (
          isEmptyValue(
            financial.amountAlreadyPaid,
          )
        ) {
          errors.amountAlreadyPaid =
            "Amount already paid is required."
        } else {
          const value =
            Number(
              financial.amountAlreadyPaid,
            )

          if (
            !Number.isFinite(
              value,
            ) ||
            value < 0
          ) {
            errors.amountAlreadyPaid =
              "Amount already paid must be a valid non-negative amount."
          }
        }

        /*
         * Balance date
         */
        if (
          isEmptyValue(
            financial.balanceAsOfDate,
          )
        ) {
          errors.balanceAsOfDate =
            "Balance as of date is required."
        }

        /*
         * paid <= original
         */
        const original =
          Number(
            financial.originalObligation,
          )

        const paid =
          Number(
            financial.amountAlreadyPaid,
          )

        if (
          Number.isFinite(
            original,
          ) &&
          Number.isFinite(
            paid,
          ) &&
          original >= 0 &&
          paid >= 0 &&
          paid > original
        ) {
          errors.amountAlreadyPaid =
            "Amount already paid cannot exceed the original obligation."
        }

        if (
          Object.keys(
            errors,
          ).length === 0
        ) {
          return {}
        }

        return {
          financial:
            errors,
        }
      },
      [
        financial.originalObligation,
        financial.amountAlreadyPaid,
        financial.balanceAsOfDate,
      ],
    )

  /*
   *----------------------------------------------------------------------
   * Validate Review
   *----------------------------------------------------------------------
   */

  const validateReviewStep =
    useCallback(
      (): ValidationErrors => {
        return {}
      },
      [],
    )

  /*
   *----------------------------------------------------------------------
   * Validate Step
   *----------------------------------------------------------------------
   */

  const validateStep =
    useCallback(
      (
        step: Step,
      ): ValidationErrors => {
        switch (
          step
        ) {
          case 1:
            return validateAgreementStep()

          case 2:
            return validateFinancialStep()

          case 3:
            return validateReviewStep()

          default:
            return {}
        }
      },
      [
        validateAgreementStep,
        validateFinancialStep,
        validateReviewStep,
      ],
    )

  /*
   *----------------------------------------------------------------------
   * Has Validation Errors
   *----------------------------------------------------------------------
   */

  const hasValidationErrors =
    useCallback(
      (
        errors: ValidationErrors,
      ): boolean => {
        if (
          errors.agreement &&
          Object.keys(
            errors.agreement,
          ).length > 0
        ) {
          return true
        }

        if (
          errors.financial &&
          Object.keys(
            errors.financial,
          ).length > 0
        ) {
          return true
        }

        if (
          errors.service
        ) {
          return Object.values(
            errors.service,
          ).some(
            (
              serviceErrors,
            ) =>
              Object.keys(
                serviceErrors,
              ).length > 0,
          )
        }

        return false
      },
      [],
    )

  /*
   *----------------------------------------------------------------------
   * Validate All
   *----------------------------------------------------------------------
   */

  const validateAll =
    useCallback(
      (): boolean => {
        const agreementErrors =
          validateAgreementStep()

        if (
          hasValidationErrors(
            agreementErrors,
          )
        ) {
          setValidationErrors(
            agreementErrors,
          )

          setCurrentStep(
            1,
          )

          return false
        }

        const financialErrors =
          validateFinancialStep()

        if (
          hasValidationErrors(
            financialErrors,
          )
        ) {
          setValidationErrors(
            financialErrors,
          )

          setCurrentStep(
            2,
          )

          return false
        }

        const reviewErrors =
          validateReviewStep()

        if (
          hasValidationErrors(
            reviewErrors,
          )
        ) {
          setValidationErrors(
            reviewErrors,
          )

          setCurrentStep(
            3,
          )

          return false
        }

        setValidationErrors(
          {},
        )

        return true
      },
      [
        validateAgreementStep,
        validateFinancialStep,
        validateReviewStep,
        hasValidationErrors,
      ],
    )

  /*
   *----------------------------------------------------------------------
   * Next Step
   *----------------------------------------------------------------------
   */

  const nextStep =
    useCallback(
      () => {
        const errors =
          validateStep(
            currentStep,
          )

        if (
          hasValidationErrors(
            errors,
          )
        ) {
          setValidationErrors(
            errors,
          )

          return
        }

        setValidationErrors(
          {},
        )

        setCurrentStep(
          (
            previous,
          ) => {
            if (
              previous ===
              1
            ) {
              return 2
            }

            if (
              previous ===
              2
            ) {
              return 3
            }

            return previous
          },
        )
      },
      [
        currentStep,
        validateStep,
        hasValidationErrors,
      ],
    )

  /*
   *----------------------------------------------------------------------
   * Previous Step
   *----------------------------------------------------------------------
   */

  const previousStep =
    useCallback(
      () => {
        setValidationErrors(
          {},
        )

        setCurrentStep(
          (
            previous,
          ) => {
            if (
              previous ===
              3
            ) {
              return 2
            }

            if (
              previous ===
              2
            ) {
              return 1
            }

            return previous
          },
        )
      },
      [],
    )

  /*
   *----------------------------------------------------------------------
   * Go To Step
   *----------------------------------------------------------------------
   */

  const goToStep =
    useCallback(
      (
        targetStep: Step,
      ) => {
        if (
          targetStep ===
          currentStep
        ) {
          return
        }

        /*
         * Backward navigation.
         */
        if (
          targetStep <
          currentStep
        ) {
          setValidationErrors(
            {},
          )

          setCurrentStep(
            targetStep,
          )

          return
        }

        /*
         * Forward navigation.
         */
        for (
          let step =
            currentStep;
          step <
            targetStep;
          step++
        ) {
          const stepNumber =
            step as Step

          const errors =
            validateStep(
              stepNumber,
            )

          if (
            hasValidationErrors(
              errors,
            )
          ) {
            setValidationErrors(
              errors,
            )

            setCurrentStep(
              stepNumber,
            )

            return
          }
        }

        setValidationErrors(
          {},
        )

        setCurrentStep(
          targetStep,
        )
      },
      [
        currentStep,
        validateStep,
        hasValidationErrors,
      ],
    )

  /*
   *----------------------------------------------------------------------
   * Build Payload
   *----------------------------------------------------------------------
   |
   | IMPORTANT:
   |
   | serviceFieldValues uses frontend field keys:
   |
   | {
   |   LAND_AREA: 2000,
   |   SADARKA_LAFAA: "1FFAA"
   | }
   |
   | Laravel expects RevenueServiceField UUIDs:
   |
   | {
   |   "01a0a71b-...": 2000,
   |   "01a0a71b-...": "1FFAA"
   | }
   |
   | Convert here, at the API boundary.
   |
   */

  const buildPayload =
    useCallback(
      () => {
        const serviceId =
          agreement.revenueServiceId

        /*
         * Find the actual RevenueService definition
         * so we can resolve:
         *
         * frontend field.key → backend field.id
         */
        const selectedService =
          findRevenueService(
            revenueServices,
            serviceId,
          )

        /*
         * Current frontend field values.
         *
         * Example:
         *
         * {
         *   LAND_AREA: 2000,
         *   SADARKA_LAFAA: "1FFAA"
         * }
         */
        const frontendServiceFields =
          serviceId
            ? serviceFieldValues[
                serviceId
              ] ?? {}
            : {}

        /*
         * Convert frontend business keys into
         * RevenueServiceField UUIDs expected by Laravel.
         */
        const backendServiceFields =
          buildBackendServiceFields(
            selectedService,
            frontendServiceFields,
          )

        return {
          taxpayer_id:
            agreement.taxpayerId,

          revenue_service_id:
            serviceId,

          service_fields:
            backendServiceFields,

          source:
            agreement.source,

          notes:
            agreement.notes,

          original_obligation:
            financial.originalObligation,

          amount_already_paid:
            financial.amountAlreadyPaid,

          balance_as_of_date:
            financial.balanceAsOfDate,
        }
      },
      [
        agreement,
        financial,
        revenueServices,
        serviceFieldValues,
      ],
    )

  /*
   *----------------------------------------------------------------------
   * Build FormData
   *----------------------------------------------------------------------
   */

  const buildFormData =
    useCallback(
      (): FormData => {
        const payload =
          buildPayload()

        const formData =
          new FormData()

        formData.append(
          "taxpayer_id",
          payload.taxpayer_id,
        )

        formData.append(
          "revenue_service_id",
          payload.revenue_service_id,
        )

        formData.append(
          "service_fields",
          JSON.stringify(
            payload.service_fields,
          ),
        )

        formData.append(
          "source",
          payload.source,
        )

        formData.append(
          "notes",
          payload.notes,
        )

        formData.append(
          "original_obligation",
          payload.original_obligation,
        )

        formData.append(
          "amount_already_paid",
          payload.amount_already_paid,
        )

        formData.append(
          "balance_as_of_date",
          payload.balance_as_of_date,
        )

        return formData
      },
      [
        buildPayload,
      ],
    )

  /*
   *----------------------------------------------------------------------
   * Reset
   *----------------------------------------------------------------------
   */

  const resetForm =
    useCallback(
      () => {
        setCurrentStep(
          1,
        )

        setAgreement({
          ...INITIAL_AGREEMENT,
        })

        setFinancial({
          ...INITIAL_FINANCIAL,
        })

        setServiceFieldValues(
          {},
        )

        setValidationErrors(
          {},
        )
      },
      [],
    )

  /*
   *----------------------------------------------------------------------
   * Return API
   *----------------------------------------------------------------------
   */

  return {
    /*
     * Mode
     */
    isEditMode,
    assessmentId,

    /*
     * Workflow
     */
    currentStep,
    nextStep,
    previousStep,
    goToStep,

    /*
     * Validation
     */
    validationErrors,
    validateStep,
    validateAll,

    /*
     * Payload
     */
    buildPayload,
    buildFormData,

    /*
     * Reset
     */
    resetForm,

    /*
     * Agreement
     */
    agreement,
    updateAgreement,

    /*
     * Financial
     */
    financial,
    updateFinancial,

    /*
     * Taxpayer
     */
    taxpayers,
    selectedTaxpayer,
    selectTaxpayer,
    clearTaxpayer,

    /*
     * Revenue service
     */
    revenueServices,
    selectedRevenueService,
    revenueCode,
    selectRevenueService,

    /*
     * Dynamic service fields
     */
    serviceFieldValues,
    setServiceFieldValue,
    handleFileChange,
    removeFile,
    removeService,

    /*
     * Financial calculation for display only.
     *
     * Backend remains authoritative.
     */
    outstandingBalance,
  }
}