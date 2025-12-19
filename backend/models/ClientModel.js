// models/Client.js
import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema({
  id: {
    type: Number,
    unique: true
  },
  name: {
    type: String
  },
  registrationNo: {
    type: String
  },
  address: {
    type: String
  },
  contactName: {
    type: String
  },
  contactPhone: {
    type: String
  },
  email: {
    type: String
  },
  trade: {
    type: String
  },
  bankName: {
    type: String
  },
  bankAccount: {
    type: String
 }
  },
  { timestamps: true }
);


export default mongoose.model('Client', clientSchema);
