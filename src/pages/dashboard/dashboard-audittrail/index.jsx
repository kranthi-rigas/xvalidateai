import MetaComponent from "@/components/common/MetaComponent";
import AuditLogPage from "@/components/dashboard/audittrail/AuditLogPage";

const metadata = {
  title: "Audit Trail || XValidate",
  description: "Audit Trail",
};

export default function AuditLogsPage() {
  return (
    <>
      <MetaComponent meta={metadata} />
      <AuditLogPage />
    </>
  );
}
