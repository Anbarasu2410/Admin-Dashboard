import React, { useState } from "react";
import { Table, Button, Modal, Form, Input, InputNumber } from "antd";

export function CrudTable({ columns, data, onAdd, onUpdate, onDelete }) {
  const [open, setOpen] = useState(false);
  const [item, setItem] = useState({});

  const handleOk = () => {
    if (item.id) onUpdate(item.id, item);
    else onAdd(item);
    setOpen(false);
    setItem({});
  };

  return (
    <>
      <Button type="dashed" className="mb-4" onClick={() => setOpen(true)}>
        + Add Item
      </Button>

      <Table
        columns={[
          ...columns,
          {
            title: "Actions",
            render: (_, rec) => (
              <Button danger onClick={() => onDelete(rec.id)}>Delete</Button>
            ),
          },
        ]}
        dataSource={data}
        rowKey="id"
      />

      <Modal open={open} onCancel={() => setOpen(false)} onOk={handleOk}>
        <Form layout="vertical">
          {columns.map(col => (
            <Form.Item label={col.title} key={col.dataIndex}>
              {col.inputType === "number" ? (
                <InputNumber
                  className="w-full"
                  value={item[col.dataIndex]}
                  onChange={(v) => setItem({...item, [col.dataIndex]: v})}
                />
              ) : (
                <Input
                  value={item[col.dataIndex]}
                  onChange={(e) => setItem({...item, [col.dataIndex]: e.target.value})}
                />
              )}
            </Form.Item>
          ))}
        </Form>
      </Modal>
    </>
  );
}
