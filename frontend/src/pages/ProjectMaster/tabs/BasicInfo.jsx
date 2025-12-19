
import React, { useState, useEffect } from "react";
import { Row, Col, Form, Input, Select, Button, message, Table, Popconfirm, Card, Space } from "antd";
import axios from "axios";
import { createProject, updateProject,getProject,listProjects,deleteProject} from "../api/projectApi";

export default function BasicInfo({ formData, setFormData, projectId, setProjectId }) {
  const [clients, setClients] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);

  const API_URL = process.env.REACT_APP_URL;

  useEffect(() => {
    fetchData();
  }, [API_URL]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [companiesRes, clientsRes] = await Promise.all([
        axios.get(`${API_URL}/companies`),
        axios.get(`${API_URL}/master/clients`)
      ]);

      setCompanies(companiesRes.data.data || []);
      setClients(clientsRes.data || []);
    } catch (err) {
      message.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const updateField = (key, value) => {
    setFormData(prev => ({
      ...prev,
      basicInfo: { ...prev.basicInfo, [key]: value }
    }));
  };

  const saveProject = async () => {
    const { projectName, projectCode, companyId, clientId, projectType } = formData.basicInfo;
    if (!projectName || !projectCode || !companyId || !clientId || !projectType) {
      message.error("Please fill all required fields");
      return;
    }

    try {
      if (!projectId) {
        const res = await createProject(formData.basicInfo);
        if (!res.data?.projectId) return message.error("Create API returned invalid data");
        setProjectId(res.data.projectId);
        message.success("Project created successfully!");
      } else {
        await updateProject(projectId, formData.basicInfo);
        message.success("Project updated successfully!");
      }
    } catch (err) {
      message.error("Error saving project");
    }
  };

  const cancelEdit = () => {
    setFormData(prev => ({ ...prev, basicInfo: {} }));
    setProjectId(null);
  };

  return (
    <Card
      title={projectId ? "Edit Project" : "Add New Project"}
      bordered={false}
      style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
    >
      <Form layout="vertical">
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item label="Project Name" required>
              <Input
                value={formData.basicInfo.projectName || ""}
                onChange={e => updateField("projectName", e.target.value)}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item label="Project Code" required>
              <Input
                value={formData.basicInfo.projectCode || ""}
                onChange={e => updateField("projectCode", e.target.value)}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item label="Company" required>
              <Select
                value={formData.basicInfo.companyId}
                onChange={v => updateField("companyId", v)}
                placeholder="Select company"
              >
                {companies.map(c => (
                  <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item label="Client" required>
              <Select
                value={formData.basicInfo.clientId}
                onChange={v => updateField("clientId", v)}
                placeholder="Select client"
              >
                {clients.map(c => (
                  <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item label="Project Type" required>
              <Select
                value={formData.basicInfo.projectType}
                onChange={v => updateField("projectType", v)}
                placeholder="Select project type"
              >
                <Select.Option value="plumbing">Plumbing</Select.Option>
                <Select.Option value="painting">Painting</Select.Option>
                <Select.Option value="cleaning">Cleaning</Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <div style={{ textAlign: "right", marginTop: 24 }}>
          <Space>
            <Button type="primary" onClick={saveProject}>
              {projectId ? "Update Project" : "Save Project"}
            </Button>
            <Button onClick={cancelEdit}>Cancel</Button>
          </Space>
        </div>
      </Form>
    </Card>
  );
}

