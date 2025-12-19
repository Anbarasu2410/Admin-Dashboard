import React from "react";
import { Row, Col, Form, Input, InputNumber, Button, message } from "antd";
import { saveLocation } from "../api/projectApi";

export default function Location({ projectId, formData, setFormData }) {

  const updateField = (key, val) => {
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        [key]: val
      }
    }));
  };

  const submitLocation = async () => {
    if (!projectId) return message.error("Save Basic Info first!");
    await saveLocation(projectId, formData.location);
    message.success("Location saved");
  };

  const location = formData.location || {};

  return (
    <div>
      <Row gutter={16}>
        <Col span={8}>
          <Form layout="vertical">

            <Form.Item label="Latitude">
              <Input
                value={location.latitude !== undefined ? location.latitude : ""}
                onChange={(e) => updateField("latitude", e.target.value)}
                placeholder="Enter latitude"
              />
            </Form.Item>

            <Form.Item label="Longitude">
              <Input
                value={location.longitude !== undefined ? location.longitude : ""}
                onChange={(e) => updateField("longitude", e.target.value)}
                placeholder="Enter longitude"
              />
            </Form.Item>

            <Form.Item label="Geo Radius (meters)">
              <InputNumber
                className="w-full"
                value={location.geofenceRadius !== undefined ? location.geofenceRadius : null}
                onChange={(v) => updateField("geofenceRadius", v)}
                placeholder="Enter geofence radius"
              />
            </Form.Item>

            <Button type="primary" onClick={submitLocation}>
              Save Location
            </Button>

          </Form>
        </Col>

        <Col span={16}>
          <div className="border h-72 rounded bg-gray-100 flex items-center justify-center">
            Map Preview Coming Soon
          </div>
        </Col>
      </Row>
    </div>
  );
}
