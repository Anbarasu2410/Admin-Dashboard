// src/routes/progressReportRoutes.js
import express from 'express';
import { getProgressReport, getProgressSummary } from '../controllers/progressReportController.js';

const router = express.Router();

// GET /api/progress-report
router.get('/progress-report', getProgressReport);

// GET /api/progress-report/summary
router.get('/progress-report/summary', getProgressSummary);

export default router;
