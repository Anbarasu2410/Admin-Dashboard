import mongoose from 'mongoose';

const employeePassportSchema = new mongoose.Schema({
  id: {
    type: Number,
    // required: true,
    // unique: true
  },
  employeeId: {
    type: Number,
    ref: 'Employee'
  },
  passportNo: {
    type: String,
    trim: true
  },
  issueDate: {
    type: Date
  },
  expiryDate: {
    type: Date
  },
  issuingCountry: {
    type: String,
    trim: true
  },
  documentPath: {
    type: String,
    trim: true
  }
},{
    collection: 'employeePassport',
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
}
);

const employeePassport = mongoose.model('employeePassport', employeePassportSchema);

export default employeePassport;