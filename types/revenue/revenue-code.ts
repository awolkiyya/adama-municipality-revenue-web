import { RevenueDomain } from "./revenue-category";

export interface RevenueCode {
    id: string;
  
    categoryId: string;
  
    code: string;
  
    name: string;
  
    description?: string | null;
  
    isActive: boolean;
  
    createdAt?: string | null;
  
    updatedAt?: string | null;
  
  
    category?: {
      id: string;
      name: string;
      revenueDomain?: RevenueDomain;
    };
  }
  
  
  
  export interface CreateRevenueCodePayload {
  
    code: string;
  
    name: string;
  
    description?: string | null;
  
    isActive?: boolean;
  
  }
  
  
  
  export interface UpdateRevenueCodePayload {
  
    code?: string;
  
    name?: string;
  
    description?: string | null;
  
    isActive?: boolean;
  
  }