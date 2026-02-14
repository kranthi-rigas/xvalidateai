import MetaComponent from "@/components/common/MetaComponent";
import OrgUsers from "@/components/dashboard/orgusergroups/OrgUsers";
const metadata = {
  title: "Users || XValidate",
  description: "OrgUsers for Academy51",
};

export default function DshbOrgUsers() {
  return (
    <>
      <MetaComponent meta={metadata} />
      <OrgUsers />
    </>
  );
}
