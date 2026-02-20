import Preloader from "@/components/common/Preloader";
import AuthFooter from "@/components/others/AuthFooter";
import AuthHeader from "@/components/others/AuthHeader";
import Terms from "@/components/terms/Terms";
import React from "react";
import MetaComponent from "@/components/common/MetaComponent";

const metadata = {
  title:
    "Terms of Use || MyAcademy51 - AI Compliance Assessment Platform",
  description:
    "Read the terms and conditions for using MyAcademy51's AI compliance platform and services.",
};

export default function TermsPage() {
  return (
    <div className="main-content">
      <MetaComponent meta={metadata} />
      <Preloader />

      <AuthHeader />
      <div className="content-wrapper js-content-wrapper overflow-hidden">
        <Terms />
        <AuthFooter />
      </div>
    </div>
  );
}
