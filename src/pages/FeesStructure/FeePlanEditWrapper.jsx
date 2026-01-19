// src/components/admin/EditWrapper.jsx

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import FeePlanForm from "./FeePlanForm";
import { getFeePlanById } from "@/apiIntegration/feesPlans";

export default function EditWrapper() {
  const { planId } = useParams();
  console.log("Editing plan ID:", planId);
  const navigate = useNavigate();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPlan = async () => {
      try {
        const data = await getFeePlanById(planId);
        setPlan(data);
      } catch (err) {
        alert("Plan not found");
        navigate("/dashboard/fee-plans");
      } finally {
        setLoading(false);
      }
    };
    loadPlan();
  }, [planId, navigate]);

  if (loading) {
    return <div className="container py-10 text-center">Loading...</div>;
  }

  return <FeePlanForm plan={plan} />;
}
