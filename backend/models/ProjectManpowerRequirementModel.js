import mongoose from 'mongoose';

const projectManpowerRequirementSchema = new mongoose.Schema({
  id: { type: String },
  projectId: { type: String },
  tradeName: { type: String },
  requiredWorkers: { type: Number },
  bufferWorkers: { type: Number, default: 0 }
}, {
  collection: 'projectManpowerRequirements',
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

export default mongoose.model('ProjectManpowerRequirement', projectManpowerRequirementSchema);
