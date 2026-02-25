import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageLoader from "@/components/common/PageLoader";

export default function InstructorsReviewPage() {
  const [instructors, setInstructors] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [comment, setComment] = useState("");

  useEffect(() => {
    fetchInstructors();
  }, []);

  const fetchInstructors = async () => {
    try {
      const res = await fetch("https://dev-api.xvalidateai.com/instructors");
      const json = await res.json();
      setInstructors(json.instructors || []);
    } catch {
      setInstructors([]);
    } finally {
      setPageLoading(false);
    }
  };

  const updateStatus = async (id, actionType) => {
    await fetch(`https://dev-api.xvalidateai.com/instructors/${id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
      },
      body: JSON.stringify({
        comments: comment,
        action: actionType, // "approve" or "reject"
      }),
    });

    setSelectedInstructor(null);
    setComment("");
    setPageLoading(true);
    fetchInstructors();
  };

  if (pageLoading) {
    return <PageLoader loading={true} />;
  }

  // GROUP BY STATUS
  const pending = (instructors || []).filter((i) => i.status === "IN_REVIEW");
  const approved = (instructors || []).filter((i) => i.status === "APPROVED");
  const rejected = (instructors || []).filter((i) => i.status === "REJECTED");

  // COMPONENT FOR EACH CARD
  const InstructorCard = ({ inst }) => (
    <div className="col-12">
      <div
        className="bg-white shadow-1 rounded-16 p-20 d-flex justify-between items-center"
        style={{ border: "1px solid #eee", padding: "20px" }}
      >
        <div>
          <div className="text-18 fw-600">
            {inst.first_name} {inst.last_name}
          </div>
          <div className="text-dark-1">{inst.email}</div>
          <div className="text-dark-1">{inst.country}</div>
        </div>

        <button
          className="button -md -blue-1 text-white fw-500"
          onClick={() => setSelectedInstructor(inst)}
        >
          Show Details
        </button>
      </div>
    </div>
  );

  return (
    <div className="dashboard__content">
      <div className="dashboard-body">
        <div className="container">
          <>
            {/* ===================== PENDING ===================== */}
            <h2 className="text-24 fw-600 mt-40 mb-20">Pending Review</h2>
            <div className="row y-gap-20">
              {pending.length > 0 ? (
                pending.map((inst) => (
                  <InstructorCard key={inst.instructor_id} inst={inst} />
                ))
              ) : (
                <p className="text-dark-1">No pending instructors.</p>
              )}
            </div>

            {/* ===================== APPROVED ===================== */}
            <h2 className="text-24 fw-600 mt-50 mb-20">Approved Instructors</h2>
            <div className="row y-gap-20">
              {approved.length > 0 ? (
                approved.map((inst) => (
                  <InstructorCard key={inst.instructor_id} inst={inst} />
                ))
              ) : (
                <p className="text-dark-1">No approved instructors.</p>
              )}
            </div>

            {/* ===================== REJECTED ===================== */}
            <h2 className="text-24 fw-600 mt-50 mb-20">Declined Instructors</h2>
            <div className="row y-gap-20">
              {rejected.length > 0 ? (
                rejected.map((inst) => (
                  <InstructorCard key={inst.instructor_id} inst={inst} />
                ))
              ) : (
                <p className="text-dark-1">No declined instructors.</p>
              )}
            </div>
          </>
        </div>

        {/* ===================== MODAL ===================== */}
        {selectedInstructor && (
          <div
            className="fixed inset-0"
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              padding: "20px",
              zIndex: 9999,
            }}
          >
            <div
              className="bg-white rounded-16 shadow-1"
              style={{ padding: "30px", width: "100%", maxWidth: "550px" }}
            >
              <h2 className="text-24 fw-600 mb-20">Instructor Details</h2>

              <div className="y-gap-10 mb-20">
                <p>
                  <b>Name:</b> {selectedInstructor.first_name}{" "}
                  {selectedInstructor.last_name}
                </p>
                <p>
                  <b>Email:</b> {selectedInstructor.email}
                </p>
                <p>
                  <b>Country:</b> {selectedInstructor.country}
                </p>
                <p>
                  <b>Expertise:</b>
                  {Array.isArray(selectedInstructor.expertise)
                    ? selectedInstructor.expertise.join(", ")
                    : selectedInstructor.expertise}
                </p>
                <p>
                  <b>Experience:</b> {selectedInstructor.years_of_experience}{" "}
                  years
                </p>
                <p>
                  <b>Bio:</b> {selectedInstructor.bio}
                </p>
              </div>

              <label className="text-16 fw-500">Comments</label>
              <textarea
                className="form-control mt-10"
                rows="4"
                placeholder="Enter comments here..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                style={{
                  width: "100%",
                  borderRadius: "8px",
                  padding: "15px",
                  border: "1px solid #ddd",
                  resize: "none",
                  outline: "none",
                }}
              />

              <div className="d-flex justify-between mt-20">
                <button
                  className="button -md -red-1 text-white fw-500"
                  onClick={() =>
                    updateStatus(selectedInstructor.instructor_id, "reject")
                  }
                >
                  Reject
                </button>

                <button
                  className="button -md -green-1 text-white fw-500"
                  onClick={() =>
                    updateStatus(selectedInstructor.instructor_id, "approve")
                  }
                >
                  Approve
                </button>
              </div>

              <button
                className="button -sm mt-20 text-dark-1 fw-500"
                onClick={() => setSelectedInstructor(null)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
