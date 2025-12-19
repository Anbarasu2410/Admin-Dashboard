import express from 'express';
import {
  createEmployeeQualification,
  getEmployeeQualifications,
  updateEmployeeQualification,
  deleteEmployeeQualification
} from '../controllers/employeeQualificationController.js';
import { uploadSingle } from '../middleware/upload.js';

const router = express.Router();

router.post('/', uploadSingle('document'), createEmployeeQualification);
router.get('/employee/:employeeId', getEmployeeQualifications);
router.put('/:id', uploadSingle('document'), updateEmployeeQualification);
router.delete('/:id', deleteEmployeeQualification);

export default router;
