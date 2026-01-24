import MetaComponent from "@/components/common/MetaComponent";
import OrganizationListView from "@/components/dashboard/organizations/OrganizationListView";
const metadata = {
  title: "Organizations || Academy51 - Smart Learning for smarter generation",
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
