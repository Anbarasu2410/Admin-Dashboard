import React from "react";
import { Form, Input, Select, DatePicker, Row, Col } from "antd";

const TASK_TYPES = [
  "WORK",
  "TRANSPORT", 
  "MATERIAL",
  "TOOL",
  "INSPECTION",
  "MAINTENANCE",
  "ADMIN",
  "TRAINING",
  "OTHER",
];

const BaseFields = ({ onTaskTypeChange, isEditing }) => {
  return (
    <Row gutter={16}>
      {/* Task Type - Left Side */}
      <Col xs={24} md={12}>
        <Form.Item 
          label="Task Type" 
          name="taskType" 
          rules={[{ required: true, message: "Please select task type" }]}
        >
          <Select 
            onChange={onTaskTypeChange} 
            disabled={isEditing}
            size="large"
            placeholder="Select task type"
          >
            {TASK_TYPES.map((type) => (
              <Select.Option key={type} value={type}>
                {type}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      </Col>

      {/* Task Name - Right Side */}
      <Col xs={24} md={12}>
        <Form.Item
          label="Task Name"
          name="taskName"
          rules={[{ required: true, message: "Please enter a task name" }]}
        >
          <Input 
            placeholder="Enter task name" 
            size="large"
          />
        </Form.Item>
      </Col>

      {/* Start Date - Left Side */}
      <Col xs={24} md={12}>
        <Form.Item 
          label="Start Date" 
          name="startDate" 
          rules={[{ required: true, message: "Please select start date" }]}
        >
          <DatePicker 
            format="YYYY-MM-DD" 
            style={{ width: '100%' }} 
            size="large" 
          />
        </Form.Item>
      </Col>

      {/* End Date - Right Side */}
      <Col xs={24} md={12}>
        <Form.Item 
          label="End Date" 
          name="endDate" 
          rules={[{ required: true, message: "Please select end date" }]}
        >
          <DatePicker 
            format="YYYY-MM-DD" 
            style={{ width: '100%' }} 
            size="large" 
          />
        </Form.Item>
      </Col>
    </Row>
  );
};

export default BaseFields;