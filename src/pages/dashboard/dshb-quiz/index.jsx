import Quiz from "@/components/dashboard/Quiz";
import MetaComponent from "@/components/common/MetaComponent";

const metadata = {
  title: "Dashboard - Quiz | Academy51",
  description:
    "Elevate your e-learning content with Educrat, the most impressive LMS template for online courses, education and LMS platforms.",
};
export default function DshbQuizPage() {
  return (
    <>
      <MetaComponent meta={metadata} />
      <Quiz />
    </>
  );
}
