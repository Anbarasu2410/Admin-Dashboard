import Project from "../models/ProjectModel.js";
import Employee from "../models/EmployeeModel.js";
import WorkerTaskAssignment from "../models/WorkerTaskAssignmentModel.js";
import Attendance from "../models/AttendanceModel.js";
import dayjs from "dayjs";




export const getDailyManpowerStatus = async (req, res) => {
  try {
    const { date, projectId } = req.query;

    if (!date) {
      return res.status(400).json({ message: "date is required" });
    }

    // 1️⃣ Assignment filter (date is STRING)
    const assignmentFilter = { date };
    if (projectId) {
      assignmentFilter.projectId = Number(projectId);
    }

    // 2️⃣ Assignments
    const assignments = await WorkerTaskAssignment
      .find(assignmentFilter)
      .lean();

    if (!assignments.length) {
      return res.json({ summary: {}, projects: [] });
    }

    // 3️⃣ Employees (workers)
    const employeeIds = [...new Set(assignments.map(a => a.employeeId))];
    const employees = await Employee
      .find({ id: { $in: employeeIds } })
      .lean();

    const employeeMap = {};
    employees.forEach(e => {
      employeeMap[e.id] = e;
    });

    // 4️⃣ Projects
    const projectIds = [...new Set(assignments.map(a => a.projectId))];
    const projects = await Project
      .find({ id: { $in: projectIds } })
      .lean();

    // 🔴 5️⃣ SUPERVISOR LOOKUP (THIS WAS MISSING BEFORE)
    const supervisorIds = [
      ...new Set(
        projects
          .map(p => p.supervisorId)
          .filter(Boolean)
      )
    ];

    const supervisors = await Employee
      .find({ id: { $in: supervisorIds } })
      .lean();

    const supervisorMap = {};
    supervisors.forEach(s => {
      supervisorMap[s.id] = s.fullName;
    });

    // 6️⃣ Attendance (checkIn is Date)
    const start = dayjs(date).startOf("day").toDate();
    const end   = dayjs(date).endOf("day").toDate();

    const attendance = await Attendance.find({
      projectId: { $in: projectIds },
      employeeId: { $in: employeeIds },
      checkIn: { $gte: start, $lte: end }
    }).lean();

    const attendanceMap = {};
    attendance.forEach(a => {
      attendanceMap[`${a.employeeId}_${a.projectId}`] = a;
    });

    // 7️⃣ Summary
    const summary = {
      assigned: assignments.length,
      present: 0,
      absent: 0,
      notCheckedIn: 0
    };

    // 8️⃣ Response
    const projectWise = projects.map(project => {
      const workers = assignments
        .filter(a => a.projectId === project.id)
        .map(assign => {
          const emp = employeeMap[assign.employeeId];
          const att = attendanceMap[`${assign.employeeId}_${assign.projectId}`];

          let status = "ASSIGNED";

          if (att?.checkIn) {
            status = "PRESENT";
            summary.present++;
          } else if (!att) {
            status = "NOT_CHECKED_IN";
            summary.notCheckedIn++;
          } else {
            status = "ABSENT";
            summary.absent++;
          }

          return {
            employeeCode: emp?.employeeCode,
            name: emp?.fullName,
            trade: emp?.jobTitle,
            status
          };
        });

      return {
        projectId: project.id,
        projectName: project.projectName,
        supervisorId: project.supervisorId,
        supervisorName: supervisorMap[project.supervisorId] || "Unassigned",
        workers
      };
    });

    res.json({ summary, projects: projectWise });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};


