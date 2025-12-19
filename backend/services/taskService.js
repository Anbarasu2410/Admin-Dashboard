import Task from "../models/TaskModel.js";
import { handleTransport, handleTransportUpdate, handleTransportDelete } from "../handlers/transportHandler.js";
import { taskLoaders } from "../loaders/index.js";


const taskHandlers = {
  TRANSPORT: handleTransport,
  // Other task types will be handled by the core Task model only
  WORK: null,
  MATERIAL: null,
  TOOL: null,
  INSPECTION: null,
  MAINTENANCE: null,
  ADMIN: null,
  TRAINING: null,
  OTHER: null,
};

const updateHandlers = {
  TRANSPORT: handleTransportUpdate,
  // Other task types will be handled by the core Task model only
  WORK: null,
  MATERIAL: null,
  TOOL: null,
  INSPECTION: null,
  MAINTENANCE: null,
  ADMIN: null,
  TRAINING: null,
  OTHER: null,
};
const deleteHandlers = {
  TRANSPORT: handleTransportDelete,
  // Other task types will be handled by the core Task model only
  WORK: null,
  MATERIAL: null,
  TOOL: null,
  INSPECTION: null,
  MAINTENANCE: null,
  ADMIN: null,
  TRAINING: null,
  OTHER: null,
};

// Your existing createTask and updateTask functions remain the same
export async function createTask(taskData) {
  const session = await Task.startSession();
  session.startTransaction();

  try {
    const id = Math.floor(10000 + Math.random() * 90000);
    console.log(id);
    taskData.id = id;
    
    const task = await Task.create([taskData], { session });
    console.log(`✅ Task created with ID: ${task[0].id}`);
    const taskId = task[0].id;

    if (taskHandlers[taskData.taskType]) {
      const result = await taskHandlers[taskData.taskType](taskId, taskData.additionalData, session);

      if (taskData.taskType === "TRANSPORT" && result) {
        await Task.updateOne(
          { id: taskId }, 
          { $set: { transportTaskId: result } }, 
          { session }
        );
      }
    }

    await session.commitTransaction();
    session.endSession();
    return task[0];
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error in task service:', error);
    throw error;
  }
}

export async function updateTask(taskId, updates) {
  const session = await Task.startSession();
  session.startTransaction();

  try {
    const updatedTask = await Task.findOneAndUpdate(
      { id: taskId }, 
      {
        $set: {
          taskName: updates.taskName,
          description: updates.description,
          startDate: updates.startDate,
          endDate: updates.endDate,
          status: updates.status,
          updatedAt: new Date(),
          additionalData: updates.additionalData,
        },
      }, 
      { new: true, session }
    );

    if (!updatedTask) throw new Error("Task not found");

    if (updateHandlers[updatedTask.taskType]) {
      const result = await updateHandlers[updatedTask.taskType](taskId, updates.additionalData, session);

      if (updatedTask.taskType === "TRANSPORT" && result) {
        await Task.updateOne(
          { id: taskId }, 
          { $set: { transportTaskId: result } }, 
          { session }
        );
      }
    }

    await session.commitTransaction();
    session.endSession();
    return updatedTask;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error in task service update:', error);
    throw error;
  }
}
// ADD THIS NEW FUNCTION TO YOUR EXISTING SERVICE
export async function getTaskWithDetails(taskId) {
  
  const task = await Task.findById(taskId)
    .populate("projectId")
    .populate("companyId")
    .populate("createdBy")
    .lean();

  if (!task) throw new Error("Task not found");

  // Load dynamic data based on task type
  const loader = taskLoaders[task.taskType];
  const dynamicData = loader ? await loader(task.id) : {};
return {
    ...task,
    additionalData: {
      ...task.additionalData,
      ...dynamicData,
    },
  };
  
}

export async function deleteTask(taskId) {
  const session = await Task.startSession();
  session.startTransaction();

   try {
    const task = await Task.findOne({id:taskId}).session(session);
    if (!task) throw new Error("Task not found");

    // Delete related records
    const handler = deleteHandlers[task.taskType];
    if (handler) await handler(taskId, session);

    // Permanently delete main task
    await Task.deleteOne({ id: taskId }).session(session);

    await session.commitTransaction();
    session.endSession();
    return { success: true };
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
}