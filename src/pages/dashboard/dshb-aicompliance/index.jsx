import MetaComponent from "@/components/common/MetaComponent";
import AICompliance from "@/components/dashboard/aicompliance/AICompliance";

const metadata = {
  title: "AI Compliance || XValidate",
  description: "AICompliance for XValidate",
};

export default function DshbAICompliance() {
  return (
    <>
      <MetaComponent meta={metadata} />
      <AICompliance />
    </>
  );
}
