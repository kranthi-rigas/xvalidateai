import rolePermissions from "@/data/rolePermissions.json";

const ROLE_PRIORITY = ["ADMIN", "AUDITOR", "ANALYST"];

export function resolvePermissionsFromRoles(
  roles = [],
  groupPermissions = [],
  directPermissions = []
) {
  const effectiveRole =
    ROLE_PRIORITY.find((r) => roles.includes(r)) || null;

  const rolePerms = effectiveRole
    ? rolePermissions[effectiveRole] || []
    : [];

  const mergedPermissions = new Set([
    ...rolePerms,
    ...groupPermissions,
    ...directPermissions,
  ]);

  return {
    role: effectiveRole,
    permissions: Array.from(mergedPermissions),
  };
}
