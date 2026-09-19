import {
    useMutation,
    useQuery,
    useQueryClient,
  } from "@tanstack/react-query";
  
  import {
    PaymentScheduleRule,
    PaymentScheduleRuleFilters,
    PaymentScheduleRulePayload,
    UpdatePaymentScheduleRulePayload,
    PaymentScheduleRuleSummary,
  } from "@/types/revenue/payment-schedule-rule";
  
  import {
    ApiResponse,
    ListResponse,
  } from "@/types/api";
  
  import { toast } from "sonner";
  
  import {
    paymentScheduleRuleService,
  } from "@/services/revenue/payment-schedule-rule-service";
  
  /*
  |--------------------------------------------------------------------------
  | QUERY KEYS
  |--------------------------------------------------------------------------
  */
  
  const PAYMENT_SCHEDULE_RULES_KEY =
    "payment-schedule-rules";
  
  /*
  |--------------------------------------------------------------------------
  | GET ALL PAYMENT SCHEDULE RULES
  |--------------------------------------------------------------------------
  */
  
  export const usePaymentScheduleRules = (
    filters?: PaymentScheduleRuleFilters,
    enabled = true,
  ) => {
    return useQuery<
      ListResponse<PaymentScheduleRule>
    >({
      queryKey: [
        PAYMENT_SCHEDULE_RULES_KEY,
        filters,
      ],
  
      queryFn: () =>
        paymentScheduleRuleService.getPaymentScheduleRules(
          filters,
        ),
  
      enabled,
  
      staleTime:
        1000 * 60 * 2,
    });
  };
  
  /*
  |--------------------------------------------------------------------------
  | GET SINGLE PAYMENT SCHEDULE RULE
  |--------------------------------------------------------------------------
  */
  
  export const usePaymentScheduleRule = (
    id: string,
    enabled = true,
  ) => {
    return useQuery<
      ApiResponse<PaymentScheduleRule>
    >({
      queryKey: [
        PAYMENT_SCHEDULE_RULES_KEY,
        id,
      ],
  
      queryFn: () =>
        paymentScheduleRuleService.getPaymentScheduleRuleById(
          id,
        ),
  
      enabled:
        enabled &&
        !!id,
  
      staleTime:
        1000 * 60 * 2,
    });
  };
  
  /*
  |--------------------------------------------------------------------------
  | GET PAYMENT SCHEDULE RULE SUMMARY
  |--------------------------------------------------------------------------
  */
  
  export const usePaymentScheduleRuleSummary = (
    enabled = true,
  ) => {
    return useQuery<
      ApiResponse<PaymentScheduleRuleSummary>
    >({
      queryKey: [
        PAYMENT_SCHEDULE_RULES_KEY,
        "summary",
      ],
  
      queryFn: () =>
        paymentScheduleRuleService.getPaymentScheduleRuleSummary(),
  
      enabled,
  
      staleTime:
        1000 * 60 * 2,
    });
  };
  
  /*
  |--------------------------------------------------------------------------
  | CREATE PAYMENT SCHEDULE RULE
  |--------------------------------------------------------------------------
  */
  
  export const useCreatePaymentScheduleRule = () => {
    const queryClient =
      useQueryClient();
  
    return useMutation({
      mutationFn: (
        data: PaymentScheduleRulePayload,
      ) =>
        paymentScheduleRuleService.createPaymentScheduleRule(
          data,
        ),
  
      onSuccess: () => {
        /*
        |--------------------------------------------------------------------------
        | Refresh payment schedule rules
        |--------------------------------------------------------------------------
        */
  
        queryClient.invalidateQueries({
          queryKey: [
            PAYMENT_SCHEDULE_RULES_KEY,
          ],
        });
  
        /*
        |--------------------------------------------------------------------------
        | Refresh summary
        |--------------------------------------------------------------------------
        */
  
        queryClient.invalidateQueries({
          queryKey: [
            PAYMENT_SCHEDULE_RULES_KEY,
            "summary",
          ],
        });
  
        toast.success(
          "Payment schedule rule created successfully",
        );
      },
    });
  };
  
  /*
  |--------------------------------------------------------------------------
  | UPDATE PAYMENT SCHEDULE RULE
  |--------------------------------------------------------------------------
  */
  
  export const useUpdatePaymentScheduleRule = () => {
    const queryClient =
      useQueryClient();
  
    return useMutation({
      mutationFn: ({
        id,
        data,
      }: {
        id: string;
        data: UpdatePaymentScheduleRulePayload;
      }) =>
        paymentScheduleRuleService.updatePaymentScheduleRule(
          id,
          data,
        ),
  
      onSuccess: (_, variables) => {
        /*
        |--------------------------------------------------------------------------
        | Refresh payment schedule rules
        |--------------------------------------------------------------------------
        */
  
        queryClient.invalidateQueries({
          queryKey: [
            PAYMENT_SCHEDULE_RULES_KEY,
          ],
        });
  
        /*
        |--------------------------------------------------------------------------
        | Refresh individual rule
        |--------------------------------------------------------------------------
        */
  
        queryClient.invalidateQueries({
          queryKey: [
            PAYMENT_SCHEDULE_RULES_KEY,
            variables.id,
          ],
        });
  
        /*
        |--------------------------------------------------------------------------
        | Refresh summary
        |--------------------------------------------------------------------------
        */
  
        queryClient.invalidateQueries({
          queryKey: [
            PAYMENT_SCHEDULE_RULES_KEY,
            "summary",
          ],
        });
  
        toast.success(
          "Payment schedule rule updated successfully",
        );
      },
    });
  };
  
  /*
  |--------------------------------------------------------------------------
  | ACTIVATE PAYMENT SCHEDULE RULE
  |--------------------------------------------------------------------------
  */
  
  export const useActivatePaymentScheduleRule = () => {
    const queryClient =
      useQueryClient();
  
    return useMutation({
      mutationFn: (
        id: string,
      ) =>
        paymentScheduleRuleService.activatePaymentScheduleRule(
          id,
        ),
  
      onSuccess: (_, id) => {
        /*
        |--------------------------------------------------------------------------
        | Refresh payment schedule rules
        |--------------------------------------------------------------------------
        */
  
        queryClient.invalidateQueries({
          queryKey: [
            PAYMENT_SCHEDULE_RULES_KEY,
          ],
        });
  
        /*
        |--------------------------------------------------------------------------
        | Refresh individual rule
        |--------------------------------------------------------------------------
        */
  
        queryClient.invalidateQueries({
          queryKey: [
            PAYMENT_SCHEDULE_RULES_KEY,
            id,
          ],
        });
  
        /*
        |--------------------------------------------------------------------------
        | Refresh summary
        |--------------------------------------------------------------------------
        */
  
        queryClient.invalidateQueries({
          queryKey: [
            PAYMENT_SCHEDULE_RULES_KEY,
            "summary",
          ],
        });
  
        toast.success(
          "Payment schedule rule activated successfully",
        );
      },
    });
  };
  
  /*
  |--------------------------------------------------------------------------
  | DEACTIVATE PAYMENT SCHEDULE RULE
  |--------------------------------------------------------------------------
  */
  
  export const useDeactivatePaymentScheduleRule = () => {
    const queryClient =
      useQueryClient();
  
    return useMutation({
      mutationFn: (
        id: string,
      ) =>
        paymentScheduleRuleService.deactivatePaymentScheduleRule(
          id,
        ),
  
      onSuccess: (_, id) => {
        /*
        |--------------------------------------------------------------------------
        | Refresh payment schedule rules
        |--------------------------------------------------------------------------
        */
  
        queryClient.invalidateQueries({
          queryKey: [
            PAYMENT_SCHEDULE_RULES_KEY,
          ],
        });
  
        /*
        |--------------------------------------------------------------------------
        | Refresh individual rule
        |--------------------------------------------------------------------------
        */
  
        queryClient.invalidateQueries({
          queryKey: [
            PAYMENT_SCHEDULE_RULES_KEY,
            id,
          ],
        });
  
        /*
        |--------------------------------------------------------------------------
        | Refresh summary
        |--------------------------------------------------------------------------
        */
  
        queryClient.invalidateQueries({
          queryKey: [
            PAYMENT_SCHEDULE_RULES_KEY,
            "summary",
          ],
        });
  
        toast.success(
          "Payment schedule rule deactivated successfully",
        );
      },
    });
  };