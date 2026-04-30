import { coursesData } from "@/data/courses";
import { events } from "@/data/events";
import { productData } from "@/data/products";
import { fetchUserProfile, logoutUser } from "@/apiIntegration/auth";
import { getUserPlan } from "@/utils/planAccess";
import React from "react";
import { useContext, useState, useCallback, useEffect, useRef } from "react";

const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
const IDLE_CHECK_INTERVAL_MS = 180 * 1000;
const AUTH_REDIRECT_URL = "/auth?mode=login";

const dataContext = React.createContext();
export const useContextElement = () => {
  return useContext(dataContext);
};

export default function Context({ children }) {
  const [cartProducts, setCartProducts] = useState([]);

  const [cartCourses, setCartCourses] = useState([]);
  const [cartEvents, setCartEvents] = useState([]);

  // User plan state: "free", "premium", or "enterprise"
  const [userPlan, setUserPlan] = useState("free");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userCredits, setUserCredits] = useState(0);
  const lastActivityRef = useRef(Date.now());

  // Initialize user plan from localStorage on component mount
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      setIsLoggedIn(true);

      // Get plan from localStorage using utility function
      const currentPlan = getUserPlan();
      console.log(
        "🔄 Context init: Loading plan from localStorage:",
        currentPlan,
      );
      setUserPlan(currentPlan);

      // Get credits from localStorage
      try {
        const userInfo = localStorage.getItem("user_info");
        if (userInfo) {
          const parsed = JSON.parse(userInfo);
          const credits =
            parsed?.plan?.credits_remaining ||
            parsed?.subscription?.credits_remaining ||
            0;
          setUserCredits(credits);
          console.log(
            "🔄 Context init: Loading credits from localStorage:",
            credits,
          );
        }
      } catch (error) {
        console.error("Error loading user credits:", error);
      }
    } else {
      setIsLoggedIn(false);
      setUserPlan("free");
      setUserCredits(0);
    }
  }, []);

  // Function to refresh user plan from API and update localStorage + Context
  const refreshUserPlan = useCallback(async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) return;

      const userData = await fetchUserProfile(token);
      if (userData) {
        // Update localStorage with fresh user data
        localStorage.setItem("user_info", JSON.stringify(userData));

        // Update Context state
        const userPlanType = userData?.plan?.plan_type ?? "free";
        const credits = userData?.plan?.credits_remaining ?? 0;

        setUserPlan(userPlanType.toLowerCase());
        setUserCredits(credits);
        setIsLoggedIn(true);

        console.log(
          "🔄 refreshUserPlan: Updated plan to",
          userPlanType,
          "with",
          credits,
          "credits",
        );
      }
    } catch (error) {
      console.error("Error refreshing user plan:", error);
    }
  }, []);

  // Function to reset user state on logout
  const resetUserState = useCallback(() => {
    console.log("🔄 resetUserState: Resetting all user state to defaults");
    setUserPlan("free");
    setUserCredits(0);
    setIsLoggedIn(false);
    setCartProducts([]);
    setCartCourses([]);
    setCartEvents([]);
  }, []);

  const forceLogout = useCallback(async () => {
    const refreshToken =
      localStorage.getItem("refresh_token") ||
      sessionStorage.getItem("refresh_token");

    if (refreshToken) {
      try {
        await logoutUser(refreshToken);
      } catch (error) {
        console.error("Auto logout API call failed:", error);
      }
    }

    localStorage.clear();
    sessionStorage.clear();
    resetUserState();

    if (window.location.pathname !== "/auth") {
      window.location.assign(AUTH_REDIRECT_URL);
    }
  }, [resetUserState]);

  useEffect(() => {
    if (!isLoggedIn) return;

    const activityEvents = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ];

    const updateActivity = () => {
      lastActivityRef.current = Date.now();
    };

    activityEvents.forEach((ev) =>
      window.addEventListener(ev, updateActivity, { passive: true }),
    );

    lastActivityRef.current = Date.now();

    const intervalId = window.setInterval(() => {
      if (Date.now() - lastActivityRef.current >= IDLE_TIMEOUT_MS) {
        forceLogout();
      }
    }, IDLE_CHECK_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
      activityEvents.forEach((ev) =>
        window.removeEventListener(ev, updateActivity),
      );
    };
  }, [forceLogout, isLoggedIn]);

  // Function to update user plan from localStorage (call after login)
  const loadUserPlanFromStorage = useCallback(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      setIsLoggedIn(true);
      const currentPlan = getUserPlan();
      console.log("🔄 loadUserPlanFromStorage: Loading plan:", currentPlan);
      setUserPlan(currentPlan);

      try {
        const userInfo = localStorage.getItem("user_info");
        if (userInfo) {
          const parsed = JSON.parse(userInfo);
          const credits =
            parsed?.plan?.credits_remaining ||
            parsed?.subscription?.credits_remaining ||
            0;
          setUserCredits(credits);
          console.log("🔄 loadUserPlanFromStorage: Loading credits:", credits);
        }
      } catch (error) {
        console.error("Error loading user credits:", error);
      }
    }
  }, []);

  const addCourseToCart = (id) => {
    if (!cartCourses.filter((elm) => elm.id == id)[0]) {
      const item = {
        ...coursesData.filter((elm) => elm.id == id)[0],
        quantity: 1,
      };
      setCartCourses((pre) => [...pre, item]);
    }
  };
  const isAddedToCartCourses = (id) => {
    if (cartCourses.filter((elm) => elm.id == id)[0]) {
      return true;
    }
    return false;
  };
  const addProductToCart = (id) => {
    if (!cartProducts.filter((elm) => elm.id == id)[0]) {
      const item = {
        ...productData.filter((elm) => elm.id == id)[0],
        quantity: 1,
      };
      setCartProducts((pre) => [...pre, item]);
    }
  };
  const isAddedToCartProducts = (id) => {
    if (cartProducts.filter((elm) => elm.id == id)[0]) {
      return true;
    }
    return false;
  };
  const addEventToCart = (id) => {
    if (!cartEvents.filter((elm) => elm.id == id)[0]) {
      const item = { ...events.filter((elm) => elm.id == id)[0], quantity: 1 };
      setCartEvents((pre) => [...pre, item]);
    }
  };
  const isAddedToCartEvents = (id) => {
    if (cartEvents.filter((elm) => elm.id == id)[0]) {
      return true;
    }
    return false;
  };

  const contextElement = {
    cartProducts,
    setCartProducts,
    addProductToCart,
    isAddedToCartProducts,

    addCourseToCart,
    isAddedToCartCourses,
    cartCourses,
    setCartCourses,

    cartEvents,
    setCartEvents,
    addEventToCart,
    isAddedToCartEvents,

    // User plan and authentication
    userPlan,
    setUserPlan,
    isLoggedIn,
    setIsLoggedIn,
    userCredits,
    setUserCredits,
    refreshUserPlan,
    resetUserState,
    loadUserPlanFromStorage,
  };
  return (
    <dataContext.Provider value={contextElement}>
      {children}
    </dataContext.Provider>
  );
}
