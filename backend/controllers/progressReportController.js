// src/controllers/progressReportController.js
import Project from '../models/ProjectModel.js';
import WorkerTaskAssignment from '../models/WorkerTaskAssignmentModel.js';
import Employee from '../models/EmployeeModel.js'
import Task from '../models/TaskModel.js'
import WorkerTaskProgress from "../models/WorkerTaskProgressModel.js";





export const getProgressReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    /* -------------------------------
       1. DATE FILTER (STRING BASED)
       ------------------------------- */
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        date: { $gte: startDate, $lte: endDate }
      };
    }

    /* -------------------------------
       2. PROJECTS
       ------------------------------- */
    const projects = await Project.find({}).lean();
    if (!projects.length) return res.json([]);

    /* -------------------------------
       3. SUPERVISORS
       ------------------------------- */
    const supervisorIds = projects.map(p => p.supervisorId).filter(Boolean);
    const supervisors = await Employee.find(
      { id: { $in: supervisorIds } },
      { id: 1, fullName: 1 }
    ).lean();

    const supervisorMap = Object.fromEntries(
      supervisors.map(s => [s.id, s.fullName])
    );

    /* -------------------------------
       4. TASK ASSIGNMENTS
       ------------------------------- */
    const projectIds = projects.map(p => p.id);

    const assignments = await WorkerTaskAssignment.find({
      projectId: { $in: projectIds },
      ...dateFilter
    }).lean();

    if (!assignments.length) {
      return res.json(
        projects.map(p => ({
          id: p.id,
          projectName: p.projectName,
          supervisorName: supervisorMap[p.supervisorId] || "-",
          overallProgress: 0,
          status: p.status || "-",
          workerProgress: []
        }))
      );
    }

    /* -------------------------------
       5. EMPLOYEES & TASKS (BULK)
       ------------------------------- */
    const employeeIds = [...new Set(assignments.map(a => a.employeeId))];
    const taskIds = [...new Set(assignments.map(a => a.taskId))];

    const employees = await Employee.find(
      { id: { $in: employeeIds } },
      { id: 1, fullName: 1 }
    ).lean();

    const tasks = await Task.find(
      { id: { $in: taskIds } },
      { id: 1, taskName: 1 }
    ).lean();

    const employeeMap = Object.fromEntries(
      employees.map(e => [e.id, e.fullName])
    );
    const taskMap = Object.fromEntries(
      tasks.map(t => [t.id, t.taskName])
    );

    /* -------------------------------
       6. WORKER TASK PROGRESS
       ------------------------------- */
    const assignmentIds = assignments.map(a => a.id);

    const progressDocs = await WorkerTaskProgress.find({
      workerTaskAssignmentId: { $in: assignmentIds }
    }).lean();

    const progressMap = Object.fromEntries(
      progressDocs.map(p => [p.workerTaskAssignmentId, p])
    );

    /* -------------------------------
       7. FINAL RESPONSE
       ------------------------------- */
    const result = projects.map(project => {
      const projectAssignments = assignments.filter(
        a => a.projectId === project.id
      );

      const workerProgress = projectAssignments.map(a => {
        const progress = progressMap[a.id];

        return {
          employeeId: a.employeeId,
          employeeName: employeeMap[a.employeeId] || "-",
          taskName: taskMap[a.taskId] || "-",
          progressPercent: progress?.progressPercent ?? 0,
          notes: progress?.notes || "-",
          status: progress?.status || "-"
        };
      });

      const overallProgress =
        workerProgress.length > 0
          ? Math.round(
              workerProgress.reduce(
                (sum, w) => sum + w.progressPercent,
                0
              ) / workerProgress.length
            )
          : 0;

      return {
        id: project.id,
        projectName: project.projectName,
        supervisorName: supervisorMap[project.supervisorId] || "-",
        overallProgress,
        status: project.status || "-",
        workerProgress
      };
    });

    res.json(result);
  } catch (err) {
    console.error("Progress Report Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

// Fetch summary cards for PDF
export const getProgressSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    /* -------------------------------
       DATE FILTER (STRING BASED)
    ------------------------------- */
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        date: { $gte: startDate, $lte: endDate },
      };
    }

    /* -------------------------------
       TOTAL PROJECTS
    ------------------------------- */
    const totalProjects = await Project.countDocuments({});

    /* -------------------------------
       TASK ASSIGNMENTS
    ------------------------------- */
    const assignments = await WorkerTaskAssignment.find(
      { ...dateFilter },
      { id: 1 }
    ).lean();

    const totalTasks = assignments.length;

    /* -------------------------------
       COMPLETED TASKS
    ------------------------------- */
    let completedTasks = 0;

    if (totalTasks > 0) {
      completedTasks = await WorkerTaskProgress.countDocuments({
        workerTaskAssignmentId: {
          $in: assignments.map(a => a.id),
        },
        progressPercent: 100,
      });
    }

    /* -------------------------------
       SINGLE RESPONSE (ONLY ONE)
    ------------------------------- */
    res.json([
      { title: "Total Projects", value: totalProjects },
      { title: "Total Tasks", value: totalTasks },
      { title: "Completed Tasks", value: completedTasks },
    ]);

  } catch (err) {
    console.error("Summary Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

