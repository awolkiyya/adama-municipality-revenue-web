"use client";

import { LeaseAmendmentForm } from "@/components/forms/lease-amendment-form";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";

export default function CreateLeaseAmendmentPage() {
  const router = useRouter();
  const params = useParams();

  const locale =
    typeof params.locale === "string"
      ? params.locale
      : "en";

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
      "CREATE LEASE AMENDMENT:",
      values,
    );

    /*
     * Later this becomes:
     *
     * await createLeaseAmendment(values);
     */

    router.push(
      `/${locale}/office/dashboard/lease-amendments`,
    );
  };

  return (
    <LeaseAmendmentForm
      mode="create"
      onSubmit={handleSubmit}
      onCancel={() => router.back()}
    />
  );
}