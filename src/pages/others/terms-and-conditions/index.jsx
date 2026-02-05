import PageLinks from "@/components/common/PageLinks";
import Preloader from "@/components/common/Preloader";
import AuthFooter from "@/components/others/AuthFooter";
import AuthHeader from "@/components/others/AuthHeader";
import TermsAndConditions from "@/components/terms/TermsAndConditions";
import React from "react";
import MetaComponent from "@/components/common/MetaComponent";

const metadata = {
  title:
    "Terms & Conditions || XVALIDATEAI - AI Compliance Assessment Platform",
  description:
    "Read our terms and conditions for using XVALIDATEAI services.",
};

export default function TermsAndConditionsPage() {
  return (
    <div className="main-content">
      <MetaComponent meta={metadata} />
      <Preloader />

      <AuthHeader />
      <div className="content-wrapper js-content-wrapper overflow-hidden">
        <PageLinks />
        <TermsAndConditions />
        <AuthFooter />
      </div>
    </div>
  );
}
