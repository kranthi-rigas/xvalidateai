import MetaComponent from "@/components/common/MetaComponent";
import AICompliance from "@/components/dashboard/aicompliance/AICompliance";

const metadata = {
  title: "Dashboard - AI Compliance | Academy51",
  description: "AICompliance for Academy51",
};

export default function DshbAICompliance() {
  return (
    <>
      <MetaComponent meta={metadata} />
      <AICompliance />
    </>
  );
}
