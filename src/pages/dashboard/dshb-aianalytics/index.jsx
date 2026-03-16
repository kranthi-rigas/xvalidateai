import MetaComponent from "@/components/common/MetaComponent";
import AIDashboard from "@/components/dashboard/AIDashboard";

const metadata = {
  title: "AI Dashboard || XValidate",
  description: "AI analytics dashboard",
};

export default function AIDashboardPage() {
  return (
    <>
      <MetaComponent meta={metadata} />
      <AIDashboard />
    </>
  );
}
