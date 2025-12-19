// routes/employeeCertificationRoutes.js
import express from 'express';
import {
  createEmployeeCertification,
  getEmployeeCertifications,
  updateEmployeeCertification,
  deleteEmployeeCertification
} from '../controllers/employeeCertificationController.js';

import { uploadSingle } from '../middleware/upload.js';

const router = express.Router();

router.post('/', uploadSingle('document'), createEmployeeCertification);
router.get('/employee/:employeeId', getEmployeeCertifications);
router.put('/:id', uploadSingle('document'), updateEmployeeCertification);
router.delete('/:id', deleteEmployeeCertification);

export default router;
