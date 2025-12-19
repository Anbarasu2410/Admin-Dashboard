import mongoose from 'mongoose';

const employeeQualificationsSchema = new mongoose.Schema({
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
  name: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['degree', 'diploma', 'certificate']
  },
  institution: {
    type: String,
    trim: true
  },
  country: {
    type: String,
    trim: true
  },
  year: {
    type: Number
  },
  documentPath: {
    type: String,
    trim: true
  }
},
{
    collection: 'employeeQualifications',
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});


const employeeQualifications = mongoose.model('employeeQualifications', employeeQualificationsSchema);

export default employeeQualifications;