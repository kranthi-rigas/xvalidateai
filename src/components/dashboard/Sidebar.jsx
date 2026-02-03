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
import { useContextElement } from "@/context/Context";

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
  const { userPlan } = useContextElement();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

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

  useEffect(() => {
    const isOrganizationRoute = sidebarItems.some(
      (item) =>
        item.children && item.children.some((child) => child.href === pathname),
    );

    if (!isOrganizationRoute) {
      setOpenSections({});
    }
  }, [pathname]);

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate("/login");
  };

  const handleNavigation = (e, item, isLocked = false) => {
    e.preventDefault();

    // 🔥 CLOSE ALL DROPDOWNS
    setOpenSections({});

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
      style={{
        backgroundColor: "white",
        borderRight: "1px solid #E2E8F0",
        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      {/* Logo section - visible only on desktop */}
      <div
        className="sidebar-logo-section d-none-mobile"
        style={{ height: "80px", borderBottom: "1px solid #E2E8F0" }}
      >
        <div
          className="d-flex items-center justify-between pl-10 pr-15 pb-10"
          style={{ height: "100%", alignItems: "center" }}
        >
          {!collapsed ? (
            <Link
              to="/dashboard"
              className="sidebar-logo-link d-flex items-center"
              style={{ gap: "8px" }}
            >
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  backgroundColor: "#0F3053",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <i
                  className="fa-solid fa-shield-halved"
                  style={{ color: "#58BFCE", fontSize: "14px" }}
                ></i>
              </div>
              <span
                style={{
                  fontSize: "18px",
                  fontWeight: "bold",
                  color: "#0F3053",
                }}
              >
                XVALIDATE<span style={{ color: "#58BFCE" }}>AI</span>
              </span>
            </Link>
          ) : (
            <div
              style={{
                width: "32px",
                height: "32px",
                backgroundColor: "#0F3053",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <i
                className="fa-solid fa-shield-halved"
                style={{ color: "#58BFCE", fontSize: "14px" }}
              ></i>
            </div>
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
      </div>

      {/* ===================== SIDEBAR ITEMS ===================== */}
      <nav
        style={{
          flex: 1,
          paddingTop: "24px",
          paddingBottom: "24px",
          paddingLeft: "12px",
          paddingRight: "12px",
          overflowY: "auto",
        }}
      >
        {filteredSidebar.map((item, index) => {
          // Handle section headers
          if (item.type === "section") {
            return (
              <div
                key={index}
                style={{
                  paddingTop: index > 0 ? "8px" : "0",
                  paddingBottom: "4px",
                }}
              >
                <div
                  style={{
                    paddingLeft: "16px",
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "#64748B",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: "8px",
                  }}
                >
                  {item.text}
                </div>
              </div>
            );
          }

          const hasChildren = Array.isArray(item.children);
          const isParentActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          const isOpen = openSections[item.id] || false;

          // Check if this item is locked due to plan restriction
          const isParentLocked = !hasPlanAccess(item);

          return (
            <div key={index} style={{ marginBottom: "4px" }}>
              {/* -------- Parent Item -------- */}
              <div
                className={`nav-item ${isParentActive ? "active" : ""} ${
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
                    className="sidebar-parent"
                    style={{
                      background: "none",
                      border: "none",
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      padding: "12px 16px",
                      cursor: isParentLocked ? "not-allowed" : "pointer",
                      fontSize: "14px",
                      fontWeight: 500,
                      color: isParentActive ? "#0F3053" : "#64748B",
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
                      src={
                        isParentActive ? `${item.active_src}` : `${item.src}`
                      }
                      style={{
                        width: "18px",
                        height: "18px",
                        marginRight: "12px",
                        filter: isParentLocked ? "grayscale(100%)" : "none",
                      }}
                    />
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
                        style={{
                          marginLeft: "auto",
                          fontSize: "12px",
                          transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
                          transition: "transform 0.2s",
                          display: collapsed ? "none" : "block",
                        }}
                      >
                        ▸
                      </span>
                    )}
                  </button>
                ) : (
                  <a
                    href={isParentLocked ? "/dashboard/pricing" : item.href}
                    onClick={(e) => handleNavigation(e, item, isParentLocked)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "12px 16px",
                      cursor: isParentLocked ? "not-allowed" : "pointer",
                      fontSize: "14px",
                      fontWeight: 500,
                      color: isParentActive ? "#0F3053" : "#64748B",
                      textDecoration: "none",
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
                      src={
                        isParentActive ? `${item.active_src}` : `${item.src}`
                      }
                      style={{
                        width: "18px",
                        height: "18px",
                        marginRight: "12px",
                        filter: isParentLocked ? "grayscale(100%)" : "none",
                      }}
                    />
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
              {hasChildren && !isParentLocked && isOpen && (
                <div
                  className="sidebar-children"
                  style={{ paddingLeft: "34px", marginTop: "4px" }}
                >
                  {item.children.map((child) => {
                    const isActiveChild = pathname === child.href;
                    const isChildLocked = !hasPlanAccess(child);

                    return (
                      <div
                        key={child.id}
                        className={`nav-item ${isActiveChild ? "active" : ""}`}
                        style={{
                          marginBottom: "4px",
                          opacity: isChildLocked ? 0.5 : 1,
                        }}
                      >
                        <a
                          href={
                            isChildLocked ? "/dashboard/pricing" : child.href
                          }
                          onClick={(e) =>
                            handleNavigation(e, child, isChildLocked)
                          }
                          style={{
                            display: "flex",
                            alignItems: "center",
                            padding: "8px 12px",
                            gap: "10px",
                            cursor: isChildLocked ? "not-allowed" : "pointer",
                            fontSize: "14px",
                            fontWeight: 500,
                            color: isActiveChild ? "#0F3053" : "#64748B",
                            textDecoration: "none",
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
                                fontSize: "16px",
                                color: isChildLocked
                                  ? "#999"
                                  : isActiveChild
                                    ? "#0F3053"
                                    : "#64748B",
                                minWidth: "18px",
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
      </nav>

      {/* Bottom Section - FAQ and User Profile */}
      <div
        style={{
          marginTop: "auto",
          padding: "16px",
          borderTop: "1px solid #E2E8F0",
        }}
      >
        {/* FAQ Link */}
        {!collapsed && (
          <Link
            to="/dashboard/faq"
            style={{
              display: "flex",
              alignItems: "center",
              padding: "12px 16px",
              marginBottom: "8px",
              fontSize: "14px",
              fontWeight: 500,
              color: pathname === "/dashboard/faq" ? "#0F3053" : "#64748B",
              textDecoration: "none",
              borderRadius: "8px",
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#F1F5F9")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            <i
              className="fa-regular fa-circle-question"
              style={{
                width: "18px",
                height: "18px",
                marginRight: "12px",
                fontSize: "18px",
              }}
            ></i>
            FAQ's
          </Link>
        )}

        {/* User Profile Section */}
        {!collapsed && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "12px",
              borderRadius: "8px",
              backgroundColor: "rgba(241, 245, 249, 0.5)",
              border: "1px solid #E2E8F0",
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                backgroundColor: "rgba(15, 48, 83, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#0F3053",
                fontWeight: "bold",
                fontSize: "12px",
                marginRight: "12px",
              }}
            >
              {user?.name?.substring(0, 2).toUpperCase() || "RP"}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontSize: "12px",
                  fontWeight: "500",
                  color: "#0F172A",
                  margin: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {user?.name || "Rakesh P."}
              </p>
              <p
                style={{
                  fontSize: "10px",
                  color: "#64748B",
                  margin: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {user?.effective_role || "Admin"}
              </p>
            </div>
            <button
              onClick={handleLogout}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "#64748B",
                padding: "4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#0F172A")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#64748B")}
              title="Logout"
            >
              <i
                className="fa-solid fa-arrow-right-from-bracket"
                style={{ fontSize: "14px" }}
              ></i>
            </button>
          </div>
        )}

        {/* Collapsed state - just show icon */}
        {collapsed && (
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              backgroundColor: "rgba(15, 48, 83, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#0F3053",
              fontWeight: "bold",
              fontSize: "12px",
              margin: "0 auto",
              cursor: "pointer",
            }}
          >
            {user?.name?.substring(0, 2).toUpperCase() || "RP"}
          </div>
        )}
      </div>
    </div>
  );
}
