import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Form, Button, Card, Spin, message } from "antd";
import dayjs from "dayjs";
import BaseFields from "./BaseFields";
import dynamicSections from "./DynamicSections";
import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

const TaskFormPage = () => {
  const { id } = useParams(); // if exists → editing
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [taskType, setTaskType] = useState("WORK");
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(!!id);

  const DynamicSection = dynamicSections[taskType] || dynamicSections["OTHER"];

  // 🟦 1. Fetch existing data if editing
  useEffect(() => {
    if (id) {
      setLoading(true);
      axios
        .get(`${API_BASE_URL}/tasks/${id}`)
        .then((res) => {
          const task = res.data.task;
          setTaskType(task.taskType);
          form.setFieldsValue({
            projectId: task.projectId,
            taskName: task.taskName,
            taskType: task.taskType,
            description: task.description,
            dateRange: [dayjs(task.startDate), dayjs(task.endDate)],
            notes: task.notes,
            additionalData: task.additionalData || {},
          });
        })
        .catch((err) => message.error(err.response?.data?.error || "Failed to load task"))
        .finally(() => setLoading(false));
    }
  }, [id, form]);

  // 🟩 2. Handle Submit
  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      
      const taskData = {
        ...values,
        taskType,
        startDate: values.dateRange?.[0]?.format("YYYY-MM-DD"),
        endDate: values.dateRange?.[1]?.format("YYYY-MM-DD"),
        status: "PLANNED",
        companyId: 1,
        additionalData: values.additionalData || {}
      };

      console.log("Submitting task data:", taskData);

      if (isEditing) {
        await axios.put(`${API_BASE_URL}/tasks/${id}`, taskData);
        message.success("Task updated successfully!");
      } else {
        await axios.post(`${API_BASE_URL}/tasks`, taskData);
        message.success("Task created successfully!");
      }

      navigate("/tasks"); // redirect back to list
    } catch (error) {
      console.error("Error saving task:", error);
      const errorMessage = error.response?.data?.message || `Failed to ${isEditing ? "update" : "create"} task`;
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <Card
        title={isEditing ? "Edit Task" : "Create New Task"}
        className="max-w-3xl mx-auto shadow-md"
      >
        <Spin spinning={loading}>
          <Form
            layout="vertical"
            form={form}
            onFinish={handleSubmit}
            initialValues={{
              taskType: "WORK",
            }}
          >
            {/* 🔹 Base Fields (common to all) */}
            <BaseFields onTaskTypeChange={setTaskType} isEditing={isEditing} />

            {/* 🔹 Dynamic Section */}
            <div className="mt-6 border-t pt-4">
              <DynamicSection form={form} />
            </div>

            {/* 🔹 Action Buttons */}
            <div className="flex justify-end mt-6 space-x-3">
              <Button onClick={() => navigate("/tasks")} disabled={loading}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {isEditing ? "Update Task" : "Create Task"}
              </Button>
            </div>
          </Form>
        </Spin>
      </Card>
    </div>
  );
};

export default TaskFormPage;