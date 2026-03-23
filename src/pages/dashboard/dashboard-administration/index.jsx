import MetaComponent from "@/components/common/MetaComponent";
import AdministrationPage from "@/components/dashboard/administration/AdministrationPage";

const metadata = {
  title: "Administration || XValidate AI",
  description: "AI literacy assessment and incident response playbook",
};

export default function Administration() {
  return (
    <>
      <MetaComponent meta={metadata} />
      <AdministrationPage />
    </>
  );
}
