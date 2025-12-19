// controllers/employeePassportController.js
import EmployeePassport from "../models/EmployeePassportModel.js";

export const createEmployeePassport = async (req, res) => {
  try {
    const {
      employeeId,
      passportNo,
      issueDate,
      expiryDate,
      issuingCountry,
      createdBy
    } = req.body;

    const passport = await EmployeePassport.create({
      employeeId,
      passportNo,
      issueDate,
      expiryDate,
      issuingCountry,
      createdBy,
      documentPath: req.file ? req.file.path : null
    });

    res.status(201).json({
      message: "Employee passport created successfully",
      passport
    });
  } catch (error) {
    res.status(500).json({ message: "Error creating passport", error });
  }
};

export const getEmployeePassports = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const passports = await EmployeePassport.find({ employeeId });

    res.status(200).json(passports);
  } catch (error) {
    res.status(500).json({ message: "Error fetching passports", error });
  }
};

export const updateEmployeePassport = async (req, res) => {
  try {
    const { id } = req.params;

    const updateData = { ...req.body };

    if (req.file) updateData.documentPath = req.file.path;

    const updated = await EmployeePassport.findByIdAndUpdate(id, updateData, {
      new: true
    });

    res.status(200).json({
      message: "Passport updated successfully",
      passport: updated
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating passport", error });
  }
};

export const deleteEmployeePassport = async (req, res) => {
  try {
    const { id } = req.params;

    await EmployeePassport.findByIdAndDelete(id);

    res.status(200).json({ message: "Passport deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting passport", error });
  }
};
