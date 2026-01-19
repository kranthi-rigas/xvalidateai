import MetaComponent from "@/components/common/MetaComponent";
import OrgUsers from "@/components/dashboard/orgusergroups/OrgUsers";
const metadata = {
  title: "Dashboard - Users | Academy51",
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
