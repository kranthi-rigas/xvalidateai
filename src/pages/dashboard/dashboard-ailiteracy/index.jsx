import MetaComponent from "@/components/common/MetaComponent";
import AiLiteracyPage from "@/pages/ailiteracy/AiLiteracyPage";

const metadata = {
  title: "Programs || XValidate",
  description: "Programs, AI literacy assessment and incident response playbook",
};

export default function AILiteracyPageWrapper() {
  return (
    <>
      <MetaComponent meta={metadata} />
      <AiLiteracyPage />
    </>
  );
}
