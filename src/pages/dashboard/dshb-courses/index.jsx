import MetaComponent from "@/components/common/MetaComponent";
import MyCourses from "@/components/dashboard/MyCourses";

const metadata = {
  title:
    "Dashboard-courses || Academy51 - Professional LMS Online Education Course ReactJS Template",
  description:
    "Elevate your e-learning content with Educrat, the most impressive LMS template for online courses, education and LMS platforms.",
};

export default function DshbCoursesPage() {
  return (
    <>
      <MetaComponent meta={metadata} />
      <MyCourses />
    </>
  );
}
