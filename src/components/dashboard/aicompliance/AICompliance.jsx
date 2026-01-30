import React, { useState, useEffect, useRef } from "react";
import useToast from "../../../hooks/useToast";
import AIListViewModern from "./AIListViewModern";
import CreateProjectModal from "./CreateProjectModal";
import EditProjectModal from "./EditProjectModal";
import ProjectDetails from "./ProjectDetails";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { COLORS } from "../../../styles/colors";

import {
  getComplianceProjects,
  getComplianceProjectDetails,
} from "../../../apiIntegration/compliance";

export default function AICompliance() {
  const [projects, setProjects] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editProjectData, setEditProjectData] = useState(null);

  const [openedProject, setOpenedProject] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const show = useToast();

  const didFetchRef = useRef(false);

  useEffect(() => {
    if (didFetchRef.current) return;
    didFetchRef.current = true;
    loadProjects();
  }, []);

  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const projectIdFromUrl = params?.project_id;

  useEffect(() => {
    if (location.pathname === "/dashboard/aicompliance") {
      setOpenedProject(null);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (!projectIdFromUrl) return;

    if (
      openedProject &&
      String(openedProject.project_id) === String(projectIdFromUrl)
    )
      return;

    const localMatch = (projects || []).find(
      (p) => String(p.project_id) === String(projectIdFromUrl),
    );

    if (localMatch) {
      openProject(localMatch);
      return;
    }

    (async () => {
      try {
        setLoadingDetails(true);
        const details = await getComplianceProjectDetails(projectIdFromUrl);
        setOpenedProject(details);
      } catch (err) {
        console.error("Details Fetch Error (direct URL):", err);
      } finally {
        setLoadingDetails(false);
      }
    })();
  }, [projectIdFromUrl, projects]);

  async function loadProjects() {
    try {
      const data = await getComplianceProjects();
      setProjects(data?.projects || []);
    } catch (err) {
      console.error("Fetch Error:", err);
      setProjects([]);
    }
  }

  async function openProject(project) {
    // ✅ REQUESTED → OPEN DIRECTLY (NO API)
    if (project.status === "requested") {
      setOpenedProject({
        ...project,
        __mode: "requested", // 🔥 flag for details page
      });
      try {
        navigate(`/dashboard/aicompliance/${project.project_id}`);
      } catch (e) {
        /* ignore */
      }
      return;
    }

    // ✅ ALL OTHER STATUSES → CALL API
    try {
      setLoadingDetails(true);
      const details = await getComplianceProjectDetails(project.project_id);
      setOpenedProject(details);
      try {
        navigate(`/dashboard/aicompliance/${details.project_id}`);
      } catch (e) {
        // ignore navigation errors
      }
    } catch (err) {
      console.error("Details Fetch Error:", err);

      show("Failed to load project details", { type: "error" });
    } finally {
      setLoadingDetails(false);
    }
  }

  /* ---------- LOADING SCREEN ---------- */
  if (loadingDetails) {
    return (
      <div style={{ paddingTop: 150, textAlign: "center" }}>
        <div
          style={{
            width: 36,
            height: 36,
            border: "4px solid #e5e7eb",
            borderTop: "4px solid #2F5FD9",
            borderRadius: "50%",
            margin: "0 auto 12px",
            animation: "spin 0.7s linear infinite",
          }}
        />
        <div style={{ color: COLORS.primary, fontWeight: 600 }}>
          Loading Assessment Report…
        </div>

        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  /* ✅ DETAILS PAGE */
  if (openedProject) {
    return (
      <ProjectDetails
        project={openedProject}
        onBack={(shouldRefresh) => {
          if (shouldRefresh) loadProjects();
          try {
            navigate("/dashboard/aicompliance");
          } catch (e) {
            /* ignore */
          }
          setOpenedProject(null);
        }}
      />
    );
  }
  // Calculate statistics from projects
  const totalScanned = (projects || []).filter(
    (p) => p.assessment_status === "completed"
  ).length;

  const compliantTools = (projects || []).filter(
    (p) => p.recommendation?.toLowerCase() === "approved"
  ).length;

  const approvedWithLimits = (projects || []).filter(
    (p) => p.recommendation?.toLowerCase() === "approved with limitations"
  ).length;

  const highRiskBlocked = (projects || []).filter(
    (p) => p.recommendation?.toLowerCase() === "not recommended" || (p.score && Number(p.score) < 40)
  ).length;

  return (
    <div className="dashboard__content bg-light-4">
      {/* STATISTICS CARDS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        {/* Total Tools Scanned */}
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #E5E7EB",
            borderRadius: 8,
            padding: "20px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 14,
                color: "#6B7280",
                marginBottom: 8,
                fontWeight: 500,
              }}
            >
              Total Tools Scanned
            </div>
            <div
              style={{
                fontSize: 32,
                fontWeight: 700,
                color: "#111827",
              }}
            >
              {totalScanned.toLocaleString()}
            </div>
          </div>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "#EEF2FF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z"
                stroke="#4F46E5"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* Compliant Tools */}
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #E5E7EB",
            borderRadius: 8,
            padding: "20px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 14,
                color: "#6B7280",
                marginBottom: 8,
                fontWeight: 500,
              }}
            >
              Compliant Tools
            </div>
            <div
              style={{
                fontSize: 32,
                fontWeight: 700,
                color: "#059669",
              }}
            >
              {compliantTools}
            </div>
          </div>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "#D1FAE5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                stroke="#059669"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* Approved with Limits */}
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #E5E7EB",
            borderRadius: 8,
            padding: "20px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 14,
                color: "#6B7280",
                marginBottom: 8,
                fontWeight: 500,
              }}
            >
              Approved with Limits
            </div>
            <div
              style={{
                fontSize: 32,
                fontWeight: 700,
                color: "#D97706",
              }}
            >
              {approvedWithLimits}
            </div>
          </div>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "#FEF3C7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                stroke="#D97706"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* High Risk / Blocked */}
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #E5E7EB",
            borderRadius: 8,
            padding: "20px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 14,
                color: "#6B7280",
                marginBottom: 8,
                fontWeight: 500,
              }}
            >
              High Risk / Blocked
            </div>
            <div
              style={{
                fontSize: 32,
                fontWeight: 700,
                color: "#DC2626",
              }}
            >
              {highRiskBlocked}
            </div>
          </div>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "#FEE2E2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M18.364 18.364C21.8787 14.8492 21.8787 9.15076 18.364 5.63604C14.8492 2.12132 9.15076 2.12132 5.63604 5.63604M18.364 18.364C14.8492 21.8787 9.15076 21.8787 5.63604 18.364C2.12132 14.8492 2.12132 9.15076 5.63604 5.63604M18.364 18.364L5.63604 5.63604"
                stroke="#DC2626"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>

      <AIListViewModern
        projects={projects}
        setShowCreateModal={setShowCreateModal}
        setOpenedProject={openProject}
        refreshProjects={loadProjects}
      />

      {showCreateModal && (
        <CreateProjectModal
          setShowCreateModal={setShowCreateModal}
          refreshProjects={loadProjects}
        />
      )}

      {showEditModal && (
        <EditProjectModal
          project={editProjectData}
          setShowEditModal={setShowEditModal}
          refreshProjects={loadProjects}
        />
      )}
    </div>
  );
}
