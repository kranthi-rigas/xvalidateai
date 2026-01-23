export const sidebarItems = [
    {
        id: 1,
        href: "/dashboard",
        src: "/dashboardSideBarIcons/dashboard.svg",
        active_src: "/dashboardSideBarIcons/dashboard_active.svg",
        text: "Home",
        permission: "dashboard",
        requiredPlan: null,
    },

    /*{
       id: 3,
       href: "/dashboard/aianalytics",
       src: "/dashboardSideBarIcons/dashboard.svg",
       active_src: "/dashboardSideBarIcons/dashboard_active.png",
       // src: "/dashboardSideBarIcons/analytics.svg",
       // active_src: "/dashboardSideBarIcons/analytics_active.png",
       text: "Home",
       permission: "ai_compliance",
       requiredPlan: null,
     },
     */
    {
        id: 2,
        href: "/dashboard/aicompliance",
        src: "/dashboardSideBarIcons/ai_compliance.svg",
        active_src: "/dashboardSideBarIcons/ai_compliance_active.svg",
        text: "AI Compliance",
        permission: "ai_compliance",
        requiredPlan: null,
    },
    {
        id: 23,
        href: "/dashboard/ailiteracy",
        src: "/dashboardSideBarIcons/ai_literacy.svg",
        active_src: "/dashboardSideBarIcons/ai_literacy_active.svg",
        text: "AI Literacy",
        permission: "ai_literacy",
        requiredPlan: null,
    },

    {
        id: 4,
        src: "/dashboardSideBarIcons/organization.svg",
        active_src: "/dashboardSideBarIcons/organization_active.png",
        text: "Organization",
        permission: "organization",
        requiredPlan: "business",
        children: [
            { id: "user-groups", iconClass: "text-20 icon-person-3", text: "User groups", permission: "organization", href: "/dashboard/orgusergroups", requiredPlan: null },
            { id: "users", iconClass: "text-20 icon-person-3", text: "Users", permission: "organization", href: "/dashboard/orgusers", requiredPlan: null },
            { id: "organizations", iconClass: "text-20 icon-person-3", text: "Organizations", permission: "organization", href: "/dashboard/organizations", requiredPlan: "business" },
        ],
    },
    /*{
      id: 5,
      href: "/dashboard/courses",
      src: "/dashboardSideBarIcons/courses.svg",
      active_src: "/dashboardSideBarIcons/courses_active.png",
      text: "My Courses",
      permission: "courses",
      requiredPlan: null,
    },
    {
      id: 6,
      href: "/dashboard/mocktest",
      src: "/dashboardSideBarIcons/mock_tests.svg",
      active_src: "/dashboardSideBarIcons/mock_tests_active.png",
      text: "Mock Tests",
      permission: "mock_tests",
      requiredPlan: null,
    },
    {
      id: 7,
      href: "/dashboard/createmocktest",
      text: "Create Mock Test",
      src: "/dashboardSideBarIcons/create_mock_test.svg",
      active_src: "/dashboardSideBarIcons/create_mock_test_active.png",
      permission: "create_mock_test",
      requiredPlan: null,
    },
    /*{
      id: 8,
      href: "/dshb-messages",
      iconClass: "text-20 icon-message",
      text: "Messages",
    },*/
    /*
    {
      id: 9,
      href: "/dashboard/becomeinstructor",
      src: "/dashboardSideBarIcons/become_instructor.svg",
      active_src: "/dashboardSideBarIcons/become_instructor_active.png",
      text: "Become Instructor",
      permission: "become_instructor",
      requiredPlan: null,
    },
    {
      id: 10,
      href: "/dashboard/reviewInstructors",
      src: "/dashboardSideBarIcons/review_instructor.svg",
      active_src: "/dashboardSideBarIcons/review_instructor_active.png",
      text: "Review Instructors",
      permission: "review_instructors",
      requiredPlan: null,
    },

    /*{
      id: 11,
      href: "/dshb-listing",
      iconClass: "text-20 icon-list",
      text: "Create Course",
    },
    {
      id: 12,
      href: "/dshb-reviews",
      iconClass: "text-20 icon-comment",
      text: "Reviews",
    },*/
    {
        id: 13,
        href: "/dashboard/settings",
        src: "/dashboardSideBarIcons/settings.svg",
        active_src: "/dashboardSideBarIcons/settings_active.svg",
        text: "Settings",
        permission: "settings",
        requiredPlan: null,
    },
    {
        id: 17,
        href: "/dashboard/pricing",
        text: "Pricing",
        src: "/dashboardSideBarIcons/pricing.svg",
        active_src: "/dashboardSideBarIcons/pricing_active.svg",
        requiredPlan: null,
        permission: "pricing",
    },





    /*
    {
      id: 14,
      href: "/dashboard/administration",
      text: "Administration",
      src: "/dashboardSideBarIcons/administration.svg",
      active_src: "/dashboardSideBarIcons/administration_active.png",
      permission: "administration",
      requiredPlan: null,
    },
    {
      id: 15,
      href: "/dashboard/assignment",
      text: "Assignment",
      src: "/dashboardSideBarIcons/assignment.svg",
      active_src: "/dashboardSideBarIcons/assignment_active.png",
      permission: "assignment",
      requiredPlan: null,
    },
    {
      id: 16,
      href: "/dashboard/fee-plans",
      text: "Fee Plans",
      src: "/dashboardSideBarIcons/banknote.svg",
      active_src: "/dashboardSideBarIcons/banknote_active.svg",
      requiredPlan: null,
    },/*
    {
      id: 17,
      href: "/dashboard/pricing",
      text: "Pricing",
      src: "/dashboardSideBarIcons/pricing.svg",
      active_src: "/dashboardSideBarIcons/pricing_active.svg",
      requiredPlan: null,
      // permission: "pricing",
    },
    /*{
      id: 17,
      href: "/dshb-calendar",
      text: "Calendar",
      iconClass: "text-20 icon-calendar",
    },
    {
      id: 18,
      href: "/dshb-dashboard",
      text: "Single Dashboard",
      iconClass: "text-20 icon-discovery",
    },
    {
      id: 19,
      href: "/dshb-forums",
      text: "Forums",
      iconClass: "text-20 icon-access",
    },*/
    /*
    {
      id: 20,
      href: "/dashboard/grades",
      text: "Grades",
      src: "/dashboardSideBarIcons/grades.svg",
      active_src: "/dashboardSideBarIcons/grades_active.png",
      permission: "grades",
      requiredPlan: null,
    },
    /*{
      id: 20,
      href: "/dshb-participants",
      text: "Participants",
      iconClass: "text-20 icon-person-3",
    },
    {
      id: 21,
      href: "/dshb-bookmarks",
      iconClass: "text-20 icon-bookmark",
      text: "Bookmarks",
    },
    {
      id: 22,
      href: "/dshb-survey",
      text: "Survey",
      iconClass: "text-20 icon-list",
    },*/
];
