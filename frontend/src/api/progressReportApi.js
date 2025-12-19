import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

export const getProgressReport = async (startDate, endDate) => {
  const res = await api.get("/progress-report", {
    params: { startDate, endDate },
  });
  return res.data;
};

export const getProgressReportSummary = async (startDate, endDate) => {
  const res = await api.get("/progress-report/summary", {
    params: { startDate, endDate },
  });
  return res.data;
};
