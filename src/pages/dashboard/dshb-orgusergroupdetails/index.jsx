import MetaComponent from "@/components/common/MetaComponent";
import OrgUserGroupDetails from "@/components/dashboard/orgusergroups/OrgUserGroupDetails";
const metadata = {
  title: "Groups Details || Academy51 - Smart Learning for smarter generation",
  description: "OrgUserGroupDetails for Academy51",
};

export default function DshbOrgUserGroupDetails() {
  return (
    <>
      <MetaComponent meta={metadata} />
      <OrgUserGroupDetails />
    </>
  );
}
