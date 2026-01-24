import MetaComponent from "@/components/common/MetaComponent";
import CreateOrganization from "@/components/dashboard/organizations/CreateOrganization";
const metadata = {
  title:
    "CreateOrganization || Academy51 - Smart Learning for smarter generation",
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
