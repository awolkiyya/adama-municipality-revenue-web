import { paymentScheduleService } from "@/services/payment-schedule/payment-schedule-service";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

export const paymentScheduleKeys = {
  all: ["payment-schedules"] as const,

  byAssessmentService: (assessmentServiceId: string) =>
    [
      ...paymentScheduleKeys.all,
      "assessment-service",
      assessmentServiceId,
    ] as const,
};

export function usePaymentSchedule(
  assessmentServiceId: string | undefined,
) {
  return useQuery({
    queryKey: assessmentServiceId
      ? paymentScheduleKeys.byAssessmentService(assessmentServiceId)
      : paymentScheduleKeys.all,

    queryFn: () =>
      paymentScheduleService.getByAssessmentService(
        assessmentServiceId!,
      ),

    enabled: Boolean(assessmentServiceId),

    select: (response) => response.data,
  });
}

export function useCreateInvoiceFromPaymentSchedules() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: paymentScheduleService.createInvoice,

    onSuccess: (_response, variables) => {
      queryClient.invalidateQueries({
        queryKey: paymentScheduleKeys.byAssessmentService(
          variables.assessmentServiceId,
        ),
      });
    },
  });
}