import MetaComponent from "@/components/common/MetaComponent";
import OrgUserGroups from "@/components/dashboard/orgusergroups/OrgUserGroups";
const metadata = {
  title: "Dashboard - Groups | Academy51",
  description: "OrgUserGroups for Academy51",
};

export default function DshbOrgUserGroups() {
  return (
    <>
      <MetaComponent meta={metadata} />
      <OrgUserGroups />
    </>
  );
}
