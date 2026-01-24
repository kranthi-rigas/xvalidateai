import React from "react";
import { useNavigate } from "react-router-dom";
import { useContextElement } from "@/context/Context";
import { getUserPlan } from "../../../utils/planAccess";
import AwsButton from "@/components/common/AwsButton";

const PlanStatusBadge = () => {
  const context = useContextElement();
  const navigate = useNavigate();

  if (!context) return null;
  const { userPlan: plan, isLoggedIn } = useContextElement();

  if (!isLoggedIn) return null;

  // Hide badge for higher plans
  if (plan === "business" || plan === "enterprise") {
    return null;
  }

  // Free & Premium → show upgrade CTA
  if (plan === "free" || plan === "premium") {
    return (
      <AwsButton
        label="Upgrade Plan"
        size="md"
        onClick={() => navigate("/dashboard/pricing")}
      >
        <i className="icon-flash text-16" />
      </AwsButton>
    );
  }

  return null;
};

export default PlanStatusBadge;
