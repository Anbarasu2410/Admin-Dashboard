import express from 'express';
import {
  getAllTasks,
  getTaskById,
  createTaskInfo,
  updateTaskInfo,
  getTaskInfo,
  deleteTaskInfo,
  getTasksByProject,
  getTasksByStatus,
  getTasksByType
} from '../controllers/taskController.js';

const router = express.Router();

// Task routes
router.get('/', getAllTasks);
router.get('/:id', getTaskById);
router.post('/', createTaskInfo);
router.put('/:id', updateTaskInfo);
router.get('/:id', getTaskInfo);
router.delete('/:id', deleteTaskInfo);
router.get('/project/:projectId', getTasksByProject);
router.get('/status/:status', getTasksByStatus);
router.get('/type/:taskType', getTasksByType);

export default router;