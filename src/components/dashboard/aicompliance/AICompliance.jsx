import React, { useState, useEffect, useRef } from "react";
import useToast from "../../../hooks/useToast";
import AIListView from "./AIListView";
import CreateProjectModal from "./CreateProjectModal";
import EditProjectModal from "./EditProjectModal";
import ProjectDetails from "./ProjectDetails";
import { useLocation, useNavigate, useParams } from "react-router-dom";

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
        <div style={{ color: "#2F5FD9", fontWeight: 600 }}>
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
  return (
    <div className="dashboard__content">
      <div className="dashboard-body">
        <AIListView
          projects={projects}
          setShowCreateModal={setShowCreateModal}
          setOpenedProject={openProject}
          setShowEditModal={setShowEditModal}
          setEditProjectData={setEditProjectData}
          refreshProjects={loadProjects}
        />
      </div>

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
