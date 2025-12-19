import mongoose from 'mongoose';

const tradeSchema = new mongoose.Schema({
  id: { type: Number, unique: true },
  name: { type: String }
}, { timestamps: true });

export default mongoose.model('Trade', tradeSchema);
