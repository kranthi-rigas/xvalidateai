import { useEffect, useState } from "react";
import FooterNine from "../layout/footers/FooterNine";
import SubjectWisePieChart from "./SubjectWisePieChart";
import AttemptWiseAreaChart from "./AttemptWiseAreaChart";
import { fetchAttemptResultsForAnalyticsById } from "@/apiIntegration/attempts";
import { fetchAllExams } from "@/apiIntegration/mockTests";
import SingleScore from "@/components/commonComponents/SingleScore";
import ListTable from "@/components/common/ListTable.jsx";
import Filter from "@/components/commonComponents/Filter";
import PageLoader from "@/components/common/PageLoader";
import usePageLoader from "@/data/usePageLoader";

export default function DashboardOne() {
  const [examDetails, setExamDetails] = useState(null);
  const [selectedExam, setSelectedExam] = useState(null);
  const [selectedTestTitle, setSelectedTestTitle] = useState(null);
  const [exams, setExams] = useState([]);
  const [examsByCategory, setExamsByCategory] = useState([]);
  const [analyticsData, setAnalyticsData] = useState([]);
  const [fullAnalyticsData, setFullAnalyticsData] = useState(null);
  const pageLoading = usePageLoader([examDetails]);
  const scoreTrend = fullAnalyticsData?.data?.charts?.line?.summary || {};
  const avgScore = scoreTrend.avg || 0;
  const maxScore = scoreTrend.max || 0;
  const minScore = scoreTrend.min || 0;
  const columns = [
    {
      key: "subject",
      label: "Subject",
      sortable: true,
    },
    {
      key: "correct",
      label: "Correct",
      sortable: true,
    },
    {
      key: "total",
      label: "Total",
      sortable: true,
    },
    {
      key: "percent",
      label: "Percentage",
      sortable: true,
    },
  ];
  const renderCell = (row, key) => {
    if (!row) return "-";

    if (key === "percent") {
      return typeof row.percent === "number"
        ? `${row.percent.toFixed(1)}%`
        : "-";
    }

    return row[key] ?? "-";
  };

  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "asc",
  });

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }
      return { key, direction: "asc" };
    });
  };
  const examOptions = exams.map((item) => ({
    label: item.exam,
    value: item.exam,
  }));

  const testOptions = examsByCategory.map((item) => ({
    label: item.title,
    value: item.exam_id,
  }));

  useEffect(() => {
    fetchAllExams()
      .then((d) => {
        setExamDetails(d.exams);
        const unique = [
          ...new Map(d.exams.map((item) => [item.exam, item])).values(),
        ];
        setExams(unique);

        if (unique.length > 0) {
          const firstExamName = unique[0].exam;
          setSelectedExam(firstExamName);

          // Filter tests belonging to this exam
          const filtered = d.exams.filter(
            (item) => item.exam === firstExamName
          );
          setExamsByCategory(filtered);

          // Auto-select first test under first exam
          if (filtered.length > 0) {
            const firstTest = filtered[0];
            setSelectedTestTitle(firstTest.title);

            // Fetch analytics for this test
            fetchAttemptResultsForAnalyticsById(firstTest.exam_id)
              .then((response) => {
                setFullAnalyticsData(response);

                let data = [];

                if (Array.isArray(response)) data = response;
                else if (response?.data?.charts?.pie?.subjects)
                  data = response.data.charts.pie.subjects;
                else if (response?.charts?.pie?.subjects)
                  data = response.charts.pie.subjects;

                setAnalyticsData(data);
              })
              .catch(() => {
                setAnalyticsData([]);
                setFullAnalyticsData(null);
              });
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleExamSelect = (examName) => {
    setSelectedExam(examName);
    const filtered = examDetails.filter((item) => item.exam === examName);
    setExamsByCategory(filtered);

    // Close dropdown
    setTimeout(() => {
      const button = document.getElementById("first_filter");
      const content = document.getElementById("first_filter_content");
      if (button) button.classList.remove("-is-dd-active");
      if (content) content.classList.remove("-is-el-visible");
    }, 0);
  };

  const handleExamIdSelect = (examId, testTitle) => {
    setSelectedTestTitle(testTitle);

    // Fetch attempt results for analytics
    fetchAttemptResultsForAnalyticsById(examId)
      .then((response) => {
        setFullAnalyticsData(response);

        // Handle different possible response structures
        let data = [];

        if (response && Array.isArray(response)) {
          // If response is directly an array
          data = response;
        } else if (response && response.data && Array.isArray(response.data)) {
          // If response.data is an array
          data = response.data;
        } else if (
          response &&
          response.data &&
          response.data.charts &&
          response.data.charts.pie &&
          Array.isArray(response.data.charts.pie.subjects)
        ) {
          // If nested in charts.pie.subjects
          data = response.data.charts.pie.subjects;
        } else if (
          response &&
          response.charts &&
          response.charts.pie &&
          Array.isArray(response.charts.pie.subjects)
        ) {
          // If nested in charts.pie.subjects (no data wrapper)
          data = response.charts.pie.subjects;
        }

        console.log("Processed Analytics Data:", data);
        setAnalyticsData(data);
      })
      .catch((error) => {
        console.error("Error fetching attempt results:", error);
        setAnalyticsData([]);
        setFullAnalyticsData(null);
      });

    setTimeout(() => {
      const button = document.getElementById("second_filter");
      const content = document.getElementById("second_filter_content");
      if (button) button.classList.remove("-is-dd-active");
      if (content) content.classList.remove("-is-el-visible");
    }, 0);
  };

  if (pageLoading) {
    return <PageLoader loading={true} />;
  }
  return (
    <div className="dashboard__content">
      <div className="dashboard-body">
        <div className="row">
          <div className="filter-section" style={{ display: "flex", gap: 12 }}>
            <Filter
              options={[{ label: "Select Exam", value: "" }, ...examOptions]}
              value={selectedExam ?? ""}
              onChange={(val) => handleExamSelect(val)}
              label={"Exam"}
            />

            <Filter
              options={[{ label: "Select Test", value: "" }, ...testOptions]}
              value={
                examsByCategory.find((e) => e.title === selectedTestTitle)
                  ? examsByCategory.find((e) => e.title === selectedTestTitle)
                      .exam_id
                  : ""
              }
              onChange={(val) => {
                const selected = examsByCategory.find((e) => e.exam_id === val);
                handleExamIdSelect(val, selected?.title || "");
              }}
              label={"Test"}
            />
          </div>
        </div>
        <div className="cards-container">
          <SingleScore
            title="Subjects"
            value={analyticsData.length}
            icon="/dashboardIcons/subjectsIcon.svg"
            valueColor="#F7941E"
          />
          <SingleScore
            title="Total Attempts"
            value={fullAnalyticsData?.data?.attempts_count}
            icon="/dashboardIcons/totalAttemptsIcon.svg"
            valueColor="#FFC710"
          />
          <SingleScore
            title="Latest Score"
            value={`${Number(
              fullAnalyticsData?.data?.latest_score ?? 0
            ).toFixed(2)}%`}
            icon="/dashboardIcons/latestScoreIcon.svg"
            valueColor="#FF2727"
          />
          <SingleScore
            title="Average Score"
            value={`${avgScore.toFixed(2)}%`}
            icon="/dashboardIcons/averageScoreIcon.svg"
            valueColor="#3BD145"
          />
          <SingleScore
            title="Total Correct"
            value={fullAnalyticsData?.data?.attempts_count}
            icon="/dashboardIcons/totalCorrectIcon.svg"
            valueColor="#3B82F6"
          />
          <SingleScore
            title="Overall Accuracy"
            value={fullAnalyticsData?.data?.attempts_count}
            icon="/dashboardIcons/overallAccuracyIcon.svg"
            valueColor="#4661FF"
          />
          <SingleScore
            title="Lowest Score"
            value={`${minScore.toFixed(2)}%`}
            icon="/dashboardIcons/lowestScoreIcon.svg"
            valueColor="#EF00B7"
          />
          <SingleScore
            title="Highest Score"
            value={`${maxScore.toFixed(2)}%`}
            icon="/dashboardIcons/highestScoreIcon.svg"
            valueColor="#A200F2"
          />
          <SingleScore
            title="Score Range"
            value={`${minScore.toFixed(2)}% - ${maxScore.toFixed(2)}%`}
            icon="/dashboardIcons/scoreRangeIcon.svg"
            valueColor="#00BFDC"
          />
        </div>
      </div>
      <div className="row">
        <div className="d-grid">
          <div>
            <SubjectWisePieChart data={analyticsData} />
          </div>
          <div>
            <AttemptWiseAreaChart fullData={fullAnalyticsData} />
          </div>
        </div>
      </div>

      <div className="list-container">
        <ListTable
          columns={columns}
          data={analyticsData}
          rowKey="subject"
          renderCell={renderCell}
          sortConfig={sortConfig}
          onSort={handleSort}
        />
      </div>
      <FooterNine />
    </div>
  );
}
