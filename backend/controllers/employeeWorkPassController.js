// controllers/employeeWorkPassController.js
import EmployeeWorkPass from "../models/EmployeeWorkPassModel.js";

export const createEmployeeWorkPass = async (req, res) => {
  try {
    const {
      employeeId,
      status,
      workPermitNo,
      finNumber,
      applicationDate,
      issuanceDate,
      expiryDate,
      medicalDate,
      createdBy
    } = req.body;

    const workPass = await EmployeeWorkPass.create({
      employeeId,
      status,
      workPermitNo,
      finNumber,
      applicationDate,
      issuanceDate,
      expiryDate,
      medicalDate,
      createdBy,
      applicationDoc: req.file ? req.file.path : null
      // You can add other files here if you extend upload.fields
      // medicalDoc, issuanceDoc, momDoc
    });

    res.status(201).json({
      message: "Employee work pass created successfully",
      workPass
    });
  } catch (error) {
    res.status(500).json({ message: "Error creating work pass", error });
  }
};

export const getEmployeeWorkPasses = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const workPasses = await EmployeeWorkPass.find({ employeeId });

    res.status(200).json(workPasses);
  } catch (error) {
    res.status(500).json({ message: "Error fetching work passes", error });
  }
};

export const updateEmployeeWorkPass = async (req, res) => {
  try {
    const { id } = req.params;

    const updateData = { ...req.body };

    if (req.file) updateData.applicationDoc = req.file.path;
    // If you have other files, add them here similarly

    const updated = await EmployeeWorkPass.findByIdAndUpdate(id, updateData, {
      new: true
    });

    res.status(200).json({
      message: "Employee work pass updated successfully",
      workPass: updated
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating work pass", error });
  }
};

export const deleteEmployeeWorkPass = async (req, res) => {
  try {
    const { id } = req.params;

    await EmployeeWorkPass.findByIdAndDelete(id);

    res.status(200).json({ message: "Employee work pass deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting work pass", error });
  }
};
