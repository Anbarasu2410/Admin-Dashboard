// routes/adminProgressRoutes.js
import express from "express";
import { getProgressDashboard } from "../controllers/adminProgressController.js";

const router = express.Router();

router.get("/progress-dashboard", getProgressDashboard);

export default router;
