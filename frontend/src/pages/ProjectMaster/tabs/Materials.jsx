import React, { useState, useEffect } from "react";
import { Button, Table, Modal, Form, InputNumber, Select, DatePicker, message } from "antd";
import { saveMaterials, deleteMaterialRequirement } from "../api/projectApi";
import { getMaterials } from "../api/masterDataApi";

export default function Materials({ projectId, formData, setFormData }) {
  const [materials, setMaterials] = useState([]);
  const [open, setOpen] = useState(false);
  const [item, setItem] = useState({});

  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    const res = await getMaterials();
    setMaterials(res.data || []);
  };

  const addMaterial = async () => {
    if (!projectId) return message.error("Save Basic Info first!");

    try {
      const payload = [{ ...item }]; // send single material as array
      const res = await saveMaterials(projectId, payload);

      setFormData(prev => ({
        ...prev,
        materials: [...(prev.materials || []), { ...item, ...res.data[0], id: Date.now() }]
      }));

      message.success("Material added successfully");
      setOpen(false);
      setItem({});
    } catch (err) {
      console.error(err);
      message.error("Failed to add material");
    }
  };

  const removeRow = async (rec) => {
    try {
      if (rec._id) await deleteMaterialRequirement(projectId, rec._id);

      setFormData(prev => ({
        ...prev,
        materials: (prev.materials || []).filter(
          m => (m._id || m.id) !== (rec._id || rec.id)
        )
      }));

      message.success("Material deleted");
    } catch (err) {
      console.error(err);
      message.error("Delete failed");
    }
  };

  const columns = [
    { title: "Material", dataIndex: "materialName" },
    { title: "Unit", dataIndex: "unit" },
    { title: "Quantity", dataIndex: "qty" },
    { title: "Required By", dataIndex: "date" },
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
        + Add Material
      </Button>

      <Table
        columns={columns}
        dataSource={formData.materials || []}
        rowKey={rec => rec._id || rec.id}
      />

      <Modal
        title="Add Material"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={addMaterial}
      >
        <Form layout="vertical">
          <Form.Item label="Material">
            <Select
              onChange={(v, o) =>
                setItem({ ...item, materialId: v, materialName: o.children })
              }
            >
              {materials.map(m => (
                <Select.Option key={m.id} value={m.id}>{m.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Unit">
            <Select onChange={(v) => setItem({ ...item, unit: v })}>
              <Select.Option value="kg">KG</Select.Option>
              <Select.Option value="ltr">Litre</Select.Option>
              <Select.Option value="pcs">Pieces</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="Estimated Qty">
            <InputNumber
              className="w-full"
              onChange={(v) => setItem({ ...item, qty: v })}
            />
          </Form.Item>

          <Form.Item label="Required By">
            <DatePicker
              className="w-full"
              onChange={(d) => setItem({ ...item, date: d })}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
