import { fetchDashboardAnalytics } from "@/apiIntegration/dashboards";
import React, { useEffect, useState, useMemo } from "react";
import {
    Chart as ChartJS,
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
} from 'chart.js';
import { Radar, Bar, Doughnut, Scatter } from 'react-chartjs-2';
import GaugeChart from "@/components/Charts/GaugeChart";
import Modal from "@/components/commonComponents/ModalPopUp";
import ListTable from "@/components/common/ListTable.jsx";
import PageLoader from "@/components/common/PageLoader";
import usePageLoader from "@/data/usePageLoader";
import { COLORS } from "@/styles/colors";

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend, CategoryScale, LinearScale, BarElement, ArcElement);

export default function AIDashboard() {
    const [dashboardAnalytics, setDashboardAnalytics] = useState(null);
    const [selectedPillar, setSelectedPillar] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
    const pageLoading = usePageLoader([dashboardAnalytics]);

    const evaluationColumns = useMemo(() => [
        { key: "tool_name", label: "Tool", sortable: false },
        { key: "developer", label: "Vendor", sortable: false },
        { key: "url", label: "URL", sortable: false },
        { key: "overall_score", label: "Overall", sortable: false },
        { key: "recommendation", label: "Recommendation", sortable: false },
        { key: "allowed_usage", label: "Allowed Usage", sortable: false },
        { key: "restricted_usage", label: "Restricted Usage", sortable: false },
        { key: "grade_level", label: "Grade Level", sortable: false },
    ], []);

    const highRiskColumns = useMemo(() => [
        { key: "project_name", label: "Tool", sortable: true, width: 180 },
        { key: "developer", label: "Vendor", sortable: true, width: 220 },
        { key: "overall_score", label: "Overall Score", sortable: true, width: 120 },
        { key: "privacy_safety", label: "Privacy Score", sortable: true, width: 120 },
        { key: "high_risk_reason", label: "Risk Reasons", sortable: false, width: 300 },
        { key: "recommendation", label: "Recommendation", sortable: true, width: 180 },
    ], []);

    const highRiskList = useMemo(() => dashboardAnalytics?.high_risk_tools || [], [dashboardAnalytics]);
    const allToolsList = useMemo(() => dashboardAnalytics?.tool_kpis || [], [dashboardAnalytics]);

    const pillarAverages = useMemo(() => {
        if (!dashboardAnalytics?.tool_kpis?.length) return null;
        const tools = dashboardAnalytics.tool_kpis;
        const count = tools.length;
        const sum = (key) => tools.reduce((acc, t) => acc + (t[key] || 0), 0);
        return {
            privacy: Math.round(sum("privacy_safety_score") / count),
            instructional: Math.round(sum("instructional_impact_score") / count),
            usability: Math.round(sum("usability_score") / count),
            dataQuality: Math.round(sum("data_quality_score") / count),
        };
    }, [dashboardAnalytics]);

    const filteredTools = useMemo(() => {
        if (!selectedPillar || !dashboardAnalytics?.tool_kpis) return [];
        return dashboardAnalytics.tool_kpis.filter((tool) => (tool[selectedPillar] ?? 0) > 0);
    }, [selectedPillar, dashboardAnalytics]);

    // Chart data configurations
    const radarChartData = useMemo(() => ({
        labels: ['Privacy & Safety', 'Instructional Impact', 'Usability', 'Data Quality'],
        datasets: [{
            label: 'Average Score',
            data: [pillarAverages?.privacy ?? 0, pillarAverages?.instructional ?? 0, pillarAverages?.usability ?? 0, pillarAverages?.dataQuality ?? 0],
            backgroundColor: 'rgba(102, 126, 234, 0.2)',
            borderColor: '#304FFD',
            pointBackgroundColor: '#3B82F6',
            pointBorderColor: '#304FFD',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgb(102, 126, 234)'
        }]
    }), [pillarAverages]);

    const radarChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: { r: { beginAtZero: true, max: 100, ticks: { stepSize: 20 } } },
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    afterLabel: (context) => {
                        const pillarMap = { 0: 'privacy_safety_score', 1: 'instructional_impact_score', 2: 'usability_score', 3: 'data_quality_score' };
                        const field = pillarMap[context.dataIndex];
                        const tools = dashboardAnalytics?.tool_kpis || [];
                        return ['', 'Tools:', ...tools.map(t => `  • ${t.tool_name}: ${t[field]}`)];
                    }
                }
            }
        }
    };

    const complianceChartData = useMemo(() => {
        const raw = dashboardAnalytics?.distributions?.compliance || [];

        const normalizeStatus = (name) => {
            const n = name.toLowerCase();
            if (n.includes("partial")) return "partial";
            if (n.includes("claimed")) return "claimed";
            if (n.includes("not")) return "notVerified";
            return "full";
        };

        const normalizeStandard = (name) =>
            name
                .replace(/- partial.*/i, "")
                .replace(/- not.*/i, "")
                .replace(/- claimed.*/i, "")
                .trim();

        const grouped = {};

        raw.forEach(({ name, value }) => {
            const standard = normalizeStandard(name);
            const status = normalizeStatus(name);

            if (!grouped[standard]) {
                grouped[standard] = {
                    full: 0,
                    partial: 0,
                    claimed: 0,
                    notVerified: 0
                };
            }

            grouped[standard][status] += value;
        });

        const standards = Object.keys(grouped);

        return {
            labels: standards,
            datasets: [
                {
                    label: "Full Compliance",
                    data: standards.map(s => grouped[s].full),
                    backgroundColor: "#00A86B"
                },
                {
                    label: "Partial Compliance",
                    data: standards.map(s => grouped[s].partial),
                    backgroundColor: "#304FFD"
                },
                {
                    label: "Claimed",
                    data: standards.map(s => grouped[s].claimed),
                    backgroundColor: "#9B8AFB"
                },
                {
                    label: "Not Verified",
                    data: standards.map(s => grouped[s].notVerified),
                    backgroundColor: "#FF965D"
                }
            ]
        };
    }, [dashboardAnalytics]);


    const complianceChartOptions = {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                stacked: true,
                beginAtZero: true,
                title: {
                    display: true,
                    text: "Number of Tools",
                    font: { weight: "bold" }
                }
            },
            y: {
                stacked: true,
                ticks: {
                    font: { size: 12 }
                }
            }
        },
        plugins: {
            legend: {
                position: "bottom",
                labels: {
                    usePointStyle: true
                }
            },
            tooltip: {
                callbacks: {
                    label: (ctx) =>
                        `${ctx.dataset.label}: ${ctx.raw}`
                }
            }
        }
    };

    const recommendationChartData = useMemo(() => {
        const colors = { 'Approved': '#27ae60', 'Approved with limitations': '#304FFD', 'Restricted': '#f39c12', 'Do not use': '#e74c3c', 'Not Recommended': '#e74c3c', 'Rejected': '#e74c3c', 'Not Assessed': '#95a5a6' };
        const data = dashboardAnalytics?.distributions?.recommendation || [];
        return {
            labels: data.map(d => d.name),
            datasets: [{ data: data.map(d => d.value), backgroundColor: data.map(d => colors[d.name] || '#95a5a6'), borderWidth: 2, borderColor: '#fff' }]
        };
    }, [dashboardAnalytics]);

    const recommendationChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
            legend: { position: 'bottom' },
            tooltip: {
                callbacks: {
                    afterLabel: (context) => {
                        const recommendation = context.label;
                        const tools = dashboardAnalytics?.tool_kpis || [];
                        const matchingTools = tools.filter(t => t.recommendation === recommendation);
                        return ['', 'Tools:', ...matchingTools.map(t => `  • ${t.tool_name}`)];
                    }
                }
            }
        }
    };

    const gradeLevelChartData = useMemo(() => {
        const normalizeGradeLevel = (level) => {
            if (!level) return 'Not Specified';
            const normalized = level.toLowerCase();
            if (normalized.includes('k-12') || normalized.includes('kindergarten')) return 'K-12';
            return level;
        };
        const distributions = dashboardAnalytics?.distributions?.intended_users || [];
        const normalizedData = {};
        distributions.forEach(d => {
            const normalized = normalizeGradeLevel(d.name);
            normalizedData[normalized] = (normalizedData[normalized] || 0) + d.value;
        });
        return {
            labels: Object.keys(normalizedData),
            datasets: [{ data: Object.values(normalizedData), backgroundColor: ['#304FFD', '#FFD240', '#00A86B', '#FF965D', '#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b'], borderWidth: 2, borderColor: '#fff' }]
        };
    }, [dashboardAnalytics]);

    const gradeLevelChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
            legend: { position: 'bottom' },
            tooltip: {
                callbacks: {
                    afterLabel: (context) => {
                        const gradeLevel = context.label;
                        const tools = dashboardAnalytics?.tool_kpis || [];
                        const matchingTools = tools.filter(t => t.grade_level === gradeLevel);
                        return ['', 'Tools:', ...matchingTools.map(t => `  • ${t.tool_name}`)];
                    }
                }
            }
        }
    };

    const privacyRiskScatterData = useMemo(() => {
        const getColor = (score) => score >= 80 ? '#00A86B' : score >= 60 ? '#304FFD' : score >= 40 ? '#f39c12' : '#e74c3c';
        const tools = dashboardAnalytics?.tool_kpis || [];
        return {
            datasets: [{
                label: 'Tools',
                data: tools.map(tool => ({ x: tool.privacy_safety_score, y: tool.overall_score, label: tool.tool_name })),
                backgroundColor: tools.map(t => getColor(t.overall_score)),
                borderColor: '#fff',
                borderWidth: 2,
                pointRadius: 10,
                pointHoverRadius: 14
            }]
        };
    }, [dashboardAnalytics]);

    const privacyRiskScatterOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: { title: { display: true, text: 'Privacy & Safety Score →', font: { size: 14, weight: 'bold' } }, beginAtZero: true, max: 100 },
            y: { title: { display: true, text: 'Overall Compliance Score →', font: { size: 14, weight: 'bold' } }, beginAtZero: true, max: 100 }
        },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                padding: 16,
                titleFont: { size: 16, weight: 'bold' },
                bodyFont: { size: 13 },
                bodySpacing: 8,
                displayColors: false,
                callbacks: {
                    title: (context) => dashboardAnalytics?.tool_kpis?.[context[0].dataIndex]?.tool_name || '',
                    label: (context) => {
                        const tool = dashboardAnalytics?.tool_kpis?.[context.dataIndex];
                        if (!tool) return '';
                        return ['', `🏢 ${tool.developer}`, `🌐 ${tool.url || 'Not specified'}`, '', `📊 Overall: ${tool.overall_score.toFixed(0)}/100`, `🔒 Privacy: ${tool.privacy_safety_score}/100`, `📚 Instructional: ${tool.instructional_impact_score}/100`, `⚙️ Usability: ${tool.usability_score}/100`, `📈 Data Quality: ${tool.data_quality_score}/100`, '', `✅ ${tool.recommendation}`, `🎓 ${tool.grade_level}`, '', `✓ Allowed:`, tool.allowed_usage?.substring(0, 60) + '...', '', `✗ Restricted:`, tool.restricted_usage?.substring(0, 60) + '...'];
                    }
                }
            }
        }
    };

    const overallScoreScatterData = useMemo(() => {
        const colorMap = { 'Approved': '#00A86B', 'Approved with limitations': '#304FFD', 'Restricted': '#f39c12', 'Do not use': '#e74c3c', 'Not Recommended': '#e74c3c', 'Rejected': '#e74c3c', 'Not Assessed': '#95a5a6' };
        const tools = dashboardAnalytics?.tool_kpis || [];
        const groupedData = {};
        tools.forEach(tool => {
            const rec = tool.recommendation || 'Not Assessed';
            if (!groupedData[rec]) groupedData[rec] = [];
            groupedData[rec].push({ x: tool.overall_score, y: tool.instructional_impact_score, label: tool.tool_name });
        });
        console.log(groupedData)
        return {
            datasets: Object.keys(groupedData).map(rec => ({
                label: rec,
                data: groupedData[rec],
                backgroundColor: colorMap[rec] || '#95a5a6',
                borderColor: '#fff',
                borderWidth: 2,
                pointRadius: 10,
                pointHoverRadius: 14
            }))
        };
    }, [dashboardAnalytics]);

    const overallScoreScatterOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: { title: { display: true, text: 'Overall Score →', font: { size: 14, weight: 'bold' } }, beginAtZero: true, max: 100 },
            y: { title: { display: true, text: 'Instructional Impact →', font: { size: 14, weight: 'bold' } }, beginAtZero: true, max: 100 }
        },
        plugins: {
            legend: { position: 'bottom' },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                padding: 16,
                titleFont: { size: 16, weight: 'bold' },
                bodyFont: { size: 13 },
                bodySpacing: 8,
                displayColors: false,
                callbacks: {
                    title: (context) => context[0].raw.label,
                    label: (context) => {
                        const toolName = context.raw.label;
                        const tool = dashboardAnalytics?.tool_kpis?.find(t => t.tool_name === toolName);
                        if (!tool) return '';
                        return ['', `🏢 ${tool.developer}`, `🌐 ${tool.url || 'Not specified'}`, '', `📊 Overall: ${tool.overall_score.toFixed(0)}/100`, `🔒 Privacy: ${tool.privacy_safety_score}/100`, `📚 Instructional: ${tool.instructional_impact_score}/100`, `⚙️ Usability: ${tool.usability_score}/100`, `📈 Data Quality: ${tool.data_quality_score}/100`, '', `✅ ${tool.recommendation}`, `🎓 ${tool.grade_level}`, '', `✓ Allowed:`, tool.allowed_usage?.substring(0, 60) + '...', '', `✗ Restricted:`, tool.restricted_usage?.substring(0, 60) + '...'];
                    }
                }
            }
        }
    };

    useEffect(() => {
        fetchDashboardAnalytics().then(setDashboardAnalytics).catch((err) => console.error("Dashboard error:", err));
    }, []);

    const getGaugeColor = (value) => value >= 80 ? "#00A86B" : value >= 60 ? '#304FFD' : value >= 40 ? "#f59e0b" : "#ef4444";
    const handleSort = (key) => setSortConfig((prev) => ({ key, direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc" }));

    const renderHighRiskCell = (row, key) => {
        switch (key) {
            case "project_name": return <span style={{ fontWeight: 600, color: COLORS.error }}>{row.project_name}</span>;
            case "developer": return row.developer || "—";
            case "overall_score": return <span style={{ fontWeight: 600, color: row.overall_score < 50 ? "#dc2626" : "#f59e0b" }}>{row.overall_score?.toFixed(0)}</span>;
            case "privacy_safety": return <span style={{ fontWeight: 600, color: row.privacy_safety < 50 ? "#dc2626" : "#f59e0b" }}>{row.privacy_safety}</span>;
            case "recommendation": return <span style={{ color: row.recommendation?.toLowerCase().includes("approved") ? "#059669" : "#dc2626", fontWeight: 500 }}>{row.recommendation}</span>;
            case "high_risk_reason": return <span style={{ fontSize: "0.9em", whiteSpace: "pre-wrap" }}>{row.high_risk_reason}</span>;
            default: return "—";
        }
    };

    const renderEvaluationCell = (row, key) => {
        switch (key) {
            case "tool_name": return <strong>{row.tool_name}</strong>;
            case "developer": return row.developer || "—";
            case "url": return row.url ? <a href={row.url} target="_blank" rel="noopener noreferrer" style={{ color: COLORS.primary }}>{row.url}</a> : "—";
            case "overall_score":
                const score = row.overall_score?.toFixed(0);
                const scoreColor = score >= 80 ? "#22c55e" : score >= 60 ? "#3498db" : score >= 40 ? "#f59e0b" : "#ef4444";
                return <span style={{ fontWeight: 600, color: scoreColor, padding: "4px 12px", borderRadius: "20px", backgroundColor: `${scoreColor}15` }}>{score}</span>;
            case "recommendation":
                const recColor = row.recommendation?.toLowerCase().includes("approved") ? "#059669" : "#dc2626";
                return <span style={{ color: recColor, fontWeight: 500, padding: "6px 14px", borderRadius: "20px", backgroundColor: `${recColor}15`, fontSize: "0.85em" }}>{row.recommendation}</span>;
            case "allowed_usage":
            case "restricted_usage":
                return <span style={{ fontSize: "0.9em", maxWidth: "300px", display: "block", whiteSpace: "normal" }}>{row[key] || "Not specified"}</span>;
            case "grade_level": return row.grade_level || "Not Specified";
            default: return row[key] ?? "—";
        }
    };

    if (pageLoading || !dashboardAnalytics) return <PageLoader loading={true} />;

    return (
        <div className="dashboard__content">
            {/* EXECUTIVE SUMMARY CARDS WITH SVG */}
            <div className="normal-container-styles">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                    <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '10px' }}>Total Tools</div>
                                <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{dashboardAnalytics.overview.total_projects ?? 0}</div>
                            </div>
                            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7L12 12L22 7L12 2Z" /><path d="M2 17L12 22L22 17" /><path d="M2 12L12 17L22 12" /></svg>
                        </div>
                    </div>
                    <div style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '10px' }}>High-Risk Tools</div>
                                <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{dashboardAnalytics.overview.high_risk_count ?? 0}</div>
                            </div>
                            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                        </div>
                    </div>
                    <div style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '10px' }}>Approved Tools</div>
                                <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{dashboardAnalytics.overview.approved_count ?? 0}</div>
                            </div>
                            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                        </div>
                    </div>
                    <div style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '10px' }}>Rejected Tools</div>
                                <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{dashboardAnalytics.overview.rejected_count ?? 0}</div>
                            </div>
                            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                        </div>
                    </div>
                </div>

                {/* PILLAR GAUGE CHARTS */}
                <div className="row y-gap-10">
                    <div className="col-md-3 col-sm-6"><GaugeChart value={pillarAverages?.privacy ?? 0} label="Privacy & Safety" color={getGaugeColor(pillarAverages?.privacy ?? 0)} onClick={() => { setSelectedPillar("privacy_safety_score"); setIsModalOpen(true); }} /></div>
                    <div className="col-md-3 col-sm-6"><GaugeChart value={pillarAverages?.instructional ?? 0} label="Instructional Impact" color={getGaugeColor(pillarAverages?.instructional ?? 0)} onClick={() => { setSelectedPillar("instructional_impact_score"); setIsModalOpen(true); }} /></div>
                    <div className="col-md-3 col-sm-6"><GaugeChart value={pillarAverages?.usability ?? 0} label="Usability & Integration" color={getGaugeColor(pillarAverages?.usability ?? 0)} onClick={() => { setSelectedPillar("usability_score"); setIsModalOpen(true); }} /></div>
                    <div className="col-md-3 col-sm-6"><GaugeChart value={pillarAverages?.dataQuality ?? 0} label="Data & Reporting Quality" color={getGaugeColor(pillarAverages?.dataQuality ?? 0)} onClick={() => { setSelectedPillar("data_quality_score"); setIsModalOpen(true); }} /></div>
                </div>
            </div>

            {/* MODAL */}
            {isModalOpen && selectedPillar && (
                <Modal title={`Tools - ${selectedPillar.replace(/_/g, " ")}`} onClose={() => { setIsModalOpen(false); setSelectedPillar(null); }}>

                    <table className="table table-bordered">
                        <thead><tr><th>Tool</th><th>Score</th><th>Recommendation</th><th>High Risk</th></tr></thead>
                        <tbody>{filteredTools.map((tool) => (<tr key={tool.project_id}><td>{tool.tool_name}</td><td>{tool[selectedPillar]}</td><td>{tool.recommendation}</td><td>{tool.high_risk ? <span className="text-danger">Yes</span> : <span className="text-success">No</span>}</td></tr>))}</tbody>
                    </table>
                </Modal>
            )}

            {/* CHARTS */}
            <div className="normal-container-styles">
                <br/>
                <h4 className="d-flex mb-20 justify-center" > Compliance Distribution</h4>
                <hr/>
                <br/>
                <div className="col-lg-12 col-md-12 col-sm-12 mb-3">
                    <div style={{ height: '450px' }}>
                        <Bar data={complianceChartData} options={complianceChartOptions} />
                    </div>
                </div>
            </div>
            <div className="normal-container-styles">
                <br/>
                <h4 className="d-flex mb-20 justify-center" > Overall Score Distribution</h4>
                <hr/>
                <br/>
                <div className="col-lg-12 col-md-12 col-sm-12 mb-3">
                    <div style={{ height: '450px' }}>
                        <Scatter data={overallScoreScatterData} options={overallScoreScatterOptions} />
                    </div>
                </div>
            </div>
            <div className="normal-container-styles">
                <br/>
                <h4 className="d-flex mb-20 justify-center" > Scores & Coverage Distribution</h4>
                <hr/>
                <br/>
                <div className="row">
                    <div className="col-lg-6 col-md-6 col-sm-12 mb-3"><div style={{ background: COLORS.white, padding: '25px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}><h3 style={{ fontSize: '1.3rem', marginBottom: '20px', color: COLORS.textPrimary, borderBottom: `2px solid ${COLORS.borderLight}`, paddingBottom: '10px' }}>Pillar Health Scores</h3><div style={{ height: '300px' }}><Radar data={radarChartData} options={radarChartOptions} /></div></div></div>
                    <div className="col-lg-6 col-md-6 col-sm-12 mb-3"><div style={{ background: COLORS.white, padding: '25px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}><h3 style={{ fontSize: '1.3rem', marginBottom: '20px', color: COLORS.textPrimary, borderBottom: `2px solid ${COLORS.borderLight}`, paddingBottom: '10px' }}>Recommendation Distribution</h3><div style={{ height: '300px' }}><Doughnut data={recommendationChartData} options={recommendationChartOptions} /></div></div></div>
                </div>
                <div className="row">
                    <div className="col-lg-6 col-md-6 col-sm-12 mb-3"><div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}><h3 style={{ fontSize: '1.3rem', marginBottom: '20px', color: '#2c3e50', borderBottom: '2px solid #ecf0f1', paddingBottom: '10px' }}>Privacy & Risk Assessment</h3><div style={{ height: '300px' }}><Scatter data={privacyRiskScatterData} options={privacyRiskScatterOptions} /></div><div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '15px', flexWrap: 'wrap' }}><span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}><span style={{ width: '16px', height: '16px', borderRadius: '3px', background: '#27ae60' }}></span>Low Risk (80+)</span><span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}><span style={{ width: '16px', height: '16px', borderRadius: '3px', background: '#304FFD' }}></span>Medium (60-79)</span><span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}><span style={{ width: '16px', height: '16px', borderRadius: '3px', background: '#f39c12' }}></span>High (40-59)</span><span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}><span style={{ width: '16px', height: '16px', borderRadius: '3px', background: '#e74c3c' }}></span>Critical (&lt;40)</span></div></div></div>
                    <div className="col-lg-6 col-md-6 col-sm-12 mb-3"><div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}><h3 style={{ fontSize: '1.3rem', marginBottom: '20px', color: '#2c3e50', borderBottom: '2px solid #ecf0f1', paddingBottom: '10px' }}>Intended Users Distribution</h3><div style={{ height: '300px' }}><Doughnut data={gradeLevelChartData} options={gradeLevelChartOptions} /></div></div></div>
                </div>
            </div>

            {/* TABLES */}
            {highRiskList.length > 0 && (
                <div className="normal-container-styles" style={{ backgroundColor: COLORS.warningLight, padding: "20px" }}>
                    <h4 className="d-flex mb-20 justify-center" style={{ color: COLORS.textPrimary }}>High-Risk Tools Requiring Immediate Attention</h4>
                    <ListTable columns={highRiskColumns} data={highRiskList} rowKey="project_id" renderCell={renderHighRiskCell} sortConfig={sortConfig} onSort={handleSort} />
                </div>
            )}
            <div className="normal-container-styles">
                <h4 className="d-flex mb-20 justify-center">Complete Tool Information</h4>
                <ListTable columns={evaluationColumns} data={allToolsList} rowKey="project_id" renderCell={renderEvaluationCell} sortConfig={null} onSort={null} />
            </div>
        </div>
    );
}