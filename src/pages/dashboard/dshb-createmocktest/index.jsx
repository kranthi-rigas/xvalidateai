import MetaComponent from "@/components/common/MetaComponent";
import Quiz from "@/components/dashboard/CreateMockTest/CreateMockTest"; // ✅ your Create Mock Test component

const metadata = {
  title: "Dashboard - Create Mock Test | Academy51",
  description: "Create a new mock test and manage exam content.",
};

export default function DshbCreateMockTestPage() {
  return (
    <>
      <MetaComponent meta={metadata} />
      <Quiz />
    </>
  );
}
