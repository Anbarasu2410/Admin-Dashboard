import { useEffect, useState } from "react";
import { DatePicker, Spin } from "antd";
import dayjs from "dayjs";

import ProjectProgressTable from "../components/ProjectProgressTable.jsx";
import PDFExportButton from "../components/PDFExportButton.jsx";
import {
  getProgressReport,
  getProgressReportSummary,
} from "../api/progressReportApi";

const { RangePicker } = DatePicker;

const ProgressReportDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [progressData, setProgressData] = useState([]);
  const [summaryCards, setSummaryCards] = useState([]);
  const [dateRange, setDateRange] = useState([
    dayjs().startOf("week"),
    dayjs().endOf("week"),
  ]);

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getProgressReport(
        dateRange[0].format("YYYY-MM-DD"),
        dateRange[1].format("YYYY-MM-DD")
      );
      const summary = await getProgressReportSummary(
        dateRange[0].format("YYYY-MM-DD"),
        dateRange[1].format("YYYY-MM-DD")
      );

      setProgressData(data);
      setSummaryCards(summary);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Progress Report</h1>
        <PDFExportButton
          summaryCards={summaryCards}
          progressData={progressData}
        />
      </div>

      <RangePicker
        value={dateRange}
        onChange={setDateRange}
        className="mb-4"
      />

      {loading ? (
        <Spin size="large" />
      ) : (
        <ProjectProgressTable data={progressData} />
      )}
    </div>
  );
};

export default ProgressReportDashboard;
