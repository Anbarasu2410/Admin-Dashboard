// server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// DB
import connectDB from './config/database.js';

// Routes
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import companyRoutes from './routes/companyRoutes.js';
import employeeRoutes from './routes/employeeRoutes.js';
import employeePassportRoutes from './routes/employeePassportRoutes.js';
import employeeWorkPassRoutes from './routes/employeeWorkPassRoutes.js';
import employeeQualificationRoutes from './routes/employeeQualificationRoutes.js';
import employeeCertificationRoutes from './routes/employeeCertificationRoutes.js';
import employeeDocumentRoutes from './routes/employeeDocumentRoutes.js';

import fleetVehicleRoutes from './routes/fleetVehicleRoutes.js';
import fleetTaskRoutes from './routes/fleetTaskRoutes.js';
import fleetTaskPassengerRoutes from './routes/fleetTaskPassengerRoutes.js';
import fleetAlertRoutes from './routes/fleetAlertRoutes.js';
import driverRoutes from './routes/driverRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import toolRoutes from './routes/toolRoute.js';
import materialRoutes from './routes/materialRoutes.js';
import workerTaskAssignmentRoutes from './routes/workerTaskAssignmentRoutes.js';
import workerRoute from './routes/workerRoute.js'; 
import companyUserRoute from './routes/companyUserRoute.js';
import adminManpowerRoutes from "./routes/adminManpowerRoutes.js";
import adminProgressRoutes from "./routes/adminProgressRoutes.js";
import progressReportRoutes from './routes/progressReportRoutes.js';


import masterRoutes from"./routes/masterRoute.js";


dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/employees/passports', employeePassportRoutes);
app.use('/api/employees/work-passes', employeeWorkPassRoutes);
app.use('/api/employees/qualifications', employeeQualificationRoutes);
app.use('/api/employees/certifications', employeeCertificationRoutes);
app.use('/api/employees/documents', employeeDocumentRoutes);

app.use('/api/fleet-vehicles', fleetVehicleRoutes);
app.use('/api/fleet-tasks', fleetTaskRoutes);
app.use('/api/fleet-task-passengers', fleetTaskPassengerRoutes);
app.use('/api/fleet-alerts', fleetAlertRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/tools', toolRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/company-users', companyUserRoute);

app.use("/api/master", masterRoutes);

app.use('/api/workers', workerRoute);
app.use('/api/workers-assignments', workerTaskAssignmentRoutes);
app.use("/api/admin", adminManpowerRoutes);
app.use("/api/admin", adminProgressRoutes);
app.use('/api', progressReportRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'ERP API is running!',
    endpoints: {
      users: '/api/users',
      companies: '/api/companies',
      employees: '/api/employees',
      fleetVehicles: '/api/fleet-vehicles',
      fleetTasks: '/api/fleet-tasks',
      fleetTaskPassengers: '/api/fleet-task-passengers',
      fleetAlerts: '/api/fleet-alerts',
      drivers: '/api/drivers',
      projects: '/api/projects',
      tasks: '/api/tasks',
    },
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: 'Connected',
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 API base URL: http://localhost:${PORT}/api`);
  console.log(`📂 Uploaded files available at: http://localhost:${PORT}/uploads`);
});

export default app;
