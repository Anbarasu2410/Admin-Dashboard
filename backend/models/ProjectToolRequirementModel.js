import mongoose from 'mongoose';

const projectToolRequirementSchema = new mongoose.Schema({
  id: { type: Number, unique: true },
  projectId: { type: String },
  toolId: { type: Number },
  requiredQuantity: { type: Number },
  rentalStart: { type: Date },
  rentalEnd: { type: Date }
},  {
  collection: 'projectToolRequirements',
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

export default mongoose.model('ProjectToolRequirement', projectToolRequirementSchema);
//erp.projecttoolrequirements
