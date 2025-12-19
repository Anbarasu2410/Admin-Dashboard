import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema({
  id: {
    type: Number,
    unique: true
  },
  companyId: {
    type: Number,
    required: true,
    ref: 'Company'
  },
  userId: {
    type: Number,
    ref: 'User'
  },
  employeeCode: {
    type: String,
    trim: true
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  dob: {
    type: Date
  },
  gender: {
    type: String,
    trim: true
  },
  nationality: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true
  },
  emergencyContactName: {
    type: String,
    trim: true
  },
  emergencyPhone: {
    type: String,
    trim: true
  },
  jobTitle: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'LEFT'],
    default: 'ACTIVE'
  },
  joinDate: {
    type: Date
  },
  leftDate: {
    type: Date
  },
  basicSalary: {
    type: Number
  },
  otCharges: {
    type: Number
  },
  housingAllowance: {
    type: Number
  },
  transportAllowance: {
    type: Number
  },
  otherAllowance: {
    type: Number
  },
  housingDeduction: {
    type: Number
  },
  transportDeduction: {
    type: Number
  },
  otherDeduction: {
    type: Number
  },
  annualLeaveDays: {
    type: Number
  },
  medicalLeaveDays: {
    type: Number
  },
  bonusEligibility: {
    type: Boolean
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const Employee = mongoose.model('Employee', employeeSchema);

export default Employee;