// models/Role.js
const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true }, // manual numeric ID
  name: { type: String, required: true }, // Boss, Admin
  level: { type: Number, required: true },
  isSystemRole: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Role', roleSchema);
