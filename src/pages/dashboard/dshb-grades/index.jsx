import Grades from "@/components/dashboard/Grades";
import MetaComponent from "@/components/common/MetaComponent";

const metadata = {
  title:
    "Dashboard-grades || Academy51 - Professional LMS Online Education Course ReactJS Template",
  description:
    "Elevate your e-learning content with Educrat, the most impressive LMS template for online courses, education and LMS platforms.",
};

export default function DshbGradesPage() {
  return (
    <>
      <MetaComponent meta={metadata} />
      <Grades />
    </>
  );
}
