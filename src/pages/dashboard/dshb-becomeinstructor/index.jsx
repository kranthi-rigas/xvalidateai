import MetaComponent from "@/components/common/MetaComponent";
import DshbBecomeInstructor from "@/components/dashboard/BecomeInstructor";

const metadata = {
  title: "Dashboard - Become an Instructor | Academy51",
  description:
    "Apply to become an instructor and share your expertise on the Educrat learning platform.",
};

export default function DshbBecomeInstructorPage() {
  return (
    <>
      <MetaComponent meta={metadata} />
      <DshbBecomeInstructor />
    </>
  );
}
