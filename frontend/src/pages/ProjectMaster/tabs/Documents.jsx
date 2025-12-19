import React from "react";
import { Upload, Table, Button, message } from "antd";
import { uploadDocument, deleteDocument } from "../api/projectApi";

const { Dragger } = Upload;

export default function Documents({ projectId, formData, setFormData }) {

  const handleUpload = async ({ file, onSuccess, onError }) => {
    if (!projectId) {
      message.error("Save Basic Info first before uploading documents!");
      onError("No projectId");
      return;
    }

    const formDataUpload = new FormData();
    formDataUpload.append("file", file);

    try {
      const res = await uploadDocument(projectId, formDataUpload);
      const docMeta = res.data;

      setFormData(prev => ({
        ...prev,
        documents: [...(prev.documents || []), docMeta]
      }));

      message.success(`${file.name} uploaded successfully`);
      onSuccess("ok");
    } catch (err) {
      console.error(err);
      message.error(`${file.name} upload failed`);
      onError(err);
    }
  };

const handleDelete = async (rec) => {
  try {
    const docId = rec.id || rec._id; // use either id or _id
    if (docId) {
      await deleteDocument(projectId, docId); // call API
      message.success("Document deleted successfully");
    }

    // Remove from UI
    setFormData(prev => ({
      ...prev,
      documents: (prev.documents || []).filter(d => (d.id || d._id) !== docId)
    }));
  } catch (err) {
    console.error(err);
    message.error("Delete failed");
  }
};


  const columns = [
    { title: "File Name", dataIndex: "name" },
    { title: "Type", dataIndex: "type" },
    { title: "Uploaded By", dataIndex: "uploadedBy" },
    { title: "Uploaded At", dataIndex: "uploadedAt" },
    {
      title: "Actions",
      render: (_, rec) => (
        <Button danger size="small" onClick={() => handleDelete(rec)}>
          Delete
        </Button>
      )
    }
  ];

  return (
    <div>
      <Dragger multiple customRequest={handleUpload}>
        <p className="ant-upload-drag-icon">📄</p>
        <p className="ant-upload-text">Click or drag files to upload project documents</p>
      </Dragger>

      <Table
        className="mt-4"
        columns={columns}
        dataSource={formData.documents || []}
        rowKey={rec => rec.id || rec._id} // ensure unique row key
      />
    </div>
  );
}
