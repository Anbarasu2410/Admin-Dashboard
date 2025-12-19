// routes/workerRoutes.js
import express from "express";
import { getAvailableWorkers  } from "../controllers/workerController.js";


const router = express.Router();

// Worker Portal - Today's Trip

router.get('/available', getAvailableWorkers); 
//router.put('/passengers/:passengerId/confirm', authMiddleware, confirmPassengerJourney);

// In your routes file


export default router;