// models/RolePermission.js
const mongoose = require('mongoose');

const rolePermissionSchema = new mongoose.Schema({
  roleId: { type: Number, required: true },
  permissionId: { type: Number, required: true }
}, {
  collection: 'rolePermission',
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});



module.exports = mongoose.model('RolePermission', rolePermissionSchema);
