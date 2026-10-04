export interface BankAccount {
    id: string;
    bank_name: string;
    account_name: string;
    account_number: string;
    currency: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  }
  
  export interface BankAccountFormData {
    bank_name: string;
    account_name: string;
    account_number: string;
    currency?: string;
    is_active?: boolean;
  }
  
  export interface BankAccountFilters {
    search?: string;
    is_active?: boolean;
    per_page?: number;
    page?: number;
  }