import express from 'express';
import {
  bulkAssignWorkers,
  getAssignmentsByDate,
  updateAssignment,
  deleteAssignment,
  availableWorkers
} from '../controllers/workerTaskAssignmentController.js';

const router = express.Router();

// CREATE (bulk)
router.post('/bulk-assign', bulkAssignWorkers);

// READ (list)
router.get('/assignments', getAssignmentsByDate);

router.get('/workers/available', availableWorkers);



// UPDATE (edit single assignment)
router.put('/assignments/:id', updateAssignment);



// DELETE (remove single assignment)
router.delete('/assignments/:id', deleteAssignment);

export default router;
