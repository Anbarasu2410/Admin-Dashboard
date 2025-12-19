// controllers/employeeDocumentController.js
import EmployeeDocument from "../models/EmployeeDocumentsModel.js";

export const createEmployeeDocument = async (req, res) => {
  try {
    const { employeeId, documentType, version, uploadedBy } = req.body;

    const document = await EmployeeDocument.create({
      employeeId,
      documentType,
      version,
      uploadedBy,
      filePath: req.file ? req.file.path : null
    });

    res.status(201).json({
      message: "Employee document added successfully",
      document
    });
  } catch (error) {
    res.status(500).json({ message: "Error creating document", error });
  }
};

export const getEmployeeDocuments = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const documents = await EmployeeDocument.find({ employeeId });

    res.status(200).json(documents);
  } catch (error) {
    res.status(500).json({ message: "Error fetching employee documents", error });
  }
};

export const updateEmployeeDocument = async (req, res) => {
  try {
    const { id } = req.params;

    const updateData = { ...req.body };

    if (req.file) updateData.filePath = req.file.path;

    const updated = await EmployeeDocument.findByIdAndUpdate(id, updateData, {
      new: true
    });

    res.status(200).json({
      message: "Employee document updated successfully",
      document: updated
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating document", error });
  }
};

export const deleteEmployeeDocument = async (req, res) => {
  try {
    const { id } = req.params;

    await EmployeeDocument.findByIdAndDelete(id);

    res.status(200).json({ message: "Employee document deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting document", error });
  }
};
