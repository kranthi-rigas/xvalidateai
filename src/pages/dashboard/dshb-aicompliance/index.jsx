import MetaComponent from "@/components/common/MetaComponent";
import AICompliance from "@/components/dashboard/aicompliance/AICompliance";

const metadata = {
  title: "AI Compliance || Academy51 - Smart Learning for smarter generation",
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
