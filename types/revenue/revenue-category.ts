import type { CreateRevenueCodePayload, RevenueCode, UpdateRevenueCodePayload } from "./revenue-code";



export type RevenueDomain =
  | "TAX"
  | "RENT"
  | "INVESTMENT"
  | "SERVICE"
  | "SALE"
  | "CAPITAL";



export interface RevenueCategoryFilters {

  /**
   * Filter by revenue domain
   */
  revenue_domain?: RevenueDomain | "ALL";



  /**
   * Filter active/inactive categories
   */
  is_active?: boolean;



  /**
   * Search by name/code
   */
  search?: string;



  /**
   * Pagination
   */
  page?: number;


  per_page?: number;

}



export interface RevenueCategory {


  id: string;


  revenueDomain: RevenueDomain;


  name: string;


  startCode?: number | null;


  endCode?: number | null;


  description?: string | null;


  sortOrder: number;


  isActive: boolean;

  status:string;



  codesCount?: number;



  codes?: RevenueCode[];



  created_at?: string | null;


  updated_at?: string | null;

}






export interface CreateRevenueCategoryPayload {


  revenue_domain: RevenueDomain;


  name: string;


  startCode?: number | null;


  endCode?: number | null;


  description?: string | null;


  sortOrder?: number;


  isActive?: boolean;



  /**
   * Create category with codes
   */
  codes?: CreateRevenueCodePayload[];

}






export interface UpdateRevenueCategoryPayload {


  revenue_domain?: RevenueDomain;


  name?: string;


  start_code?: number | null;


  end_code?: number | null;


  description?: string | null;


  sortOrder?: number;


  is_active?: boolean;



  /**
   * Sync codes
   */
  codes?: UpdateRevenueCodePayload[];

}


export interface RevenueCategorySummary {

  total: number;

  active: number;

  inactive: number;

  totalCodes: number;

}