import React from "react";
import { useNavigate } from "react-router-dom";

export default function DashboardNotFound() {
    const navigate = useNavigate();

    const handleGoBack = () => {
        navigate("/dashboard");
    };

    return (
        <div className="row justify-center ">
            <div className="rounded-16 bg-white ">
                <div className="py-60 px-40">
                    <div className="text-center">
                        {/* 404 Illustration */}
                        <div className="mb-40">
                            <div className="d-flex justify-center mb-30">
                                <img
                                    src="/assets/img/404/NotFound.svg"
                                    alt="404 Not Found"
                                    style={{ maxWidth: "40rem", width: "100%" }}
                                />
                            </div>
                        </div>


                        {/* Action Buttons */}
                        <div className="d-flex justify-center gap-3 flex-wrap">
                            <button
                                onClick={handleGoBack}
                                className="button -md -purple-1 text-white"
                            >
                                {/* <i className="icon-arrow-left mr-10"></i> */}
                                Back to Home
                            </button>
                            
                        </div>

                        {/* Helpful Links */}
                        {/* <div className="mt-50 pt-40 border-top-light">
                            <h3 className="text-18 fw-500 text-dark-1 mb-20">
                                Quick Links
                            </h3>
                            <div className="d-flex justify-center gap-4 flex-wrap">
                                <a
                                    href="/dashboard/courses"
                                    className="text-purple-1 text-14 fw-500"
                                >
                                    My Courses
                                </a>
                                <span className="text-light-1">|</span>
                                <a
                                    href="/dashboard/mocktest"
                                    className="text-purple-1 text-14 fw-500"
                                >
                                    Mock Tests
                                </a>
                                <span className="text-light-1">|</span>
                                <a
                                    href="/dashboard/settings"
                                    className="text-purple-1 text-14 fw-500"
                                >
                                    Settings
                                </a>
                                <span className="text-light-1">|</span>
                                <a
                                    href="/dashboard/messages"
                                    className="text-purple-1 text-14 fw-500"
                                >
                                    Messages
                                </a>
                            </div>
                        </div> */}
                    </div>
                </div>
            </div>

            {/* Additional Help Card */}
            {/* <div className="rounded-16 bg-white -dark-bg-dark-1 shadow-4 mt-30">
                <div className="py-30 px-40">
                    <div className="d-flex items-center">
                        <div className="mr-20">
                            <i className="icon-help text-40 text-purple-1"></i>
                        </div>
                        <div>
                            <h4 className="text-17 lh-15 fw-500 text-dark-1 mb-5">
                                Need Help?
                            </h4>
                            <p className="text-14 lh-16 text-light-1">
                                If you believe this is an error, please contact our support
                                team or check your permissions.
                            </p>
                        </div>
                    </div>
                </div>
            </div> */}
        </div>

    );
}
