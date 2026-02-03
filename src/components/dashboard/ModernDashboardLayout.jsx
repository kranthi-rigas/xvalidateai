import React, { useEffect, useState, useMemo } from "react";
import { Link, Outlet, Navigate, useLocation } from "react-router-dom";
import Preloader from "@/components/common/Preloader";
import "./ModernDashboardLayout.css";
import { COLORS } from "@/styles/colors";
import { useContextElement } from "@/context/Context";
import { sidebarItems } from "@/data/dashBoardSidebar";

export default function ModernDashboardLayout() {
  const location = useLocation();
  const isAuthenticated = localStorage.getItem("access_token");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const handleParentClick = (item) => {
    if (!item.children) return;

    setOpenMenuId((prev) => (prev === item.id ? null : item.id));
  };
  useEffect(() => {
    sidebarItems.forEach((item) => {
      if (item.children?.some((child) => isActiveRoute(child.href))) {
        setOpenMenuId(item.id);
      }
    });
  }, [location.pathname]);

  const { userCredits } = useContextElement();
  const isActiveRoute = (href) => {
    if (!href) return false;

    // Exact match for dashboard only
    if (href === "/dashboard") {
      return (
        location.pathname === "/dashboard" ||
        location.pathname === "/dashboard/"
      );
    }

    return location.pathname.startsWith(href);
  };

  // Dynamic header content based on route
  const headerContent = useMemo(() => {
    const path = location.pathname;

    if (path === "/dashboard" || path === "/dashboard/") {
      return {
        title: "Dashboard Overview",
        description: "Welcome back to your compliance center.",
      };
    }

    if (path.startsWith("/dashboard/aicompliance")) {
      return {
        title: "AI Compliance",
        description: "Manage and monitor AI tool compliance assessments.",
      };
    }

    if (path.startsWith("/dashboard/ailiteracy")) {
      return {
        title: "AI Literacy",
        description: "Educational resources and training materials.",
      };
    }

    if (path.startsWith("/dashboard/orgusergroups")) {
      return {
        title: "User Groups",
        description:
          "Create and manage user groups to organize users and control access across your organization.",
      };
    }

    if (path.startsWith("/dashboard/orgusers")) {
      return {
        title: "Users",
        description:
          "View, invite, and manage users in your organization, including roles and access status.",
      };
    }

    if (path.startsWith("/dashboard/organizations")) {
      return {
        title: "Organizations",
        description: "Manage your organization settings and members.",
      };
    }

    if (path.startsWith("/dashboard/settings")) {
      return {
        title: "Settings",
        description: "Configure your account and preferences.",
      };
    }

    if (path.startsWith("/dashboard/pricing")) {
      return {
        title: "Pricing",
        description: "View and manage your subscription plan.",
      };
    }

    // Default fallback
    return {
      title: "Dashboard",
      description: "Welcome back.",
    };
  }, [location.pathname]);

  return (
    <div className="bg-background text-foreground font-sans overflow-hidden h-screen w-full flex">
      {/* Sidebar */}
      <aside
        id="sidebar"
        className={`${sidebarCollapsed ? "w-20" : "w-64"} bg-sidebar border-r border-sidebar-border h-full flex flex-col z-20 shadow-lg transition-all duration-300`}
      >
        <div className="h-20 flex items-center px-6 border-b border-sidebar-border justify-between">
          <div
            className={`flex items-center ${sidebarCollapsed ? "hidden" : ""}`}
          >
            <img
              src="/assets/img/logo/xvalidateai-logo.svg"
              alt="XVALIDATEAI"
              className="h-10 w-auto"
            />
          </div>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={`${sidebarCollapsed ? "mx-auto" : ""} w-8 h-8 rounded-lg bg-muted hover:bg-primary/10 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors`}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <i
              className={`fa-solid ${sidebarCollapsed ? "fa-angles-right" : "fa-angles-left"}`}
            ></i>
          </button>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {sidebarItems.map((item) => {
            /* SECTION HEADER */
            if (item.type === "section") {
              if (sidebarCollapsed) {
                return (
                  <div
                    key={item.id}
                    className="border-t border-sidebar-border my-2"
                  />
                );
              }

              return (
                <div key={item.id} className="pt-2 pb-1">
                  <div className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    {item.text}
                  </div>
                </div>
              );
            }

            const active = isActiveRoute(item.href);

            return (
              <div key={item.id}>
                {/* 🔹 PARENT ITEM */}
                <Link
                  to={item.children ? "#" : item.href}
                  onClick={(e) => {
                    if (item.children) {
                      e.preventDefault();
                      handleParentClick(item);
                    }
                  }}
                  title={sidebarCollapsed ? item.text : ""}
                  className={`nav-item flex items-center ${
                    sidebarCollapsed ? "justify-center px-2" : "px-4"
                  } py-3 text-sm font-medium rounded-lg transition-colors group ${
                    active
                      ? "active"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {/* LEFT SIDE */}
                  <div className="flex items-center flex-1">
                    <span
                      className={`fa-regular fa-building ${
                        sidebarCollapsed ? "" : "mr-3"
                      } group-hover:text-primary transition-colors`}
                    />
                    {!sidebarCollapsed && <span>{item.text}</span>}
                  </div>

                  {/* RIGHT SIDE (CHEVRON) */}
                  {!sidebarCollapsed && item.children && (
                    <span
                      className={`fa-solid fa-chevron-right text-xs text-muted-foreground/50 transition-transform ${
                        openMenuId === item.id ? "rotate-90" : ""
                      }`}
                    />
                  )}
                </Link>

                {/* 🔹 CHILDREN (THIS is where your snippet goes) */}
                {!sidebarCollapsed &&
                  item.children &&
                  openMenuId === item.id &&
                  item.children.map((child) => (
                    <Link
                      key={child.id}
                      to={child.href}
                      className={`nav-item ml-10 px-4 py-2 text-sm rounded-lg transition-colors ${
                        isActiveRoute(child.href)
                          ? "active"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      {child.text}
                    </Link>
                  ))}
              </div>
            );
          })}
        </nav>

        {/* Credits Display */}
        {!sidebarCollapsed && (
          <div
            className="px-4 py-3 mx-3 mb-3 rounded-lg border border-border"
            style={{ backgroundColor: `${COLORS.secondary}08` }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Credits
              </span>
              <i
                className="fa-solid fa-coins"
                style={{ color: COLORS.secondary, fontSize: "14px" }}
              ></i>
            </div>
            <div className="flex items-baseline gap-1">
              <span
                className="text-2xl font-bold"
                style={{ color: COLORS.secondary }}
              >
                {userCredits?.remaining ?? 0}
              </span>
              <span className="text-xs text-muted-foreground">
                / {userCredits?.total ?? 0}
              </span>
            </div>
            <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${userCredits?.total ? (userCredits.remaining / userCredits.total) * 100 : 0}%`,
                  backgroundColor: COLORS.secondary,
                }}
              ></div>
            </div>
          </div>
        )}

        <div className="p-4 border-t border-sidebar-border">
          <Link
            to="/dashboard/faq"
            className={`nav-item flex items-center ${sidebarCollapsed ? "justify-center px-2" : "px-4"} py-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors group mb-2`}
            title={sidebarCollapsed ? "FAQ's" : ""}
          >
            <span
              className={`fa-regular fa-circle-question ${sidebarCollapsed ? "" : "mr-3"} group-hover:text-primary transition-colors`}
            ></span>
            {!sidebarCollapsed && <span>FAQ's</span>}
          </Link>
          <div
            className={`flex items-center ${sidebarCollapsed ? "justify-center" : ""} p-3 bg-muted/50 rounded-lg border border-border`}
          >
            {sidebarCollapsed ? (
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                RP
              </div>
            ) : (
              <>
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs mr-3">
                  RP
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    Rakesh P.
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    Admin
                  </p>
                </div>
                <button className="text-muted-foreground hover:text-foreground">
                  <i className="fa-solid fa-arrow-right-from-bracket"></i>
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-background relative">
        {/* Header */}
        <header
          id="header"
          className="h-20 bg-card border-b border-border flex items-center justify-between px-8 z-10 sticky top-0"
        >
          <div>
            <h1 className="text-2xl font-bold text-primary">
              {headerContent.title}
            </h1>
            <p className="text-sm text-muted-foreground">
              {headerContent.description}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search tools, vendors..."
                className="pl-10 pr-4 py-2 bg-muted border border-transparent focus:border-primary focus:bg-white rounded-lg text-sm w-64 transition-all outline-none"
              />
              <i className="fa-solid fa-search absolute left-3 top-2.5 text-muted-foreground text-sm"></i>
            </div>
            <button className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-secondary/10 transition-colors relative">
              <i className="fa-regular fa-bell"></i>
              <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div
          key={location.pathname}
          className="flex-1 overflow-y-auto p-8 pb-20"
        >
          {isAuthenticated ? <Outlet /> : <Navigate to="/auth?mode=login" />}
        </div>
      </main>
    </div>
  );
}

// Made with Bob
