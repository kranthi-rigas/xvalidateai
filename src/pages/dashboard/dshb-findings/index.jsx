import MetaComponent from "@/components/common/MetaComponent";
import FindingsPage from "@/components/dashboard/verification/FindingsPage";

const metadata = {
  title: "Findings || XValidate",
  description:
    "Continuous monitoring findings for your approved tools, with the evidence behind each one.",
};

export default function DshbFindingsPage() {
  return (
    <>
      <MetaComponent meta={metadata} />
      <FindingsPage />
    </>
  );
}
