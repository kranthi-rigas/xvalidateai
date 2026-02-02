import ModernSettings from "@/components/dashboard/Settings/ModernSettings";
import MetaComponent from "@/components/common/MetaComponent";

const metadata = {
  title:
    "Dashboard-settings || Academy51 - Smart Learning for smarter generation",
  description:
    "Elevate your e-learning content with Educrat, the most impressive LMS template for online courses, education and LMS platforms.",
};
export default function DshbSettingsPage() {
  return (
    <>
      <MetaComponent meta={metadata} />
      <ModernSettings />
    </>
  );
}
