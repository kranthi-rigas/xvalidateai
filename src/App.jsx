import "./styles/index.scss";
import "@fortawesome/fontawesome-svg-core/styles.css";
import "react-calendar/dist/Calendar.css";
import "aos/dist/aos.css";

import { BrowserRouter, Route, Routes } from "react-router-dom";

import AOS from "aos";
import AboutPage1 from "./pages/about/about-1";
import AdminFeePlanList from "./pages/FeesStructure/AdminFeePlanList";
import AdminInstructorsReviewPage from "./pages/dashboard/dshb-reviewInstructors";
import BlogListpage1 from "./pages/blogs/blog-list-1";
import BlogListpage2 from "./pages/blogs/blog-list-2";
import BlogListpage3 from "./pages/blogs/blog-list-3";
import BlogdetailsPage from "./pages/blogs/blogs";
import ContactPage1 from "./pages/contacts/contact-1";
import ContactPage2 from "./pages/contacts/contact-2";
import Context from "@/context/Context";
import CourseCartPage from "./pages/cartPages/course-cart";
import CourseCheckoutPage from "./pages/cartPages/course-checkout";
import CourseFeeStructurePage from "./pages/FeesStructure/CourseFeeStructurePage";
import CourseListPage1 from "./pages/coursesList/courses-list-1";
import CourseListPage2 from "./pages/coursesList/courses-list-2";
import CourseListPage3 from "./pages/coursesList/courses-list-3";
import CourseListPage4 from "./pages/coursesList/courses-list-4";
import CourseListPage5 from "./pages/coursesList/courses-list-5";
import CourseListPage6 from "./pages/coursesList/courses-list-6";
import CourseListPage7 from "./pages/coursesList/courses-list-7";
import CourseListPage8 from "./pages/coursesList/courses-list-8";
import CourseSinglePage1 from "./pages/courseSingle/courses";
import CourseSinglePage2 from "./pages/courseSingle/courses-single-2";
import CourseSinglePage3 from "./pages/courseSingle/courses-single-3";
import CourseSinglePage4 from "./pages/courseSingle/courses-single-4";
import CourseSinglePage5 from "./pages/courseSingle/courses-single-5";
import CourseSinglePage6 from "./pages/courseSingle/courses-single-6/page";
import DashboardLayout from "@/pages/dashboard/dashboardMainPage";
import DashboardPage from "./pages/dashboard/dashboard";
import DshbAICompliance from "./pages/dashboard/dshb-aicompliance";
import DshbAdministrationPage from "./pages/dashboard/dshb-administration";
import DshbAssignmentPage from "./pages/dashboard/dshb-assignment";
import DshbAttachPermissions from "./pages/dashboard/dshb-orgattachpermissions";
import DshbBecomeInstructor from "./pages/dashboard/dshb-becomeinstructor";
import DshbBookmarksPage from "./pages/dashboard/dshb-bookmarks";
import DshbCalenderPage from "./pages/dashboard/dshb-calendar";
import DshbCoursesPage from "./pages/dashboard/dshb-courses";
import DshbCreateMockTestPage from "./pages/dashboard/dshb-createmocktest";
import DshbCreateOrganization from "./pages/dashboard/dshb-createorganization";
import DshbDashboardPage from "./pages/dashboard/dshb-dashboard";
import DshbForumsPage from "./pages/dashboard/dshb-forums";
import DshbGradesPage from "./pages/dashboard/dshb-grades";
import DshbListingPage from "./pages/dashboard/dshb-listing";
import DshbMessagesPage from "./pages/dashboard/dshb-messages";
import DshbMockTestPage from "./pages/dashboard/dshb-mocktest";
import DshbOrgAddUsersToGroups from "./pages/dashboard/dshb-orgaddusertogroup";
import DshbOrgUserGroupDetails from "./pages/dashboard/dshb-orgusergroupdetails";
import DshbOrgUserGroups from "./pages/dashboard/dshb-orgusergroups";
import DshbOrgUsers from "./pages/dashboard/dshb-orgusers";
import DshbOrganizationListView from "./pages/dashboard/dshb-organizations";
import DshbPartcipentPage from "./pages/dashboard/dshb-participants";
import DshbQuizPage from "./pages/dashboard/dshb-quiz";
import DshbQuizResultsPage from "./pages/dashboard/dshb-quizresults";
import DshbReviewsPage from "./pages/dashboard/dshb-reviews";
import DshbServeyPage from "./pages/dashboard/dshb-survey";
import DshbSettingsPage from "./pages/dashboard/dshb-settings";
import EventCartPage from "./pages/cartPages/event-cart";
import EventCheckoutPage from "./pages/cartPages/event-checkout";
import EventListPage1 from "./pages/events/event-list-1";
import EventListPage2 from "./pages/events/event-list-2";
import EventSingPage from "./pages/events/events";
import FeePlanEditWrapper from "./pages/FeesStructure/FeePlanEditWrapper";
import FeePlanForm from "./pages/FeesStructure/FeePlanForm";
import GoogleLoginPage from "./pages/others/googleLogin";
import HelpCenterPage from "./pages/others/help-center";
import HomePage1 from "./pages";
import HomePage10 from "./pages/homes/home-10";
import HomePage2 from "./pages/homes/home-2";
import HomePage3 from "./pages/homes/home-3";
import HomePage4 from "./pages/homes/home-4";
import HomePage5 from "./pages/homes/home-5";
import HomePage6 from "./pages/homes/home-6";
import HomePage7 from "./pages/homes/home-7";
import HomePage8 from "./pages/homes/home-8";
import HomePage9 from "./pages/homes/home-9";
import InstractoBacomePage from "./pages/aboutCourses/instructor-become";
import InstractorListPage1 from "./pages/aboutCourses/instructors-list-1";
import InstractorListPage2 from "./pages/aboutCourses/instructors-list-2";
import InstractorSinglePage from "./pages/aboutCourses/instructors";
import LessonSinglePage1 from "./pages/aboutCourses/lesson-single-1";
import LessonSinglePage2 from "./pages/aboutCourses/lesson-single-2";
import NotAuthorized from "./pages/NotAuthorized";
// import NotFoundPage from "./pages/not-found";
import DashboardNotFoundPage from "./pages/dashboard/dshb-notfound";
//import PricingPage from "./pages/others/pricing";
import DshbPricingPage from "./pages/dashboard/dshb-pricing";
import DshbBillingPage from "./pages/dashboard/dshb-billing";
import ScrollTopBehaviour from "./components/common/ScrollTopBehaviour";
import ShopCartPage from "./pages/cartPages/shop-cart";
import ShopCheckoutPage from "./pages/cartPages/shop-checkout";
import ShopListPage from "./pages/shop/shop-list";
import ShopOrderPage from "./pages/shop/shop-order/page";
import ShopdetailsPage from "./pages/shop/shop";
import TermsPage from "./pages/others/terms";
import UIElementsPage from "./pages/others/ui-elements";
import { useEffect } from "react";
import AuthPage from "./pages/others/authPage";
import ForgotPassword from "./components/others/ForgotPassword";
import ResetPassword from "./components/others/ResetPassword";
import VerifyEmail from "./components/others/VerifyEmail";
import AIDashboardPage from "./pages/dashboard/dshb-aianalytics";
import AILiteracyPage from "./pages/dashboard/dashboard-ailiteracy";

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

              {/*dashboard nested route*/}
              <Route path="dashboard" element={<DashboardLayout />}>
                <Route index element={<AIDashboardPage />} />
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
                <Route path="aianalytics" element={<AIDashboardPage />} />
                <Route path="ailiteracy" element={<AILiteracyPage />} />
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
