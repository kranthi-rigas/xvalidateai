// src/components/admin/FeePlanForm.jsx

import { Link, useNavigate } from "react-router-dom";
import { createFeePlan, updateFeePlan } from "@/apiIntegration/feesPlans";
import {
  faEye,
  faFileAlt,
  faList,
  faRupeeSign,
  faTag,
} from "@fortawesome/free-solid-svg-icons";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import FooterNine from "@/components/layout/footers/FooterNine";
import MetaComponent from "@/components/common/MetaComponent";
import { useState } from "react";

const metadata = {
  title:
    "Admin Fee Plans || Educrat - Professional LMS Online Education Course ReactJS Template",
  description:
    "Elevate your e-learning content with Educrat, the most impressive LMS template for online courses, education and LMS platforms.",
};
// eslint-disable-next-line react/prop-types
export default function FeePlanForm({ plan: initialPlan = null }) {
  const navigate = useNavigate();
  const isNew = !initialPlan;

  const [formData, setFormData] = useState({
    name: initialPlan?.name || "",
    description: initialPlan?.description || "",
    monthlyAmount: initialPlan?.monthlyAmount || "",
    annualAmount: initialPlan?.annualAmount || "",
    features: initialPlan?.features?.join("\n") || "",
    isActive: initialPlan?.isActive ?? true,
  });

  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
    // Clear error for this field
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      monthlyAmount: Number(formData.monthlyAmount),
      annualAmount: Number(formData.annualAmount),
      features: formData.features
        .split("\n")
        .map((f) => f.trim())
        .filter(Boolean),
      isActive: formData.isActive,
    };

    try {
      if (isNew) {
        await createFeePlan(payload);
      } else {
        await updateFeePlan(initialPlan.planId, payload);
      }
      navigate("/dashboard/fee-plans");
    } catch (err) {
      alert("Failed to save plan. Check console for details.");
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="dashboard__content bg-light-4">
      <MetaComponent meta={metadata} />
      <div className="row pb-50 mb-10">
        <div className="col-auto">
          <h1 className="text-30 lh-12 fw-700">
            {isNew ? "Create New Fee Plan" : "Edit Fee Plan"}
          </h1>
          <nav className="text-14 text-gray-600 mt-10">
            <Link to="/dashboard" className="text-purple-1 fw-600 hover:text-purple-2">
              Home
            </Link>
            <span className="mx-2 text-gray-400">&gt;</span>
            <Link
              to="/dashboard/fee-plans"
              className="text-purple-1 fw-600 hover:text-purple-2"
            >
              Fee Plans
            </Link>
            <span className="mx-2 text-gray-400">&gt;</span>
            <span className="text-gray-500 fw-500">
              {isNew ? "Create" : "Edit"}
            </span>
          </nav>
        </div>
      </div>

      <div className="row y-gap-30">
        <div className="col-12">
          <div className="bg-white p-5 rounded-16 shadow-4 -dark-bg-dark-1">

            <form onSubmit={handleSubmit}>
              <div className="mb-lg-3">
                <label className="block text-16 fw-600 mb-3 text-gray-800">
                  Plan Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-1 focus:border-transparent transition-colors"
                  placeholder="Enter plan name"
                  required
                />
              </div>

              <div className="mb-lg-3">
                <label className="block text-16 fw-600 mb-3 text-gray-800">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-1 focus:border-transparent transition-colors resize-vertical"
                  rows="3"
                  placeholder="Enter plan description"
                  required
                />
              </div>

              <div className="row y-gap-20 mb-lg-3">
                <div className="col-md-6">
                  <label className="block text-16 fw-600 mb-3 text-gray-800">
                    Monthly Amount (₹) *
                  </label>
                  <input
                    type="number"
                    name="monthlyAmount"
                    value={formData.monthlyAmount}
                    onChange={handleChange}
                    min="0"
                    className="w-full py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-1 focus:border-transparent transition-colors"
                    placeholder="0"
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="block text-16 fw-600 mb-3 text-gray-800">
                    Annual Amount (₹) <span className=" !text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    name="annualAmount"
                    value={formData.annualAmount}
                    onChange={handleChange}
                    min="0"
                    className="w-full py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-1 focus:border-transparent transition-colors"
                    placeholder="0"
                    required
                  />
                </div>
              </div>

              <div className="mb-lg-3">
                <label className="block text-16 fw-600 mb-3 text-gray-800">
                  Features (one per line) *
                </label>
                <textarea
                  name="features"
                  value={formData.features}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-1 focus:border-transparent transition-colors resize-vertical"
                  rows="4"
                  placeholder="Live Classes&#10;Assignments&#10;Certificate"
                  required
                />
              </div>

              <div className="mb-8">
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="w-5 h-5 text-purple-1 bg-gray-100 border-gray-300 rounded focus:ring-purple-1 focus:ring-2"
                  />
                  <span className="ml-3 text-16 text-gray-700">
                    Active (visible to users)
                  </span>
                </label>
              </div>
              <div className="d-flex flex-wrap x-gap-10 y-gap-10">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="button bg-purple-1 text-white px-6 py-3 rounded-lg fw-600 hover:bg-purple-2 transition-colors flex-grow-1"
                >
                  {isSaving ? "Saving..." : isNew ? "Create Plan" : "Update Plan"}
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/dashboard/fee-plans")}
                  className="button bg-gray-200 text-gray-800 px-6 py-3 rounded-lg fw-600 hover:bg-gray-300 transition-colors flex-grow-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <FooterNine />
    </div>
  );
}
