import React, { useEffect, useState } from "react";
import { Table, Button, Space } from "antd";
import { listProjects } from "./api/projectApi";
import { useNavigate } from "react-router-dom";

export default function ProjectList() {
  const [projects, setProjects] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const res = await listProjects();
      const projectArray = Array.isArray(res.data) ? res.data : res.data.projects || [];

      const formattedProjects = projectArray.map((project) => ({
        id: project._id,
        projectName: project.projectName,
        projectCode: project.projectCode,
      }));

      setProjects(formattedProjects);
    } catch (error) {
      console.error("Failed to load projects:", error);
    }
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "projectName",
      key: "name",
      align: "left",
      width: 1,           // Use flex ratio
      ellipsis: true,     // Prevent long names from stretching column
    },
    {
      title: "Project Code",
      dataIndex: "projectCode",
      key: "code",
      align: "left",
      width: 1,           // Same flex ratio as Name
      ellipsis: true,
    },
    {
      title: "Actions",
      key: "actions",
      align: "center",
      width: 150,         // Fixed width for action buttons
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="primary"
            onClick={() => navigate(`/project-master?id=${record.id}`)}
          >
            Edit
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto", width: "100%" }}>
      {/* Header Row */}
      <div style={{ display: "flex", marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 24, fontWeight: 600, margin: 0 }}>Project List</h2>
        </div>
        {/* <div style={{ flex: 1, textAlign: "center" }}>
          <span style={{ fontWeight: 600 }}>Code</span>
        </div> */}
        <div style={{ width: 150, textAlign: "center" }}>
          <Button type="primary" onClick={() => navigate("/project-master?mode=create")}>
            Add Project
          </Button>
        </div>
      </div>

      {/* Table */}
      <Table
        dataSource={projects}
        columns={columns}
        rowKey="id"
        bordered
        pagination={{ pageSize: 10 }}
        scroll={{ x: "max-content" }}
      />
    </div>
  );
}
