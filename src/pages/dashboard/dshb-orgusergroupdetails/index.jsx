import MetaComponent from "@/components/common/MetaComponent";
import OrgUserGroupDetails from "@/components/dashboard/orgusergroups/OrgUserGroupDetails";
const metadata = {
  title: "Groups Details || XValidate",
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
