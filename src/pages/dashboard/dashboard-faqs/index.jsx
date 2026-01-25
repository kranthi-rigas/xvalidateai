import MetaComponent from "@/components/common/MetaComponent";
import FaqPage from "@/components/dashboard/FaqPage";

const metadata = {
  title: "Faqs || Academy51 - Smart Learning for smarter generation",
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
