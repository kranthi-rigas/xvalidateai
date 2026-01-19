import MetaComponent from "@/components/common/MetaComponent";
import OrganizationListView from "@/components/dashboard/organizations/OrganizationListView";
const metadata = {
  title: "Dashboard - Organizations | Academy51",
  description: "Organizations for Academy51",
};

export default function DshbOrganizationListView() {
  return (
    <>
      <MetaComponent meta={metadata} />
      <OrganizationListView />
    </>
  );
}
