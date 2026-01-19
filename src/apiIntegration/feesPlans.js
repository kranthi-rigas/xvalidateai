// src/api/feePlansApi.js

import { API_BASE_URL, fetchWithAuth } from "./auth";

// 🔧 SET THIS TO false AFTER BACKEND IS DEPLOYED & WORKING
const USE_MOCK = false;

/* ----------------------------------------------------
   MOCK DATA (for development only)
---------------------------------------------------- */
const MOCK_FEE_PLANS = [
  {
    planId: "plan_basic",
    name: "Basic Plan",
    description: "Perfect for beginners",
    monthlyAmount: 1500,
    annualAmount: 16200,
    features: ["Live Classes", "Assignments", "Q&A Forum"],
    isActive: true,
    createdAt: "2025-04-01T10:00:00Z",
  },
  {
    planId: "plan_premium",
    name: "Premium Plan",
    description: "Full learning experience with certification",
    monthlyAmount: 3000,
    annualAmount: 32400,
    features: [
      "Live Classes",
      "Assignments",
      "Certificate",
      "1:1 Mentor",
      "Career Support",
    ],
    isActive: true,
    createdAt: "2025-04-01T10:05:00Z",
  },
  {
    planId: "plan_enterprise",
    name: "Enterprise Plan",
    description: "For institutions and groups",
    monthlyAmount: 5000,
    annualAmount: 54000,
    features: [
      "Everything in Premium",
      "Dedicated Manager",
      "Bulk Enrollment",
      "Custom Reports",
    ],
    isActive: false, // inactive → won't show on public page
    createdAt: "2025-04-01T10:10:00Z",
  },
];

/* ----------------------------------------------------
   PUBLIC: Fetch Active Fee Plans
---------------------------------------------------- */
export async function getFeePlans() {
  if (USE_MOCK) {
    // Simulate network delay
    await new Promise((res) => setTimeout(res, 300));
    return MOCK_FEE_PLANS.filter((plan) => plan.isActive);
  }

  try {
    const res = await fetch(`${API_BASE_URL}/public/fee-plans`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText || "Failed to load fee plans");
    }

    return await res.json();
  } catch (err) {
    console.error("❌ getFeePlans Error:", err);
    throw err;
  }
}

/* ----------------------------------------------------
   ADMIN: Create New Fee Plan
---------------------------------------------------- */
export async function createFeePlan(planData) {
  if (USE_MOCK) {
    await new Promise((res) => setTimeout(res, 400));
    const newPlan = {
      ...planData,
      planId: "plan_" + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    console.log("🟢 [MOCK] Created plan:", newPlan);
    return newPlan;
  }

  try {
    const res = await fetchWithAuth(`${API_BASE_URL}/admin/fee-plans`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(planData),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText || "Failed to create fee plan");
    }

    return await res.json();
  } catch (err) {
    console.error("❌ createFeePlan Error:", err);
    throw err;
  }
}

/* ----------------------------------------------------
   ADMIN: Update Fee Plan by ID
---------------------------------------------------- */
export async function updateFeePlan(planId, planData) {
  if (USE_MOCK) {
    await new Promise((res) => setTimeout(res, 400));
    const updatedPlan = {
      planId,
      ...planData,
      updatedAt: new Date().toISOString(),
    };
    console.log("🟢 [MOCK] Updated plan:", updatedPlan);
    return updatedPlan;
  }

  try {
    const res = await fetchWithAuth(
      `${API_BASE_URL}/admin/fee-plans/${planId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(planData),
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText || "Failed to update fee plan");
    }

    return await res.json();
  } catch (err) {
    console.error("❌ updateFeePlan Error:", err);
    throw err;
  }
}

/* ----------------------------------------------------
   ADMIN: Fetch All Fee Plans
---------------------------------------------------- */
export async function getAllFeePlans() {
  if (USE_MOCK) {
    await new Promise((res) => setTimeout(res, 300));
    return MOCK_FEE_PLANS; // includes inactive
  }

  try {
    const res = await fetchWithAuth(`${API_BASE_URL}/admin/fee-plans`, {
      method: "GET",
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText || "Failed to fetch fee plans");
    }

    return await res.json();
  } catch (err) {
    console.error("❌ getAllFeePlans Error:", err);
    throw err;
  }
}

/* ----------------------------------------------------
   ADMIN: Fetch Single Fee Plan by ID
---------------------------------------------------- */
export async function getFeePlanById(planId) {
  if (USE_MOCK) {
    await new Promise((res) => setTimeout(res, 300));
    const plan = MOCK_FEE_PLANS.find((p) => p.planId === planId);
    if (!plan) {
      throw new Error("Plan not found");
    }
    return plan;
  }

  try {
    const res = await fetchWithAuth(
      `${API_BASE_URL}/admin/fee-plans/${planId}`,
      {
        method: "GET",
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText || "Failed to fetch fee plan");
    }

    return await res.json();
  } catch (err) {
    console.error("❌ getFeePlanById Error:", err);
    throw err;
  }
}
