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
      {/* Same white panel the Programs page uses: .dashboard-body for the card
          itself, and minHeight so it fills the viewport rather than shrinking
          to an empty-state message. Wrapped here rather than inside
          MyDocuments, which is a plain content component. */}
      <div className="spicy-y" style={{ height: "100%" }}>
        <div
          className="dashboard-body"
          style={{ minHeight: "100%", boxSizing: "border-box" }}
        >
          <MyDocuments />
        </div>
      </div>
    </>
  );
}
