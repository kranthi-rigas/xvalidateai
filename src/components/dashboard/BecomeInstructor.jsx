import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Confetti from "react-confetti";
import { applyInstructor } from "../../apiIntegration/auth.js";
import PageLoader from "@/components/common/PageLoader";

export default function DshbBecomeInstructor() {
  const [pageLoading, setPageLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    qualification: "",
    experience: "",
    subjects: "",
    bio: "",
    portfolio: "",
    resume: null,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 300); // 300ms feels smooth, not flickery

    return () => clearTimeout(timer);
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const token = localStorage.getItem("access_token");
      await applyInstructor(formData, token);
      setSuccess(true);
      // Optionally reset form fields
      setFormData({
        firstName: "",
        lastName: "",
        phone: "",
        qualification: "",
        experience: "",
        subjects: "",
        bio: "",
        portfolio: "",
        resume: null,
      });
    } catch (err) {
      console.error("Application failed:", err);
      setError("❌ Failed to submit application. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (pageLoading) {
    return <PageLoader loading={true} />;
  }
  return (
    <div className="dashboard__content">
      <div className="dashboard-body">
        {/* 🎉 Confetti animation */}
        {success && <Confetti recycle={false} numberOfPieces={400} />}

        <div className="container">
          <div className="row justify-center items-center">
            <div>
              <div className="instructor-form-styles">
                <p className="text-dark-1">
                  Fill out the form below to apply as an instructor. Our team
                  will review your details and get back to you soon.
                </p>

                {/* Success Message */}
                {success && (
                  <div className="text-center mt-30 mb-20 p-25 bg-light-3 rounded-16 border border-green-3">
                    <h4 className="text-24 text-green-1 fw-600 mb-10">
                      🎉 Congratulations!
                    </h4>
                    <p className="text-dark-1">
                      Your application has been successfully submitted for admin
                      review.
                    </p>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="text-center mt-20 p-20 bg-red-1 text-white rounded-16">
                    {error}
                  </div>
                )}

                {/* Hide form after success if you want */}
                {!success && (
                  <form
                    onSubmit={handleSubmit}
                    className="contact-form respondForm__form"
                  >
                    <div className="contact-form respondForm__form row y-gap-20 pt-30">
                      <h5>Personal Information</h5>
                      {/* First Name */}
                      <div className="col-lg-6">
                        <label className="text-16 lh-1 fw-500 text-dark-1 mb-10">
                          First Name <spam className="text-red-1">*</spam>
                        </label>
                        <input
                          required
                          type="text"
                          name="firstName"
                          placeholder="Your first name"
                          value={formData.firstName}
                          onChange={handleChange}
                        />
                      </div>
                      {/* Last Name */}
                      <div className="col-lg-6">
                        <label className="text-16 lh-1 fw-500 text-dark-1 mb-10">
                          Last Name <spam className="text-red-1">*</spam>
                        </label>
                        <input
                          required
                          type="text"
                          name="lastName"
                          placeholder="Your last name"
                          value={formData.lastName}
                          onChange={handleChange}
                        />
                      </div>
                      {/* Phone */}
                      <div className="col-lg-6">
                        <label className="text-16 lh-1 fw-500 text-dark-1 mb-10">
                          Phone Number <spam className="text-red-1">*</spam>
                        </label>
                        <input
                          required
                          type="tel"
                          name="phone"
                          placeholder="Phone number"
                          value={formData.phone}
                          onChange={handleChange}
                          style={{
                            outline: "none",
                            width: "100%",
                            backgroundColor: "transparent",
                            borderRadius: "8px",
                            border: "1px solid #DDDDDD",
                            lineHeight: "1.5",
                            padding: "15px 22px",
                          }}
                        />
                      </div>
                    </div>

                    <div className="contact-form respondForm__form row y-gap-20 pt-30">
                      <h5>Professional Information</h5>
                      {/* Qualification */}
                      <div className="col-lg-6">
                        <label className="text-16 lh-1 fw-500 text-dark-1 mb-10">
                          Qualification <spam className="text-red-1">*</spam>
                        </label>
                        <input
                          type="text"
                          name="qualification"
                          placeholder="e.g., M.Sc in Physics"
                          value={formData.qualification}
                          onChange={handleChange}
                        />
                      </div>

                      {/* Experience */}
                      <div className="col-lg-6">
                        <label className="text-16 lh-1 fw-500 text-dark-1 mb-10">
                          Years of Experience{" "}
                          <spam className="text-red-1">*</spam>
                        </label>
                        <input
                          style={{
                            outline: "none",
                            width: "100%",
                            backgroundColor: "transparent",
                            borderRadius: "8px",
                            border: "1px solid #DDDDDD",
                            lineHeight: "1.5",
                            padding: "15px 22px",
                          }}
                          type="number"
                          name="experience"
                          placeholder="e.g., 5"
                          value={formData.experience}
                          onChange={handleChange}
                        />
                      </div>

                      {/* Subjects */}
                      <div className="col-12">
                        <label className="text-16 lh-1 fw-500 text-dark-1 mb-10">
                          Subjects / Expertise{" "}
                          <spam className="text-red-1">*</spam>
                        </label>
                        <input
                          required
                          type="text"
                          name="subjects"
                          placeholder="e.g., Mathematics, Chemistry"
                          value={formData.subjects}
                          onChange={handleChange}
                        />
                      </div>

                      {/* Bio */}
                      <div className="col-12">
                        <label className="text-16 lh-1 fw-500 text-dark-1 mb-10">
                          Short Bio <spam className="text-red-1">*</spam>
                        </label>
                        <textarea
                          name="bio"
                          rows="4"
                          placeholder="Tell us about your teaching style and experience..."
                          value={formData.bio}
                          onChange={handleChange}
                          required
                        ></textarea>
                      </div>

                      {/* Portfolio */}
                      <div className="col-lg-6">
                        <label className="text-16 lh-1 fw-500 text-dark-1 mb-10">
                          Portfolio / LinkedIn URL
                        </label>
                        <input
                          type="text"
                          name="portfolio"
                          placeholder="e.g., https://linkedin.com/in/yourname"
                          value={formData.portfolio}
                          onChange={handleChange}
                        />
                      </div>

                      {/* Resume */}
                      <div className="col-lg-6">
                        <label className="text-16 lh-1 fw-500 text-dark-1 mb-10 required-label">
                          Upload Resume
                        </label>

                        <div className="custom-file-upload">
                          <label
                            htmlFor="resumeUpload"
                            className="file-select-btn"
                          >
                            <span className="file-icon">📄</span> Choose File
                          </label>

                          <input
                            id="resumeUpload"
                            type="file"
                            name="resume"
                            onChange={handleChange}
                            className="hidden-file-input"
                          />

                          <span className="file-name">
                            {formData.resume
                              ? formData.resume.name
                              : "No file chosen"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="instructor-submit-block">
                      {/* Terms */}
                      <div className="mt-30">
                        <label className="d-flex items-center">
                          <input type="checkbox" required className="mr-10" />I
                          agree to the platform’s Instructor Terms & Conditions.
                        </label>
                      </div>

                      {/* Submit */}
                      <div>
                        <button
                          type="submit"
                          disabled={submitting}
                          className="button -md -blue-1 text-white fw-500 w-1/1"
                        >
                          {submitting ? "Submitting..." : "Submit Application"}
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
