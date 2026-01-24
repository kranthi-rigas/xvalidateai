import React, { useEffect } from "react";
import Sidebar from "@/components/dashboard/Sidebar.jsx";
import HeaderDashboard from "@/components/layout/headers/HeaderDashboard.jsx";
import Preloader from "@/components/common/Preloader.jsx";
import MetaComponent from "@/components/common/MetaComponent.jsx";
import HeaderAuth from "@/components/layout/headers/HeaderAuth.jsx";
import { googleLogin } from "@/apiIntegration/auth.js";
import { useNavigate } from "react-router-dom";
import useToast from "@/hooks/useToast";

const metadata = {
  title: "Academy51 - Login",
  description: "Login into application using google login",
};

export default function GoogleLoginPage() {
  const navigate = useNavigate();
  const show = useToast();

  useEffect(() => {
    const doLogin = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      try {
        const res = await googleLogin(code);
        localStorage.setItem("access_token", res.access_token);
        localStorage.setItem("refresh_token", res.refresh_token);
        localStorage.setItem("user_info", JSON.stringify(res.user));
        refreshUserPlan?.();
        refreshUserPlan();
        navigate("/dashboard");
      } catch (err) {
        show(err.message || "Google login failed", { type: "error" });
        console.error("Google login error", err);
      }
    };
    doLogin();
  }, []);

  return (
    <div className="main-content">
      <MetaComponent meta={metadata} />
      <Preloader />

      <HeaderAuth />
      <div className="content-wrapper js-content-wrapper overflow-hidden">
        Redirecting...
      </div>
    </div>
  );
}
