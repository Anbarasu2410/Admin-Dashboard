
import { Row, Col, Form, Input, InputNumber, Select, Switch, TimePicker, Button, message, Card } from "antd";
import { saveTransport } from "../api/projectApi";
import React, { useState, useEffect } from "react";
import axios from "axios";
import moment from "moment";
import dayjs from "dayjs";



export default function Transport({ projectId, formData, setFormData }) {
    const [drivers, setDrivers] = useState([]);
    const [loadingDrivers, setLoadingDrivers] = useState(false);

    useEffect(() => {
  const fetchDrivers = async () => {
    try {
      const API_URL = process.env.REACT_APP_URL;
      const res = await axios.get(`${API_URL}/drivers`);
      setDrivers(res.data.data); 
    } catch (err) {
      console.error("Failed to fetch drivers:", err);
    }
  };
  fetchDrivers();
}, []);

  const transport = formData.transport || {};

  const updateField = (key, value) => {
    setFormData(prev => ({
      ...prev,
      transport: {
        ...prev.transport,
        [key]: value
      }
    }));
  };

 const saveData = async () => {
  if (!projectId) return message.error("Save Basic Info first!");

  await saveTransport(projectId, {
    transportRequired: formData.transport?.required,
    dailyWorkers: formData.transport?.dailyWorkers,
    pickupLocation: formData.transport?.pickupLocation,
    driverId: formData.transport?.driverId,
    pickupTime: formData.transport?.pickupTime,
    dropTime: formData.transport?.dropTime
  });

  message.success("Transport details saved");
};


  return (
    <Card>
      <Form layout="vertical">
        <Form.Item label="Transport Required">
          <Switch
           checked={!!formData.transport?.required}
            onChange={(v) => updateField("required", v)}
          />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Daily Workers">
              <InputNumber
                className="w-full"
                value={transport.dailyWorkers}
                onChange={(v) => updateField("dailyWorkers", v)}
              />
            </Form.Item>

            <Form.Item label="Pickup Location">
              <Input
                value={transport.pickupLocation}
                onChange={(e) => updateField("pickupLocation", e.target.value)}
              />
            </Form.Item>
          </Col>

          <Col span={12}>
           <Form.Item label="Driver">
  <Select
    value={transport.driverId}
    onChange={(v) => updateField("driverId", v)}
    placeholder="Select a driver"
    loading={loadingDrivers}
  >
   {drivers.map(driver => (
  <Select.Option key={driver.id} value={driver.id}>
    {driver.employeeName}
  </Select.Option>
))}

  </Select>
</Form.Item>


           <Form.Item label="Pickup Time">
  <TimePicker
    className="w-full"
    value={transport.pickupTime ? dayjs(transport.pickupTime) : null}
    onChange={(time) =>
      updateField("pickupTime", time ? time.toISOString() : null)
    }
  />
</Form.Item>

<Form.Item label="Drop Time">
  <TimePicker
    className="w-full"
    value={transport.dropTime ? dayjs(transport.dropTime) : null}
    onChange={(time) =>
      updateField("dropTime", time ? time.toISOString() : null)
    }
  />
</Form.Item>
          </Col>
        </Row>

        <Row justify="end">
          <Button type="primary" onClick={saveData}>
            Save Transport
          </Button>
        </Row>
      </Form>
    </Card>
  );
}