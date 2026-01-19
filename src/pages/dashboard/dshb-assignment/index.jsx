import Assignment from "@/components/dashboard/Assignment";
import React from "react";

import MetaComponent from "@/components/common/MetaComponent";

const metadata = {
  title:
    "Dashboard-assignment || Academy51 - Professional LMS Online Education Course ReactJS Template",
  description:
    "Elevate your e-learning content with Educrat, the most impressive LMS template for online courses, education and LMS platforms.",
};

export default function DshbAssignmentPage() {
  return (
    <>
      <MetaComponent meta={metadata} />
      <Assignment />
    </>
  );
}
