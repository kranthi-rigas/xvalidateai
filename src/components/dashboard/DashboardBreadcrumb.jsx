import React from "react";
import { Link, useLocation } from "react-router-dom";

// Route segment to label mapping
const routeLabels = {
  dashboard: "Dashboard",
  aicompliance: "AI Compliance",
  aianalytics: "AI Analytics",
  courses: "My Courses",
  mocktest: "Mock Tests",
  createmocktest: "Create Mock Test",
  becomeinstructor: "Become Instructor",
  reviewInstructors: "Review Instructors",
  settings: "Settings",
  administration: "Administration",
  assignment: "Assignment",
  "fee-plans": "Fee Plans",
  pricing: "Pricing",
  grades: "Grades",
  orgusergroups: "User Groups",
  orgusers: "Users",
  organizations: "Organizations",
  createorganization: "Create Organization",
  billing: "Billing",
  messages: "Messages",
  bookmarks: "Bookmarks",
  calendar: "Calendar",
  forums: "Forums",
  participants: "Participants",
  reviews: "Reviews",
  survey: "Survey",
  listing: "Create Course",
  quiz: "Quiz",
  quizresults: "Quiz Results",
};

// Convert URL segment to readable label
const getLabel = (segment) => {
  // Check if it's a known route
  if (routeLabels[segment]) {
    return routeLabels[segment];
  }
  
  // Handle dynamic segments (IDs, etc.) - just return the segment
  // Check if it's a UUID or numeric ID
  if (/^[0-9a-f-]{36}$/i.test(segment) || /^\d+$/.test(segment)) {
    return null; // Skip IDs in breadcrumb display
  }
  
  // Convert kebab-case or camelCase to Title Case
  return segment
    .replace(/[-_]/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export default function DashboardBreadcrumb() {
  const location = useLocation();
  const pathSegments = location.pathname.split("/").filter(Boolean);
  
  // Don't show breadcrumb on dashboard home
  if (pathSegments.length <= 1 && pathSegments[0] === "dashboard") {
    return (
      <div className="dashboard-breadcrumb-bar">
        <div className="dashboard-breadcrumb-container">
          <div className="dashboard-breadcrumb-content">
            <div className="dashboard-breadcrumb-item dashboard-breadcrumb-home">
              <Link to="/dashboard">
                <i className="icon-home text-16"></i>
                <span>Dashboard</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Build breadcrumb items
  const breadcrumbItems = [];
  let currentPath = "";
  
  for (let i = 0; i < pathSegments.length; i++) {
    const segment = pathSegments[i];
    currentPath += `/${segment}`;
    const label = getLabel(segment);
    
    if (label) {
      breadcrumbItems.push({
        label,
        path: currentPath,
        isLast: i === pathSegments.length - 1,
        isHome: segment === "dashboard",
      });
    }
  }

  return (
    <div className="dashboard-breadcrumb-bar">
      <div className="dashboard-breadcrumb-container">
        <div className="dashboard-breadcrumb-content">
          {breadcrumbItems.map((item, index) => (
            <div
              key={item.path}
              className={`dashboard-breadcrumb-item ${
                item.isLast ? "dashboard-breadcrumb-current" : ""
              } ${item.isHome ? "dashboard-breadcrumb-home" : ""}`}
            >
              {item.isLast ? (
                <span>
                  {item.isHome && <i className="icon-home text-16"></i>}
                  {item.label}
                </span>
              ) : (
                <Link to={item.path}>
                  {item.isHome && <i className="icon-home text-16"></i>}
                  {item.label}
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
