import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import EditProfile from "./EditProfile";
import Password from "./Password";
import SocialProfiles from "./SocialProfiles";
import CloseAccount from "./CloseAccount";
import FooterNine from "@/components/layout/footers/FooterNine";
import Notification from "./Notifications";
import PageLoader from "../../common/PageLoader";

const buttons = [
  "Edit Profile",
  "Password",
  //"Social Profiles",
  //"Notifications",
  "Close Account",
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState(1);
  const [pageLoading, setPageLoading] = useState(true);

  // ✅ Show spinner only on page landing
  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 400); // you can change to 300 or 500

    return () => clearTimeout(timer);
  }, []);

  if (pageLoading) {
    return <PageLoader loading />;
  }

  return (
    <div className="dashboard__content bg-light-4">
      <div className="row y-gap-30">
        <div className="col-12">
          <div className="rounded-16 bg-white -dark-bg-dark-1 shadow-4 h-100">
            <div className="tabs -active-purple-2 js-tabs pt-0">
              <div className="tabs__controls d-flex x-gap-30 y-gap-20 flex-wrap items-center pt-20 px-30 border-bottom-light js-tabs-controls">
                {buttons.map((elm, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveTab(i + 1)}
                    className={`tabs__button text-light-1 js-tabs-button ${
                      activeTab === i + 1 ? "is-active" : ""
                    }`}
                    type="button"
                  >
                    {elm}
                  </button>
                ))}
              </div>

              <div className="tabs__content py-30 px-30 js-tabs-content">
                <EditProfile activeTab={activeTab} />
                <Password activeTab={activeTab} />
                {/*<SocialProfiles activeTab={activeTab} />
                <Notification activeTab={activeTab} />*/}
                <CloseAccount activeTab={activeTab} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <FooterNine />
    </div>
  );
}
