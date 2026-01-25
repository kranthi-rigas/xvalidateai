import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Messages from "../component/Messages";
import { notifications } from "@/data/notifications";
import { logoutUser, fetchUserProfile } from "../../../apiIntegration/auth";
import { useOutsideClick } from "../../../data/useOutsideClick";
import CartToggle from "../component/CartToggle";
import PlanStatusBadge from "../component/PlanStatusBadge";
import { useContextElement } from "@/context/Context";
import { hasAccess } from "@/utils/planAccess";
import DashboardBreadcrumb from "@/components/dashboard/DashboardBreadcrumb";

export default function HeaderDashboard({ collapsed, setCollapsed }) {
  const [messageOpen, setMessageOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isOnNotification, setIsOnNotification] = useState(false);
  const [isOnProfile, setIsOnProfile] = useState(false);
  const [documentElement, setDocumentElement] = useState();
  const [initials, setInitials] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [first_name, setFirstName] = useState("");
  const [last_name, setLastName] = useState("");
  const [userPermissions, setUserPermissions] = useState([]);
  const [isDefaultAccount, setIsDefaultAccount] = useState(true);
  const [isCartOpen, setCartOpen] = useState(false);
  const [planType, setPlanType] = useState("");
  const [credits, setCredits] = useState(0); // stat to store credits

  const { setUserPlan, setIsLoggedIn, setUserCredits } = useContextElement();

  const cartRef = useRef(null);
  const cartButtonRef = useRef(null);
  const messageRef = useRef(null);
  const notificationRef = useRef(null);

  const [orgName, setOrgName] = useState("");
  const [email, setEmail] = useState("");
  const [userRole, setUserRole] = useState("");

  const profileRef = useRef(null);

  useOutsideClick(cartButtonRef, () => setCartOpen(false), isCartOpen);

  useOutsideClick(messageRef, () => setMessageOpen(false), messageOpen);
  useOutsideClick(profileRef, () => setIsOnProfile(false), isOnProfile);

  useOutsideClick(
    notificationRef,
    () => setIsOnNotification(false),
    isOnNotification,
  );

  useEffect(() => {
    const loadUserData = async () => {
      try {
        // const userData = JSON.parse(localStorage.getItem("user_info"));
        const token = localStorage.getItem("access_token");
        const userData = await fetchUserProfile(token);

        if (userData) {
          const first = userData.first_name?.charAt(0).toUpperCase() || "";
          const last = userData.last_name?.charAt(0).toUpperCase() || "";

          setInitials(first + last);
          setFirstName(userData?.first_name);
          setLastName(userData?.last_name);
          setEmail(userData?.email || "");

          // ✅ Extract role safely INSIDE effect
          const rolesRaw = userData?.roles || [];
          const rolesArray = Array.isArray(rolesRaw)
            ? rolesRaw
            : String(rolesRaw).split(",");

          // Priority: ADMIN > AUDITOR > ANALYST
          const primaryRole =
            rolesArray.find((r) => r.toUpperCase() === "ADMIN") ||
            rolesArray.find((r) => r.toUpperCase() === "AUDITOR") ||
            rolesArray.find((r) => r.toUpperCase() === "ANALYST") ||
            "";

          setUserRole(primaryRole);

          const org = userData?.organization?.name || "";
          setOrgName(org);

          // ✅ THIS IS THE KEY FIX
          setIsDefaultAccount(org === "Academy51" || !org);

          setUserPermissions(userData?.permissions || []);

          // Get plan type from user_info->plan->plan_type
          const userPlanType = userData?.plan?.plan_type || "";
          const userCredits = userData?.plan?.credits_remaining || 0;
          setPlanType(userPlanType);
          setCredits(userCredits);
          if (setUserCredits) {
            setUserCredits(userCredits);
          }

          // Set user login status and plan for badge
          if (setIsLoggedIn && setUserPlan) {
            setIsLoggedIn(true);
            // Determine plan based on user data (adjust this logic based on your actual data structure)
            const userPlanType = userData?.plan?.plan_type || "free";
            setUserPlan(userPlanType.toLowerCase());
          }
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      }
    };

    loadUserData();

    // Refetch every 30 seconds to keep plan type and credits updated
    const interval = setInterval(loadUserData, 30000);
    return () => clearInterval(interval);
  }, [setIsLoggedIn, setUserPlan, setUserCredits]);

  const hasPermission = (item) => {
    // Logout always visible
    if (item.text?.toLowerCase() === "logout") return true;

    // If item has no permission → visible
    if (!item.permission) return true;

    // Check permission
    return userPermissions.includes(item.permission);
  };

  const handleFullScreenToggle = () => {
    setIsFullScreen((pre) => !pre);
    if (!isFullScreen) {
      openFullscreen();
    } else {
      closeFullscreen();
    }
  };

  const navigate = useNavigate();

  // ✅ Logout logic
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);

      const token =
        localStorage.getItem("refresh_token") ||
        sessionStorage.getItem("refresh_token");

      await logoutUser(token);

      // Clear tokens & redirect
      localStorage.clear();
      sessionStorage.clear();

      navigate("/auth?mode=login");
    } catch (err) {
      console.error("Logout failed:", err);
      alert("Failed to logout. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const location = useLocation();
  const isResultsPage = location.pathname === "/dshb-quizresults";

  // ✅ Handle sidebar clicks (including logout)
  const handleSidebarClick = async (e, item) => {
    if (item.text.toLowerCase() === "logout") {
      e.preventDefault();
      await handleLogout();
    }
  };

  useEffect(() => {
    setDocumentElement(document.documentElement);
  }, []);
  const openFullscreen = () => {
    if (documentElement?.requestFullscreen) {
      documentElement?.requestFullscreen();
    } else if (documentElement?.webkitRequestFullscreen) {
      /* Safari */
      documentElement?.webkitRequestFullscreen();
    } else if (documentElement?.msRequestFullscreen) {
      /* IE11 */
      documentElement?.msRequestFullscreen();
    }
  };

  const handleDarkmode = () => {
    if (document) {
      document.getElementsByTagName("html")[0].classList.toggle("-dark-mode");
    }
  };

  const closeFullscreen = () => {
    if (document?.exitFullscreen) {
      document?.exitFullscreen();
    } else if (document?.webkitExitFullscreen) {
      /* Safari */
      document?.webkitExitFullscreen();
    } else if (document?.msExitFullscreen) {
      /* IE11 */
      document?.msExitFullscreen();
    }
  };
  const handleResize = () => {};
  useEffect(() => {
    if (window.innerWidth < 990) {
      document
        .getElementById("dashboardOpenClose")
        .classList.add("-is-sidebar-hidden");
    }
    const handleResize = () => {
      if (window.innerWidth < 990) {
        document
          .getElementById("dashboardOpenClose")
          .classList.add("-is-sidebar-hidden");
      }
    };

    // Add event listener to window resize event
    window.addEventListener("resize", handleResize);

    // Clean up the event listener when component unmounts
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const menuItemStyle = {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "8px 14px",
    width: "100%",
    fontSize: 14,
    fontWeight: 500,
    lineHeight: "20px",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    textAlign: "left",
    lineHeight: "20px",
  };

  return (
    <>
      <header className="header -dashboard js-header">
        <div className="header-inner">
          <div className="pt-10 px-20">
            <div className="row justify-between items-center mobile-header-layout">
              {/* --- Mobile Hamburger Menu --- */}
              <div className="col-auto d-none-desktop mobile-hamburger">
                <button
                  onClick={() => setCollapsed && setCollapsed((prev) => !prev)}
                  className="d-flex items-center justify-center size-40 rounded-8"
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                  }}
                  aria-label="Toggle sidebar menu"
                >
                  <i className="icon-explore text-24 text-dark-1"></i>
                </button>
              </div>

              {/* --- Logo (visible only on mobile, centered) --- */}
              <div className="col-auto d-none-desktop mobile-logo-center">
                <div className="header__logo">
                  <Link to="/dashboard">
                    <img
                      className="logo"
                      src="/assets/img/general/logo-dark.png"
                      alt="Academy51 Logo"
                      style={{ maxWidth: 150, height: "auto" }}
                    />
                  </Link>
                </div>
              </div>

              {/* --- Empty spacer for desktop to push content right --- */}
              <div className="col-auto d-none-mobile"></div>

              <div className="col-auto ml-auto">
                <div className="d-flex items-center">
                  {/* --- Quick Pages & My Courses --- 
                  <div className="text-white d-flex items-center lg:d-none mr-15">
                    <MyCourses />
                  </div>*/}

                  {/* --- Header Actions --- */}
                  <div className="d-flex items-center sm:d-none"></div>

                  {/* --- Plan Status Badge (hidden on mobile) --- */}
                  <div className="d-flex items-center ml-10 d-none-mobile">
                    <PlanStatusBadge />
                  </div>

                  {/* --- Profile Dropdown --- */}
                  <div
                    ref={profileRef}
                    className="relative d-flex items-center ml-10 mr-10"
                  >
                    <a
                      href="#"
                      className="d-flex items-center text-15 lh-1 gap-8"
                      onClick={(e) => {
                        e.preventDefault();
                        setIsOnProfile((prev) => !prev);
                      }}
                    >
                      {initials ? (
                        <div
                          className="size-40 d-flex justify-center align-center text-18 fw-600 text-white"
                          style={{
                            borderRadius: "50%",
                            backgroundColor: "#2F5FD9",
                            alignItems: "center",
                            textTransform: "uppercase",
                          }}
                        >
                          {initials}
                        </div>
                      ) : (
                        <img
                          className="size-50"
                          src="/assets/img/misc/user-profile.png"
                          alt="profile"
                          style={{ borderRadius: "50%" }}
                        />
                      )}
                    </a>

                    <div
                      className={`toggle-element js-profile-toggle ${
                        isOnProfile ? "-is-el-visible" : ""
                      }`}
                    >
                      <div className="toggle-bottom -profile bg-white shadow-4 border-light rounded-8 mt-10">
                        <div className="px-10 py-10">
                          <div className="sidebar -dashboard">
                            {/* ===== AWS STYLE HEADER ===== */}
                            <div style={{ padding: "12px 14px" }}>
                              {/* User Full Name (PRIMARY) */}
                              {/* User Full Name */}
                              {/* User Name */}
                              <div
                                style={{
                                  fontSize: 16,
                                  fontWeight: 600,
                                  color: "#111827",
                                  lineHeight: "20px",
                                }}
                              >
                                {first_name} {last_name}
                              </div>

                              {/* Email */}
                              <div
                                style={{
                                  fontSize: 13,
                                  color: "#374151",
                                  marginTop: 2,
                                }}
                              >
                                {email}
                              </div>

                              {/* Role (subtitle style under name) */}
                              {userRole && orgName && (
                                <div
                                  style={{
                                    fontSize: 12.5,
                                    color: "#6B7280",
                                    marginTop: 2,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                  }}
                                >
                                  {/* Role indicator dot */}
                                  <span
                                    style={{
                                      width: 6,
                                      height: 6,
                                      borderRadius: "50%",
                                      backgroundColor:
                                        userRole === "ADMIN"
                                          ? "#7C3AED" // 🟣 purple
                                          : userRole === "AUDITOR"
                                            ? "#2563EB" // 🔵 blue
                                            : "#0891B2", // fallback
                                    }}
                                  />
                                  {`${userRole.charAt(0)}${userRole.slice(1).toLowerCase()} @ ${orgName} `}
                                </div>
                              )}

                              {/* Organization (SECONDARY / LAST) 
                              {orgName && (
                                <div
                                  style={{
                                    fontSize: 12.5,
                                    color: "#9CA3AF",
                                    marginTop: 4,
                                  }}
                                >
                                  {orgName}
                                </div>
                              )}

                              {/* Plan Type and Credits - Side by Side */}
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 10,
                                  marginTop: 6,
                                  flexWrap: "wrap",
                                }}
                              >
                                {/* Plan Type */}
                                {planType && (
                                  <div
                                    style={{
                                      fontSize: 12,
                                      color: "#6366F1",
                                      fontWeight: 500,
                                      padding: "2px 8px",
                                      backgroundColor: "#EEF2FF",
                                      borderRadius: "4px",
                                    }}
                                  >
                                    {planType.charAt(0).toUpperCase() +
                                      planType.slice(1)}{" "}
                                    Plan
                                  </div>
                                )}

                                {/* Credits */}
                                <div
                                  style={{
                                    fontSize: 12,
                                    color: "#059669",
                                    fontWeight: 500,
                                    padding: "2px 8px",
                                    backgroundColor: "#ECFDF5",
                                    borderRadius: "4px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 4,
                                  }}
                                >
                                  <span>$</span>
                                  <span>{credits} </span>
                                </div>
                              </div>
                            </div>

                            <div
                              style={{
                                height: 1,
                                background: "#E5E7EB",
                                margin: "6px 0",
                              }}
                            />

                            {/* ===== ACTIONS ===== */}

                            {/* ================= AWS STYLE ACTIONS ================= */}

                            {/* Create Organization */}
                            {/* Create Organization (permission-based + plan-based: business/enterprise only) */}
                            {userPermissions.includes("organization") &&
                              hasAccess("business") && (
                                <>
                                  <Link
                                    to="/dashboard/createorganization"
                                    style={menuItemStyle}
                                    onClick={() => setIsOnProfile(false)}
                                  >
                                    <span
                                      style={{
                                        width: 20,
                                        height: 20,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                      }}
                                    >
                                      <img
                                        src="/dashboardSideBarIcons/organization.svg"
                                        alt=""
                                        style={{ width: 18, height: 18 }}
                                      />
                                    </span>
                                    <span>Create Organization</span>
                                  </Link>

                                  <div
                                    style={{
                                      height: 1,
                                      background: "#E5E7EB",
                                      margin: "6px 0",
                                    }}
                                  />
                                </>
                              )}

                            <button
                              type="button"
                              onClick={handleLogout}
                              style={{
                                ...menuItemStyle,
                                color: "#DC2626",
                              }}
                            >
                              <span
                                style={{
                                  width: 20,
                                  height: 20,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <i className="icon icon-power" />
                              </span>
                              <span>Logout</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* --- End Profile Dropdown --- */}
                </div>
              </div>
            </div>
          </div>
          <Messages setMessageOpen={setMessageOpen} messageOpen={messageOpen} />
        </div>
        <DashboardBreadcrumb />
      </header>

      {/* Profile Dropdown Overlay for Mobile */}
      {isOnProfile && (
        <div
          className="profile-dropdown-overlay"
          onClick={() => setIsOnProfile(false)}
        />
      )}
    </>
  );
}
