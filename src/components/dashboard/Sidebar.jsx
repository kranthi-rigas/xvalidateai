import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { sidebarItems } from "@/data/dashBoardSidebar";
import { resolvePermissionsFromRoles } from "@/data/roleAccess";
import {
  getUserPlan,
  hasAccess,
  getRequiredPlanName,
  PLAN_BADGE_COLORS,
} from "@/utils/planAccess";

// Plan badge component for locked items
const PlanBadge = ({ requiredPlan, collapsed }) => {
  if (collapsed) return null;

  const planName = getRequiredPlanName(requiredPlan);
  const colors = PLAN_BADGE_COLORS[requiredPlan] || PLAN_BADGE_COLORS.premium;

  return (
    <span
      className="plan-required-badge"
      style={{
        background: colors.background,
        color: colors.color,
        fontSize: "9px",
        fontWeight: "600",
        padding: "2px 6px",
        borderRadius: "4px",
        marginLeft: "auto",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
        letterSpacing: "0.5px",
      }}
    >
      {planName}
    </span>
  );
};

export default function Sidebar({ collapsed, setCollapsed }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userPlan, setUserPlan] = useState("free");

  // Dropdown state ONLY for sections that have children (Organization)
  const [openSections, setOpenSections] = useState({});

  useEffect(() => {
    const u = localStorage.getItem("user_info");

    try {
      const parsedUser = u ? JSON.parse(u) : null;

      if (parsedUser) {
        const { role, permissions } = resolvePermissionsFromRoles(
          parsedUser.roles || [],
          parsedUser.permissions || [],
        );

        const enrichedUser = {
          ...parsedUser,
          effective_role: role,
          effective_permissions: permissions,
        };

        setUser(enrichedUser);

        localStorage.setItem("user_info", JSON.stringify(enrichedUser));

        // Get user's plan from localStorage
        const currentPlan = getUserPlan();
        setUserPlan(currentPlan);
        console.log("🔍 Sidebar Debug - User Plan:", currentPlan);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }

    setLoading(false);
  }, []);

  // Auto-open dropdown when a child route is active
  useEffect(() => {
    const newOpenState = {};
    sidebarItems.forEach((item) => {
      if (item.children) {
        const isChildActive = item.children.some((c) => c.href === pathname);
        if (isChildActive) newOpenState[item.id] = true;
      }
    });
    setOpenSections((prev) => ({ ...prev, ...newOpenState }));
  }, [pathname]);

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate("/login");
  };

  const handleNavigation = (e, item, isLocked = false) => {
    e.preventDefault();

    // If item is locked due to plan restriction, redirect to pricing page
    if (isLocked) {
      navigate("/dashboard/pricing");
      return;
    }

    if (item.text?.toLowerCase() === "logout") handleLogout();
    else navigate(item.href);

    // Auto-collapse sidebar on mobile after navigation
    if (window.innerWidth <= 991) {
      setCollapsed(true);
    }
  };

  const toggleSection = (id) =>
    setOpenSections((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));

  if (loading) return <div>Loading...</div>;

  /* =====================================================
     🔐 PERMISSION FILTER (ADDED — SINGLE SOURCE OF TRUTH)
  ===================================================== */
  const userPermissions = user?.effective_permissions || [];

  // 🔥 DEBUG: Log permissions to console
  console.log("🔍 Sidebar Debug - User:", user);
  console.log("🔍 Sidebar Debug - Permissions:", userPermissions);
  console.log("🔍 Sidebar Debug - User Plan:", userPlan);

  const hasPermission = (item) =>
    !item.permission || userPermissions.includes(item.permission);

  // Check if user has plan access for an item
  const hasPlanAccess = (item) => hasAccess(item.requiredPlan, userPlan);

  const filteredSidebar = sidebarItems
    .map((item) => {
      if (item.children) {
        // Filter children by permission, but keep all for plan-based display
        const allowedChildren = item.children.filter(hasPermission);
        if (allowedChildren.length === 0) return null;
        return { ...item, children: allowedChildren };
      }
      return hasPermission(item) ? item : null;
    })
    .filter(Boolean);

  return (
    <div
      className={`sidebar -dashboard ${
        collapsed ? "-is-collapsed -is-sidebar-hidden" : ""
      }`}
    >
      {/* Logo section - visible only on desktop */}
      <div className="sidebar-logo-section d-none-mobile">
        <div className="d-flex items-center justify-between pl-10 pr-15 pb-10">
          {!collapsed ? (
            <Link to="/dashboard">
              <img
                className="logo"
                src="/assets/img/general/xvalidateai_logo.png"
                alt="XValidateAI logo"
                style={{
                  width: 88,
                  height: "auto",
                  objectFit: "contain",
                }}
              />
            </Link>
          ) : (
            <img
              className="logo-short"
              src="/assets/img/general/app-logo.png"
              alt="XValidateAI Short Logo"
              style={{ maxWidth: 40, height: "auto", objectFit: "contain" }}
            />
          )}
          {/* Toggle button - visible on desktop */}
          <button
            onClick={() => setCollapsed((prev) => !prev)}
            className="sidebar-toggle-btn"
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "8px",
              marginLeft: collapsed ? "0" : "auto",
            }}
            aria-label="Toggle sidebar"
          >
            <i className="icon-explore text-24 text-dark-1"></i>
          </button>
        </div>
        {/* Secondary logo - visible when expanded */}
      </div>

      {/* ===================== SIDEBAR ITEMS ===================== */}
      {filteredSidebar.map((item, index) => {
        const hasChildren = Array.isArray(item.children);
        const isParentActive =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

        const isOpen = openSections[item.id] || false;

        // Check if this item is locked due to plan restriction
        const isParentLocked = !hasPlanAccess(item);

        return (
          <div key={index}>
            {/* -------- Parent Item -------- */}
            <div
              className={`sidebar__item ${isParentActive ? "-is-active" : ""} ${
                isParentLocked ? "sidebar__item--locked" : ""
              }`}
              style={isParentLocked ? { opacity: 0.5 } : {}}
            >
              {hasChildren ? (
                <button
                  onClick={() =>
                    isParentLocked
                      ? navigate("/dashboard/pricing")
                      : toggleSection(item.id)
                  }
                  className="sidebar-parent d-flex items-center text-17 lh-1 fw-500"
                  style={{
                    background: "none",
                    border: "none",
                    width: "100%",
                    padding: "6px 0",
                    cursor: isParentLocked ? "not-allowed" : "pointer",
                  }}
                  title={
                    isParentLocked
                      ? `Requires ${getRequiredPlanName(
                          item.requiredPlan,
                        )} plan`
                      : ""
                  }
                >
                  <img
                    src={isParentActive ? `${item.active_src}` : `${item.src}`}
                    style={isParentLocked ? { filter: "grayscale(100%)" } : {}}
                  />
                  <i className="mr-15" />
                  <span className={`${collapsed ? "d-none" : ""}`}>
                    {item.text}
                  </span>
                  {isParentLocked && item.requiredPlan && (
                    <PlanBadge
                      requiredPlan={item.requiredPlan}
                      collapsed={collapsed}
                    />
                  )}
                  {!isParentLocked && (
                    <span
                      className={`sidebar-arrow ${isOpen ? "open" : ""} ${
                        collapsed ? "d-none" : ""
                      }`}
                    >
                      ▸
                    </span>
                  )}
                </button>
              ) : (
                <a
                  href={isParentLocked ? "/dashboard/pricing" : item.href}
                  onClick={(e) => handleNavigation(e, item, isParentLocked)}
                  className={`d-flex items-center text-17 lh-1 fw-500 ${
                    isParentActive ? "-is-active" : ""
                  }`}
                  style={{
                    padding: "6px 0",
                    cursor: isParentLocked ? "not-allowed" : "pointer",
                  }}
                  title={
                    isParentLocked
                      ? `Requires ${getRequiredPlanName(
                          item.requiredPlan,
                        )} plan`
                      : ""
                  }
                >
                  <img
                    src={isParentActive ? `${item.active_src}` : `${item.src}`}
                    style={isParentLocked ? { filter: "grayscale(100%)" } : {}}
                  />
                  <i className="mr-15" />
                  <span className={`${collapsed ? "d-none" : ""}`}>
                    {item.text}
                  </span>
                  {isParentLocked && item.requiredPlan && (
                    <PlanBadge
                      requiredPlan={item.requiredPlan}
                      collapsed={collapsed}
                    />
                  )}
                </a>
              )}
            </div>

            {/* -------- Child Items -------- */}
            {hasChildren && !isParentLocked && (
              <div
                className={`sidebar-children ${isOpen ? "open" : ""}`}
                style={{ paddingLeft: 34, marginTop: -6 }}
              >
                {item.children.map((child) => {
                  const isActiveChild = pathname === child.href;
                  const isChildLocked = !hasPlanAccess(child);

                  return (
                    <div
                      key={child.id}
                      className={`sidebar__item ${
                        isActiveChild ? "-is-active" : ""
                      } ${isChildLocked ? "sidebar__item--locked" : ""}`}
                      style={{
                        margin: "-6px 0",
                        opacity: isChildLocked ? 0.5 : 1,
                      }}
                    >
                      <a
                        href={isChildLocked ? "/dashboard/pricing" : child.href}
                        onClick={(e) =>
                          handleNavigation(e, child, isChildLocked)
                        }
                        className="d-flex items-center text-15 lh-1 fw-500"
                        style={{
                          padding: "6px 0",
                          gap: 10,
                          cursor: isChildLocked ? "not-allowed" : "pointer",
                        }}
                        title={
                          isChildLocked
                            ? `Requires ${getRequiredPlanName(
                                child.requiredPlan,
                              )} plan`
                            : ""
                        }
                      >
                        {child.iconClass && (
                          <i
                            className={child.iconClass}
                            style={{
                              fontSize: 16,
                              color: isChildLocked ? "#999" : "#576AFF",
                              minWidth: 18,
                            }}
                          />
                        )}
                        <span>{child.text}</span>
                        {isChildLocked && child.requiredPlan && (
                          <PlanBadge
                            requiredPlan={child.requiredPlan}
                            collapsed={collapsed}
                          />
                        )}
                      </a>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
