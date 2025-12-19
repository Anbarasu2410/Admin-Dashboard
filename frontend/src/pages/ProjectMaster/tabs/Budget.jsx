
import React from "react";
import { Row, Col, Form, InputNumber, Button, message, Card } from "antd";
import { saveBudget } from "../api/projectApi";


export default function Budget({ projectId, formData, setFormData }) {
  const budget = formData.budget || {};

  const updateField = (key, value) => {
    setFormData(prev => ({
      ...prev,
      budget: {
        ...prev.budget,
        [key]: value
      }
    }));
  };

  const saveData = async () => {
    if (!projectId) return message.error("Save Basic Info first!");
    await saveBudget(projectId, formData.budget || {});
    message.success("Budget saved");
  };

  return (
    <Card>
      <Form layout="vertical">
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="Labor Budget">
              <InputNumber
                className="w-full"
                value={budget.labor}
                onChange={(v) => updateField("labor", v)}
              />
            </Form.Item>

            <Form.Item label="Material Budget">
              <InputNumber
                className="w-full"
                value={budget.material}
                onChange={(v) => updateField("material", v)}
              />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item label="Tools Budget">
              <InputNumber
                className="w-full"
                value={budget.tools}
                onChange={(v) => updateField("tools", v)}
              />
            </Form.Item>

            <Form.Item label="Transport Budget">
              <InputNumber
                className="w-full"
                value={budget.transport}
                onChange={(v) => updateField("transport", v)}
              />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item label="Warranty Budget">
              <InputNumber
                className="w-full"
                value={budget.warranty}
                onChange={(v) => updateField("warranty", v)}
              />
            </Form.Item>

            <Form.Item label="Certification Budget">
              <InputNumber
                className="w-full"
                value={budget.certification}
                onChange={(v) => updateField("certification", v)}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row justify="end">
          <Button type="primary" onClick={saveData}>
            Save Budget
          </Button>
        </Row>
      </Form>
    </Card>
  );
}