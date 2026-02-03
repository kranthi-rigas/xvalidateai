import React, { useEffect } from "react";

export default function ModernDashboard() {
  useEffect(() => {
    // Load Plotly if not already loaded
    if (!window.Plotly) {
      const script = document.createElement("script");
      script.src = "https://cdn.plot.ly/plotly-2.27.0.min.js";
      script.async = true;
      script.onload = () => initializeCharts();
      document.body.appendChild(script);
    } else {
      initializeCharts();
    }
  }, []);

  const initializeCharts = () => {
    // Chart: Recommendation Distribution
    const recommendationData = [
      {
        values: [65, 25, 10],
        labels: ["Approved", "Approved with Limitations", "Not Recommended"],
        type: "pie",
        hole: 0.6,
        marker: {
          colors: ["#10b981", "#3b82f6", "#ef4444"],
        },
        textinfo: "none",
      },
    ];

    const recommendationLayout = {
      title: {
        text: "Recommendation Distribution",
        font: { size: 16, family: "Inter", color: "#0F3053", weight: 700 },
        x: 0.05,
      },
      showlegend: true,
      legend: { orientation: "h", y: -0.2 },
      margin: { t: 40, b: 20, l: 20, r: 20 },
      height: 300,
      paper_bgcolor: "rgba(0,0,0,0)",
    };

    window.Plotly.newPlot(
      "chart-recommendation",
      recommendationData,
      recommendationLayout,
      { displayModeBar: false, responsive: true },
    );

    // Chart: Intended Users
    const usersData = [
      {
        values: [40, 30, 20, 10],
        labels: ["K-12", "Higher Ed", "Faculty Only", "Admin Only"],
        type: "pie",
        hole: 0.6,
        marker: {
          colors: ["#3b82f6", "#58BFCE", "#f59e0b", "#8b5cf6"],
        },
        textinfo: "none",
      },
    ];

    const usersLayout = {
      title: {
        text: "Intended Users Distribution",
        font: { size: 16, family: "Inter", color: "#0F3053", weight: 700 },
        x: 0.05,
      },
      showlegend: true,
      legend: { orientation: "h", y: -0.2 },
      margin: { t: 40, b: 20, l: 20, r: 20 },
      height: 300,
      paper_bgcolor: "rgba(0,0,0,0)",
    };

    window.Plotly.newPlot("chart-users", usersData, usersLayout, {
      displayModeBar: false,
      responsive: true,
    });

    // Chart: Compliance Distribution (Horizontal Bar)
    const complianceData = [
      {
        type: "bar",
        x: [95, 88, 85, 80, 75, 70, 65, 60, 55, 50],
        y: [
          "SOC 2 Type II",
          "CCPA",
          "FERPA",
          "GDPR",
          "COPPA",
          "ISO 27001",
          "CSPC",
          "Australia Privacy Act",
          "Terms of Service",
          "Data Protection Act",
        ],
        orientation: "h",
        marker: {
          color: [
            "#10b981",
            "#10b981",
            "#10b981",
            "#3b82f6",
            "#10b981",
            "#10b981",
            "#3b82f6",
            "#10b981",
            "#10b981",
            "#3b82f6",
          ],
        },
      },
    ];

    const complianceLayout = {
      title: {
        text: "Compliance Standard Distribution",
        font: { size: 18, family: "Inter", color: "#0F3053", weight: 700 },
      },
      xaxis: { title: "Compliance Score / Percentage", gridcolor: "#f1f5f9" },
      yaxis: { autorange: "reversed" },
      margin: { t: 50, b: 40, l: 200, r: 20 },
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      height: 450,
    };

    window.Plotly.newPlot(
      "chart-compliance",
      complianceData,
      complianceLayout,
      { displayModeBar: false, responsive: true },
    );
  };

  return (
    <div className="dashboard__content">
      {/* Stats Cards Row */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Scanned Tools */}
        <div className="dashboard-card p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Scanned Tools
              </p>
              <h3 className="text-4xl font-bold text-foreground mt-1">142</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <i className="fa-solid fa-database"></i>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            <span className="text-emerald-600 font-medium">
              <i className="fa-solid fa-arrow-up mr-1"></i>12%
            </span>{" "}
            from last month
          </div>
        </div>

        {/* High Risk Tools */}
        <div className="dashboard-card p-6 flex flex-col justify-between border-l-4 border-l-destructive">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                High Risk Tools
              </p>
              <h3 className="text-4xl font-bold text-destructive mt-1">3</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
              <i className="fa-solid fa-triangle-exclamation"></i>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            Requires immediate attention
          </div>
        </div>

        {/* Approved Tools */}
        <div className="dashboard-card p-6 flex flex-col justify-between border-l-4 border-l-emerald-500">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Approved Tools
              </p>
              <h3 className="text-4xl font-bold text-emerald-600 mt-1">89</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <i className="fa-solid fa-check-circle"></i>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            Ready for enterprise usage
          </div>
        </div>

        {/* Pending Review */}
        <div className="dashboard-card p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Pending Review
              </p>
              <h3 className="text-4xl font-bold text-orange-500 mt-1">14</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-500">
              <i className="fa-regular fa-clock"></i>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            Tools awaiting evaluation
          </div>
        </div>
      </section>

      {/* High Risk & Charts Row */}
      <section
        className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8"
        style={{ minHeight: "400px" }}
      >
        {/* High Risk Alert Box */}
        <div className="lg:col-span-8 dashboard-card flex flex-col overflow-hidden">
          <div className="bg-amber-50 border-b border-amber-100 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center text-amber-800">
              <i className="fa-solid fa-triangle-exclamation mr-2"></i>
              <h3 className="font-bold text-lg">
                High-Risk Tools Requiring Immediate Attention
              </h3>
            </div>
            <button className="text-xs font-medium text-amber-700 hover:text-amber-900 underline">
              View all risks
            </button>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full custom-table">
              <thead>
                <tr>
                  <th className="w-1/4">Tool</th>
                  <th className="w-1/4">Vendor</th>
                  <th className="text-center w-24">Overall</th>
                  <th className="text-center w-24">Privacy</th>
                  <th>Risk Reasons</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-red-50/30">
                  <td>
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded bg-blue-600 text-white flex items-center justify-center mr-3 font-bold text-xs">
                        fb
                      </div>
                      <div>
                        <div className="font-semibold text-destructive">
                          facebook.com
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Social Media
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>Meta Platforms, Inc.</td>
                  <td className="text-center">
                    <span className="font-bold text-destructive">52</span>
                  </td>
                  <td className="text-center">
                    <span className="font-bold text-amber-600">60</span>
                  </td>
                  <td className="text-xs text-muted-foreground">
                    Data sharing, Tracking, No educational purpose
                  </td>
                  <td className="text-right">
                    <span className="status-badge status-danger">Block</span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded bg-gray-800 text-white flex items-center justify-center mr-3 font-bold text-xs">
                        X
                      </div>
                      <div>
                        <div className="font-semibold text-amber-700">
                          x.com
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Social Media
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>X Corp.</td>
                  <td className="text-center">
                    <span className="font-bold text-amber-600">58</span>
                  </td>
                  <td className="text-center">
                    <span className="font-bold text-amber-600">62</span>
                  </td>
                  <td className="text-xs text-muted-foreground">
                    User generated content, Unmoderated
                  </td>
                  <td className="text-right">
                    <span className="status-badge status-warning">Review</span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded bg-black text-white flex items-center justify-center mr-3 font-bold text-xs">
                        TT
                      </div>
                      <div>
                        <div className="font-semibold text-destructive">
                          tiktok.com
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Social Media
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>ByteDance</td>
                  <td className="text-center">
                    <span className="font-bold text-destructive">45</span>
                  </td>
                  <td className="text-center">
                    <span className="font-bold text-destructive">40</span>
                  </td>
                  <td className="text-xs text-muted-foreground">
                    Data privacy concerns, Addiction risks
                  </td>
                  <td className="text-right">
                    <span className="status-badge status-danger">Block</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Score Gauges */}
        <div className="lg:col-span-4 dashboard-card p-6 flex flex-col">
          <h3 className="font-bold text-foreground mb-6">
            Overall Compliance Health
          </h3>
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="grid grid-cols-2 gap-8 w-full">
              {[
                { score: 77, label: "Privacy & Safety", color: "#3b82f6" },
                { score: 81, label: "Instructional Impact", color: "#10b981" },
                { score: 87, label: "Usability", color: "#10b981" },
                { score: 92, label: "Data Quality", color: "#10b981" },
              ].map((item, idx) => (
                <div key={idx} className="flex flex-col items-center">
                  <div
                    className="score-circle"
                    style={{ "--score": item.score, "--primary": item.color }}
                  >
                    <span className="score-value" style={{ color: item.color }}>
                      {item.score}%
                    </span>
                  </div>
                  <p className="mt-2 text-xs font-semibold text-muted-foreground text-center">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Charts & Table Row */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        {/* Charts Column */}
        <div className="lg:col-span-4 space-y-6">
          {/* Recommendation Distribution */}
          <div className="dashboard-card p-4" style={{ height: "320px" }}>
            <div id="chart-recommendation" className="w-full h-full"></div>
          </div>

          {/* Intended Users */}
          <div className="dashboard-card p-4" style={{ height: "320px" }}>
            <div id="chart-users" className="w-full h-full"></div>
          </div>
        </div>

        {/* Main Table Column */}
        <div
          className="lg:col-span-8 dashboard-card flex flex-col overflow-hidden"
          style={{ height: "664px" }}
        >
          <div className="px-6 py-5 border-b border-border flex justify-between items-center bg-white">
            <h3 className="font-bold text-lg text-primary">
              Complete Tool Information
            </h3>
            <div className="flex space-x-2">
              <button className="px-3 py-1.5 text-xs font-medium border border-border rounded hover:bg-muted transition-colors">
                <i className="fa-solid fa-filter mr-1"></i> Filter
              </button>
              <button className="px-3 py-1.5 text-xs font-medium border border-border rounded hover:bg-muted transition-colors">
                <i className="fa-solid fa-download mr-1"></i> Export
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full custom-table">
              <thead className="sticky top-0 bg-muted z-10 shadow-sm">
                <tr>
                  <th>Tool Name</th>
                  <th>Category</th>
                  <th>Overall</th>
                  <th>Recommendation</th>
                  <th>Allowed Usage</th>
                  <th>Grade Level</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    name: "flintk12",
                    vendor: "Flint K12 Inc.",
                    category: "Education",
                    categoryBg: "bg-purple-100",
                    categoryText: "text-purple-700",
                    score: 82,
                    scoreBg: "bg-emerald-100",
                    scoreText: "text-emerald-700",
                    recommendation: "Approved w/ Limits",
                    recClass: "status-approved",
                    usage: "Creating lesson plans...",
                    grade: "K-12",
                  },
                  {
                    name: "Canva",
                    vendor: "Canva Pty Ltd",
                    category: "Design",
                    categoryBg: "bg-blue-100",
                    categoryText: "text-blue-700",
                    score: 95,
                    scoreBg: "bg-emerald-100",
                    scoreText: "text-emerald-700",
                    recommendation: "Approved",
                    recClass: "status-approved",
                    usage: "Visual content creation, presentations",
                    grade: "All Levels",
                  },
                  {
                    name: "UX Pilot",
                    vendor: "UX Pilot AI",
                    category: "AI LLM",
                    categoryBg: "bg-indigo-100",
                    categoryText: "text-indigo-700",
                    score: 68,
                    scoreBg: "bg-amber-100",
                    scoreText: "text-amber-700",
                    recommendation: "Restricted",
                    recClass: "status-warning",
                    usage: "Teacher assistance only, no student PII",
                    grade: "Faculty Only",
                  },
                  {
                    name: "Quizlet",
                    vendor: "Quizlet Inc.",
                    category: "Study Tool",
                    categoryBg: "bg-purple-100",
                    categoryText: "text-purple-700",
                    score: 88,
                    scoreBg: "bg-emerald-100",
                    scoreText: "text-emerald-700",
                    recommendation: "Approved",
                    recClass: "status-approved",
                    usage: "Study sets, flashcards, learning games",
                    grade: "K-12, Higher Ed",
                  },
                  {
                    name: "Midjourney",
                    vendor: "Midjourney Inc.",
                    category: "Gen AI Art",
                    categoryBg: "bg-pink-100",
                    categoryText: "text-pink-700",
                    score: 65,
                    scoreBg: "bg-amber-100",
                    scoreText: "text-amber-700",
                    recommendation: "Restricted",
                    recClass: "status-warning",
                    usage: "Art curriculum only, teacher supervision",
                    grade: "9-12 (Art)",
                  },
                  {
                    name: "Discord",
                    vendor: "Discord Inc.",
                    category: "Communication",
                    categoryBg: "bg-gray-100",
                    categoryText: "text-gray-700",
                    score: 42,
                    scoreBg: "bg-red-100",
                    scoreText: "text-red-700",
                    recommendation: "Not Recommended",
                    recClass: "status-danger",
                    usage: "None for student use",
                    grade: "N/A",
                  },
                  {
                    name: "Kahoot!",
                    vendor: "Kahoot! ASA",
                    category: "Gamification",
                    categoryBg: "bg-purple-100",
                    categoryText: "text-purple-700",
                    score: 91,
                    scoreBg: "bg-emerald-100",
                    scoreText: "text-emerald-700",
                    recommendation: "Approved",
                    recClass: "status-approved",
                    usage: "Quizzes, interactive learning",
                    grade: "K-12",
                  },
                ].map((tool, idx) => (
                  <tr key={idx}>
                    <td>
                      <div className="font-semibold text-primary">
                        {tool.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {tool.vendor}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${tool.categoryBg} ${tool.categoryText}`}
                      >
                        {tool.category}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-xs ${tool.scoreBg} ${tool.scoreText}`}
                      >
                        {tool.score}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${tool.recClass}`}>
                        {tool.recommendation}
                      </span>
                    </td>
                    <td className="text-xs max-w-[200px] truncate">
                      {tool.usage}
                    </td>
                    <td className="text-xs">{tool.grade}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Compliance Bar Chart Section */}
      <section className="dashboard-card p-6" style={{ height: "500px" }}>
        <div id="chart-compliance" className="w-full h-full"></div>
      </section>
    </div>
  );
}

// Made with Bob
