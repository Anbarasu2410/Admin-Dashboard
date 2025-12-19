import React, { useState, useEffect } from "react";
import { Button, Table, Form, Modal, InputNumber, Input, message } from "antd";
import {
  saveManpower,
  updateManpowerRequirement,
  listManpowerRequirements,
  deleteManpowerRequirement
} from "../api/projectApi";

export default function Manpower({ projectId, formData, setFormData }) {
  const [open, setOpen] = useState(false);
  const [manpowerItem, setManpowerItem] = useState({});
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch existing manpower from backend
  const fetchManpower = async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const res = await listManpowerRequirements(projectId);
      const data = Array.isArray(res.data) ? res.data : [];
      setFormData(prev => ({ ...prev, manpower: data }));
    } catch (err) {
      console.error(err);
      message.error("Failed to load manpower");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManpower();
  }, [projectId]);

  // Add or update manpower directly to backend
  const addOrUpdateManpower = async () => {
    if (!manpowerItem.tradeName) {
      return message.error("Trade name is required");
    }

    try {
      setLoading(true);

      if (editId) {
        // Update backend immediately
        const res = await updateManpowerRequirement(projectId, editId, {
          tradeName: manpowerItem.tradeName,
          requiredWorkers: manpowerItem.required,
          bufferWorkers: manpowerItem.buffer || 0
        });

        setFormData(prev => ({
          ...prev,
          manpower: prev.manpower.map(item =>
            item._id === editId ? res.data : item
          )
        }));

        message.success("Manpower updated successfully");
      } else {
        // Save new item directly to backend
        const res = await saveManpower(projectId, [{
          tradeName: manpowerItem.tradeName,
          requiredWorkers: manpowerItem.required,
          bufferWorkers: manpowerItem.buffer || 0
        }]);

        // Refresh from backend to get proper IDs
        await fetchManpower();

        message.success("Manpower added successfully");
      }

      setOpen(false);
      setEditId(null);
      setManpowerItem({});
    } catch (err) {
      console.error(err);
      message.error(editId ? "Failed to update manpower" : "Failed to add manpower");
    } finally {
      setLoading(false);
    }
  };

  // Edit row
  const editRow = (row) => {
    setManpowerItem({
      tradeName: row.tradeName,
      required: row.requiredWorkers,
      buffer: row.bufferWorkers,
      _id: row._id
    });
    setEditId(row._id);
    setOpen(true);
  };

  // Delete row
  const removeRow = async (row) => {
    try {
      await deleteManpowerRequirement(projectId, row._id);
      setFormData(prev => ({
        ...prev,
        manpower: prev.manpower.filter(item => item._id !== row._id)
      }));
      message.success("Manpower deleted successfully");
    } catch (err) {
      console.error(err);
      message.error("Failed to delete manpower");
    }
  };

  const columns = [
    { title: "Trade", dataIndex: "tradeName" },
    { 
      title: "Required", 
      dataIndex: "requiredWorkers",
      render: (value, record) => value || record.required || 0
    },
    { 
      title: "Buffer", 
      dataIndex: "bufferWorkers",
      render: (value, record) => value || record.buffer || 0
    },
    {
      title: "Actions",
      render: (_, rec) => (
        <>
          <Button type="link" onClick={() => editRow(rec)}>Edit</Button>
          <Button type="link" danger onClick={() => removeRow(rec)}>Delete</Button>
        </>
      )
    }
  ];

  return (
    <>
      <Button type="dashed" className="mb-4" onClick={() => setOpen(true)}>
        + Add Trade Requirement
      </Button>

      <Table
        dataSource={Array.isArray(formData.manpower) ? formData.manpower : []}
        columns={columns}
        rowKey={record => record._id}
        loading={loading}
      />

      <Modal
        title={editId ? "Edit Manpower Requirement" : "Add Manpower Requirement"}
        open={open}
        onCancel={() => { setOpen(false); setEditId(null); setManpowerItem({}); }}
        onOk={addOrUpdateManpower}
        okText={editId ? "Update" : "Add"}
      >
        <Form layout="vertical">
          <Form.Item label="Trade">
            <Input
              placeholder="Enter trade name"
              value={manpowerItem.tradeName || ""}
              onChange={e => setManpowerItem({ ...manpowerItem, tradeName: e.target.value })}
            />
          </Form.Item>

          <Form.Item label="Required Workers">
            <InputNumber
              className="w-full"
              value={manpowerItem.required}
              onChange={v => setManpowerItem({ ...manpowerItem, required: v })}
              min={0}
            />
          </Form.Item>

          <Form.Item label="Buffer">
            <InputNumber
              className="w-full"
              value={manpowerItem.buffer}
              onChange={v => setManpowerItem({ ...manpowerItem, buffer: v })}
              min={0}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
