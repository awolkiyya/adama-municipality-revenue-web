import PaymentResultPage from "@/components/payment/PaymentResultPage";
import { mockFailedPayment } from "@/data/payment-result.mock";

export default function PaymentFailedPage() {
  return (
    <PaymentResultPage
      status="failed"
      payment={mockFailedPayment}
      invoiceUrl="/invoices"
      dashboardUrl="/"
    />
  );
}