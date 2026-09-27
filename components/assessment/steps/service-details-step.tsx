import {
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Progress,
} from "@/components/ui/progress";

import {
  RevenueServiceFields,
} from "@/components/revenue/assessment/revenue-service-fields";

import type {
  RevenueService,
} from "@/types/revenue/assessment";

import type {
  FieldValue,
} from "@/types/assessment/assessment-form.types";

type ServiceDetailsStepProps = {
  selectedServices: RevenueService[];

  validationErrors: Record<
    string,
    string
  >;

  editMode: boolean;

  getServiceValues: (
    serviceId: string,
  ) => Record<string, FieldValue>;

  onServiceFieldValueChange: (
    serviceId: string,
    fieldKey: string,
    value: FieldValue,
  ) => void;

  /*
   * Keep this signature aligned with
   * useAssessmentFileFields().
   *
   * Hook:
   *   serviceId, field, event
   *
   * RevenueServiceFields:
   *   event, field
   */
  onFileChange: (
    serviceId: string,
    field: RevenueService["fields"][number],
    event: React.ChangeEvent<HTMLInputElement>,
  ) => void;

  /*
   * Remove a file from a service field.
   */
  onRemoveFile: (
    serviceId: string,
    field: RevenueService["fields"][number],
    index?: number,
    currentValue?: FieldValue,
  ) => void;

  /*
   * Remove the entire revenue service
   * from the assessment.
   */
  onRemoveService: (
    serviceId: string,
  ) => void;
};

export function ServiceDetailsStep({
  selectedServices,
  validationErrors,
  editMode,
  getServiceValues,
  onServiceFieldValueChange,
  onFileChange,
  onRemoveFile,
  onRemoveService,
}: ServiceDetailsStepProps) {
  /*
   * No service selected.
   */
  if (selectedServices.length === 0) {
    return (
      <Alert>
        <AlertCircle className="size-4" />

        <AlertTitle>
          No revenue service selected
        </AlertTitle>

        <AlertDescription>
          Go back to the Taxpayer & Services
          step and select at least one
          revenue service.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-5">
      {selectedServices.map(
        (service, index) => {
          const values =
            getServiceValues(
              service.id,
            );

          /*
           * Required fields for this service.
           */
          const requiredFields =
            (service.fields ?? []).filter(
              (field) =>
                field.required,
            );

          /*
           * Completed required fields.
           */
          const completedFields =
            requiredFields.filter(
              (field) =>
                !validationErrors[
                  `${service.id}.${field.key}`
                ],
            );

          /*
           * Service-level progress.
           */
          const serviceProgress =
            requiredFields.length > 0
              ? Math.round(
                  (completedFields.length /
                    requiredFields.length) *
                    100,
                )
              : 100;

          /*
           * Validation errors belonging
           * only to this service.
           */
          const serviceErrors =
            Object.entries(
              validationErrors,
            ).filter(
              ([key]) =>
                key.startsWith(
                  `${service.id}.`,
                ),
            );

          return (
            <Card
              key={service.id}
              className="overflow-hidden"
            >

              {/* ---------------------------------------------------------- */}
              {/* Service content */}
              {/* ---------------------------------------------------------- */}

              <CardContent className="pt-6">

                {/* -------------------------------------------------------- */}
                {/* Revenue service fields */}
                {/* -------------------------------------------------------- */}

                <RevenueServiceFields
                  service={service}
                  index={index}
                  values={values}
                  errors={
                    validationErrors
                  }
                  onChange={(
                    fieldKey,
                    value,
                  ) =>
                    onServiceFieldValueChange(
                      service.id,
                      fieldKey,
                      value,
                    )
                  }
                  /*
                   * RevenueServiceFields emits:
                   *
                   *   event, field
                   *
                   * Our parent handler expects:
                   *
                   *   serviceId, field, event
                   *
                   * So we adapt the arguments here.
                   */
                  onFileChange={(
                    event,
                    field,
                  ) =>
                    onFileChange(
                      service.id,
                      field,
                      event,
                    )
                  }
                  /*
                   * Remove one file from
                   * the current field.
                   */
                  onRemoveFile={(
                    field: RevenueService["fields"][number],
                    index?: number,
                  ) =>
                    onRemoveFile(
                      service.id,
                      field,
                      index,
                      values[
                        field.key
                      ],
                    )
                  }
                  /*
                   * Remove the entire service
                   * from the assessment.
                   */
                  onRemove={() =>
                    onRemoveService(
                      service.id,
                    )
                  }
                />
              </CardContent>
            </Card>
          );
        },
      )}
    </div>
  );
}
