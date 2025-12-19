import mongoose from 'mongoose';

const projectMaterialRequirementSchema = new mongoose.Schema({
  id: { type: Number, unique: true },
  projectId: { type: String },
  materialId: { type: Number },
  materialName: { type: String },
    qty: { type: Number },
  estimatedQuantity: { type: Number },
  unit: { type: String },
  requiredBy: { type: Date }
}, {
  collection: 'projectMaterialRequirements',
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

export default mongoose.model('ProjectMaterialRequirement', projectMaterialRequirementSchema);
//projectmanpowerrequirements