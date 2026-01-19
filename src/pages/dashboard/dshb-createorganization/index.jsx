import MetaComponent from "@/components/common/MetaComponent";
import CreateOrganization from "@/components/dashboard/organizations/CreateOrganization";
const metadata = {
  title: "Dashboard - CreateOrganization | Academy51",
  description: "CreateOrganization for Academy51",
};

export default function DshbCreateOrganization() {
  return (
    <>
      <MetaComponent meta={metadata} />
      <CreateOrganization />
    </>
  );
}
