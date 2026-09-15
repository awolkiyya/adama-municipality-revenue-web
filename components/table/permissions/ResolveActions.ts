import type { UserPermission } from "@/types/user";
import type {
  CommentTableConfig,
  TableActionKey,
} from "../registry";

/**
 * Resolve table actions from:
 *
 * 1. Table configuration
 * 2. UI enabled state
 * 3. User permissions
 *
 * Example:
 *
 * config:
 * {
 *   view: {
 *     enabled: true,
 *     permission: {
 *       resource: "assessment",
 *       action: "view",
 *     },
 *   },
 * }
 *
 * permission:
 * {
 *   resource: "assessment",
 *   actions: ["read", "view", "update"],
 * }
 *
 * result:
 * {
 *   view: true
 * }
 */
export function resolveActions(
  config: CommentTableConfig,
  permissions: UserPermission[] = [],
): Record<TableActionKey, boolean> {
  const result = {} as Record<TableActionKey, boolean>;

  /*
  |--------------------------------------------------------------------------
  | No actions configured
  |--------------------------------------------------------------------------
  */

  if (!config?.actions) {
    return result;
  }

  /*
  |--------------------------------------------------------------------------
  | Resolve each configured action
  |--------------------------------------------------------------------------
  */

  (Object.keys(config.actions) as TableActionKey[]).forEach((key) => {
    const actionConfig = config.actions[key];

    /*
    |--------------------------------------------------------------------------
    | Action is not enabled
    |--------------------------------------------------------------------------
    */

    if (!actionConfig?.enabled) {
      result[key] = false;
      return;
    }

    /*
    |--------------------------------------------------------------------------
    | Action has no permission requirement
    |--------------------------------------------------------------------------
    |
    | If an action is explicitly enabled but has no permission mapping,
    | allow the action.
    |
    | This is useful for purely UI/local actions.
    |
    */

    if (!actionConfig.permission) {
      result[key] = true;
      return;
    }

    const requiredPermission = actionConfig.permission;

    /*
    |--------------------------------------------------------------------------
    | Check user permission
    |--------------------------------------------------------------------------
    */

    const hasPermission = permissions.some(
      (permission) =>
        permission.resource === requiredPermission.resource &&
        permission.actions.includes(requiredPermission.action),
    );

    result[key] = hasPermission;
  });

  return result;
}