
import mongoose from 'mongoose';

const projectDocumentSchema = new mongoose.Schema({
  id: {
    type: Number,
    unique: true
  },
  projectId: {
    type: String
  },
  docType: {
    type: String
  },
  filePath: {
    type: String
  },
  uploadedBy: {
    type: Number
  },
  uploadedAt: {
    type: Date,
    default: Date.now
    }
}, {
  collection: 'projectDocuments',
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

export default mongoose.model('ProjectDocument', projectDocumentSchema);
