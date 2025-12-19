import Trade from "../models/TradeModel.js";
import Material from "../models/MaterialModel.js";
import Tool from "../models/ToolModel.js";
import Client from "../models/ClientModel.js";
import CompanyUsers from "../models/CompanyUserModel.js";
 import Employees from "../models/EmployeeModel.js";



export const getTrades = async (req, res) => {
  try {
    const trades = await Trade.find().lean();
    return res.json(trades);
  } catch (err) {
    return res.status(500).json({ status: "error", message: err.message });
  }
};

export const getMaterials = async (req, res) => {
  try {
    const materials = await Material.find().lean();
    return res.json(materials);
  } catch (err) {
    return res.status(500).json({ status: "error", message: err.message });
  }
};

export const getTools = async (req, res) => {
  try {
    const tools = await Tool.find().lean();
    return res.json(tools);
  } catch (err) {
    return res.status(500).json({ status: "error", message: err.message });
  }
};

export const getClients = async (req, res) => {
  try {
    const clients = await Client.find().lean();
    return res.json(clients);
  } catch (err) {
    return res.status(500).json({ status: "error", message: err.message });
  }
};

// export const getUsersByRole = async (req, res) => {
//   try {
//     const { role } = req.query;
//     const filter = role ? { role } : {};
//     const users = await User.find(filter).lean();
//     return res.json(users);
//   } catch (err) {
//     return res.status(500).json({ status: "error", message: err.message });
//   }
// };



export const getUsersByRole = async (req, res) => {
  
  try {
    const { role } = req.query;
    const filter = {};
    if (role) filter.role = role;

    // 1. Get company users with that role
    const companyUsers = await CompanyUsers.find(filter).lean();

    

    if (companyUsers.length === 0) {
      return res.json({ success: true, count: 0, data: [] });
    }

    // 2. Extract userIds
    const userIds = companyUsers.map(u => u.userId);

    // 3. Find employees with same userIds
    const employees = await Employees.find({ userId: { $in: userIds } }).lean();

    // 4. Create employee map for fast lookup
    const employeeMap = new Map();
    employees.forEach(emp => employeeMap.set(emp.userId, emp));

    // 5. Merge manually
    const result = companyUsers
      .map(cu => {
        const emp = employeeMap.get(cu.userId);
        if (!emp) return null;

        return {
          companyUserId: cu.id,
          companyId: cu.companyId,
          userId: cu.userId,
          role: cu.role,
          isPrimary: cu.isPrimary,

          fullName: emp.fullName,
          phone: emp.phone,
          employeeCode: emp.employeeCode,
          jobTitle: emp.jobTitle,
          status: emp.status,
          photoUrl: emp.photoUrl
        };
      })
      .filter(item => item !== null);

    return res.json({ success: true, count: result.length, data: result });

  } catch (err) {
    return res.status(500).json({ status: "error", message: err.message });
  }
};

