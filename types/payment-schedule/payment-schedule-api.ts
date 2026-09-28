import type { PaymentSchedule } from "./payment-schedule";

export type PaymentScheduleAssessmentService = {
  id: string;
  assessmentId: string;
  serviceId: string;
  serviceName: string;
  revenueCode: string;
};

export type PaymentScheduleListResponse = {
  data: {
    assessmentService: PaymentScheduleAssessmentService;
    schedules: PaymentSchedule[];
  };
};

export type PaymentScheduleCreateInvoiceRequest = {
  assessmentServiceId: string;
  paymentScheduleIds: string[];
};

export type PaymentScheduleCreateInvoiceResponse = {
  message: string;
  data: {
    invoice: {
      id: string;
      invoiceNumber: string;
      status: string;
    };
  };
};