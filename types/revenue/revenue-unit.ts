// unit type

export interface MeasurementUnit {
    id: string;
  
    code: string;
  
    name: string;
  
    symbol?: string | null;
  
    description?: string | null;
  
    is_active: boolean;
  
    sort_order: number;
  
    created_at?: string;
  
    updated_at?: string;
    
  }
  
  
  export interface MeasurementUnitFilters {
    search?: string;
  
    code?: string;
  
    isActive?: boolean;
  
    page?: number;
  
    per_page?: number;
  }