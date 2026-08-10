import MetaComponent from "@/components/common/MetaComponent";
import DashboardCalendar from "@/components/dashboard/calendar/DashboardCalendar";

const metadata = {
  title: "Calendar || XValidate",
  description: "Upcoming reviews, assessments and deadlines for your organization.",
};

export default function DshbCalenderPage() {
  return (
    <>
      <MetaComponent meta={metadata} />
      <DashboardCalendar />
    </>
  );
}
