// models/FleetVehicle.js
import mongoose from 'mongoose';

const fleetVehicleSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    unique: true
  },
  companyId: {
    type: Number,
    required: true,
    index: true
  },
  vehicleCode: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  registrationNo: {
    type: String,
    unique: true,
    trim: true,
    index: true
  },
  vehicleType: {
    type: String,
    trim: true
  },
  capacity: {
    type: Number,
    min: 0
  },
  status: {
    type: String,
    enum: ['AVAILABLE', 'IN_SERVICE', 'MAINTENANCE', 'OUT_OF_SERVICE'],
    default: 'AVAILABLE',
    index: true
  },
  insuranceExpiry: {
    type: Date,
    index: true
  },
  lastServiceDate: {
    type: Date,
    index: true
  },
  odometer: {
    type: Number,
    min: 0
  },
  meta: {
    type: Object,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'fleetVehicles',
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

// Add essential indexes
fleetVehicleSchema.index({ companyId: 1, status: 1 });
fleetVehicleSchema.index({ status: 1, insuranceExpiry: 1 });

// Pre-save middleware to ensure ID is always set
fleetVehicleSchema.pre('save', async function(next) {
  if (this.isNew && !this.id) {
    try {
      // Find the highest ID and increment
      const lastVehicle = await mongoose.model('FleetVehicle').findOne().sort({ id: -1 });
      this.id = lastVehicle ? lastVehicle.id + 1 : 1;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

export default mongoose.model('FleetVehicle', fleetVehicleSchema);