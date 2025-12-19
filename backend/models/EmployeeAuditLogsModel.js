import mongoose from 'mongoose';

const employeeAuditLogsSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    unique: true
  },
  employeeId: {
    type: Number,
    required: true,
    ref: 'Employee'
  },
  field: {
    type: String,
    trim: true
  },
  oldValue: {
    type: String,
    trim: true
  },
  newValue: {
    type: String,
    trim: true
  },
  changedBy: {
    type: Number,
    required: true,
    ref: 'User'
  },
  changedAt: {
    type: Date,
    default: Date.now
  }
},
{
    collection: 'employeeAuditLogs',
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
}
);

const employeeAuditLogs = mongoose.model('employeeAuditLogs', employeeAuditLogsSchema);

export default employeeAuditLogs;