export function hasOrganization() {
  try {
    const user = JSON.parse(localStorage.getItem("user_info") || "{}");

    const DEFAULT_ORG_NAME = "academy51";

    // ---------- MULTIPLE ORGS ----------
    if (Array.isArray(user.organizations)) {
      return user.organizations.some(
        (org) =>
          org &&
          typeof org === "object" &&
          org.name &&
          org.name.toLowerCase() !== DEFAULT_ORG_NAME,
      );
    }

    // ---------- SINGLE ORG ----------
    if (user.organization && typeof user.organization === "object") {
      const name = String(user.organization.name || "").toLowerCase();

      // ❌ treat default org as NO org
      if (!name || name === DEFAULT_ORG_NAME) {
        return false;
      }

      return true;
    }

    return false;
  } catch {
    return false;
  }
}
