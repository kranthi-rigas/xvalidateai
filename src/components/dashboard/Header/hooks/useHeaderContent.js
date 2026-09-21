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
  "/dashboard/documents": {
    title: "My Documents",
    description: "Documents you have uploaded. Only you can see them.",
  },
  "/dashboard/orgusergroups": {
    title: "User Groups",
    description: "Create and manage user groups to organize users and control access across your organization.",
  },
  "/dashboard/orgusers": {
    title: "Users",
    description: "View, invite, and manage users in your organization, including roles and access status.",
  },

  "/dashboard/organizations": {
    title: "Organizations",
    description: "Manage your organization settings and members.",
  },
  "/dashboard/calendar": {
    title: "Calendar",
    description: "Upcoming reviews, assessments and deadlines for your organization.",
  },
  "/dashboard/settings": {
    title: "Settings",
    description: "Configure your account and preferences.",
  },
  "/dashboard/pricing": {
    title: "Pricing",
    description: "View and manage your subscription plan.",
  },
  "/dashboard/audittrail": {
    title: "Audit Trail",
    description: "Monitor and review user and system activity across your organization.",
  },

  "/dashboard/faqs": {
  title: "FAQs",
  description: "Access quick answers about AI compliance, governance policies, platform features, and implementation guidance.",
},
"/dashboard/administration": {
  title: "Administration",
  description: "Manage and track credit requests from your organization.",
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