import FleetTask from "../models/FleetTaskModel.js";
import FleetTaskPassenger from "../models/FleetTaskPassengerModel.js";
import FleetTaskMaterial from "../models/FleetTaskMaterialModel.js";
import FleetTaskTool from "../models/FleetTaskToolModel.js";

export async function loadTransportData(taskId) {
  // Find fleet task by taskId (numeric ID from Task model)
  const fleetTask = await FleetTask.findOne({ taskId: taskId })
    .populate("driverId")
    .populate("vehicleId")
    .lean();

  if (!fleetTask) return null;

  const transportType = fleetTask.transportType;

  let extraData = {};

  if (transportType === "WORKER_TRANSPORT") {
    const passengers = await FleetTaskPassenger.find({ fleetTaskId: fleetTask.id })
      .populate("workerEmployeeId")
      .lean();
    extraData.workers = passengers.map(p => ({
      id: p.workerEmployeeId?.id,
      name: p.workerEmployeeId?.name,
    }));
  }

  if (transportType === "MATERIAL_TRANSPORT") {
    const materials = await FleetTaskMaterial.find({ fleetTaskId: fleetTask.id })
      .populate("materialId")
      .lean();
    extraData.materials = materials.map(m => ({
      id: m.materialId?.id,
      name: m.materialId?.name,
      quantity: m.quantity,
    }));
  }

  if (transportType === "TOOL_TRANSPORT") {
    const tools = await FleetTaskTool.find({ fleetTaskId: fleetTask.id })
      .populate("toolId")
      .lean();
    extraData.tools = tools.map(t => ({
      id: t.toolId?.id,
      name: t.toolId?.name,
      quantity: t.quantity,
    }));
  }

  return {
    driverId: fleetTask.driverId?.id,
    vehicleId: fleetTask.vehicleId?.id,
    transportType: transportType,
    pickupLocation: fleetTask.pickupLocation,
    dropLocation: fleetTask.dropLocation,
    pickupTime: fleetTask.pickupTime,
    dropTime: fleetTask.dropTime,
    ...extraData,
  };
}