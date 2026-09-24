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
      {/* The panel is exactly the height of the viewport and never taller:
          the document list scrolls inside it, so the page itself does not. */}
      <div className="spicy-y" style={{ height: "100%" }}>
        <div
          className="dashboard-body"
          style={{
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            boxSizing: "border-box",
          }}
        >
          <MyDocuments />
        </div>
      </div>
    </>
  );
}
