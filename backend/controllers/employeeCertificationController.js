// controllers/employeeCertificationController.js
import EmployeeCertification from "../models/EmployeeCertificationsModel.js";

export const createEmployeeCertification = async (req, res) => {
  try {
    const { employeeId, name, type, ownership, issueDate, expiryDate } = req.body;

    const certification = await EmployeeCertification.create({
      employeeId,
      name,
      type,
      ownership,
      issueDate,
      expiryDate,
      filePath: req.file ? req.file.path : null
    });

    res.status(201).json({
      message: "Certification added successfully",
      certification,
    });
  } catch (error) {
    res.status(500).json({ message: "Error creating certification", error });
  }
};

export const getEmployeeCertifications = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const certifications = await EmployeeCertification.find({ employeeId });

    res.status(200).json(certifications);
  } catch (error) {
    res.status(500).json({ message: "Error fetching certifications", error });
  }
};

export const updateEmployeeCertification = async (req, res) => {
  try {
    const { id } = req.params;

    const updateData = { ...req.body };

    if (req.file) updateData.filePath = req.file.path;

    const updated = await EmployeeCertification.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    res.status(200).json({
      message: "Certification updated successfully",
      certification: updated,
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating certification", error });
  }
};

export const deleteEmployeeCertification = async (req, res) => {
  try {
    const { id } = req.params;

    await EmployeeCertification.findByIdAndDelete(id);

    res.status(200).json({ message: "Certification deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting certification", error });
  }
};
