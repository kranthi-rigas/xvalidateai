import MetaComponent from "@/components/common/MetaComponent";
import OrgUsers from "@/components/dashboard/orgusergroups/OrgUsers";
const metadata = {
  title: "Users || Academy51 - Smart Learning for smarter generation",
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
