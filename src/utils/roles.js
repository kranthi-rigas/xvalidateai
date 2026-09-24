/**
 * Role helpers.
 *
 * A view-only account is one whose every role is USER: it can read what its
 * organisation has, but cannot buy plans, upload documents or export reports.
 * An account that also holds ADMIN (or any other role) is not view-only.
 */
export function getUserRoles() {
  try {
    const info = JSON.parse(localStorage.getItem("user_info") || "{}");
    const list = Array.isArray(info.roles)
      ? info.roles
      : String(info.roles || "").split(",");
    return list.map((role) => role.toUpperCase().trim()).filter(Boolean);
  } catch {
    return [];
  }
}

export function isViewOnlyUser() {
  const roles = getUserRoles();
  return roles.length > 0 && roles.every((role) => role === "USER");
}

/** The one message the UI uses whenever this restriction bites. */
export const VIEW_ONLY_MESSAGE = "You have view-only access";
