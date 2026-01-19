import Brands from "@/components/common/Brands";
import FooterOne from "@/components/layout/footers/FooterOne";
import Header from "@/components/layout/headers/Header";
import MetaComponent from "@/components/common/MetaComponent";
import Preloader from "@/components/common/Preloader";
import PricingCards from "@/components/others/Pricing/PricingCards";

const metadata = {
  title: "Pricing Plans || Academy51 - Professional Learning Platform",
  description:
    "Choose the perfect plan for your learning journey. Simple, transparent pricing with flexible credits system.",
};

export default function PricingPage() {
  return (
    <div className="main-content">
      <MetaComponent meta={metadata} />
      <Preloader />

      <Header />
      <div className="content-wrapper js-content-wrapper overflow-hidden">
        <PricingCards />
        <Brands />
        <FooterOne />
      </div>
    </div>
  );
}
