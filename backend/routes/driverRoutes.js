import express from 'express';
import {
  getAllDrivers,
  getDriverById,
  createDriver,
  updateDriver,
  deleteDriver,
  getDriversByCompany,
  getDriverProfile,
  changeDriverPassword,
    uploadDriverPhoto,
  getDriversByVehicle,
    upload
} from '../controllers/driverController.js';

const router = express.Router();

// GET /api/drivers - Get all drivers
router.get('/', getAllDrivers);

// GET /api/drivers/:id - Get driver by ID
router.get('/:id', getDriverById);


router.get("/profile",  getDriverProfile);
router.put("/profile/password",  changeDriverPassword);
router.post("/profile/photo",  upload.single('photo'), uploadDriverPhoto);

// POST /api/drivers - Create new driver
router.post('/', createDriver);

// PUT /api/drivers/:id - Update driver
router.put('/:id', updateDriver);

// DELETE /api/drivers/:id - Delete driver
router.delete('/:id', deleteDriver);

// GET /api/drivers/company/:companyId - Get drivers by company
router.get('/company/:companyId', getDriversByCompany);

// GET /api/drivers/vehicle/:vehicleId - Get drivers by assigned vehicle
router.get('/vehicle/:vehicleId', getDriversByVehicle);

export default router;