import { Description } from "@mui/icons-material";
import { API_BASE_URL, fetchWithAuth } from "./auth";

const ENDPOINT = `${API_BASE_URL}`;

// POST
export async function createGroup(payload) {
  const res = await fetchWithAuth(`${ENDPOINT}/groups`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: payload.name, // REQUIRED
      description: payload.description, // REQUIRED
      permissions: payload.permissions, // REQUIRED by backend
      tags: payload.tags || [], // REQUIRED
      metadata: payload.metadata || {}, // REQUIRED
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || "Failed to create group");
  }

  return res.json();
}

//Delete
export async function deleteGroup(groupId) {
  const res = await fetchWithAuth(`${ENDPOINT}/groups/${groupId}`, {
    method: "DELETE",
  });

  // If API returns 204 No Content → return success without JSON parsing
  if (res.status === 204) {
    return { success: true };
  }

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || "Failed to delete group");
  }

  // Only parse JSON if there actually IS a body
  try {
    return await res.json();
  } catch {
    return { success: true };
  }
}

//Get Groups
export async function getGroups({ limit = 100, lastKey = null } = {}) {
  // Build query string
  let query = `?limit=${limit}`;
  if (lastKey) query += `&last_evaluated_key=${encodeURIComponent(lastKey)}`;

  const res = await fetchWithAuth(`${ENDPOINT}/groups${query}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || "Failed to fetch groups");
  }

  return res.json(); // returns { groups, count, has_more, last_evaluated_key }
}

//API call for group by ID
export async function getGroupById(groupId) {
  const res = await fetchWithAuth(`${ENDPOINT}/groups/${groupId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || "Failed to fetch group details");
  }

  return res.json();
}

//fetch user attributes
export async function getUserAttributes() {
  const res = await fetchWithAuth(`${ENDPOINT}/user/attributes`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || "Failed to fetch user attributes");
  }

  return res.json();
}

// Invite Users
export async function inviteUsers(payload) {
  const res = await fetchWithAuth(`${ENDPOINT}/user/invite`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      emails: payload.emails || [],
      roles: payload.roles || [],
      groups: payload.groups || [],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || "Failed to invite users");
  }

  return res.json();
}

// Fetch all users
export async function getUsers({ limit = 100 } = {}) {
  let allUsers = [];
  let lastKey = null;
  let hasMore = true;
  let pageCount = 0;
  const MAX_PAGES = 50; // safety cap

  try {
    while (hasMore && pageCount < MAX_PAGES) {
      pageCount++;

      let query = `?limit=${limit}`;
      if (lastKey) {
        query += `&last_evaluated_key=${encodeURIComponent(lastKey)}`;
      }

      const res = await fetchWithAuth(`${ENDPOINT}/users${query}`, {
        method: "GET",
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || "Failed to fetch users");
      }

      const data = await res.json();

      const users = data.users || [];
      allUsers.push(...users);

      hasMore = data.has_more === true;
      lastKey = data.last_evaluated_key || null;

      // Stop if no pagination key returned
      if (!lastKey) hasMore = false;
    }

    return allUsers;

  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
}

// Add users to a group
export async function addUsersToGroup(groupId, userIds = []) {
  const res = await fetchWithAuth(`${ENDPOINT}/group/${groupId}/associate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ user_ids: userIds }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || "Failed to add users to group");
  }

  return res.json();
}
// Remove users from a group
export async function removeUsersFromGroup(groupId, userIds = []) {
  const res = await fetchWithAuth(`${ENDPOINT}/group/${groupId}/dissociate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ user_ids: userIds }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || "Failed to remove users from group");
  }

  return res.json();
}
// Add or Remove permissions from a group
export async function updateGroupPermissions(groupId, permissions = []) {
  const res = await fetchWithAuth(`${ENDPOINT}/group/${groupId}/permissions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      permissions, // backend expects complete list
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || "Failed to update permissions");
  }

  return res.json(); // returns { message, group_id, total_permissions, permissions }
}

//get roles for Role Based Pages
export async function getRoles() {
  const res = await fetchWithAuth(`${ENDPOINT}/roles`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || "Failed to fetch roles");
  }

  return res.json();
}
// CREATE ORGANIZATION
export async function createOrganization(payload) {
  const res = await fetchWithAuth(`${ENDPOINT}/organization`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: payload.name || "",
      description: payload.description || "",
      slug: payload.slug || "",
      address: payload.address || "",
      email: payload.email || "",
      metadata: payload.metadata || {},
    }),
  });

  // ⭐ Preserve status + backend error object
  if (!res.ok) {
    let data = null;

    try {
      data = await res.json(); // Try parsing JSON error
    } catch {
      data = { error: await res.text() }; // fallback
    }

    const error = new Error(
      data?.error || data?.message || "Failed to create organization"
    );

    // ✅ Axios-like error structure
    error.response = {
      status: res.status,
      data: data,
    };

    throw error;
  }

  return res.json();
}

//Get Organizations
export async function getOrganizations() {
  const res = await fetchWithAuth(`${API_BASE_URL}/organization`, {
    method: "GET",
  });

  if (!res.ok) throw new Error("Failed to load organizations");
  return res.json();
}
//Delete Organizations
export async function deleteOrganization(org_id) {
  const res = await fetchWithAuth(`${API_BASE_URL}/organization/${org_id}`, {
    method: "DELETE",
  });

  if (!res.ok) throw new Error("Failed to delete organization");
  return res.json();
}

// UPDATE / REVIEW ORGANIZATION
export async function reviewOrganization(org_id, payload) {
  const res = await fetchWithAuth(`${API_BASE_URL}/organization/${org_id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: payload.action, // ACTIVATE | SUSPEND | DEACTIVATE | DELETE | REJECT
      comment: payload.comment || "",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || "Failed to update organization status");
  }

  return res.json();
}
