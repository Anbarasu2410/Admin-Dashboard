import { useEffect, useState } from "react";
import {
  Card,
  Select,
  Table,
  Tag,
  Statistic,
  Row,
  Col,
  Spin,
  DatePicker,
  message
} from "antd";
import dayjs from "dayjs";
import axios from "axios";

/* ===============================
   AXIOS INSTANCE (INLINE)
================================ */
const api = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`
  }
});

export default function DailyManpowerStatus() {
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState();
  const [date, setDate] = useState(dayjs());
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  /* ---------------- Fetch Projects ---------------- */
  useEffect(() => {
    api.get("/projects")
      .then(res => setProjects(res.data))
      .catch(() => message.error("Failed to load projects"));
  }, []);

  /* ---------------- Fetch Manpower Status ---------------- */
  useEffect(() => {
    fetchStatus();
  }, [date, projectId]);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/manpower-status", {
        params: {
          date: date.format("YYYY-MM-DD"),
          projectId
        }
      });
      setData(res.data);
    } catch (err) {
      console.error(err);
      message.error("Failed to load manpower status");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- Table Columns ---------------- */
  const columns = [
    { title: "Emp Code", dataIndex: "employeeCode" },
    { title: "Name", dataIndex: "name" },
    { title: "Trade", dataIndex: "trade" },
    {
      title: "Status",
      dataIndex: "status",
      render: status => {
        const colors = {
          PRESENT: "green",
          ABSENT: "red",
          ASSIGNED: "gold",
          NOT_CHECKED_IN: "orange"
        };
        return (
          <Tag color={colors[status]}>
            {status.replaceAll("_", " ")}
          </Tag>
        );
      }
    }
  ];

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Daily Manpower Status</h1>
        <div className="flex gap-2">
          <DatePicker value={date} onChange={setDate} />
          <Select
            allowClear
            placeholder="All Projects"
            className="w-48"
            onChange={setProjectId}
          >
            {projects.map(p => (
              <Select.Option key={p.id} value={p.id}>
                {p.projectName}
              </Select.Option>
            ))}
          </Select>
        </div>
      </div>

      {/* Summary */}
      {data?.summary && (
        <Row gutter={16}>
          <Col span={6}>
            <Card><Statistic title="Assigned" value={data.summary.assigned} /></Card>
          </Col>
          <Col span={6}>
            <Card><Statistic title="Present" value={data.summary.present} /></Card>
          </Col>
          <Col span={6}>
            <Card><Statistic title="Absent" value={data.summary.absent} /></Card>
          </Col>
          <Col span={6}>
            <Card><Statistic title="Not Checked In" value={data.summary.notCheckedIn} /></Card>
          </Col>
        </Row>
      )}

      {/* Project Wise Tables */}
      <Spin spinning={loading}>
        {data?.projects?.map(project => (
          <Card
            key={project.projectId}
            className="mt-4"
            title={`${project.projectName} | Supervisor: ${project.supervisorName}`}

          >
            <Table
              columns={columns}
              dataSource={project.workers}
              rowKey="employeeCode"
              pagination={false}
            />
          </Card>
        ))}
      </Spin>
    </div>
  );
}
