// /permissions/resolveActions.ts

import { UserRole } from "@/types/user";
import { ActionPermissions } from "./ActionPermissions";
import { CommentTableConfig, TableActionKey } from "../registry";

export function resolveActions(
  config: CommentTableConfig,
  role: UserRole
): Record<TableActionKey, boolean> {
  const result = {} as Record<TableActionKey, boolean>;

  (Object.keys(config.actions) as TableActionKey[]).forEach((key) => {
    const uiEnabled = config.actions[key]?.enabled ?? false;
    const roleAllowed = ActionPermissions[key]?.includes(role) ?? false;

    result[key] = uiEnabled && roleAllowed;
  });

  return result;
}