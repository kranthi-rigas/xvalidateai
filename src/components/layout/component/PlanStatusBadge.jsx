import React from "react";
import { Link } from "react-router-dom";
import { useContextElement } from "@/context/Context";
import { getUserPlan } from "../../../utils/planAccess";



const PlanStatusBadge = () => {
  const context = useContextElement();
  const plan = getUserPlan()
  
  // Safety check for context
  if (!context) {
    return null;
  }
  
  const { userPlan, isLoggedIn } = context;

  // Don't show badge if user is not logged in
  if (!isLoggedIn) {
    return null;
  }

  console.log("Rendering Premium Plan Badge userPlan,plan:", userPlan, plan);

  // Free plan - show upgrade CTA
  if (plan === "free") {
    
    return (
      <Link
        to="/dashboard/pricing"
        className="button h-50 px-30 text-14 -purple-1 text-white plan-badge-free"
        style={{
          background: "linear-gradient(90deg, #6440FB 0%, #5119DE 100%)",
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          transition: "all 0.3s ease",
          boxShadow: "0 4px 12px rgba(100, 64, 251, 0.25)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 6px 16px rgba(100, 64, 251, 0.35)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(100, 64, 251, 0.25)";
        }}
      >
        <i className="icon-flash text-16"></i>
        <span className="fw-500">Upgrade Plan</span>
      </Link>
    );
  }

  // Premium plan badge
  if (plan === "premium") {
    return (
      <Link
        to="/dashboard/pricing"
        className="button h-50 px-30 text-14 -purple-1 text-white plan-badge-free"
        style={{
          background: "linear-gradient(90deg, #6440FB 0%, #5119DE 100%)",
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          transition: "all 0.3s ease",
          boxShadow: "0 4px 12px rgba(100, 64, 251, 0.25)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 6px 16px rgba(100, 64, 251, 0.35)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(100, 64, 251, 0.25)";
        }}
      >
        <i className="icon-flash text-16"></i>
        <span className="fw-500">Upgrade Plan</span>
      </Link>
    );
  }

  // Enterprise plan badge
  if (plan === "business" || plan === "enterprise") {
    return null;
  }

  return null;
};

export default PlanStatusBadge;
