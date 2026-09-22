import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import {
  directCollectionService,
} from "@/services/revenue/direct-collection.service"

import type {
  CalculateDirectCollectionPayload,
  StoreDirectCollectionPayload,
  UpdateDirectCollectionPayload,
} from "@/types/revenue/direct-collection"

import type {
  DirectCollectionListParams,
} from "@/services/revenue/direct-collection.service"

/*
|--------------------------------------------------------------------------
| Query Keys
|--------------------------------------------------------------------------
*/

export const directCollectionKeys = {
  all: ["direct-collections"] as const,

  lists: () =>
    [
      ...directCollectionKeys.all,
      "list",
    ] as const,

  list: (
    params: DirectCollectionListParams = {},
  ) =>
    [
      ...directCollectionKeys.lists(),
      params,
    ] as const,

  details: () =>
    [
      ...directCollectionKeys.all,
      "detail",
    ] as const,

  detail: (invoiceId: string) =>
    [
      ...directCollectionKeys.details(),
      invoiceId,
    ] as const,
}

/*
|--------------------------------------------------------------------------
| Calculate
|--------------------------------------------------------------------------
*/

export function useCalculateDirectCollection() {
  return useMutation({
    mutationFn: (
      payload: CalculateDirectCollectionPayload,
    ) =>
      directCollectionService.calculate(
        payload,
      ),
  })
}

/*
|--------------------------------------------------------------------------
| Create
|--------------------------------------------------------------------------
*/

export function useCreateDirectCollection() {
  const queryClient =
    useQueryClient()

  return useMutation({
    mutationFn: (
      payload: StoreDirectCollectionPayload,
    ) =>
      directCollectionService.create(
        payload,
      ),

    onSuccess: (createdCollection) => {
      queryClient.invalidateQueries({
        queryKey:
          directCollectionKeys.lists(),
      })

      if (createdCollection?.id) {
        queryClient.setQueryData(
          directCollectionKeys.detail(
            createdCollection.id,
          ),
          createdCollection,
        )
      }
    },
  })
}

/*
|--------------------------------------------------------------------------
| Update
|--------------------------------------------------------------------------
*/

export function useUpdateDirectCollection() {
  const queryClient =
    useQueryClient()

  return useMutation({
    mutationFn: ({
      invoiceId,
      payload,
    }: {
      invoiceId: string
      payload: UpdateDirectCollectionPayload
    }) =>
      directCollectionService.update(
        invoiceId,
        payload,
      ),

    onSuccess: (updatedCollection) => {
      /*
      |--------------------------------------------------------------------------
      | Refresh list pages
      |--------------------------------------------------------------------------
      */

      queryClient.invalidateQueries({
        queryKey:
          directCollectionKeys.lists(),
      })

      /*
      |--------------------------------------------------------------------------
      | Update detail cache immediately
      |--------------------------------------------------------------------------
      */

      if (updatedCollection?.id) {
        queryClient.setQueryData(
          directCollectionKeys.detail(
            updatedCollection.id,
          ),
          updatedCollection,
        )
      }
    },
  })
}

/*
|--------------------------------------------------------------------------
| Get One
|--------------------------------------------------------------------------
*/

export function useDirectCollection(
  invoiceId?: string,
) {
  return useQuery({
    queryKey:
      invoiceId
        ? directCollectionKeys.detail(
            invoiceId,
          )
        : directCollectionKeys.detail(
            "",
          ),

    queryFn: () =>
      directCollectionService.get(
        invoiceId as string,
      ),

    enabled:
      Boolean(invoiceId),
  })
}

/*
|--------------------------------------------------------------------------
| List
|--------------------------------------------------------------------------
*/

export function useDirectCollections(
  params: DirectCollectionListParams = {},
) {
  return useQuery({
    queryKey:
      directCollectionKeys.list(
        params,
      ),

    queryFn: () =>
      directCollectionService.list(
        params,
      ),

    placeholderData: (
      previousData,
    ) => previousData,
  })
}
