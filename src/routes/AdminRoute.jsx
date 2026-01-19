import React from "react";
import { Navigate } from "react-router-dom";

export default function AdminRoute({ children }) {
  const user = JSON.parse(localStorage.getItem("user_info") || "{}");

  const isAdmin = user?.is_admin === true || user?.roles?.includes("admin");

  // Not admin → block access
  if (!isAdmin) {
    return <Navigate to="/not-authorized" replace />;
  }

  return children;
}
