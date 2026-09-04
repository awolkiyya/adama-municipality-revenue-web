"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  toast,
} from "sonner";

import type {
  RevenueSettingResponse,
  UpdateRevenueSettingPayload,
} from "@/types/revenue/revenueSetting";
import { revenueSettingService } from "@/services/revenue/evenueSettingService";



// =====================================================
// QUERY KEYS
// =====================================================

export const revenueSettingKeys = {

  /*
  |--------------------------------------------------------------------------
  | ROOT
  |--------------------------------------------------------------------------
  */

  all: [
    "revenue-settings",
  ],


  /*
  |--------------------------------------------------------------------------
  | ACTIVE SETTINGS
  |--------------------------------------------------------------------------
  */

  active: () => [
    ...revenueSettingKeys.all,
    "active",
  ],

};


// =====================================================
// GET ACTIVE REVENUE SETTINGS
// =====================================================
//
// GET /revenue/settings
//
// Returns the global Revenue Management configuration.
// =====================================================

export const useRevenueSettings = () => {

  return useQuery<
    RevenueSettingResponse
  >({

    queryKey:
      revenueSettingKeys.active(),

    queryFn:
      () =>
        revenueSettingService.getRevenueSettings(),

    staleTime:
      1000 * 60 * 5,

  });

};


// =====================================================
// UPDATE REVENUE SETTINGS
// =====================================================
//
// PUT /revenue/settings/{id}
//
// Updates the global Revenue Management configuration.
// =====================================================

export const useUpdateRevenueSettings = () => {

  const queryClient =
    useQueryClient();


  return useMutation({

    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateRevenueSettingPayload;
    }) =>
      revenueSettingService.updateRevenueSettings(
        id,
        data
      ),


    onSuccess: (
      response
    ) => {

      /*
      |--------------------------------------------------------------------------
      | Update Active Settings Cache
      |--------------------------------------------------------------------------
      */

      queryClient.setQueryData(
        revenueSettingKeys.active(),
        response
      );


      /*
      |--------------------------------------------------------------------------
      | Ensure Any Dependent Queries Refresh
      |--------------------------------------------------------------------------
      */

      queryClient.invalidateQueries({
        queryKey:
          revenueSettingKeys.all,
      });


      /*
      |--------------------------------------------------------------------------
      | Success Notification
      |--------------------------------------------------------------------------
      */

      toast.success(
        "Revenue settings updated successfully"
      );

    },

  });

};