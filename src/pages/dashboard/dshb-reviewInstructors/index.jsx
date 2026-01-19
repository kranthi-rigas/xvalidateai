import MetaComponent from "@/components/common/MetaComponent";
import InstructorsReviewPage from "@/components/dashboard/InstructorsReview";

const metadata = {
  title: "Dashboard - Review Instructors | Academy51",
  description:
    "Admin panel to review, approve, or reject instructor applications.",
};

export default function AdminInstructorsReviewPage() {
  return (
    <>
      <MetaComponent meta={metadata} />
      <InstructorsReviewPage />
    </>
  );
}
