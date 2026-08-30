export interface AdminUnit {
    id: string;
    name: string;
    code: string;
    level: 'CITY' | 'SUBCITY' | 'WEREDA';
    is_active: boolean;
    parent_id: string | null;
    
    // Optional field, as it only appears when eager-loaded
    children?: AdminUnit[];
    
    audit: {
      created_by: string | null;
      updated_by: string | null;
      created_at: string | null;
      updated_at: string | null;
    };
  }

export interface Cluster {
   id:string;
   name:string;
   code:string;
   description:string;
}

export interface Sector {
  id: string;

  name: string;
  code: string;
  description: string;

  cluster: Cluster;

  is_active: boolean;

  created_at: string;
  updated_at: string;
}