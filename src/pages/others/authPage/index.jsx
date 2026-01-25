import React from "react";
import { useSearchParams } from "react-router-dom";

import Preloader from "@/components/common/Preloader";
import HeaderAuth from "@/components/layout/headers/HeaderAuth";
import LoginForm from "@/components/others/LoginForm";
import SignUpForm from "@/components/others/SignUpForm";
import MetaComponent from "@/components/common/MetaComponent";

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode") || "login";

  const metadata = {
    title: mode === "login" ? "Login || Academy51" : "Sign up || Academy51",
    description: "Academy51 authentication page",
  };

  return (
    <div className="main-content">
      <MetaComponent meta={metadata} />
      <Preloader />

      <HeaderAuth />

      <div className="image-styles bg-cover bg-no-repeat flex justify-end items-center">
        <div className="auth-animate">
          {mode === "login" ? <LoginForm /> : <SignUpForm />}
        </div>
      </div>

      <div
        className="py-30 border-top-light-15"
        style={{ backgroundColor: "#202020" }}
      >
        <div className="row justify-center items-center text-center y-gap-20">
          <div className="col-auto">
            <div className="d-flex items-center h-100 text-white">
              MyAcademy 51 © {new Date().getFullYear()}. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
