import DashboardNotFound from "@/components/dashboard/DashboardNotFound";
import MetaComponent from "@/components/common/MetaComponent";
import AuthHeader from "@/components/others/AuthHeader";
import AuthFooter from "@/components/others/AuthFooter";
import Preloader from "@/components/common/Preloader";

const metadata = {
  title: "Page Not Found || Academy51",
  description: "The page you are looking for does not exist.",
};

export default function DashboardNotFoundPage() {
  return (
    <div className="main-content">
      <MetaComponent meta={metadata} />
      <Preloader />

      <AuthHeader />

      <div
        style={{
          minHeight: "calc(100vh - 180px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f8f9fa",
        }}
      >
        <DashboardNotFound />
      </div>

      {/* <AuthFooter /> */}
    </div>
  );
}
