import MetaComponent from "@/components/common/MetaComponent";
import AttachPermissions from "@/components/dashboard/orgusergroups/AttachPermissions";
const metadata = {
  title: "Dashboard - AttachPermissions to Group | Academy51",
  description: "AttachPermissions to Group for Academy51",
};

export default function DshbAttachPermissions() {
  return (
    <>
      <MetaComponent meta={metadata} />
      <AttachPermissions />
    </>
  );
}
