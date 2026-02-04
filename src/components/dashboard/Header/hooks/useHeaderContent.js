import { useMemo } from "react";

const headerContentMap = {
  "/dashboard": {
    title: "Dashboard Overview",
    description: "Welcome back to your compliance center.",
  },
  "/dashboard/aicompliance": {
    title: "AI Compliance",
    description: "Manage and monitor AI tool compliance assessments.",
  },
  "/dashboard/ailiteracy": {
    title: "AI Literacy",
    description: "Educational resources and training materials.",
  },
  "/dashboard/organizations": {
    title: "Organizations",
    description: "Manage your organization settings and members.",
  },
  "/dashboard/settings": {
    title: "Settings",
    description: "Configure your account and preferences.",
  },
  "/dashboard/pricing": {
    title: "Pricing",
    description: "View and manage your subscription plan.",
  },
};

export function useHeaderContent(pathname) {
  return useMemo(() => {
    if (pathname === "/dashboard" || pathname === "/dashboard/") {
      return headerContentMap["/dashboard"];
    }

    for (const [prefix, content] of Object.entries(headerContentMap)) {
      if (pathname.startsWith(prefix) && prefix !== "/dashboard") {
        return content;
      }
    }

    return { title: "Dashboard", description: "Welcome back." };
  }, [pathname]);
}