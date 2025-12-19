import express from 'express';
import {
  createEmployeeDocument,
  getEmployeeDocuments,
  updateEmployeeDocument,
  deleteEmployeeDocument
} from '../controllers/employeeDocumentController.js';

import { uploadSingle } from '../middleware/upload.js';

const router = express.Router();

router.post('/', uploadSingle('document'), createEmployeeDocument);
router.get('/employee/:employeeId', getEmployeeDocuments);
router.put('/:id', uploadSingle('document'), updateEmployeeDocument);
router.delete('/:id', deleteEmployeeDocument);

export default router;
