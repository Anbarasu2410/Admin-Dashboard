// controllers/employeeQualificationController.js
import EmployeeQualification from "../models/EmployeeQualificationsModel.js";

export const createEmployeeQualification = async (req, res) => {
  try {
    const { employeeId, name, type, institution, country, year } = req.body;

    const qualification = await EmployeeQualification.create({
      employeeId,
      name,
      type,
      institution,
      country,
      year,
      filePath: req.file ? req.file.path : null
    });

    res.status(201).json({
      message: "Qualification added successfully",
      qualification
    });
  } catch (error) {
    res.status(500).json({ message: "Error creating qualification", error });
  }
};

export const getEmployeeQualifications = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const qualifications = await EmployeeQualification.find({ employeeId });

    res.status(200).json(qualifications);
  } catch (error) {
    res.status(500).json({ message: "Error fetching qualifications", error });
  }
};

export const updateEmployeeQualification = async (req, res) => {
  try {
    const { id } = req.params;

    const updateData = { ...req.body };

    if (req.file) updateData.filePath = req.file.path;

    const updated = await EmployeeQualification.findByIdAndUpdate(id, updateData, {
      new: true
    });

    res.status(200).json({
      message: "Qualification updated successfully",
      qualification: updated
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating qualification", error });
  }
};

export const deleteEmployeeQualification = async (req, res) => {
  try {
    const { id } = req.params;

    await EmployeeQualification.findByIdAndDelete(id);

    res.status(200).json({ message: "Qualification deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting qualification", error });
  }
};
