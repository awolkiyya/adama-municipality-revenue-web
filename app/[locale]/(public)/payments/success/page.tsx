import PaymentResultPage from "@/components/payment/PaymentResultPage";
import { mockSuccessfulPayment } from "@/data/payment-result.mock";

export default function PaymentSuccessPage() {
  return (
    <PaymentResultPage
      status="success"
      payment={mockSuccessfulPayment}
      invoiceUrl="/invoices"
      dashboardUrl="/"
    />
  );
}