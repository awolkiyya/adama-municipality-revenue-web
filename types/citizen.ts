/* ==========================================
   Citizen Enums
========================================== */

export type CitizenGender =
  | "MALE"
  | "FEMALE";

export type CitizenSource =
  | "MANUAL"
  | "IMPORT"
  | "EXTERNAL_SYSTEM";



/* ==========================================
   Registered By
========================================== */

export interface RegisteredBy {
  name: string;
  role: string;
}

export interface AdministrativeUnit {
  id: string;
  name: string;
  level: "CITY" | "SUBCITY" | "WEREDA";
  full_address: string;
}



/* ==========================================
   Citizen
========================================== */

export interface Citizen {
  id: string;

  citizen_uid: string;

  full_name: string;

  national_id: string;

  email?:string;

  phone: string;

  address: string;

  date_of_birth:string;

  administrative_unit:AdministrativeUnit;

  gender: CitizenGender;

  source: CitizenSource;

  registered_by: RegisteredBy;

  registered_at: string;

  is_active: boolean;
  status:string;
}



/* ==========================================
   Create / Update Citizen
========================================== */

export interface CitizenFormData {
  full_name: string;

  national_id: string;

  phone: string;

  email?:string|null;

  gender: CitizenGender;

  is_active?: boolean;

  administativ_unit?: string;
}



/* ==========================================
   Citizen Filters
========================================== */

export interface CitizenFilters {
  search?: string;

  gender?: CitizenGender;

  source?: CitizenSource;

  address?:string;

  is_active?: boolean;

  page?: number;

  per_page?: number;

  sort_by?: string;

  sort_direction?: "asc" | "desc";
}