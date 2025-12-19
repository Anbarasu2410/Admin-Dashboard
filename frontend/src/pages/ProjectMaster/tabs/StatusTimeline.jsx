import React, { useEffect } from "react";
import { Row, Col, Form, Select, DatePicker, Button, message, Card } from "antd";
import { saveStatus, saveTimeline } from "../api/projectApi";
import moment from "moment";

export default function StatusTimeline({ projectId, formData, setFormData }) {
  const [form] = Form.useForm();
  const status = formData.status || {};

  // Parse date safely
  const parseDate = (d) => {
    if (!d) return null;
    const m = moment(d);
    return m.isValid() ? m : null;
  };

  // Initialize form once when component mounts
  useEffect(() => {
    form.setFieldsValue({
      projectStatus: status.projectStatus || undefined,
      startDate: parseDate(status.startDate),
      expectedEndDate: parseDate(status.expectedEndDate),
      actualCompletion: parseDate(status.actualCompletion),
    });
  }, []); // run only once

  // Update formData when form values change
  const handleFormChange = (_, allValues) => {
    setFormData((prev) => ({
      ...prev,
      status: {
        ...prev.status,
        projectStatus: allValues.projectStatus,
        startDate: allValues.startDate,
        expectedEndDate: allValues.expectedEndDate,
        actualCompletion: allValues.actualCompletion,
      },
    }));
  };

  // Save form data to backend
  const handleSave = async () => {
    if (!projectId) return message.error("Save Basic Info first!");

    try {
      const values = form.getFieldsValue();

      // Save project status
      await saveStatus(projectId, { projectStatus: values.projectStatus });

      // Save timeline
      const timelineData = {
        startDate: values.startDate ? values.startDate.toISOString() : null,
        expectedEndDate: values.expectedEndDate ? values.expectedEndDate.toISOString() : null,
        actualCompletion: values.actualCompletion ? values.actualCompletion.toISOString() : null,
      };

      const response = await saveTimeline(projectId, timelineData);

      // Update formData with backend response
      if (response.data?.data) {
        const updated = response.data.data;

        setFormData((prev) => ({
          ...prev,
          status: {
            projectStatus: updated.projectStatus || values.projectStatus,
            startDate: updated.startDate ? parseDate(updated.startDate) : values.startDate,
            expectedEndDate: updated.expectedEndDate ? parseDate(updated.expectedEndDate) : values.expectedEndDate,
            actualCompletion: updated.actualCompletion || updated.actualEndDate
              ? parseDate(updated.actualCompletion || updated.actualEndDate)
              : values.actualCompletion,
          },
        }));
      }

      message.success("Status & Timeline saved successfully!");
    } catch (err) {
      console.error(err);
      message.error("Failed to save data.");
    }
  };

  return (
    <Card title="Status & Timeline">
      <Form form={form} layout="vertical" onValuesChange={handleFormChange}>
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item label="Project Status" name="projectStatus">
              <Select placeholder="Select project status">
                <Select.Option value="not started">Not Started</Select.Option>
                <Select.Option value="ongoing">Ongoing</Select.Option>
                <Select.Option value="on hold">On Hold</Select.Option>
                <Select.Option value="completed">Completed</Select.Option>
                <Select.Option value="warranty">Warranty</Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="Start Date" name="startDate">
              <DatePicker className="w-full" format="YYYY-MM-DD" />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item label="Expected End Date" name="expectedEndDate">
              <DatePicker className="w-full" format="YYYY-MM-DD" />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item label="Actual Completion" name="actualCompletion">
              <DatePicker className="w-full" format="YYYY-MM-DD" />
            </Form.Item>
          </Col>
        </Row>

        <Row justify="end" className="mt-6">
          <Button type="primary" onClick={handleSave}>
            Save Status & Timeline
          </Button>
        </Row>
      </Form>
    </Card>
  );
}
