import React, { useState, useEffect } from "react";
import { Button, Tabs, Card, Row, Col, Space, message } from "antd";

import {  getProject } from './api/projectApi';




import BasicInfo from "./tabs/BasicInfo";
import Location from "./tabs/Location";
import Team from "./tabs/Team";
import Manpower from "./tabs/Manpower";
import Materials from "./tabs/Materials";
import Tools from "./tabs/Tools";
import Documents from "./tabs/Documents";
import Budget from "./tabs/Budget";
import Transport from "./tabs/Transport";
import StatusTimeline from "./tabs/StatusTimeline";

export default function ProjectMaster() {

  const [projectId, setProjectId] = useState(null);
  const [formData, setFormData] = useState({
    basicInfo: {},
    location: {},
    team: [],
    manpower: [],
    materials: [],
    tools: [],
    documents: [],
    budget: {},
    transport: {},
    status: {}
  });

  // Load project if editing
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id");
    if (id) {
      loadProject(id);
    }
  }, []);

 const loadProject = async (id) => {
  try {
    const res = await getProject(id);
    if (res.data?.status === "success") {
      setProjectId(id);
      setFormData(prev => ({
        ...prev,
        ...res.data.data  // merge all tab data
      }));
    } else {
      message.error("Failed to load project");
    }
  } catch (err) {
    console.error("Load project error:", err);
    message.error("Failed to load project");
  }
};


  // const saveProject = async () => {
  //   try {
  //     let res;
  //     if (!projectId) {
  //       res = await createProject(formData.basicInfo);
  //       setProjectId(res.data.projectId);
  //     } else {
  //       await updateProject(projectId, formData.basicInfo);
  //     }
  //     message.success("Project saved!");
  //   } catch (err) {
  //     message.error("Error saving project");
  //   }
  // };

  return (
    <div className="p-4">

      {/* PAGE HEADER */}
      <Row justify="space-between" align="middle" className="mb-4">
        <Col>
          <h2 className="text-xl font-semibold">Project Master Setup</h2>
        </Col>

        {/* <Col>
          <Space>
            <Button onClick={saveProject} type="primary">
              Save Project
            </Button>
          </Space>
        </Col> */}
      </Row>

      {/* MAIN FORM */}
      <Card>
        <Tabs defaultActiveKey="1">

          <Tabs.TabPane tab="Basic Info" key="1">
            <BasicInfo
              formData={formData}
              setFormData={setFormData}
              projectId={projectId}
              setProjectId={setProjectId}
            />
          </Tabs.TabPane>


          <Tabs.TabPane tab="Location" key="2">
            <Location projectId={projectId} formData={formData} setFormData={setFormData} />
          </Tabs.TabPane>

          <Tabs.TabPane tab="Team" key="3">
            <Team projectId={projectId} formData={formData} setFormData={setFormData} />
          </Tabs.TabPane>

          <Tabs.TabPane tab="Manpower" key="4">
            <Manpower projectId={projectId} formData={formData} setFormData={setFormData} />
          </Tabs.TabPane>

          <Tabs.TabPane tab="Materials" key="5">
            <Materials projectId={projectId} formData={formData} setFormData={setFormData} />
          </Tabs.TabPane>

          <Tabs.TabPane tab="Tools & Machinery" key="6">
            <Tools projectId={projectId} formData={formData} setFormData={setFormData} />
          </Tabs.TabPane>

          <Tabs.TabPane tab="Documents" key="7">
            <Documents projectId={projectId} formData={formData} setFormData={setFormData} />
          </Tabs.TabPane>

          <Tabs.TabPane tab="Budget" key="8">
            <Budget projectId={projectId} formData={formData} setFormData={setFormData} />
          </Tabs.TabPane>

          <Tabs.TabPane tab="Transport" key="9">
            <Transport projectId={projectId} formData={formData} setFormData={setFormData} />
          </Tabs.TabPane>

          <Tabs.TabPane tab="Status / Timeline" key="10">
            <StatusTimeline projectId={projectId} formData={formData} setFormData={setFormData} />
          </Tabs.TabPane>

        </Tabs>
      </Card>
    </div>
  );
}
