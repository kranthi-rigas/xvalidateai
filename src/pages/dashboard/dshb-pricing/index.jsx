import DashboardPricing from "@/components/dashboard/Pricing/DashboardPricing";
import MetaComponent from "@/components/common/MetaComponent";

const metadata = {
  title: "Pricing Plans || Academy51 - Smart Learning for smarter generation",
  description:
    "Choose the perfect plan for your learning journey. Simple, transparent pricing with flexible credits system.",
};

export default function DshbPricingPage() {
  return (
    <>
      <MetaComponent meta={metadata} />
      <DashboardPricing />
    </>
  );
}
