"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PenaltyDiscountForm from "@/components/forms/penalty-discount-form";

export default function EditPenaltyDiscountRequestPage() {
  const router = useRouter();
  const params = useParams();

  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState<any>(null);

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

    // ...
  ];

  useEffect(() => {
    const loadRequest = async () => {
      try {
        console.log("Loading request:", id);

        // API example:
        //
        // const response = await api.get(
        //   `/penalty-discount-requests/${id}`
        // );
        //
        // setRequest(response.data.data);

        // Temporary mock:
        setRequest({
          id: "pdr-001",

          invoice: invoices[0],

          requestedAmount: 500,

          reason:
            "The taxpayer has requested a penalty reduction due to delayed payment caused by an exceptional circumstance.",

          supportingFileName: "supporting-document.pdf",
        });
      } finally {
        setLoading(false);
      }
    };

    loadRequest();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!request) {
    return (
      <div className="p-6">
        Penalty discount request not found.
      </div>
    );
  }

  const handleSaveDraft = async (data: any) => {
    console.log("UPDATE DRAFT", {
      id,
      ...data,
    });

    // API:
    // await api.put(`/penalty-discount-requests/${id}`, data);

    router.push("../../");
  };

  const handleSubmit = async (data: any) => {
    console.log("UPDATE + SUBMIT", {
      id,
      ...data,
    });

    // API:
    // await api.put(`/penalty-discount-requests/${id}`, {
    //   ...data,
    //   status: "SUBMITTED",
    // });

    router.push("../../");
  };

  return (
    <PenaltyDiscountForm
      mode="edit"
      invoices={invoices}
      initialData={{
        invoice: request.invoice,
        requested_amount: request.requestedAmount,
        reason: request.reason,
        supporting_file_name: request.supportingFileName,
      }}
      onCancel={() => router.back()}
      onSaveDraft={handleSaveDraft}
      onSubmit={handleSubmit}
    />
  );
}