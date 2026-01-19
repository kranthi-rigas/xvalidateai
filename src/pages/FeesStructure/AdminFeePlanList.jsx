import { useEffect, useState } from "react";

import FooterNine from "@/components/layout/footers/FooterNine";
import { Link } from "react-router-dom";
import MetaComponent from "@/components/common/MetaComponent";
import { getAllFeePlans } from "../../apiIntegration/feesPlans";
import PageLoader from "@/components/common/PageLoader";
import usePageLoader from "@/data/usePageLoader";

const metadata = {
  title:
    "Admin Fee Plans || Academy51 - Professional LMS Online Education Course ReactJS Template",
  description:
    "Elevate your e-learning content with Academy51, the most impressive LMS template for online courses, education and LMS platforms.",
};
export default function AdminFeePlanList() {
  const [plans, setPlans] = useState(null);
  const [loading, setLoading] = useState(true);
  const pageLoading = usePageLoader([plans]);

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const data = await getAllFeePlans(); // ✅
        setPlans(data);
      } catch (err) {
        alert("Failed to load fee plans");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadPlans();
  }, []);

  if (pageLoading) {
    return <PageLoader loading={true} />;
  }

  return (
    <div className="dashboard__content bg-light-4">
      <MetaComponent meta={metadata} />
      <div className="row y-gap-30">
        <div className="col-12">
          <div className="bg-white p-4 rounded-16 shadow-4 -dark-bg-dark-1">
            <div className="d-flex justify-between items-center flex-wrap y-gap-10 mb-6">
              <h2 className="text-20 fw-600">All Fee Plans</h2>
              <Link
                to="/dashboard/fee-plans/new"
                className="button bg-purple-1 text-white px-4 py-2 rounded-lg fw-600 hover:bg-purple-2 transition-colors text-14"
              >
                + Add New Plan
              </Link>
            </div>

            <div className="w-full mx-auto">
              {plans.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  No plans yet.
                </div>
              ) : (
                <div
                  className="mt-5"
                  style={{
                    overflowX: "auto",
                    WebkitOverflowScrolling: "touch",
                  }}
                >
                  <div
                    className="rounded-16 shadow-2"
                    style={{ display: "inline-block", minWidth: "100%" }}
                  >
                    <table
                      className="w-full text-left border-collapse"
                      style={{ minWidth: "800px" }}
                    >
                      <thead className="bg-gray-100 border-b-2 border-gray-200">
                        <tr>
                          <th className="p-3 fw-700 text-gray-800 text-14">
                            Plan Name
                          </th>
                          <th className="p-3 fw-700 text-gray-800 text-14">
                            Description
                          </th>
                          <th className="p-3 fw-700 text-gray-800 text-14">
                            Monthly
                          </th>
                          <th className="p-3 fw-700 text-gray-800 text-14">
                            Annual
                          </th>
                          <th className="p-3 fw-700 text-gray-800 text-14">
                            Status
                          </th>
                          <th className="p-3 fw-700 text-gray-800 text-14">
                            Created
                          </th>
                          <th className="p-3 fw-700 text-gray-800 text-14">
                            Updated
                          </th>
                          <th className="p-3 fw-700 text-gray-800 text-right text-14">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {plans.map((plan, index) => (
                          <tr
                            key={plan.planId}
                            className={`border-b border-gray-200 ${
                              index % 2 === 0 ? "bg-white" : "bg-gray-50"
                            } hover:bg-blue-50 transition-colors`}
                          >
                            <td className="p-3 fw-600 text-gray-900 text-14">
                              {plan.name}
                            </td>
                            <td className="p-3 text-gray-700 text-14">
                              {plan.description || "N/A"}
                            </td>
                            <td className="p-3 text-gray-700 text-14">
                              ₹{plan.monthlyAmount}
                            </td>
                            <td className="p-3 text-gray-700 text-14">
                              ₹{plan.annualAmount}
                            </td>
                            <td className="p-3 text-gray-700 text-14">
                              <span
                                className={`px-2 py-1 rounded-full text-12 font-medium ${
                                  plan.isActive
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {plan.isActive ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td className="p-3 text-gray-700 text-14">
                              {plan.created_at
                                ? new Date(plan.created_at).toLocaleDateString()
                                : "N/A"}
                            </td>
                            <td className="p-3 text-gray-700 text-14">
                              {plan.updatedAt
                                ? new Date(plan.updatedAt).toLocaleDateString()
                                : "N/A"}
                            </td>
                            <td className="p-3 text-right text-14">
                              <Link
                                to={`/dashboard/fee-plans/edit/${plan.planId}`}
                                className="text-purple-1 hover:text-purple-2 fw-600"
                              >
                                Edit
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <FooterNine />
    </div>
  );
}
