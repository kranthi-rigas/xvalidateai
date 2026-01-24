import React, { useState, useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import Sidebar from "@/components/dashboard/Sidebar";
import HeaderDashboard from "@/components/layout/headers/HeaderDashboard";
import Preloader from "@/components/common/Preloader";

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const isAuthenticated = localStorage.getItem("access_token");

  // Auto-collapse sidebar on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 991) {
        setCollapsed(true);
      }
    };

    // Initial check
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="barba-container" data-barba="container">
      <main className="main-content">
        <Preloader />
        <div className="content-wrapper js-content-wrapper overflow-hidden">
          <div
            id="dashboardOpenClose"
            className={`dashboard -home-9 ${
              collapsed ? "-is-sidebar-hidden" : ""
            }`}
          >
            <HeaderDashboard
              collapsed={collapsed}
              setCollapsed={setCollapsed}
              className={` ${
                collapsed ? "-is-collapsed -is-sidebar-hidden" : ""
              }`}
            />
            <div className="dashboard__sidebar scroll-bar-1">
              <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
            </div>

            {/* Child route renders here */}
            <div
              className={`dashboard__main ${collapsed ? "-is-collapsed" : ""}`}
            >
              <div
                key={location.pathname}
                className="dashboard-page-transition"
              >
                {isAuthenticated ? (
                  <Outlet />
                ) : (
                  <Navigate to="/auth?mode=login" />
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
