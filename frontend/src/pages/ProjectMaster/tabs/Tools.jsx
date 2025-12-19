import React, { useEffect, useState } from "react";
import { Button, Table, Modal, Form, InputNumber, Select, DatePicker, message } from "antd";
import { getTools } from "../api/masterDataApi";
import { saveTools, deleteToolRequirement } from "../api/projectApi";

export default function Tools({ projectId, formData, setFormData }) {
  const [tools, setTools] = useState([]);
  const [open, setOpen] = useState(false);
  const [item, setItem] = useState({});

  useEffect(() => {
    loadTools();
  }, []);

  const loadTools = async () => {
    const res = await getTools();
    setTools(res.data || []);
  };

  const addTool = async () => {
    if (!projectId) return message.error("Save Basic Info first!");

    try {
      // Save tool immediately in backend
      const payload = [{ ...item }];
      const res = await saveTools(projectId, payload);

      // Update local state with saved tool
      setFormData(prev => ({
        ...prev,
        tools: [...(prev.tools || []), { ...item, ...res.data[0], id: Date.now() }]
      }));

      message.success("Tool added successfully");
      setOpen(false);
      setItem({});
    } catch (err) {
      console.error(err);
      message.error("Failed to add tool");
    }
  };

  const removeRow = async (rec) => {
    try {
      if (rec._id) {
        await deleteToolRequirement(projectId, rec._id);
        message.success("Deleted successfully");
      }

      setFormData(prev => ({
        ...prev,
        tools: (prev.tools || []).filter(
          t => (t._id || t.id) !== (rec._id || rec.id)
        )
      }));
    } catch (err) {
      console.error(err);
      message.error("Delete failed");
    }
  };

  const columns = [
    { title: "Tool / Machine", dataIndex: "toolName" },
    { title: "Qty", dataIndex: "qty" },
    { title: "Rental Start", dataIndex: "rentalStart" },
    { title: "Rental End", dataIndex: "rentalEnd" },
    {
      title: "Actions",
      render: (_, rec) => (
        <Button danger onClick={() => removeRow(rec)}>Delete</Button>
      )
    }
  ];

  return (
    <>
      <Button type="dashed" className="mb-4" onClick={() => setOpen(true)}>
        + Add Tool
      </Button>

      <Table
        columns={columns}
        dataSource={formData.tools || []}
        rowKey={rec => rec._id || rec.id}
      />

      <Modal
        title="Add Tool / Machine"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={addTool}
      >
        <Form layout="vertical">
          <Form.Item label="Tool / Machine">
            <Select
              onChange={(v, o) =>
                setItem({ ...item, toolId: v, toolName: o.children })
              }
            >
              {tools.map(t => (
                <Select.Option key={t.id} value={t.id}>
                  {t.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Quantity">
            <InputNumber
              className="w-full"
              onChange={(v) => setItem({ ...item, qty: v })}
            />
          </Form.Item>

          <Form.Item label="Rental Start">
            <DatePicker
              className="w-full"
              onChange={(d) => setItem({ ...item, rentalStart: d })}
            />
          </Form.Item>

          <Form.Item label="Rental End">
            <DatePicker
              className="w-full"
              onChange={(d) => setItem({ ...item, rentalEnd: d })}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
