import MetaComponent from "@/components/common/MetaComponent";
import OrgAddUsersToGroups from "@/components/dashboard/orgusergroups/OrgAddUsersToGroup";
const metadata = {
  title: "Dashboard - Add Users to Groups | Academy51",
  description: "Add Users to Groups for Academy51",
};

export default function DshbOrgAddUsersToGroups() {
  return (
    <>
      <MetaComponent meta={metadata} />
      <OrgAddUsersToGroups />
    </>
  );
}
