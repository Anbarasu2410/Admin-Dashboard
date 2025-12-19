import express from "express";
import { getDailyManpowerStatus } from "../controllers/adminManpowerController.js";

const router = express.Router();

router.get("/manpower-status", getDailyManpowerStatus);

export default router;
