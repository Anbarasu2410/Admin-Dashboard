import FleetTask from "../models/FleetTaskModel.js";
import FleetTaskPassenger from "../models/FleetTaskPassengerModel.js";
import FleetTaskMaterial from "../models/FleetTaskMaterialModel.js";
import FleetTaskTool from "../models/FleetTaskToolModel.js";

export async function handleTransport(taskId, data, session) {
  try {
    // Generate new ID for fleet task
    const lastFleetTask = await FleetTask.findOne().sort({ id: -1 });
    const newFleetTaskId = lastFleetTask ? lastFleetTask.id + 1 : 1;

    // Create main fleet task
    const fleetTask = await FleetTask.create([{
      id: newFleetTaskId,
      taskId: taskId,
      driverId: data.driverId,
      vehicleId: data.vehicleId,
      transportType: data.transportType,
      pickupLocation: data.pickupLocation,
      dropLocation: data.dropLocation,
      pickupTime: data.pickupTime,
      dropTime: data.dropTime,
      companyId: data.companyId,
      projectId: data.projectId,
      taskDate: new Date(),
      plannedPickupTime: data.pickupTime,
      plannedDropTime: data.dropTime,
      status: 'PLANNED',
      createdBy: data.createdBy,
      createdAt: new Date(),
      updatedAt: new Date()
    }], { session });

    const fleetTaskId = fleetTask[0].id;

    // Worker passengers
    if (data.transportType === "WORKER_TRANSPORT" && data.workers && data.workers.length) {
      const passengers = data.workers.map((empId) => ({ 
        fleetTaskId: fleetTaskId, 
        workerEmployeeId: empId 
      }));
      await FleetTaskPassenger.insertMany(passengers, { session });
    }

    // Materials
    if (data.transportType === "MATERIAL_TRANSPORT" && data.materialQuantities && data.materialQuantities.length) {
      const materials = data.materialQuantities.map((material) => ({ 
        fleetTaskId: fleetTaskId, 
        materialId: material.materialId, 
        quantity: material.quantity 
      }));
      await FleetTaskMaterial.insertMany(materials, { session });
    }

    // Tools
    if (data.transportType === "TOOL_TRANSPORT" && data.toolQuantities && data.toolQuantities.length) {
      const tools = data.toolQuantities.map((tool) => ({ 
        fleetTaskId: fleetTaskId, 
        toolId: tool.toolId, 
        quantity: tool.quantity 
      }));
      await FleetTaskTool.insertMany(tools, { session });
    }

    console.log(`✅ Fleet task created: ${newFleetTaskId} for transport task`);
    return fleetTask[0].id;
  } catch (error) {
    console.error('Error in transport handler:', error);
    throw error;
  }
}

export async function handleTransportUpdate(taskId, data, session) {
  try {
    // Find the existing fleet task
    const existingFleetTask = await FleetTask.findOne({ taskId: taskId }).session(session);
    
    if (!existingFleetTask) {
      throw new Error("Fleet task not found for the given task ID");
    }

    const fleetTaskId = existingFleetTask.id;

    // Update main fleet task
    await FleetTask.updateOne(
      { id: fleetTaskId },
      {
        $set: {
          driverId: data.driverId,
          vehicleId: data.vehicleId,
          transportType: data.transportType,
          pickupLocation: data.pickupLocation,
          dropLocation: data.dropLocation,
          pickupTime: data.pickupTime,
          dropTime: data.dropTime,
          companyId: data.companyId,
          projectId: data.projectId,
          plannedPickupTime: data.pickupTime,
          plannedDropTime: data.dropTime,
          status: data.status || existingFleetTask.status,
          updatedAt: new Date()
        }
      },
      { session }
    );

    // Handle passengers update - delete existing and create new
    if (data.transportType === "WORKER_TRANSPORT") {
      await FleetTaskPassenger.deleteMany({ fleetTaskId: fleetTaskId }, { session });
      
      if (data.workers && data.workers.length) {
        const passengers = data.workers.map((empId) => ({ 
          fleetTaskId: fleetTaskId, 
          workerEmployeeId: empId 
        }));
        await FleetTaskPassenger.insertMany(passengers, { session });
      }
    }

    // Handle materials update
    if (data.transportType === "MATERIAL_TRANSPORT") {
      await FleetTaskMaterial.deleteMany({ fleetTaskId: fleetTaskId }, { session });
      
      if (data.materialQuantities && data.materialQuantities.length) {
        const materials = data.materialQuantities.map((material) => ({ 
          fleetTaskId: fleetTaskId, 
          materialId: material.materialId, 
          quantity: material.quantity 
        }));
        await FleetTaskMaterial.insertMany(materials, { session });
      }
    }

    // Handle tools update
    if (data.transportType === "TOOL_TRANSPORT") {
      await FleetTaskTool.deleteMany({ fleetTaskId: fleetTaskId }, { session });
      
      if (data.toolQuantities && data.toolQuantities.length) {
        const tools = data.toolQuantities.map((tool) => ({ 
          fleetTaskId: fleetTaskId, 
          toolId: tool.toolId, 
          quantity: tool.quantity 
        }));
        await FleetTaskTool.insertMany(tools, { session });
      }
    }

    console.log(`✅ Fleet task updated: ${fleetTaskId} for transport task`);
    return fleetTaskId;
  } catch (error) {
    console.error('Error in transport update handler:', error);
    throw error;
  }
}
//new function to handle transport task deletion


export async function handleTransportDelete(id, session) {
  
  
   const fleetTask = await FleetTask.findOne({ taskId: id }).session(session);
  if (!fleetTask) return;

  
  await Promise.all([
    FleetTaskPassenger.deleteMany({ fleetTaskId: fleetTask.id }).session(session),
    FleetTaskMaterial.deleteMany({ fleetTaskId: fleetTask.id }).session(session),
    FleetTaskTool.deleteMany({ fleetTaskId: fleetTask.id }).session(session),
  ]);

  // Delete main fleet task
  await FleetTask.deleteOne({ id: fleetTask.id }).session(session);
}