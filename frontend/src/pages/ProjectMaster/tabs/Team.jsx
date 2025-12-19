import React, { useEffect, useState } from "react";
import { Form, Select, Button, message } from "antd";
import { saveTeam } from "../api/projectApi";
import { getUsersByRole } from "../api/masterDataApi";

export default function Team({ projectId, formData, setFormData }) {
    const [managers, setManagers] = useState([]);
    const [supervisors, setSupervisors] = useState([]);
    const [engineers, setEngineers] = useState([]);
    const [safety, setSafety] = useState([]);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        const managerRes = await getUsersByRole("manager");
        setManagers(managerRes.data.data || []);

        const supervisorRes = await getUsersByRole("supervisor");
        setSupervisors(supervisorRes.data.data || []);

        const engineerRes = await getUsersByRole("engineer");
        setEngineers(engineerRes.data.data || []);

        const safetyRes = await getUsersByRole("safety");
        setSafety(safetyRes.data.data || []);

    };

    const updateField = (key, val) => {
        setFormData(prev => ({
            ...prev,
            team: {
                ...prev.team,
                [key]: val
            }
        }));
    };

    const saveTeamData = async () => {
        if (!projectId) return message.error("Save Basic Info first!");

        await saveTeam(projectId, formData.team);
        message.success("Team updated");
    };

    return (
        <Form layout="vertical">

           <Form.Item label="Project Manager">
  <Select
    showSearch
    placeholder="Select Manager"
    value={managers.length ? formData.team.manager : undefined} // Only bind after options load
    onChange={(v) => updateField("manager", v)}
    loading={!managers.length}
  >
    {managers.map(u => (
      <Select.Option key={u.userId} value={u.userId}>
        {u.fullName}
      </Select.Option>
    ))}
  </Select>
</Form.Item>


         <Form.Item label="Supervisors">
  <Select
    mode="multiple"
    showSearch
    value={supervisors.length ? formData.team.supervisors || [] : []} // Only bind after options load
    onChange={(v) => updateField("supervisors", v)}
    loading={!supervisors.length}
  >
    {supervisors.map(u => (
      <Select.Option key={u.userId} value={u.userId}>
        {u.fullName}
      </Select.Option>
    ))}
  </Select>
</Form.Item>


      <Form.Item label="Engineers">
  <Select
    mode="multiple"
    value={engineers.length ? formData.team.engineers || [] : []} // only bind after options load
    onChange={(v) => updateField("engineers", v)}
    loading={!engineers.length}
  >
    {engineers.map(u => (
      <Select.Option key={u.userId} value={u.userId}>
        {u.fullName}
      </Select.Option>
    ))}
  </Select>
</Form.Item>

<Form.Item label="Safety Officer">
  <Select
    value={safety.length ? formData.team.safety || undefined : undefined} // only bind after options load
    onChange={(v) => updateField("safety", v)}
    loading={!safety.length}
  >
    {safety.map(u => (
      <Select.Option key={u.userId} value={u.userId}>
        {u.fullName}
      </Select.Option>
    ))}
  </Select>
</Form.Item>




            <Button type="primary" onClick={saveTeamData}>
                Save Team
            </Button>

        </Form>
    );
}
