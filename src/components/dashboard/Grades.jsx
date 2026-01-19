import { grades } from "@/data/dashboard";
import React, { useState, useEffect } from "react";
import FooterNine from "../layout/footers/FooterNine";
import PageLoader from "@/components/common/PageLoader";

export default function Grades() {
  const [currentLetter, setCurrentLetter] = useState("A");
  const [pageLoading, setPageLoading] = useState(true);

  // ✅ landing page spinner
  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 400);

    return () => clearTimeout(timer);
  }, []);

  // ✅ IMPORTANT: before JSX
  if (pageLoading) {
    return <PageLoader loading={true} />;
  }

  return (
    <div className="dashboard__content bg-light-4">
      <div className="row y-gap-30">
        <div className="col-12">
          <div className="rounded-16 bg-white -dark-bg-dark-1 shadow-4 h-100">
            <div className="d-flex items-center py-20 px-30 border-bottom-light">
              <h2 className="text-17 lh-1 fw-500">Grades</h2>
            </div>

            <div className="py-30 px-30">
              <div className="row">
                <div className="col-auto">Grader Report</div>
              </div>

              <div className="row y-gap-20 x-gap-20 items-center pt-30">
                <div className="col-auto">
                  <h4 className="text-18 lh-13 fw-500">First name</h4>
                </div>

                <div className="col-12">
                  <div className="d-flex x-gap-5 y-gap-10 flex-wrap">
                    <div>
                      <div className="py-8 pr-5 d-flex justify-center items-center">
                        All
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="py-25 px-30 bg-light-7 -dark-bg-dark-2 rounded-8 mt-25">
                <div className="row y-gap-20 justify-between items-center">
                  <div className="col-xl-3 text-purple-1 fw-500">
                    First name / Surname
                  </div>
                  <div className="col-xl-2 text-purple-1 fw-500">
                    Email address
                  </div>
                  <div className="col-xl-2 text-purple-1 fw-500">
                    Are you a Literacy Light...
                  </div>
                  <div className="col-xl-2 text-purple-1 fw-500">
                    Let&apos;s learn about...
                  </div>
                  <div className="col-xl-2 text-purple-1 fw-500">
                    Course total
                  </div>
                </div>
              </div>

              <div className="border-light-bottom py-20 px-30">
                {grades.map((elm, i) => (
                  <div
                    key={i}
                    className={`row y-gap-20 justify-between items-center ${
                      i !== 0 ? "border-top-light pt-20 mt-20" : ""
                    }`}
                  >
                    <div className="col-xl-3">
                      <div className="d-flex items-center">
                        <div className="d-flex x-gap-10 items-center mr-30">
                          <a href="#">
                            <i className="icon-calendar text-16"></i>
                          </a>
                          <a href="#">
                            <i className="icon-edit text-16"></i>
                          </a>
                        </div>

                        <img
                          src={elm.avatar}
                          alt="avatar"
                          className="size-40"
                        />
                        <div className="text-dark-1 ml-10">{elm.name}</div>
                      </div>
                    </div>

                    <div className="col-xl-2 text-dark-1">{elm.email}</div>

                    <div className="col-xl-2 d-flex justify-end">
                      <i className="icon-zoom-in text-20"></i>
                    </div>

                    <div className="col-xl-2 d-flex justify-end">
                      <i className="icon-zoom-in text-20"></i>
                    </div>

                    <div className="col-xl-2 d-flex justify-end">
                      <i className="icon-zoom-in text-20"></i>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <FooterNine />
    </div>
  );
}
