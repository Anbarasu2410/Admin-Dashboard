// import { createTask, updateTask } from "../services/taskService.js"; // Add updateTask import

import Task from '../models/TaskModel.js';
import Project from '../models/ProjectModel.js';
import Company from '../models/CompanyModel.js';
import FleetTaskTool from '../models/FleetTaskToolModel.js';
import FleetTaskMaterial from '../models/FleetTaskMaterialModel.js';
import { createTask, updateTask, getTaskWithDetails, deleteTask } from '../services/taskService.js';
/**
 * Validates task input data
 */
const validateTaskInput = (data) => {
  const { 
    companyId, projectId, taskName, taskType, startDate, endDate, status 
  } = data;
  const errors = [];

  // Required fields validation - only taskName and taskType are required
  if (!taskName) errors.push('Task name is required');
  if (!taskType) errors.push('Task type is required');

  // Data type validation (only if provided)
  if (companyId && isNaN(companyId)) errors.push('Company ID must be a number');
  if (projectId && isNaN(projectId)) errors.push('Project ID must be a number');

  // Date validation
  if (startDate) {
    const date = new Date(startDate);
    if (isNaN(date.getTime())) {
      errors.push('Start date must be a valid date');
    }
  }

  if (endDate) {
    const date = new Date(endDate);
    if (isNaN(date.getTime())) {
      errors.push('End date must be a valid date');
    }
  }

  // Business logic validation
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end <= start) {
      errors.push('End date must be after start date');
    }
  }

  // Status validation
  const validStatuses = ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
  if (status && !validStatuses.includes(status)) {
    errors.push(`Status must be one of: ${validStatuses.join(', ')}`);
  }

  // Task type validation
  const validTaskTypes = [
    'WORK', 'TRANSPORT', 'MATERIAL', 'TOOL', 'INSPECTION',
    'MAINTENANCE', 'ADMIN', 'TRAINING', 'OTHER'
  ];
  if (taskType && !validTaskTypes.includes(taskType)) {
    errors.push(`Task type must be one of: ${validTaskTypes.join(', ')}`);
  }

  return errors;
};

/**
 * Normalizes task data for consistent storage
 */
const normalizeTaskData = (data) => {
  const normalized = { ...data };

  // Type conversion (only if provided)
  if (normalized.companyId) normalized.companyId = parseInt(normalized.companyId, 10);
  if (normalized.projectId) normalized.projectId = parseInt(normalized.projectId, 10);
  if (normalized.createdBy) normalized.createdBy = parseInt(normalized.createdBy, 10);

  // String sanitization
  if (normalized.taskName) normalized.taskName = normalized.taskName.trim();
  if (normalized.description) normalized.description = normalized.description.trim();
  if (normalized.notes) normalized.notes = normalized.notes.trim();

  // Date handling
  const parseDate = (dateString) => {
    if (!dateString) return null;
    if (dateString instanceof Date) return dateString;
    
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  };

  if (normalized.startDate) normalized.startDate = parseDate(normalized.startDate);
  if (normalized.endDate) normalized.endDate = parseDate(normalized.endDate);

  // Default values
  if (!normalized.status) normalized.status = 'PLANNED';
  if (!normalized.additionalData) normalized.additionalData = {};
  if (!normalized.createdAt) normalized.createdAt = new Date();

  return normalized;
};

/**
 * Validates referential integrity (only if companyId and projectId are provided)
 */
const validateReferentialIntegrity = async (companyId, projectId) => {
  const errors = [];
  const validationPromises = [];

  // Only validate company if companyId is provided
  if (companyId) {
    validationPromises.push(
      Company.findOne({ id: companyId }).select('_id name').lean().exec()
    );
  } else {
    validationPromises.push(Promise.resolve(null));
  }

  // Only validate project if projectId is provided
  if (projectId) {
    validationPromises.push(
      Project.findOne({ id: projectId }).select('_id name').lean().exec()
    );
  } else {
    validationPromises.push(Promise.resolve(null));
  }

  const [company, project] = await Promise.all(validationPromises);

  if (companyId && !company) errors.push(`Company with ID ${companyId} does not exist`);
  if (projectId && !project) errors.push(`Project with ID ${projectId} does not exist`);

  return { 
    isValid: errors.length === 0, 
    errors,
    company,
    project
  };
};

/**
 * GET /api/tasks - Get all tasks with pagination and filtering
 */
