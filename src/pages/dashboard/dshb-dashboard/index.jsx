import DshbDashboard from "@/components/dashboard/Dshb-dashboard";
import MetaComponent from "@/components/common/MetaComponent";

const metadata = {
  title:
    "Dashboard-single || Academy51 - Professional LMS Online Education Course ReactJS Template",
  description:
    "Elevate your e-learning content with Educrat, the most impressive LMS template for online courses, education and LMS platforms.",
};
export default function DshbDashboardPage() {
  return (
    <>
      <MetaComponent meta={metadata} />
      <DshbDashboard />
    </>
  );
}
