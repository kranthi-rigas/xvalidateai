import MetaComponent from "@/components/common/MetaComponent";
import AILiteracy from "@/components/dashboard/aicompliance/AILiteracy";

const metadata = {
  title: "AI Literacy || XValidate",
  description: "AI literacy",
};

export default function AILiteracyPage() {
  return (
    <>
      <MetaComponent meta={metadata} />
      <AILiteracy />
    </>
  );
}
