import { TaxpayerFormValues } from "@/lib/zod-forms/taxpayer.schema";
import { Citizen } from "@/types/citizen";


export function mapCitizenToForm(
  citizen: Citizen
): TaxpayerFormValues {

  return {
    full_name: citizen.full_name,

    national_id: citizen.national_id ?? "",

    gender: citizen.gender,

    date_of_birth: citizen.date_of_birth ?? null,

    phone: citizen.phone,

    email: citizen.email ?? null,

    administrative_unit_id:
      citizen.administrative_unit?.id ?? "",
  };
}