const getAllTasks = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 1000;
    const skip = (page - 1) * limit;

    // Build query based on filters
    const query = {};
    if (req.query.companyId) query.companyId = parseInt(req.query.companyId);
    if (req.query.projectId) query.projectId = parseInt(req.query.projectId);
    if (req.query.status) query.status = req.query.status.toUpperCase();
    if (req.query.taskType) query.taskType = req.query.taskType.toUpperCase();

    // Date range filtering
    if (req.query.startDate && req.query.endDate) {
      query.startDate = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }

    const tasks = await Task.find(query)
      .sort({ createdAt: -1, id: -1 })
      .skip(skip)
      .limit(limit);

    // Populate related data
    const tasksWithDetails = await Promise.all(
      tasks.map(async (task) => {
        const [company, project] = await Promise.all([
          task.companyId ? Company.findOne({ id: task.companyId }) : Promise.resolve(null),
          task.projectId ? Project.findOne({ id: task.projectId }) : Promise.resolve(null),
        ]);

        const taskObj = task.toObject();

        return {
          ...taskObj,
          companyName: company ? company.name : 'Unknown Company',
          projectName: project ? project.name : 'Unknown Project',
        };
      })
    );

    const total = await Task.countDocuments(query);

    res.json({
      success: true,
      data: tasksWithDetails,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({
      success: false,
      message: `Error fetching tasks: ${error.message}`,
    });
  }
};

/**
 * GET /api/tasks/:id - Get single task by ID
 */
const getTaskById = async (req, res) => {
  try {
    let task;
    if (req.params.id.match(/^[0-9]+$/)) {
      task = await Task.findOne({ id: parseInt(req.params.id) });
    } else {
      task = await Task.findById(req.params.id);
    }

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Populate related data (only if IDs exist)
    const [company, project] = await Promise.all([
      task.companyId ? Company.findOne({ id: task.companyId }) : Promise.resolve(null),
      task.projectId ? Project.findOne({ id: task.projectId }) : Promise.resolve(null)
    ]);

    const taskObj = task.toObject();

    const taskWithDetails = {
      ...taskObj,
      companyName: company ? company.name : 'Unknown Company',
      projectName: project ? project.name : 'Unknown Project'
    };

    res.json({
      success: true,
      data: taskWithDetails
    });
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({
      success: false,
      message: `Error fetching task: ${error.message}`
    });
  }
};

/**
 * POST /api/tasks - Create new task
 */
/**
 * POST /api/tasks - Create new task
 */
/**
 * POST /api/tasks - Create new task
 */
/**
 * POST /api/tasks - Create new task
 */
const createTaskInfo = async (req, res) => {
  try {
    console.log("📨 Raw request body:", req.body);
    
    // Use your service to create the main task
    const task = await createTask(req.body);
    
  
    
    res.status(201).json({ 
      success: true, 
      data: task,
      message: 'Task created successfully'
    });
    
  } catch (err) {
    console.error('❌ Task creation process failed:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message,
      message: 'Failed to create task'
    });
  }
};
const updateTaskInfo = async (req, res) => {
  try {
    
    console.log("📨 Raw request body for update:", req.body);
    
    // Use your service to update the task
    const task = await updateTask(req.params.id, req.body);
    
    res.status(200).json({ 
      success: true, 
      data: task,
      message: 'Task updated successfully'
    });
    
  } catch (err) {
    console.error('❌ Task update process failed:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message,
      message: 'Failed to update task'
    });
  }
};


