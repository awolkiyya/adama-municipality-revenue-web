import { api } from "@/lib/api"

import type {
  CalculateDirectCollectionPayload,
  DirectCollectionApiResponse,
  DirectCollectionCalculation,
  DirectCollectionInvoice,
  StoreDirectCollectionPayload,
  UpdateDirectCollectionPayload,
} from "@/types/revenue/direct-collection"

/*
|--------------------------------------------------------------------------
| Direct Collection Service
|--------------------------------------------------------------------------
*/

const BASE_URL = "/direct-collections"

/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

export interface DirectCollectionListParams {
  page?: number
  per_page?: number

  search?: string
  status?: string

  taxpayer_id?: string
  revenue_service_id?: string

  from_date?: string
  to_date?: string
}

export interface DirectCollectionPaginationMeta {
  current_page: number
  per_page: number
  last_page: number
  total: number

  from: number | null
  to: number | null
}

export interface DirectCollectionListResponse {
  data: DirectCollectionInvoice[]
  meta: DirectCollectionPaginationMeta
}

/*
|--------------------------------------------------------------------------
| API Response
|--------------------------------------------------------------------------
*/

interface DirectCollectionListApiResponse {
  success: boolean
  message: string
  data: DirectCollectionInvoice[]
  meta: DirectCollectionPaginationMeta
}

/*
|--------------------------------------------------------------------------
| Service
|--------------------------------------------------------------------------
*/

export const directCollectionService = {
  /*
  |--------------------------------------------------------------------------
  | Calculate
  |--------------------------------------------------------------------------
  */

  async calculate(
    payload: CalculateDirectCollectionPayload,
  ): Promise<DirectCollectionCalculation> {
    const response =
      await api.post<
        DirectCollectionApiResponse<DirectCollectionCalculation>
      >(
        `${BASE_URL}/calculate`,
        payload,
      )

    return response.data.data
  },

  /*
  |--------------------------------------------------------------------------
  | Create
  |--------------------------------------------------------------------------
  */

  async create(
    payload: StoreDirectCollectionPayload,
  ): Promise<DirectCollectionInvoice> {
    const response =
      await api.post<
        DirectCollectionApiResponse<DirectCollectionInvoice>
      >(
        BASE_URL,
        payload,
      )

    return response.data.data
  },

  /*
  |--------------------------------------------------------------------------
  | Update
  |--------------------------------------------------------------------------
  |
  | Updates an existing unpaid ISSUED direct collection.
  |
  | Backend recalculates the amount and updates the
  | existing invoice/item.
  |
  |--------------------------------------------------------------------------
  */

  async update(
    invoiceId: string,
    payload: UpdateDirectCollectionPayload,
  ): Promise<DirectCollectionInvoice> {
    const response =
      await api.put<
        DirectCollectionApiResponse<DirectCollectionInvoice>
      >(
        `${BASE_URL}/${invoiceId}`,
        payload,
      )

    return response.data.data
  },

  /*
  |--------------------------------------------------------------------------
  | Get One
  |--------------------------------------------------------------------------
  */

  async get(
    invoiceId: string,
  ): Promise<DirectCollectionInvoice> {
    const response =
      await api.get<
        DirectCollectionApiResponse<DirectCollectionInvoice>
      >(
        `${BASE_URL}/${invoiceId}`,
      )

    return response.data.data
  },

  /*
  |--------------------------------------------------------------------------
  | List
  |--------------------------------------------------------------------------
  */

  async list(
    params: DirectCollectionListParams = {},
  ): Promise<DirectCollectionListResponse> {
    const response =
      await api.get<DirectCollectionListApiResponse>(
        BASE_URL,
        {
          params: {
            page: params.page ?? 1,
            per_page: params.per_page ?? 20,

            ...(params.search
              ? {
                  search: params.search,
                }
              : {}),

            ...(params.status
              ? {
                  status: params.status,
                }
              : {}),

            ...(params.taxpayer_id
              ? {
                  taxpayer_id:
                    params.taxpayer_id,
                }
              : {}),

            ...(params.revenue_service_id
              ? {
                  revenue_service_id:
                    params.revenue_service_id,
                }
              : {}),

            ...(params.from_date
              ? {
                  from_date:
                    params.from_date,
                }
              : {}),

            ...(params.to_date
              ? {
                  to_date:
                    params.to_date,
                }
              : {}),
          },
        },
      )

    return {
      data: response.data.data,
      meta: response.data.meta,
    }
  },
}
