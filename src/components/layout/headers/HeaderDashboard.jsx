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
import { COLORS } from "@/styles/colors";
import AwsButton from "@/components/common/AwsButton";

export default function HeaderDashboard({ collapsed, setCollapsed }) {
  const [messageOpen, setMessageOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isOnNotification, setIsOnNotification] = useState(false);
  const [isOnProfile, setIsOnProfile] = useState(false);
  const [documentElement, setDocumentElement] = useState();
  const [initials, setInitials] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [first_name, setFirstName] = useState("");
  const [last_name, setLastName] = useState("");
  const [userPermissions, setUserPermissions] = useState([]);
  const [isDefaultAccount, setIsDefaultAccount] = useState(true);
  const [isCartOpen, setCartOpen] = useState(false);
  const [planType, setPlanType] = useState("");
  const [credits, setCredits] = useState(0); // stat to store credits

  const { setUserPlan, setIsLoggedIn, setUserCredits, resetUserState } = useContextElement();

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

  // ✅ Show logout confirmation modal
  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  // ✅ Logout logic
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      setShowLogoutModal(false);

      const token =
        localStorage.getItem("refresh_token") ||
        sessionStorage.getItem("refresh_token");

      await logoutUser(token);

      // Clear tokens & redirect
      localStorage.clear();
      sessionStorage.clear();

      // Reset Context state to defaults
      resetUserState();

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
      <header className="header -dashboard js-header" style={{
        minHeight: "80px",
        backgroundColor: "white",
        borderBottom: "1px solid #E2E8F0",
        position: "sticky",
        top: 0,
        zIndex: 10,
        paddingTop: "env(safe-area-inset-top, 0px)",
      }}>
        <div className="header-inner" style={{ height: "100%" }}>
          <div className="pt-10 px-20" style={{ height: "100%" }}>
            <div className="row justify-between items-center mobile-header-layout" style={{ height: "100%", alignItems: "center" }}>
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

              {/* --- Dashboard Title (visible on desktop) --- */}
              <div className="col-auto d-none-mobile">
                <div>
                  <h1 style={{ fontSize: "24px", fontWeight: "bold", color: "#0F3053", margin: 0 }}>
                    Dashboard Overview
                  </h1>
                  <p style={{ fontSize: "14px", color: "#64748B", margin: 0 }}>
                    Welcome back to your compliance center.
                  </p>
                </div>
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

              <div className="col-auto ml-auto">
                <div className="d-flex items-center" style={{ gap: "16px" }}>
                  {/* --- Search Bar --- */}
                  <div className="d-none-mobile" style={{ position: "relative" }}>
                    <input
                      type="text"
                      placeholder="Search tools, vendors..."
                      style={{
                        paddingLeft: "40px",
                        paddingRight: "16px",
                        paddingTop: "8px",
                        paddingBottom: "8px",
                        backgroundColor: "#F1F5F9",
                        border: "1px solid transparent",
                        borderRadius: "8px",
                        fontSize: "14px",
                        width: "256px",
                        transition: "all 0.2s",
                        outline: "none"
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = "#0F3053";
                        e.target.style.backgroundColor = "white";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "transparent";
                        e.target.style.backgroundColor = "#F1F5F9";
                      }}
                    />
                    <i className="fa-solid fa-search" style={{
                      position: "absolute",
                      left: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#64748B",
                      fontSize: "14px"
                    }}></i>
                  </div>

                  {/* --- Notification Bell --- */}
                  <button style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    backgroundColor: "#F1F5F9",
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#64748B",
                    cursor: "pointer",
                    position: "relative",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#0F3053";
                    e.currentTarget.style.backgroundColor = "rgba(88, 191, 206, 0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "#64748B";
                    e.currentTarget.style.backgroundColor = "#F1F5F9";
                  }}>
                    <i className="fa-regular fa-bell"></i>
                    <span style={{
                      position: "absolute",
                      top: "8px",
                      right: "8px",
                      width: "8px",
                      height: "8px",
                      backgroundColor: "#ef4444",
                      borderRadius: "50%",
                      border: "2px solid white"
                    }}></span>
                  </button>
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

                  {/* --- Logout Button (visible on desktop) --- */}
                  <button
                    onClick={handleLogoutClick}
                    disabled={isLoggingOut}
                    className="d-none-mobile"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "8px 16px",
                      backgroundColor: "transparent",
                      border: `1px solid ${COLORS.borderLight}`,
                      borderRadius: "8px",
                      fontSize: "14px",
                      fontWeight: "500",
                      color: COLORS.error,
                      cursor: isLoggingOut ? "not-allowed" : "pointer",
                      transition: "all 0.2s",
                      marginLeft: "12px"
                    }}
                    onMouseEnter={(e) => {
                      if (!isLoggingOut) {
                        e.currentTarget.style.backgroundColor = COLORS.errorLight;
                        e.currentTarget.style.borderColor = COLORS.error;
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.borderColor = COLORS.borderLight;
                    }}
                  >
                    <i className="icon icon-power" style={{ fontSize: "16px" }}></i>
                    <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
                  </button>

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
                              onClick={handleLogoutClick}
                              style={{
                                ...menuItemStyle,
                                color: COLORS.error,
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

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: COLORS.bgOverlay,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
          onClick={() => setShowLogoutModal(false)}
        >
          <div
            style={{
              backgroundColor: COLORS.white,
              borderRadius: "12px",
              padding: "24px",
              maxWidth: "400px",
              width: "90%",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ marginBottom: "16px", textAlign: "center" }}>
              <div style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                backgroundColor: COLORS.errorLight,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "16px",
                margin: "0 auto 16px auto"
              }}>
                <i className="icon icon-power" style={{ fontSize: "24px", color: COLORS.error }}></i>
              </div>
              <h3 style={{
                fontSize: "18px",
                fontWeight: "600",
                color: COLORS.textPrimary,
                marginBottom: "8px"
              }}>
                Confirm Logout
              </h3>
              <p style={{
                fontSize: "14px",
                color: COLORS.textSecondary,
                lineHeight: "1.5"
              }}>
                Are you sure you want to logout?
              </p>
            </div>

            {/* Modal Actions */}
            <div style={{
              display: "flex",
              gap: "12px",
              justifyContent: "center",
              marginTop: "24px"
            }}>
              <AwsButton
                label="Cancel"
                variant="secondary"
                onClick={() => setShowLogoutModal(false)}
                disabled={isLoggingOut}
              />
              <AwsButton
                label={isLoggingOut ? "Logging out..." : "Logout"}
                variant="primary"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                {!isLoggingOut && <i className="icon icon-power" style={{ fontSize: "14px" }}></i>}
              </AwsButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