const getTaskInfo = async (req, res) => {
  try {
    const task = await getTaskWithDetails(req.params.id);
    res.status(200).json({ 
      success: true, 
      data: task 
    });
  } catch (err) {
    console.error('❌ Error fetching task details:', err);
    
    if (err.message === "Task not found") {
      return res.status(404).json({ 
        success: false, 
        error: err.message 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: err.message,
      message: 'Failed to fetch task details'
    });
  }
};

const  deleteTaskInfo=async(req, res)=> {
  try {
    console.log("📨 Request to delete  info task ID:", req.params.id);
    const task = await deleteTask(req.params.id);

    res.status(200).json({ success: true, message: "Task permanently deleted",  result: task });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}




/**
 * DELETE /api/tasks/:id - Delete task
 */
// const deleteTask = async (req, res) => {
//   try {
//     let deletedTask;
//     if (req.params.id.match(/^[0-9]+$/)) {
//       deletedTask = await Task.findOneAndDelete({ id: parseInt(req.params.id) });
//     } else {
//       deletedTask = await Task.findByIdAndDelete(req.params.id);
//     }

//     if (!deletedTask) {
//       return res.status(404).json({
//         success: false,
//         message: 'Task not found'
//       });
//     }

//     res.json({
//       success: true,
//       message: 'Task deleted successfully',
//       data: deletedTask
//     });
//   } catch (error) {
//     console.error('Error deleting task:', error);
//     res.status(500).json({
//       success: false,
//       message: `Error deleting task: ${error.message}`
//     });
//   }
// };

/**
 * GET /api/tasks/project/:projectId - Get tasks by project
 */
const getTasksByProject = async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 1000;
    const skip = (page - 1) * limit;

    const project = await Project.findOne({ id: projectId });
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const query = { projectId };
    
    // Additional filters
    if (req.query.status) query.status = req.query.status.toUpperCase();
    if (req.query.taskType) query.taskType = req.query.taskType.toUpperCase();
    if (req.query.startDate && req.query.endDate) {
      query.startDate = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }

    const tasks = await Task.find(query)
      .sort({ createdAt: -1, id: -1 })
      .skip(skip)
      .limit(limit);

    const tasksWithDetails = await Promise.all(
      tasks.map(async (task) => {
        const company = task.companyId ? await Company.findOne({ id: task.companyId }) : null;

        const taskObj = task.toObject();

        return {
          ...taskObj,
          companyName: company ? company.name : 'Unknown Company',
          projectName: project.name
        };
      })
    );

    const total = await Task.countDocuments(query);

    res.json({
      success: true,
      data: tasksWithDetails,
      project: {
        id: project.id,
        name: project.name
      },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching project tasks:', error);
    res.status(500).json({
      success: false,
      message: `Error fetching project tasks: ${error.message}`,
    });
  }
};

/**
 * GET /api/tasks/status/:status - Get tasks by status
 */
const getTasksByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 1000;
    const skip = (page - 1) * limit;

    const validStatuses = ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }

    const query = { status: status.toUpperCase() };
    
    if (req.query.companyId) query.companyId = parseInt(req.query.companyId);
    if (req.query.projectId) query.projectId = parseInt(req.query.projectId);
    if (req.query.startDate && req.query.endDate) {
      query.startDate = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }

    const tasks = await Task.find(query)
      .sort({ createdAt: -1, id: -1 })
      .skip(skip)
      .limit(limit);

    const tasksWithDetails = await Promise.all(
      tasks.map(async (task) => {
        const [company, project] = await Promise.all([
          task.companyId ? Company.findOne({ id: task.companyId }) : Promise.resolve(null),
          task.projectId ? Project.findOne({ id: task.projectId }) : Promise.resolve(null),
        ]);

        const taskObj = task.toObject();

        return {
          ...taskObj,
          companyName: company ? company.name : 'Unknown Company',
          projectName: project ? project.name : 'Unknown Project'
        };
      })
    );

    const total = await Task.countDocuments(query);

    res.json({
      success: true,
      data: tasksWithDetails,
      status: status.toUpperCase(),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching tasks by status:', error);
    res.status(500).json({
      success: false,
      message: `Error fetching tasks by status: ${error.message}`,
    });
  }
};

/**
 * GET /api/tasks/type/:taskType - Get tasks by type
 */
const getTasksByType = async (req, res) => {
  try {
    const { taskType } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 1000;
    const skip = (page - 1) * limit;

    const validTaskTypes = [
      'WORK', 'TRANSPORT', 'MATERIAL', 'TOOL', 'INSPECTION',
      'MAINTENANCE', 'ADMIN', 'TRAINING', 'OTHER'
    ];
    
    if (!validTaskTypes.includes(taskType.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: `Task type must be one of: ${validTaskTypes.join(', ')}`
      });
    }

    const query = { taskType: taskType.toUpperCase() };
    
    if (req.query.companyId) query.companyId = parseInt(req.query.companyId);
    if (req.query.projectId) query.projectId = parseInt(req.query.projectId);
    if (req.query.startDate && req.query.endDate) {
      query.startDate = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }

    const tasks = await Task.find(query)
      .sort({ createdAt: -1, id: -1 })
      .skip(skip)
      .limit(limit);

    const tasksWithDetails = await Promise.all(
      tasks.map(async (task) => {
        const [company, project] = await Promise.all([
          task.companyId ? Company.findOne({ id: task.companyId }) : Promise.resolve(null),
          task.projectId ? Project.findOne({ id: task.projectId }) : Promise.resolve(null),
        ]);

        const taskObj = task.toObject();

        return {
          ...taskObj,
          companyName: company ? company.name : 'Unknown Company',
          projectName: project ? project.name : 'Unknown Project'
        };
      })
    );

    const total = await Task.countDocuments(query);

    res.json({
      success: true,
      data: tasksWithDetails,
      taskType: taskType.toUpperCase(),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching tasks by type:', error);
    res.status(500).json({
      success: false,
      message: `Error fetching tasks by type: ${error.message}`,
    });
  }
};

export {
  getAllTasks,
  getTaskById,
  createTaskInfo,
  getTasksByProject,
  getTasksByStatus,
  updateTaskInfo,
  getTaskInfo,
  deleteTaskInfo,
  getTasksByType
};