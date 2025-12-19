import mongoose from 'mongoose';

const employeeWorkPassSchema = new mongoose.Schema({
  id: {
    type: Number,
    // required: true,
    // unique: true
  },
  employeeId: {
    type: Number,
    required: true,
    ref: 'Employee'
  },
  status: {
    type: String,
    enum: ['PENDING', 'ACTIVE', 'EXPIRED']
  },
  workPermitNo: {
    type: String,
    trim: true
  },
  finNumber: {
    type: String,
    trim: true
  },
  applicationDate: {
    type: Date
  },
  issuanceDate: {
    type: Date
  },
  expiryDate: {
    type: Date
  },
  medicalDate: {
    type: Date
  },
  applicationDoc: {
    type: String,
    trim: true
  },
  medicalDoc: {
    type: String,
    trim: true
  },
  issuanceDoc: {
    type: String,
    trim: true
  },
  momDoc: {
    type: String,
    trim: true
  }
},{
    collection: 'employeeWorkPass',
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

const employeeWorkPass = mongoose.model('employeeWorkPass', employeeWorkPassSchema);

export default employeeWorkPass;