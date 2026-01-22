import DashboardNotFound from "@/components/dashboard/DashboardNotFound";
import MetaComponent from "@/components/common/MetaComponent";
import HeaderAuth from "@/components/layout/headers/HeaderAuth";
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

      <HeaderAuth />

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

      <div
        className="py-30 border-top-light-15"
        style={{ backgroundColor: "#202020" }}
      >
        <div className="row justify-center items-center text-center y-gap-20">
          <div className="col-auto">
            <div className="d-flex items-center h-100 text-white">
              Academy 51 © {new Date().getFullYear()}. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
