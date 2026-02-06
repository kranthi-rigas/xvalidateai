import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import useToast from "../../../hooks/useToast";
import AIListViewModern from "./AIListViewModern";
import CreateProjectModal from "./CreateProjectModal";
import EditProjectModal from "./EditProjectModal";
import ProjectDetailsModern from "./ProjectDetailsModern";
import { COLORS } from "../../../styles/colors";
import StatisticsCards from "./StatisticsCards"; // ✅ REQUIRED
import PageLoader from "../../common/PageLoader";
import usePageLoader from "@/data/usePageLoader";
import { useContextElement } from "@/context/Context";
import { fetchUserProfile } from "@/apiIntegration/auth";

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
  const pageLoading = usePageLoader([projects]);

  const show = useToast();
  const didFetchRef = useRef(false);

  const location = useLocation();
  const navigate = useNavigate();
  const { project_id: projectIdFromUrl } = useParams();
  const { setUserCredits } = useContextElement();

  /* ---------- INITIAL LOAD ---------- */
  useEffect(() => {
    if (didFetchRef.current) return;
    didFetchRef.current = true;
    loadProjects();
  }, []);

  /* ---------- RESET ON LIST PAGE ---------- */
  useEffect(() => {
    if (location.pathname === "/dashboard/aicompliance") {
      setOpenedProject(null);
    }
  }, [location.pathname]);

  /* ---------- DIRECT URL OPEN ---------- */
  useEffect(() => {
    if (!projectIdFromUrl) return;

    if (
      openedProject &&
      String(openedProject.project_id) === String(projectIdFromUrl)
    ) {
      return;
    }

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

  /* ---------- API ---------- */
  async function loadProjects() {
    try {
      const data = await getComplianceProjects();
      setProjects(data?.projects || []);

      // Update credits immediately after scan/action completes
      const token = localStorage.getItem("access_token");
      if (token && setUserCredits) {
        const userData = await fetchUserProfile(token);
        if (userData?.plan?.credits_remaining !== undefined) {
          setUserCredits(userData.plan.credits_remaining);
        }
      }
    } catch (err) {
      console.error("Fetch Error:", err);
      setProjects([]);
    }
  }

  async function openProject(project) {
    if (project.status === "requested") {
      setOpenedProject({ ...project, __mode: "requested" });
      navigate(`/dashboard/aicompliance/${project.project_id}`);
      return;
    }

    try {
      setLoadingDetails(true);
      const details = await getComplianceProjectDetails(project.project_id);
      setOpenedProject(details);
      navigate(`/dashboard/aicompliance/${details.project_id}`);
    } catch (err) {
      console.error("Details Fetch Error:", err);
      show("Failed to load project details", { type: "error" });
    } finally {
      setLoadingDetails(false);
    }
  }

  /* ---------- LOADING ---------- */
  if (loadingDetails) {
    return <PageLoader loading={true} message="Loading Assessment Report…" />;
  }

  /* ---------- DETAILS PAGE ---------- */
  if (openedProject) {
    return (
      <ProjectDetailsModern
        project={openedProject}
        onBack={(shouldRefresh) => {
          if (shouldRefresh) loadProjects();
          navigate("/dashboard/aicompliance");
          setOpenedProject(null);
        }}
      />
    );
  }

  /* ---------- STATISTICS (MUST BE BEFORE RETURN) ---------- */
  const totalScanned = (projects || []).filter(
    (p) => p.assessment_status === "completed",
  ).length;

  const compliantTools = (projects || []).filter(
    (p) => p.recommendation?.toLowerCase() === "approved",
  ).length;

  const approvedWithLimits = (projects || []).filter(
    (p) => p.recommendation?.toLowerCase() === "approved with limitations",
  ).length;

  const highRiskBlocked = (projects || []).filter(
    (p) =>
      p.recommendation?.toLowerCase() === "not recommended" ||
      (p.score && Number(p.score) < 40),
  ).length;

  if (pageLoading) return <PageLoader loading />;

  /* ---------- MAIN LIST ---------- */
  return (
    <div className="space-y">
      <StatisticsCards
        totalScanned={totalScanned}
        compliantTools={compliantTools}
        approvedWithLimits={approvedWithLimits}
        highRiskBlocked={highRiskBlocked}
      />

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
