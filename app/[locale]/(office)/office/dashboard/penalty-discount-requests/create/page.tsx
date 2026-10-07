"use client";

import PenaltyDiscountForm from "@/components/forms/penalty-discount-form";
import { useRouter } from "next/navigation";

export default function CreatePenaltyDiscountRequestPage() {
  const router = useRouter();

  const invoices = [
    {
      id: "inv-new-001",
      invoice_number: "INV-2018-000129",
      status: "OVERDUE" as const,
      citizen: {
        id: "cit-001",
        name: "Ahmed Hussein",
        phone: "+251911987654",
      },
      subtotal: 9000,
      penalty_amount: 1600,
      penalty_discount_amount: 0,
      interest_amount: 160,
      total_amount: 10760,
      paid_amount: 1500,
      balance_due: 9260,
      due_date: "2026-08-18",
    },

    {
      id: "inv-new-002",
      invoice_number: "INV-2018-000130",
      status: "OVERDUE" as const,
      citizen: {
        id: "cit-002",
        name: "Amina Yusuf",
        phone: "+251922876543",
      },
      subtotal: 12000,
      penalty_amount: 2400,
      penalty_discount_amount: 0,
      interest_amount: 240,
      total_amount: 14640,
      paid_amount: 4000,
      balance_due: 10640,
      due_date: "2026-08-12",
    },

    {
      id: "inv-new-003",
      invoice_number: "INV-2018-000131",
      status: "PARTIALLY_PAID" as const,
      citizen: {
        id: "cit-003",
        name: "Mulugeta Bekele",
        phone: "+251933765432",
      },
      subtotal: 18000,
      penalty_amount: 2800,
      penalty_discount_amount: 0,
      interest_amount: 280,
      total_amount: 21080,
      paid_amount: 5000,
      balance_due: 16080,
      due_date: "2026-08-22",
    },

    {
      id: "inv-new-004",
      invoice_number: "INV-2018-000132",
      status: "OVERDUE" as const,
      citizen: {
        id: "cit-004",
        name: "Khalid Omar",
        phone: "+251944321987",
      },
      subtotal: 15000,
      penalty_amount: 3000,
      penalty_discount_amount: 500,
      interest_amount: 300,
      total_amount: 17800,
      paid_amount: 2500,
      balance_due: 15300,
      due_date: "2026-08-05",
    },
  ];

  const handleSaveDraft = async (data: any) => {
    console.log("CREATE DRAFT", data);

    // API:
    // await api.post("/penalty-discount-requests", data);

    router.push("../");
  };

  const handleSubmit = async (data: any) => {
    console.log("CREATE + SUBMIT", data);

    // API:
    // await api.post("/penalty-discount-requests", {
    //   ...data,
    //   status: "SUBMITTED",
    // });

    router.push("../");
  };

  return (
    <PenaltyDiscountForm
      mode="create"
      invoices={invoices}
      onCancel={() => router.back()}
      onSaveDraft={handleSaveDraft}
      onSubmit={handleSubmit}
    />
  );
}