export interface Permission {
    id: string;
  
    /**
     * Permission identifier.
     * Example: "revenue.collect"
     */
    name: string;
  
    /**
     * Human readable label.
     * Example: "Collect Revenue"
     */
    label?: string | null;
  
  }
  
  export interface PermissionGroup {
    /**
     * Internal module key.
     * Example: "revenue"
     */
    key: string;
  
    /**
     * Display label.
     * Example: "Revenue Management"
     */
    module: string;
  
    permissions: Permission[];
  }
  
  /**
   * Shared permission picker.
   *
   * Used by:
   * - Create Role
   * - Update Role
   * - Clone Role
   *
   * `value` stays a string[] at the boundary so it drops straight into
   * forms / react-hook-form / API payloads without extra mapping.
   */
  export interface PermissionSelectorProps {
    groups: PermissionGroup[];
  
    /**
     * Selected permission names.
     * Example: ["revenue.view", "payment.create"]
     */
    value: string[];
  
    onChange(permissions: string[]): void;
  
    disabled?: boolean;
  }
  
  /**
   * Single permission module card.
   *
   * Internal component. Receives a Set for O(1) membership checks instead
   * of re-running `.includes()` on every checkbox on every render.
   */
  export interface PermissionModuleCardProps {
    group: PermissionGroup;
  
    /** Selected permission lookup. */
    selected: Set<string>;
  
    /** Toggle one or more permission names. */
    onChange(permissions: string[]): void;
  
    disabled?: boolean;
  }