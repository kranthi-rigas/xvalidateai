// src/apiIntegration/compliance.js
import { API_BASE_URL, fetchWithAuth } from "./auth";

const ENDPOINT = `${API_BASE_URL}/compliance-projects`;

// GET
export async function getComplianceProjects() {
  const res = await fetchWithAuth(ENDPOINT, { method: "GET" });
  if (!res.ok) throw new Error("Failed to fetch compliance projects");
  return res.json();
}

//GET project details
export async function getComplianceProjectDetails(projectId) {
  const res = await fetchWithAuth(`${ENDPOINT}/${projectId}`, {
    method: "GET",
  });
  if (!res.ok) throw new Error("Failed to fetch project details");
  return res.json();
}

// POST
export async function createComplianceProject(payload) {
  const res = await fetchWithAuth(ENDPOINT, {
    method: "POST",
    body: JSON.stringify({
      name: payload.projectName,
      description: payload.description,
      url: payload.url,

      // 🔥 NEW FIELDS
      status: payload.status, // pending_assessment | requested
      justification: payload.justification, // instructor only
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || "Failed to create project");
  }
  return res.json();
}

/* =====================================================
   EDIT PROJECT (Tool details)
   Used by: EditProjectModal
   Endpoint: PUT /compliance-projects/{id}/assessment
===================================================== */
export async function updateComplianceTool(projectId, payload) {
  const cleanedUrl = payload.url
    ?.trim()
    .replace(/\/+$/, "");   // 🔥 removes ALL trailing slashes

  const body = {
    name: payload.projectName,
    description: payload.description,
    url: cleanedUrl,
  };

  if (payload.justification) {
    body.justification = payload.justification;
  }

  const res = await fetchWithAuth(
    `${ENDPOINT}/${projectId}/assessment`,
    {
      method: "PUT",
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || "Failed to update project");
  }

  return res.json();
}

// DELETE
export async function deleteComplianceProject(projectId) {
  const res = await fetchWithAuth(`${ENDPOINT}/${projectId}`, {
    method: "DELETE",
  });

  // If server returns 204 No Content → success, no JSON to read
  if (res.status === 204) {
    return { success: true };
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to delete project");
  }

  // If server returns JSON on delete (rare)
  try {
    return await res.json();
  } catch {
    return { success: true };
  }
}
/* =====================================================
   STATUS / APPROVAL UPDATE
   Used by: Admin approve / reject actions
   Endpoint: PATCH /compliance-projects/{id}
===================================================== */
export async function updateComplianceProject(projectId, payload) {
  const res = await fetchWithAuth(`${ENDPOINT}/${projectId}`, {
    method: "PATCH",
    body: JSON.stringify({
      action: payload.action,              // approve | reject
      status: payload.status,              // approved | rejected
      approval_comment: payload.comment || "",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || "Failed to update project status");
  }

  return res.json();
}