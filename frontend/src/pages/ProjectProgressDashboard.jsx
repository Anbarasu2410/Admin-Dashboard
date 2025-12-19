import { useEffect, useState } from "react";
import { Card, Table, Row, Col, Select, DatePicker, Progress, Spin, message } from "antd";
import dayjs from "dayjs";
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
});

export default function ProjectProgressDashboard() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [viewDate, setViewDate] = useState(dayjs());
  const [loading, setLoading] = useState(false);
  const [progressData, setProgressData] = useState([]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await api.get("/projects");
        setProjects(res.data);
      } catch (err) {
        console.error(err);
        message.error("Failed to fetch projects");
      }
    };
    fetchProjects();
  }, []);

  useEffect(() => {
    const fetchProgress = async () => {
      setLoading(true);
      try {
        const res = await api.get("/admin/progress-dashboard", {
          params: {
            projectId: selectedProject,
            date: viewDate.format("YYYY-MM-DD")
          }
        });
        setProgressData(res.data.projects || []);
      } catch (err) {
        console.error(err);
        message.error("Failed to fetch progress data");
      } finally {
        setLoading(false);
      }
    };
    fetchProgress();
  }, [selectedProject, viewDate]);

  const columns = [
    { title: "Task Name", dataIndex: "taskName", key: "taskName" },
    { title: "Assigned To", dataIndex: "assignedTo", key: "assignedTo" },
    {
      title: "Progress",
      dataIndex: "progress",
      key: "progress",
      render: progress => <Progress percent={progress} size="small" />
    }
  ];

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between gap-2 items-start md:items-center">
        <h1 className="text-xl font-semibold">Project Progress Dashboard</h1>
        <div className="flex gap-2 flex-col sm:flex-row w-full sm:w-auto">
          <DatePicker value={viewDate} onChange={setViewDate} className="w-full sm:w-48" />
          <Select
            allowClear
            placeholder="Select Project"
            className="w-full sm:w-48"
            onChange={setSelectedProject}
          >
            {projects.map(p => (
              <Select.Option key={p.id} value={p.id}>
                {p.projectName}
              </Select.Option>
            ))}
          </Select>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center my-10">
          <Spin size="large" />
        </div>
      )}

      {/* Project Cards */}
      <Row gutter={[16, 16]}>
        {!loading && progressData.map(project => (
          <Col xs={24} md={12} lg={8} key={project.projectId}>
            <Card title={project.projectName} extra={<span>Overall: {project.overallProgress}%</span>} className="shadow-sm">
              <p className="text-sm text-gray-600 mb-2">Issues: {project.issues || "None"}</p>
              <Table
                columns={columns}
                dataSource={project.dailyTasks}
                rowKey="taskName"
                pagination={false}
                size="small"
              />
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}
