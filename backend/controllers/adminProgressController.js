import Project from "../models/ProjectModel.js";
import WorkerTaskAssignment from "../models/WorkerTaskAssignmentModel.js";
import Employee from "../models/EmployeeModel.js";
import ProjectDailyProgress from "../models/ProjectDailyProgressModel.js";
import dayjs from "dayjs";
import Task from "../models/TaskModel.js"
export const getProgressDashboard = async (req, res) => {
  try {
    const { projectId, date } = req.query;
    const filter = {};

    // Filter projects by numeric id
    if (projectId) filter.id = Number(projectId);

    const projects = await Project.find(filter).lean();

    const response = [];

    for (const project of projects) {
      // 1️⃣ Daily progress for this project on selected date
      const start = dayjs(date).startOf("day").toDate();
      const end = dayjs(date).endOf("day").toDate();

      const dailyProgress = await ProjectDailyProgress.find({
        projectId: project.id,
        date: { $gte: start, $lte: end }
      }).lean();

      // 2️⃣ Task assignments for this project on selected date
      const assignments = await WorkerTaskAssignment.find({
        projectId: project.id,
        date: date // assignment date is stored as string
      }).lean();

      // 3️⃣ Map tasks with employees and progress
    const tasks = await Promise.all(assignments.map(async (a) => {
  const emp = await Employee.findOne({ id: a.employeeId }).lean();

  // Lookup the task from Task collection by numeric id
  const taskRecord = await Task.findOne({ id: a.taskId }).lean();

  const progressRecord = dailyProgress.find(dp => dp.supervisorId === a.supervisorId);

  return {
    taskName: taskRecord ? taskRecord.taskName : "Unassigned",
    assignedTo: emp ? emp.fullName : "N/A",
    progress: progressRecord ? progressRecord.overallProgress : 0,
    issues: progressRecord ? progressRecord.issues : ""
  };
}));


      const overallProgress = tasks.length
        ? Math.round(tasks.reduce((sum, t) => sum + t.progress, 0) / tasks.length)
        : 0;

      const issues = tasks.map(t => t.issues).filter(Boolean).join(", ") || "None";

      response.push({
        projectId: project.id,
        projectName: project.projectName,
        overallProgress,
        issues,
        dailyTasks: tasks
      });
    }

    res.json({ projects: response });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
