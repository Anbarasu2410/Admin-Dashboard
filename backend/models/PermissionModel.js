
const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
    id:{type: Number, required: true, unique: true},

  module: { type: String, required: true },   // Project, Payroll
  action: { type: String, required: true },   // View, Create
  code: { type: String, required: true, unique: true }
}, { timestamps: true });

module.exports = mongoose.model('Permission', permissionSchema);
