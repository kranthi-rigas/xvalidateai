import Preloader from "@/components/common/Preloader";
import AuthFooter from "@/components/others/AuthFooter";
import AuthHeader from "@/components/others/AuthHeader";
import PrivacyPolicy from "@/components/terms/PrivacyPolicy";
import React from "react";
import MetaComponent from "@/components/common/MetaComponent";

const metadata = {
  title:
    "Privacy Policy || MyAcademy51 - AI Compliance Assessment Platform",
  description:
    "Learn how MyAcademy51 collects, uses, and protects your personal information.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="main-content">
      <MetaComponent meta={metadata} />
      <Preloader />

      <AuthHeader />
      <div className="content-wrapper js-content-wrapper overflow-hidden">
        <PrivacyPolicy />
        <AuthFooter />
      </div>
    </div>
  );
}
