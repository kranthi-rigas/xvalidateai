import MetaComponent from "@/components/common/MetaComponent";
import DashboardOne from "@/components/dashboard/DashboardOne";

const metadata = {
  title: "Dashboard | Academy51",
  description: "User dashboard overview",
};

export default function DashboardPage() {
  return (
    <>
      <MetaComponent meta={metadata} />
      <DashboardOne />
    </>
  );
}
