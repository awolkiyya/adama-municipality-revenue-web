export interface AdminUnitParent {
  id: string;
  name: string;
  code: string;
  level: "CITY" | "SUBCITY" | "WEREDA";
}

export interface AdminUnit {
  id: string;
  name: string;
  code: string;
  level: "CITY" | "SUBCITY" | "WEREDA";
  is_active: boolean;

  parent_id: string | null;

  // Included when the API eager-loads the parent relationship.
  // Null for a root unit such as a city.
  parent?: AdminUnitParent | null;

  // Included when the API eager-loads child units.
  children?: AdminUnit[];

  audit: {
    created_by: string | null;
    updated_by: string | null;
    created_at: string | null;
    updated_at: string | null;
  };
}

export interface Cluster {
  id: string;
  name: string;
  code: string;
  description: string;
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
