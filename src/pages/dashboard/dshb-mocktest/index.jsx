import MetaComponent from "@/components/common/MetaComponent";
import MockTestPage from "@/components/dashboard/MockTestPage";

const metadata = {
  title: "Dashboard - Mock Test | Academy51",
  description: "Mock Test dashboard for managing and viewing mock exams.",
};

export default function DshbMockTestPage() {
  return (
    <>
      <MetaComponent meta={metadata} />
      <MockTestPage />
    </>
  );
}
