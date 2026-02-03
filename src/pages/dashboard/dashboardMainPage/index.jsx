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
    <div className="barba-container" data-barba="container" style={{ height: "100vh", overflow: "hidden" }}>
      <main className="main-content" style={{ height: "100%", display: "flex" }}>
        <Preloader />
        <div className="content-wrapper js-content-wrapper" style={{ display: "flex", width: "100%", height: "100%", overflow: "hidden" }}>
          <div
            id="dashboardOpenClose"
            className={`dashboard -home-9 ${
              collapsed ? "-is-sidebar-hidden" : ""
            }`}
            style={{ display: "flex", width: "100%", height: "100%", overflow: "hidden" }}
          >
            {/* Sidebar */}
            <div className="dashboard__sidebar scroll-bar-1" style={{
              width: collapsed ? "80px" : "256px",
              transition: "width 0.3s ease",
              flexShrink: 0,
              height: "100%",
              overflow: "hidden"
            }}>
              <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
            </div>

            {/* Main Content Area */}
            <div
              className={`dashboard__main ${collapsed ? "-is-collapsed" : ""}`}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                height: "100%",
                overflow: "hidden",
                backgroundColor: "#FAFAFA"
              }}
            >
              <HeaderDashboard
                collapsed={collapsed}
                setCollapsed={setCollapsed}
                className={` ${
                  collapsed ? "-is-collapsed -is-sidebar-hidden" : ""
                }`}
              />
              
              {/* Scrollable Content */}
              <div
                key={location.pathname}
                className="dashboard-page-transition"
                style={{
                  flex: 1,
                  overflow: "auto",
                  backgroundColor: "#FAFAFA"
                }}
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
