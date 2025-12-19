import express from 'express';
import {
  createEmployeeWorkPass,
  getEmployeeWorkPasses,
  updateEmployeeWorkPass,
  deleteEmployeeWorkPass
} from '../controllers/employeeWorkPassController.js';
import { uploadSingle } from '../middleware/upload.js';

const router = express.Router();

router.post('/', uploadSingle('applicationDoc'), createEmployeeWorkPass);
router.get('/employee/:employeeId', getEmployeeWorkPasses);
router.put('/:id', uploadSingle('applicationDoc'), updateEmployeeWorkPass);
router.delete('/:id', deleteEmployeeWorkPass);

export default router;
