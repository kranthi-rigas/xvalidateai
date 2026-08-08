import React, { useEffect, useState } from "react";
import {
  Link,
  Outlet,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import "./ModernDashboardLayout.css";
import { useContextElement } from "@/context/Context";
import { sidebarItems } from "@/data/dashBoardSidebar";
import Header from "./Header";
import { logoutUser, fetchUserProfile } from "@/apiIntegration/auth";
import AwsButton from "@/components/common/AwsButton";

export default function ModernDashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthenticated = localStorage.getItem("access_token");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [roleBadgeClass, setRoleBadgeClass] = useState("");
  const [userName, setUserName] = useState("User");
  const [userRole, setUserRole] = useState("User");

  // ✅ Staff flags — controls Administration visibility
  const [isStaffAdmin, setIsStaffAdmin] = useState(false);
  const [isStaffUser, setIsStaffUser] = useState(false);

  const handleParentClick = (item) => {
    if (!item.children) return;
    if (sidebarCollapsed) {
      setSidebarCollapsed(false);
      setOpenMenuId(item.id);
    } else {
      setOpenMenuId((prev) => (prev === item.id ? null : item.id));
    }
  };

  // Fetch user data on mount
  useEffect(() => {
    const loadUserData = () => {
      try {
        const userInfo = localStorage.getItem("user_info");
        if (userInfo) {
          const userData = JSON.parse(userInfo);
          const fullName =
            `${userData?.first_name || "User"} ${userData?.last_name || ""}`.trim();
          const roleRaw = userData?.roles?.[0] || userData?.role || "User";
          const formattedRole =
            roleRaw.charAt(0).toUpperCase() + roleRaw.slice(1).toLowerCase();

          let badgeClass = "role-badge";
          switch (roleRaw.toUpperCase()) {
            case "ADMIN":
              badgeClass += " role-admin";
              break;
            case "MANAGER":
              badgeClass += " role-auditor";
              break;
            case "USER":
              badgeClass += " role-analyst";
              break;
            default:
              badgeClass += " role-default";
          }

          setUserName(fullName);
          setUserRole(formattedRole);
          setRoleBadgeClass(badgeClass);

          // ✅ Read staff flags from stored user_info
          setIsStaffAdmin(userData?.is_staff_admin === true);
          setIsStaffUser(userData?.is_staff_user === true);

          // ✅ Normalize plan to lowercase
          // ✅ Plan is managed by Context (refreshUserPlan) — no local state needed
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      }
    };
    loadUserData();
  }, []);

  // ✅ Also fetch fresh profile from API to get latest staff flags
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) return;

        const data = await fetchUserProfile(token);

        // ✅ Update staff flags from fresh API response
        setIsStaffAdmin(data?.is_staff_admin === true);
        setIsStaffUser(data?.is_staff_user === true);

        // ✅ Persist updated user_info back to localStorage
        const existingInfo = JSON.parse(
          localStorage.getItem("user_info") || "{}",
        );
        localStorage.setItem(
          "user_info",
          JSON.stringify({
            ...existingInfo,
            is_staff_admin: data?.is_staff_admin,
            is_staff_user: data?.is_staff_user,
          }),
        );

        console.log("🔍 Profile API - is_staff_admin:", data?.is_staff_admin);
        console.log("🔍 Profile API - is_staff_user:", data?.is_staff_user);
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    fetchProfile();
  }, []);

  useEffect(() => {
    setMobileSidebarOpen(false);
    sidebarItems.forEach((item) => {
      if (item.children?.some((child) => isActiveRoute(child.href))) {
        setOpenMenuId(item.id);
      }
    });
  }, [location.pathname]);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      const token =
        localStorage.getItem("refresh_token") ||
        sessionStorage.getItem("refresh_token");
      if (token) {
        await logoutUser(token);
      }
      localStorage.clear();
      sessionStorage.clear();
      if (setIsLoggedIn) {
        setIsLoggedIn(false);
      }
      navigate("/auth?mode=login");
    } catch (err) {
      console.error("Logout failed:", err);
      alert("Failed to logout. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const { userCredits, setIsLoggedIn, userPlan } = useContextElement();

  useEffect(() => {
    if (mobileSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileSidebarOpen]);

  const effectiveCollapsed = sidebarCollapsed && !mobileSidebarOpen;

  const isActiveRoute = (href) => {
    if (!href) return false;
    if (href === "/dashboard") {
      return (
        location.pathname === "/dashboard" ||
        location.pathname === "/dashboard/"
      );
    }
    return location.pathname.startsWith(href);
  };

  // ✅ Lock any item whose requiredPlan isn't met by the current user's plan
  const isAuditTrailLocked = (item) => {
    if (!item.requiredPlan) return false;
    if (userPlan === "enterprise") return false; // enterprise >= business
    return userPlan !== item.requiredPlan.toLowerCase();
  };

  // ✅ Filter sidebar — hide Administration unless is_staff_admin or is_staff_user
  const canSeeAdministration = isStaffAdmin || isStaffUser;

  const filteredSidebarItems = sidebarItems.filter((item) => {
    if (item.href === "/dashboard/administration") {
      return canSeeAdministration;
    }
    return true;
  });

  return (
    <div className="bg-background text-foreground font-sans overflow-hidden h-screen w-full flex">
      {/* Mobile backdrop overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        id="sidebar"
        className={
          mobileSidebarOpen
            ? "fixed inset-0 z-50 flex flex-col w-full bg-sidebar border-r border-sidebar-border shadow-lg overflow-y-auto"
            : `hidden lg:flex lg:flex-col ${
                sidebarCollapsed ? "lg:w-20" : "lg:w-64"
              } bg-sidebar border-r border-sidebar-border lg:h-full z-20 shadow-lg transition-[width] duration-300`
        }
      >
        {/* Sidebar top bar */}
        <div
          className={`h-20 relative flex items-center border-b border-sidebar-border
            ${mobileSidebarOpen ? "justify-center" : `justify-between ${effectiveCollapsed ? "px-2" : "px-6"}`}`}
        >
          {!effectiveCollapsed && (
            <Link
              to="/dashboard"
              className="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
              title="Go to dashboard"
            >
              <img
                src="/assets/img/logo/xvalidateai-logo.svg"
                alt="XVALIDATEAI"
                className="h-10 w-auto"
              />
            </Link>
          )}

          {effectiveCollapsed && (
            <Link
              to="/dashboard"
              className="cursor-pointer hover:opacity-80 transition-opacity"
              title="Go to dashboard"
            >
              <img
                src="/assets/img/general/collapsed-app-logo.png"
                alt="XVALIDATEAI"
                className="w-10 mx-auto"
              />
            </Link>
          )}

          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="lg:hidden absolute right-4 sidebar-collapse-btn rounded-lg flex items-center justify-center text-muted-foreground transition-colors"
            title="Close sidebar"
          >
            <i className="fa-solid fa-xmark text-xl" data-fa-i2svg="false"></i>
          </button>

          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex sidebar-collapse-btn rounded-lg items-center justify-center text-muted-foreground transition-colors"
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <i
              className={`fa-solid ${effectiveCollapsed ? "fa-angle-right mr-2" : "fa-angles-left"}`}
              data-fa-i2svg="false"
            />
          </button>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {filteredSidebarItems.map((item) => {
            /* SECTION HEADER */
            if (item.type === "section") {
              if (effectiveCollapsed) {
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
            const locked = isAuditTrailLocked(item);

            return (
              <div key={item.id}>
                {locked ? (
                  // ✅ LOCKED STATE — greyed out, click redirects to pricing
                  <div className="relative group">
                    <button
                      onClick={() => navigate("/dashboard/pricing")}
                      title={effectiveCollapsed ? "Business Plan Required" : ""}
                      className={`nav-item flex items-center justify-between w-full ${
                        effectiveCollapsed ? "px-2" : "px-4"
                      } py-3 text-sm font-medium rounded-lg transition-colors cursor-pointer`}
                      style={{ opacity: 0.5 }}
                    >
                      <div
                        className={`flex items-center ${effectiveCollapsed ? "" : "flex-1"}`}
                      >
                        <span
                          data-fa-i2svg="false"
                          className={`${item.icon} ${effectiveCollapsed ? "" : "mr-3"} text-muted-foreground`}
                        />
                        {!effectiveCollapsed && (
                          <span className="text-muted-foreground">
                            {item.text}
                          </span>
                        )}
                      </div>
                      {!effectiveCollapsed && (
                        <div className="flex items-center gap-1">
                          <i className="fa-solid fa-lock text-xs text-muted-foreground/70" />
                        </div>
                      )}
                    </button>

                    {/* Tooltip on hover */}
                    {!effectiveCollapsed && (
                      <div
                        className="absolute left-0 right-0 bottom-full mb-1 mx-2 hidden group-hover:flex items-center justify-center"
                        style={{ zIndex: 50 }}
                      >
                        <div
                          className="text-white text-xs font-medium px-3 py-1.5 rounded-md shadow-lg whitespace-nowrap"
                          style={{ backgroundColor: "#0F3053" }}
                        >
                          🔒 Business Plan Required
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  // ✅ NORMAL STATE
                  <div>
                    <Link
                      to={item.children ? "#" : item.href}
                      onClick={(e) => {
                        if (item.children) {
                          e.preventDefault();
                          handleParentClick(item);
                        }
                      }}
                      title={effectiveCollapsed ? item.text : ""}
                      className={`nav-item flex items-center justify-between w-full ${
                        effectiveCollapsed ? "px-2" : "px-4"
                      } py-3 text-sm font-medium rounded-lg transition-colors group ${
                        active
                          ? "active"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                      style={{ display: "inline-flex" }}
                    >
                      <div
                        className={`flex items-center ${effectiveCollapsed ? "" : "flex-1"}`}
                      >
                        <span
                          data-fa-i2svg="false"
                          className={`${item.icon} ${
                            effectiveCollapsed ? "" : "mr-3"
                          } transition-colors group-hover:text-primary`}
                        />
                        {!effectiveCollapsed && <span>{item.text}</span>}
                      </div>

                      {/* CHEVRON for parent items */}
                      {!effectiveCollapsed && item.children && (
                        <span
                          className={`fa-solid fa-chevron-right text-xs text-muted-foreground/50 transition-transform ${
                            openMenuId === item.id ? "rotate-90" : ""
                          }`}
                          data-fa-i2svg="false"
                        />
                      )}
                    </Link>

                    {/* CHILDREN */}
                    {!effectiveCollapsed &&
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
                          <span className={`${child.icon} mr-3 text-xs`} />
                          <span>{child.text}</span>
                        </Link>
                      ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div
            className={`flex items-center ${effectiveCollapsed ? "justify-center" : ""} p-2 bg-muted/50 rounded-lg border border-border`}
          >
            {effectiveCollapsed ? (
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                {userName
                  .split(" ")
                  .map((n) => n.charAt(0).toUpperCase())
                  .join("") || "RP"}
              </div>
            ) : (
              <>
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs mr-3">
                  {userName
                    .split(" ")
                    .map((n) => n.charAt(0).toUpperCase())
                    .join("") || "RP"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {userName || "User"}
                  </p>
                  <span className={roleBadgeClass}>{userRole}</span>
                </div>
                <button
                  onClick={handleLogoutClick}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  title="Logout"
                >
                  <i className="fa-solid fa-arrow-right-from-bracket"></i>
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-background relative">
        <Header
          onToggleMobileSidebar={() => setMobileSidebarOpen((prev) => !prev)}
        />
        <div
          key={location.pathname}
          className="flex-1 overflow-y-auto p-4 lg:p-8 pb-20 min-h-0"
        >
          {isAuthenticated ? <Outlet /> : <Navigate to="/auth?mode=login" />}
        </div>
      </main>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
          onClick={() => setShowLogoutModal(false)}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "24px",
              maxWidth: "400px",
              width: "90%",
              boxShadow:
                "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ marginBottom: "16px", textAlign: "center" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  backgroundColor: "#fee2e2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px auto",
                }}
              >
                <i
                  className="fa-solid fa-power-off"
                  style={{ fontSize: "24px", color: "#ef4444" }}
                ></i>
              </div>
              <h3
                style={{
                  fontSize: "18px",
                  fontWeight: "600",
                  color: "#1f2937",
                  marginBottom: "8px",
                }}
              >
                Confirm Logout
              </h3>
              <p
                style={{
                  fontSize: "16px",
                  color: "#6b7280",
                  lineHeight: "1.5",
                }}
              >
                Are you sure you want to logout?
              </p>
            </div>
            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "center",
                marginTop: "24px",
              }}
            >
              <AwsButton
                label="Cancel"
                variant="secondary"
                onClick={() => setShowLogoutModal(false)}
                disabled={isLoggingOut}
                size="lg"
              />
              <AwsButton
                loading={isLoggingOut}
                label={isLoggingOut ? "Logging out..." : "Logout"}
                variant="danger"
                onClick={handleLogout}
                disabled={isLoggingOut}
                size="lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Made with Bob
