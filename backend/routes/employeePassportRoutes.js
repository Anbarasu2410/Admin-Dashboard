import express from 'express';
import {
  createEmployeePassport,
  getEmployeePassports,
  updateEmployeePassport,
  deleteEmployeePassport
} from '../controllers/employeePassportController.js';
import { uploadSingle } from '../middleware/upload.js';

const router = express.Router();

router.post('/', uploadSingle('document'), createEmployeePassport);
router.get('/employee/:employeeId', getEmployeePassports);
router.put('/:id', uploadSingle('document'), updateEmployeePassport);
router.delete('/:id', deleteEmployeePassport);

export default router;
