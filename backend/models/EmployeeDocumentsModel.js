import mongoose from 'mongoose';

const employeeDocumentsSchema = new mongoose.Schema({
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
  documentType: {
    type: String,
    enum: ['passport', 'work pass', 'certification', 'other']
  },
  filePath: {
    type: String,
    trim: true
  },
  version: {
    type: String,
    trim: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  uploadedBy: {
    type: Number,
    ref: 'User'
  }
},
{
    collection: 'employeeDocuments',
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
}
);

const employeeDocuments = mongoose.model('employeeDocuments', employeeDocumentsSchema);

export default employeeDocuments;