"use client";

import { LeaseAmendmentForm } from "@/components/forms/lease-amendment-form";
import {
  useParams,
  useRouter,
} from "next/navigation";


export default function EditLeaseAmendmentPage() {
  const router = useRouter();
  const params = useParams();

  const locale =
    typeof params.locale === "string"
      ? params.locale
      : "en";

  const amendmentId =
    typeof params.id === "string"
      ? params.id
      : "";

  const handleSubmit = async (
    values: Parameters<
      NonNullable<
        React.ComponentProps<
          typeof LeaseAmendmentForm
        >["onSubmit"]
      >
    >[0],
  ) => {
    console.log(
      "UPDATE LEASE AMENDMENT:",
      {
        amendmentId,
        values,
      },
    );

    /*
     * Later:
     *
     * await updateLeaseAmendment(
     *   amendmentId,
     *   values,
     * );
     */

    router.push(
      `/${locale}/office/dashboard/lease-amendments`,
    );
  };

  return (
    <LeaseAmendmentForm
      mode="edit"
      amendmentId={amendmentId}
      onSubmit={handleSubmit}
      onCancel={() => router.back()}
      assessment={{
        id: "",
        assessmentNumber: "",
        sourceType: "NEW",
        citizenId: "",
        assessmentDate: null,
        status: "DRAFT",
        notes: null,
        submittedAt: null,
        decision: null,
        decisionNotes: null,
        decidedBy: null,
        decidedAt: null,
        approvedAt: null,
        rejectedAt: null,
        decisionMetadata: null,
        administrativeUnitId: null,
        taxpayer: null,
        services: [],
        createdBy: null,
        updatedBy: null,
        createdAt: "",
        updatedAt: ""
      }}    />
  );
}