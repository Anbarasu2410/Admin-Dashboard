import WorkerTaskAssignment from '../models/WorkerTaskAssignmentModel.js';
import Employee from '../models/EmployeeModel.js';
import Project from '../models/ProjectModel.js';
import CompanyUser from '../models/CompanyUserModel.js';

// ✅ Bulk assign workers to project
export const bulkAssignWorkers = async (req, res) => {
  try {
    const { projectId, supervisorId, vehicleId, date, employeeIds } = req.body;

    if (!projectId || !supervisorId || !employeeIds?.length) {
      return res.status(400).json({
        success: false,
        message: 'Project ID, supervisor ID, and at least one employee ID are required'
      });
    }

    if (!date) {
      return res.status(400).json({ success: false, message: 'Date is required (YYYY-MM-DD)' });
    }

    const project = await Project.findOne({ id: projectId });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Check for existing assignments
    const existingAssignments = await WorkerTaskAssignment.find({
      employeeId: { $in: employeeIds },
      date
    });

    if (existingAssignments.length > 0) {
      const duplicateIds = existingAssignments.map(a => a.employeeId);
      const duplicates = await Employee.find({ id: { $in: duplicateIds } }).select('fullName');
      return res.status(400).json({
        success: false,
        message: 'Some workers are already assigned for this date',
        duplicates: duplicates.map(d => d.fullName)
      });
    }

    // Auto-increment id
    const lastAssignment = await WorkerTaskAssignment.findOne().sort({ id: -1 });
    let nextId = lastAssignment ? lastAssignment.id + 1 : 1;

    const assignments = employeeIds.map(empId => ({
      id: nextId++,
      projectId,
      supervisorId,
      vehicleId: vehicleId || null,
      employeeId: empId,
      taskId: null,
      date,
      companyId: project.companyId
    }));

    await WorkerTaskAssignment.insertMany(assignments);

    res.status(201).json({
      success: true,
      message: `${assignments.length} workers assigned successfully`,
      data: { count: assignments.length, projectId, date, supervisorId }
    });

  } catch (error) {
    console.error('❌ Error bulk assigning workers:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Some workers are already assigned for this date'
      });
    }
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ✅ Get all assignments (no date filter) – UPDATED
export const getAssignmentsByDate = async (req, res) => {
  try {
    const { projectId } = req.query;

    // Match filter (optional project filter)
    const match = {};
    if (projectId) match.projectId = Number(projectId);

    const data = await WorkerTaskAssignment.aggregate([
      { $match: match },

      // Employee
      {
        $lookup: {
          from: "employees",
          localField: "employeeId",
          foreignField: "id",
          as: "employee"
        }
      },
      { $unwind: { path: "$employee", preserveNullAndEmptyArrays: true } },

      // Supervisor
      {
        $lookup: {
          from: "employees",
          localField: "supervisorId",
          foreignField: "id",
          as: "supervisor"
        }
      },
      { $unwind: { path: "$supervisor", preserveNullAndEmptyArrays: true } },

      // Project
      {
        $lookup: {
          from: "projects",
          localField: "projectId",
          foreignField: "id",
          as: "project"
        }
      },
      { $unwind: { path: "$project", preserveNullAndEmptyArrays: true } },

      // Vehicle
     {
  $lookup: {
    from: "fleetVehicles",  // <-- match your actual collection name
    localField: "vehicleId",
    foreignField: "id",
    as: "vehicle"
  }
},
      { $unwind: { path: "$vehicle", preserveNullAndEmptyArrays: true } },

      // Project fields
      {
        $project: {
          id: 1,
          date: 1,
          employeeId: 1,
          supervisorId: 1,
          projectId: 1,
          vehicleId: 1,
          employeeName: { $ifNull: ["$employee.fullName", "—"] },
          supervisorName: { $ifNull: ["$supervisor.fullName", "—"] },
          projectName: { $ifNull: ["$project.projectName", "—"] },
          vehicleCode: { $ifNull: ["$vehicle.vehicleCode", "—"] }
        }
      },

      { $sort: { date: -1, id: -1 } } // newest first
    ]);

    // Remove exact duplicate rows by assignment id
    const uniqueData = Array.from(new Map(data.map(a => [a.id, a])).values());

    res.json({ success: true, data: uniqueData });

  } catch (err) {
    console.error("Error fetching assignments:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
// ✅ Get available workers for a given date
// ✅ Get available workers for a given date
export const availableWorkers = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ success: false, message: "Date is required" });
    }

    // 1️⃣ Get all active company users with role "worker"
    const workerUserIds = await CompanyUser.find({ role: "worker", status: "active" })
      .distinct("userId");

    if (!workerUserIds.length) {
      return res.json({ success: true, data: [] });
    }

    // 2️⃣ Fetch all employees whose userId matches a worker user
    const allWorkerEmployees = await Employee.find({
      status: "active",
      userId: { $in: workerUserIds }
    }).select("id fullName trade employeeCode userId");

    if (!allWorkerEmployees.length) {
      return res.json({ success: true, data: [] });
    }

    // 3️⃣ Find already assigned workers for this date
    const assignedWorkerIds = await WorkerTaskAssignment.find({
      date,
      employeeId: { $in: allWorkerEmployees.map(e => e.id) }
    }).distinct("employeeId");

    // 4️⃣ Filter out assigned workers
    const availableWorkers = allWorkerEmployees.filter(
      w => !assignedWorkerIds.includes(w.id)
    );

    // 5️⃣ Map for frontend rowKey
    const data = availableWorkers.map(w => ({
      id: w.id,               // rowKey in frontend table
      fullName: w.fullName,
      trade: w.trade || "—",
      employeeCode: w.employeeCode || "—",
      userId: w.userId
    }));

    res.json({ success: true, data });

  } catch (err) {
    console.error("Error fetching available workers:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};







// ✅ Update assignment
export const updateAssignment = async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await WorkerTaskAssignment.findOneAndUpdate(
      { id: Number(id) },
      req.body,
      { new: true }
    );

    if (!updated) return res.status(404).json({ success: false, message: "Not found" });

    res.json({ success: true, data: updated });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Delete assignment
export const deleteAssignment = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await WorkerTaskAssignment.findOneAndDelete({ id: Number(id) });

    if (!deleted) return res.status(404).json({ success: false, message: "Not found" });

    res.json({ success: true, deletedId: id });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
