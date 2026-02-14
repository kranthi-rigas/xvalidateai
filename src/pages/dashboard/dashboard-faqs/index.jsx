import MetaComponent from "@/components/common/MetaComponent";
import FaqPage from "@/components/dashboard/FaqPage";

const metadata = {
  title: "Faqs || XValidate",
  description: "AI literacy",
};

export default function FaqsPage() {
  return (
    <>
      <MetaComponent meta={metadata} />
      <FaqPage />
    </>
  );
}
