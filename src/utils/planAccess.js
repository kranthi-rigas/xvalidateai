// Plan hierarchy - higher index = more access
export const PLAN_HIERARCHY = {
  free: 0,
  premium: 1,
  business: 2,
  enterprise: 2,
};

// Plan display names for badges
export const PLAN_DISPLAY_NAMES = {
  free: "Free",
  premium: "Platform",
  business: "Platform + CAIO",
  enterprise: "Enterprise",
};

// Plan badge colors
export const PLAN_BADGE_COLORS = {
  premium: {
    background: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",
    color: "#000",
  },
  enterprise: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "#fff",
  },
  business: {
    background: "linear-gradient(135deg, #43cea2 0%, #185a9d 100%)",
    color: "#fff",
  },
};

/**
 * Get the user's current plan from localStorage
 * @returns {string} - The user's plan type (free, premium, business, enterprise)
 */
export function getUserPlan() {
  try {
    const userInfo = localStorage.getItem("user_info");
    if (!userInfo) {
      console.log("🔍 getUserPlan: No user_info found, defaulting to free");
      return "free";
    }
    
    const parsed = JSON.parse(userInfo);
    
    // Debug: Log the plan structure
    console.log("🔍 getUserPlan: plan object:", parsed?.plan);
    console.log("🔍 getUserPlan: subscription object:", parsed?.subscription);
    
    // Try multiple possible locations
    let planType = 
      parsed?.plan?.plan_type ||        // Backend subscription
      parsed?.plan?.name ||              // Fee plan system
      parsed?.subscription?.plan_type || // Voucher system
      parsed?.plan_type ||               // Direct property
      null;
    
    if (!planType) {
      console.log("🔍 getUserPlan: No plan found in any location, defaulting to free");
      return "free";
    }
    
    planType = planType.toLowerCase();
    console.log("🔍 getUserPlan: Raw plan type (lowercase):", planType);
    
    // Normalize plan names
    if (planType.includes("basic") || planType.includes("starter") || planType === "free") {
      return "free";
    }
    if (planType.includes("premium") || planType.includes("pro")) {
      return "premium";
    }
    if (planType.includes("business")) {
      return "business";
    }
    if (planType.includes("enterprise")) {
      return "enterprise";
    }
    
    // Log unrecognized plan for debugging
    console.log("🔍 getUserPlan: Unrecognized plan type:", planType);
    return planType;
  } catch (error) {
    console.error("Error reading user plan:", error);
    return "free";
  }
}

/**
 * Check if user has access to a feature based on required plan
 * @param {string} requiredPlan - The minimum plan required (free, premium, enterprise)
 * @param {string} userPlan - The user's current plan
 * @returns {boolean} - Whether user has access
 */
export function hasAccess(requiredPlan, userPlan = null) {
  const currentPlan = userPlan || getUserPlan();
  
  // If no required plan specified, everyone has access
  if (!requiredPlan) {
    console.log("🔍 hasAccess: No required plan, granting access");
    return true;
  }
  
  const requiredLevel = PLAN_HIERARCHY[requiredPlan.toLowerCase()] || 0;
  const userLevel = PLAN_HIERARCHY[currentPlan.toLowerCase()] || 0;
  
  console.log(`🔍 hasAccess: Required="${requiredPlan}" (level ${requiredLevel}), Current="${currentPlan}" (level ${userLevel}), Access=${userLevel >= requiredLevel}`);
  
  return userLevel >= requiredLevel;
}

/**
 * Get the minimum required plan to access a feature
 * @param {string} requiredPlan - The required plan
 * @returns {string} - Display name for the required plan
 */
export function getRequiredPlanName(requiredPlan) {
  return PLAN_DISPLAY_NAMES[requiredPlan?.toLowerCase()] || requiredPlan;
}
