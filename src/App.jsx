import "./styles/index.scss";
import "@fortawesome/fontawesome-svg-core/styles.css";
import "react-calendar/dist/Calendar.css";
import "aos/dist/aos.css";

import { BrowserRouter, Route, Routes } from "react-router-dom";

import AOS from "aos";
import AdminFeePlanList from "./pages/FeesStructure/AdminFeePlanList";
import Context from "@/context/Context";
import CourseFeeStructurePage from "./pages/FeesStructure/CourseFeeStructurePage";
import ModernDashboardLayout from "@/components/dashboard/ModernDashboardLayout";
import DshbAICompliance from "./pages/dashboard/dshb-aicompliance";
import DshbAssignmentPage from "./pages/dashboard/dshb-assignment";
import DshbAttachPermissions from "./pages/dashboard/dshb-orgattachpermissions";
import DshbCalenderPage from "./pages/dashboard/dshb-calendar";
import DshbCreateOrganization from "./pages/dashboard/dshb-createorganization";
import DshbDashboardPage from "./pages/dashboard/dshb-dashboard";
import DshbForumsPage from "./pages/dashboard/dshb-forums";
import DshbGradesPage from "./pages/dashboard/dshb-grades";
import DshbMessagesPage from "./pages/dashboard/dshb-messages";
import DshbOrgAddUsersToGroups from "./pages/dashboard/dshb-orgaddusertogroup";
import DshbOrgUserGroupDetails from "./pages/dashboard/dshb-orgusergroupdetails";
import DshbOrgUserGroups from "./pages/dashboard/dshb-orgusergroups";
import DshbOrgUsers from "./pages/dashboard/dshb-orgusers";
import DshbOrganizationListView from "./pages/dashboard/dshb-organizations";
import DshbPartcipentPage from "./pages/dashboard/dshb-participants";
import DshbQuizPage from "./pages/dashboard/dshb-quiz";
import DshbServeyPage from "./pages/dashboard/dshb-survey";
import DshbSettingsPage from "./pages/dashboard/dshb-settings";
import FeePlanEditWrapper from "./pages/FeesStructure/FeePlanEditWrapper";
import FeePlanForm from "./pages/FeesStructure/FeePlanForm";
import GoogleLoginPage from "./pages/others/googleLogin";
// import NotFoundPage from "./pages/not-found";
import DashboardNotFoundPage from "./pages/dashboard/dshb-notfound";
//import PricingPage from "./pages/others/pricing";
import DshbPricingPage from "./pages/dashboard/dshb-pricing";
import DshbBillingPage from "./pages/dashboard/dshb-billing";
import ScrollTopBehaviour from "./components/common/ScrollTopBehaviour";
import { useEffect } from "react";
import AuthPage from "./pages/others/authPage";
import ForgotPassword from "./components/others/ForgotPassword";
import ResetPassword from "./components/others/ResetPassword";
import VerifyEmail from "./components/others/VerifyEmail";
import AIDashboardPage from "./pages/dashboard/dshb-aianalytics";
import AILiteracyPage from "./pages/dashboard/dashboard-ailiteracy";
import MyDocumentsPage from "./pages/dashboard/dashboard-mydocuments";
import FaqsPage from "./pages/dashboard/dashboard-faqs";
import SubscriptionSuccess from "./components/dashboard/Billing/SubscriptionSuccess";
import SubscriptionCancel from "./components/dashboard/Billing/SubscriptionCancel";
import AuditLogsPage from "./pages/dashboard/dashboard-audittrail";
import AdministrationPage from "./pages/dashboard/dashboard-administration";

function App() {
  useEffect(() => {
    AOS.init({
      duration: 700,
      offset: 120,
      easing: "ease-out",
      once: true,
    });
  }, []);

  return (
    <>
      <Context>
        <BrowserRouter>
          <Routes>
            <Route path="/">
              <Route index element={<AuthPage />} />

              {/* Modern Dashboard with layout wrapper */}
              <Route path="dashboard" element={<ModernDashboardLayout />}>
                <Route path="aicompliance" element={<DshbAICompliance />} />
                <Route
                  path="aicompliance/:project_id"
                  element={<DshbAICompliance />}
                />
                <Route path="orgusers" element={<DshbOrgUsers />} />
                <Route path="orgusergroups" element={<DshbOrgUserGroups />} />
                <Route
                  path="orgusergroupdetails/:group_id"
                  element={<DshbOrgUserGroupDetails />}
                />
                <Route
                  path="orgaddusertogroup/:group_id/add-users"
                  element={<DshbOrgAddUsersToGroups />}
                />
                <Route
                  path="orgattachpermissions/:group_id/permissions"
                  element={<DshbAttachPermissions />}
                />
                <Route
                  path="createorganization"
                  element={<DshbCreateOrganization />}
                />
                <Route
                  path="organizations"
                  element={<DshbOrganizationListView />}
                />

                <Route path="settings" element={<DshbSettingsPage />} />
                <Route path="assignment" element={<DshbAssignmentPage />} />
                <Route path="calendar" element={<DshbCalenderPage />} />
                <Route path="dashboard" element={<DshbDashboardPage />} />
                <Route index element={<AIDashboardPage />} />
                <Route path="ailiteracy" element={<AILiteracyPage />} />
                <Route path="mydocuments" element={<MyDocumentsPage />} />

                <Route path="faqs" element={<FaqsPage />} />
                <Route path="audittrail" element={<AuditLogsPage />} />
                <Route path="administration" element={<AdministrationPage />} />
                <Route path="forums" element={<DshbForumsPage />} />
                <Route path="grades" element={<DshbGradesPage />} />
                <Route path="messages" element={<DshbMessagesPage />} />
                <Route path="participants" element={<DshbPartcipentPage />} />
                <Route path="quiz" element={<DshbQuizPage />} />
                <Route path="survey" element={<DshbServeyPage />} />
                <Route
                  path="courses-feestructure/:id"
                  element={<CourseFeeStructurePage />}
                />
                <Route path="fee-plans" element={<AdminFeePlanList />} />
                <Route path="fee-plans/new" element={<FeePlanForm />} />
                <Route
                  path="fee-plans/edit/:planId"
                  element={<FeePlanEditWrapper />}
                />
                <Route path="pricing" element={<DshbPricingPage />} />
                <Route path="pricing/billing" element={<DshbBillingPage />} />
              </Route>
              {/* ✅ PayPal Return Pages */}
              <Route
                path="subscription/success"
                element={<SubscriptionSuccess />}
              />
              <Route
                path="subscription/cancel"
                element={<SubscriptionCancel />}
              />

              <Route path="not-found" element={<DashboardNotFoundPage />} />
              <Route path="*" element={<DashboardNotFoundPage />} />
              <Route path="auth" element={<AuthPage />} />
              <Route path="forgot-password" element={<ForgotPassword />} />
              <Route path="reset-password" element={<ResetPassword />} />
              <Route path="verify-email" element={<VerifyEmail />} />
              <Route path="login/google" element={<GoogleLoginPage />} />
            </Route>
          </Routes>
          <ScrollTopBehaviour />
        </BrowserRouter>
      </Context>
    </>
  );
}

export default App;
