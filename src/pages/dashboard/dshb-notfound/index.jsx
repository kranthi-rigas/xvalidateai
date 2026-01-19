import DashboardNotFound from "@/components/dashboard/DashboardNotFound";
import MetaComponent from "@/components/common/MetaComponent";

const metadata = {
  title: "Page Not Found || Academy51 - Dashboard",
  description: "The page you are looking for does not exist.",
};

export default function DashboardNotFoundPage() {
  return (
    <>
      <MetaComponent meta={metadata} />
      <DashboardNotFound />
    </>
  );
}
