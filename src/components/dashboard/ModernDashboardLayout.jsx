import React, { useEffect, useRef, useState } from "react";
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
import UpgradeBanner from "./UpgradeBanner";
import { isUpgradeBannerDismissed } from "./useUpgradeNudge";
import { PLAN_DISPLAY_NAMES } from "@/utils/planAccess";
import AwsButton from "@/components/common/AwsButton";
import { COLORS } from "@/styles/colors";

// Logging out is a wait-then-go, not a question: the dialog counts down and
// signs the person out on its own, and Cancel is there to stop it.
const LOGOUT_COUNTDOWN_SECONDS = 5;
const RING_RADIUS = 46;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export default function ModernDashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthenticated = localStorage.getItem("access_token");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(LOGOUT_COUNTDOWN_SECONDS);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [upgradeDismissed, setUpgradeDismissed] = useState(
    isUpgradeBannerDismissed,
  );
  const [roleBadgeClass, setRoleBadgeClass] = useState("");
  const [userName, setUserName] = useState("User");
  const [userRole, setUserRole] = useState("User");
  const [userEmail, setUserEmail] = useState("");
  // The account details card that opens upward out of the sidebar footer.
  const [accountDetailsOpen, setAccountDetailsOpen] = useState(false);
  const accountDetailsRef = useRef(null);

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
          setUserEmail(userData?.email || "");
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

        // ✅ Persist the whole fresh profile — the plan travels with it, so a
        //    plan bought earlier in this session is picked up on arrival
        const existingInfo = JSON.parse(
          localStorage.getItem("user_info") || "{}",
        );
        localStorage.setItem(
          "user_info",
          JSON.stringify({ ...existingInfo, ...data }),
        );

        // ✅ Tell Context (and anything reading user_info) the plan may have moved
        window.dispatchEvent(new Event("plan-updated"));

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
    setSecondsLeft(LOGOUT_COUNTDOWN_SECONDS);
    setShowLogoutModal(true);
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
    setSecondsLeft(LOGOUT_COUNTDOWN_SECONDS);
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

  const planLabel =
    PLAN_DISPLAY_NAMES[userPlan] ||
    (userPlan ? userPlan.charAt(0).toUpperCase() + userPlan.slice(1) : "Free");
  // Enterprise is the top tier, so there is nothing left to sell it.
  const canUpgrade = userPlan !== "enterprise";

  // Clicking away or pressing Escape closes the account details card.
  useEffect(() => {
    if (!accountDetailsOpen) return undefined;
    const onPointerDown = (e) => {
      if (!accountDetailsRef.current?.contains(e.target))
        setAccountDetailsOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === "Escape") setAccountDetailsOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [accountDetailsOpen]);

  // A route change should not leave the card hanging open.
  useEffect(() => {
    setAccountDetailsOpen(false);
  }, [location.pathname]);

  // One tick per second while the dialog is open; at zero it signs out by
  // itself. Cancelling or the request starting stops the clock.
  useEffect(() => {
    if (!showLogoutModal || isLoggingOut) return undefined;

    if (secondsLeft <= 0) {
      handleLogout();
      return undefined;
    }

    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showLogoutModal, isLoggingOut, secondsLeft]);

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

  // ✅ Plan-gated items (Organization, Audit Trail, …) are locked for free users
  //    only — any paid plan type unlocks them
  const isAuditTrailLocked = (item) => {
    if (!item.requiredPlan) return false;
    return !userPlan || userPlan === "free";
  };

  // ✅ Message shown on locked items
  const getLockMessage = () => "Upgrade to paid plan";

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
                      title={effectiveCollapsed ? getLockMessage() : ""}
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
                          🔒 {getLockMessage()}
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

        {/* Account — the row names who is signed in and keeps logout as its
            own icon; clicking the profile opens the details card. Collapsed the
            rail is only 80px wide, so the two icons stack and the details fly
            out to the side instead of squeezing into the rail. */}
        <div
          className={`border-t border-sidebar-border relative ${
            effectiveCollapsed ? "px-2 py-3" : "p-4"
          }`}
          ref={accountDetailsRef}
        >
          {accountDetailsOpen && (
            <div
              className={`absolute rounded-xl border border-border bg-card shadow-lg z-50 ${
                effectiveCollapsed
                  ? "left-full bottom-3 ml-2 w-60"
                  : "bottom-full left-4 right-4 mb-2"
              }`}
              role="dialog"
              aria-label="Account details"
            >
              <div className="px-4 py-3 border-b border-border">
                <p className="text-sm font-semibold text-foreground truncate">
                  {userName || "User"}
                </p>
                {userEmail && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {userEmail}
                  </p>
                )}
              </div>

              <div className="px-4 py-3 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    Role
                  </span>
                  <span className={roleBadgeClass}>{userRole}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    Plan
                  </span>
                  <span className="text-xs font-semibold text-foreground text-right whitespace-nowrap">
                    {planLabel}
                  </span>
                </div>
              </div>

              {canUpgrade && (
                <div className="px-4 pb-3">
                  <AwsButton
                    label="Upgrade plan"
                    variant="primary"
                    size="sm"
                    fullWidth
                    onClick={() => {
                      setAccountDetailsOpen(false);
                      navigate("/dashboard/pricing");
                    }}
                  >
                    <i className="fa-solid fa-arrow-up-right-dots" />
                  </AwsButton>
                </div>
              )}
            </div>
          )}

          {effectiveCollapsed ? (
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => setAccountDetailsOpen((open) => !open)}
                aria-haspopup="dialog"
                aria-expanded={accountDetailsOpen}
                title={`${userName} · ${userRole}`}
                className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs border border-border transition-opacity hover:opacity-80"
              >
                {userName
                  .split(" ")
                  .map((n) => n.charAt(0).toUpperCase())
                  .join("") || "RP"}
              </button>
              <button
                type="button"
                onClick={handleLogoutClick}
                className="w-10 h-10 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                title="Logout"
                aria-label="Log out"
              >
                <i className="fa-solid fa-arrow-right-from-bracket text-lg"></i>
              </button>
            </div>
          ) : (
            <div className="flex items-center p-2 bg-muted/50 rounded-lg border border-border">
              <button
                type="button"
                onClick={() => setAccountDetailsOpen((open) => !open)}
                aria-haspopup="dialog"
                aria-expanded={accountDetailsOpen}
                title="Account details"
                className="flex items-center flex-1 min-w-0 text-left rounded-md transition-opacity hover:opacity-80"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0 mr-3">
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
              </button>

              {/* Its own 40px box, so a click anywhere near the icon logs out
                  rather than falling through to the profile button. */}
              <button
                type="button"
                onClick={handleLogoutClick}
                className="ml-1 w-10 h-10 flex-shrink-0 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                title="Logout"
                aria-label="Log out"
              >
                <i className="fa-solid fa-arrow-right-from-bracket text-lg"></i>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-background relative">
        {/* Free-plan upgrade nudge — the topmost strip, above the header, so it
            reads as an account notice rather than part of the page. Self-hides
            for paid plans and on the pricing page. */}
        <UpgradeBanner
          dismissed={upgradeDismissed}
          onDismiss={() => setUpgradeDismissed(true)}
        />
        <Header
          onToggleMobileSidebar={() => setMobileSidebarOpen((prev) => !prev)}
          showUpgradeCta={upgradeDismissed}
        />
        <div
          key={location.pathname}
          className="flex-1 overflow-y-auto p-4 lg:p-8 pb-20 min-h-0"
        >
          {isAuthenticated ? <Outlet /> : <Navigate to="/auth?mode=login" />}
        </div>
      </main>

      {/* Logout dialog — a countdown that logs the person out when it runs
          out, with Cancel underneath to stop it. */}
      {showLogoutModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.45)" }}
          onClick={() => !isLoggingOut && cancelLogout()}
          role="dialog"
          aria-modal="true"
          aria-label="Logging out"
        >
          <div
            className="bg-white w-full shadow-xl text-center"
            style={{ maxWidth: 420, padding: 32, borderRadius: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-foreground">
              {isLoggingOut ? "Signing you out…" : "Logging you out"}
            </h3>
            <p className="text-sm text-muted-foreground mt-2">
              {isLoggingOut
                ? "One moment."
                : `You will be signed out in ${secondsLeft} second${
                    secondsLeft === 1 ? "" : "s"
                  }.`}
            </p>

            {/* The ring empties a step a second, so the wait is visible as
                well as counted. */}
            <div
              className="relative mx-auto"
              style={{ width: 120, height: 120, marginTop: 20 }}
            >
              <svg width="120" height="120" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r={RING_RADIUS}
                  fill="none"
                  stroke={COLORS.borderLight}
                  strokeWidth="8"
                />
                <circle
                  cx="60"
                  cy="60"
                  r={RING_RADIUS}
                  fill="none"
                  stroke={COLORS.primary}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={RING_CIRCUMFERENCE}
                  strokeDashoffset={
                    RING_CIRCUMFERENCE *
                    (1 - Math.max(secondsLeft, 0) / LOGOUT_COUNTDOWN_SECONDS)
                  }
                  transform="rotate(-90 60 60)"
                  style={{ transition: "stroke-dashoffset 1s linear" }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span
                  style={{
                    fontSize: 38,
                    fontWeight: 700,
                    color: COLORS.primary,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {Math.max(secondsLeft, 0)}
                </span>
              </div>
            </div>

            {/* Which account is being signed out — worth stating when someone
                keeps more than one. */}
            <div
              className="flex items-center gap-3 mt-6 p-3 border border-border text-left"
              style={{ borderRadius: 14 }}
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                {userName
                  .split(" ")
                  .map((n) => n.charAt(0).toUpperCase())
                  .join("") || "RP"}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {userName || "User"}
                </p>
                {userEmail && (
                  <p className="text-xs text-muted-foreground truncate">
                    {userEmail}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <AwsButton
                label={isLoggingOut ? "Logging out…" : "Log out now"}
                variant="primary"
                size="lg"
                fullWidth
                loading={isLoggingOut}
                onClick={handleLogout}
              />
              <AwsButton
                label="Cancel"
                variant="secondary"
                size="lg"
                fullWidth
                disabled={isLoggingOut}
                onClick={cancelLogout}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Made with Bob
