import MetaComponent from "@/components/common/MetaComponent";
import QuizResults from "@/components/dashboard/QuizResults";

const metadata = {
  title:
    "Dashboard - Quiz Results || Academy51 - Professional LMS Online Education Course ReactJS Template",
  description:
    "Elevate your e-learning content with Educrat, the most impressive LMS template for online courses, education and LMS platforms.",
};

export default function DshbQuizResultsPage() {
  return (
    <>
      <MetaComponent meta={metadata} />
      <QuizResults />
    </>
  );
}
