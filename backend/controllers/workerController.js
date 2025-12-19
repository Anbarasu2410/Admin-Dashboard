
import Employee from "../models/EmployeeModel.js";
import WorkerTaskAssignment from "../models/WorkerTaskAssignmentModel.js";

export const getAvailableWorkers = async (req, res) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date parameter is required (YYYY-MM-DD)'
      });
    }

    // Get already assigned workers for the date
    const assignedAssignments = await WorkerTaskAssignment.find({ date });
    const assignedEmployeeIds = assignedAssignments.map(a => a.employeeId);

    // Find available active employees
    const availableWorkers = await Employee.find({
      status: 'active',
      id: { $nin: assignedEmployeeIds }
    })
    .select('id fullName trade phone status employeeCode companyId')
    .sort({ fullName: 1 });

    res.json({
      success: true,
      data: availableWorkers,
      count: availableWorkers.length,
      message: 'Available workers fetched successfully'
    });
  } catch (error) {
    console.error('❌ Error fetching available workers:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching available workers',
      error: error.message
    });
  }
};

