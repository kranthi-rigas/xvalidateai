import MetaComponent from "@/components/common/MetaComponent";
import MyDocuments from "@/pages/ailiteracy/MyDocuments";

const metadata = {
  title: "My Documents || XValidate",
  description: "Documents you have uploaded",
};

export default function DocumentsPageWrapper() {
  return (
    <>
      <MetaComponent meta={metadata} />
      <MyDocuments />
    </>
  );
}
