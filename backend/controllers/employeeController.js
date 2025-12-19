import mongoose from 'mongoose';
import multer from 'multer';
import Employee from '../models/EmployeeModel.js';
import EmployeePassport from '../models/EmployeePassportModel.js';
import EmployeeWorkPass from '../models/EmployeeWorkPassModel.js';
import EmployeeQualification from '../models/EmployeeQualificationsModel.js';
import EmployeeCertification from '../models/EmployeeCertificationsModel.js';
import EmployeeDocument from '../models/EmployeeDocumentsModel.js';
import Company from '../models/CompanyModel.js';
import User from '../models/UserModel.js';
import CompanyUser from '../models/CompanyUserModel.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ================= Multer Setup ================= */
const storagePath = path.join(__dirname, '../uploads');
if (!fs.existsSync(storagePath)) {
  fs.mkdirSync(storagePath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, storagePath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const originalName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    cb(null, uniqueSuffix + '-' + originalName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, PDF, and Word documents are allowed.'), false);
  }
};

export const uploadEmployeeFiles = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
}).fields([
  { name: 'passport', maxCount: 1 },
  { name: 'workPassApplication', maxCount: 1 },
  { name: 'workPassMedical', maxCount: 1 },
  { name: 'workPassIssuance', maxCount: 1 },
  { name: 'workPassMOM', maxCount: 1 },
  { name: 'qualifications', maxCount: 10 },
  { name: 'certifications', maxCount: 10 },
  { name: 'documents', maxCount: 10 }
]);

/* ================= Helper Functions ================= */
const validateEmployeeInput = (data) => {
  const { companyId, userId, fullName, employeeCode, status } = data;
  const errors = [];

  if (!companyId) errors.push('Company ID is required');
  if (!fullName) errors.push('Full name is required');
  if (!employeeCode) errors.push('Employee code is required');

  if (companyId && isNaN(companyId)) errors.push('Company ID must be a number');
  if (userId && isNaN(userId)) errors.push('User ID must be a number');

  if (fullName && fullName.trim().length === 0) errors.push('Full name cannot be empty');
  if (fullName && fullName.trim().length > 100) errors.push('Full name must be less than 100 characters');
  if (employeeCode && employeeCode.trim().length > 20) errors.push('Employee code must be less than 20 characters');

  const validStatuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];
  if (status && !validStatuses.includes(status)) errors.push(`Status must be one of: ${validStatuses.join(', ')}`);

  return errors;
};

const normalizeEmployeeData = (data) => {
  const normalized = { ...data };

  // Remove id field as it will be auto-generated
  delete normalized.id;

  if (normalized.companyId) normalized.companyId = parseInt(normalized.companyId, 10);
  if (normalized.userId) normalized.userId = parseInt(normalized.userId, 10);

  // Convert string numbers to actual numbers
  if (normalized.basicSalary) normalized.basicSalary = parseFloat(normalized.basicSalary);
  if (normalized.otCharges) normalized.otCharges = parseFloat(normalized.otCharges);
  if (normalized.housingAllowance) normalized.housingAllowance = parseFloat(normalized.housingAllowance);
  if (normalized.transportAllowance) normalized.transportAllowance = parseFloat(normalized.transportAllowance);
  if (normalized.otherAllowance) normalized.otherAllowance = parseFloat(normalized.otherAllowance);
  if (normalized.housingDeduction) normalized.housingDeduction = parseFloat(normalized.housingDeduction);
  if (normalized.transportDeduction) normalized.transportDeduction = parseFloat(normalized.transportDeduction);
  if (normalized.otherDeduction) normalized.otherDeduction = parseFloat(normalized.otherDeduction);
  if (normalized.annualLeaveDays) normalized.annualLeaveDays = parseInt(normalized.annualLeaveDays, 10);
  if (normalized.medicalLeaveDays) normalized.medicalLeaveDays = parseInt(normalized.medicalLeaveDays, 10);

  // Convert boolean strings to actual booleans
  if (typeof normalized.bonusEligibility === 'string') {
    normalized.bonusEligibility = normalized.bonusEligibility === 'true';
  }

  if (normalized.fullName) normalized.fullName = normalized.fullName.trim().replace(/\s+/g, ' ');
  if (normalized.employeeCode) normalized.employeeCode = normalized.employeeCode.trim();
  if (normalized.phone) normalized.phone = normalized.phone.trim().replace(/\D/g, '');
  if (normalized.jobTitle) normalized.jobTitle = normalized.jobTitle.trim();
  if (normalized.photoUrl) normalized.photoUrl = normalized.photoUrl.trim();

  if (normalized.status) normalized.status = normalized.status.toUpperCase();
  
  // Set default status if not provided
  if (!normalized.status) normalized.status = 'ACTIVE';

  // Set timestamps
  normalized.createdAt = new Date();
  normalized.updatedAt = new Date();

  return normalized;
};

const validateReferentialIntegrity = async (companyId, userId = null) => {
  try {
    const [companyExists, userExists] = await Promise.all([
      Company.findOne({ id: companyId }).select('_id').lean().exec(),
      userId ? User.findOne({ id: userId }).select('_id').lean().exec() : Promise.resolve(true)
    ]);

    const errors = [];
    if (!companyExists) errors.push(`Company with ID ${companyId} does not exist`);
    if (userId && !userExists) errors.push(`User with ID ${userId} does not exist`);

    return { isValid: errors.length === 0, errors };
  } catch (error) {
    console.error('Error in referential integrity check:', error);
    return { isValid: false, errors: ['Database error during validation'] };
  }
};

const checkEmployeeUniqueness = async (employeeCode, excludeEmployeeId = null) => {
  try {
    const query = { employeeCode: employeeCode.trim() };
    if (excludeEmployeeId) query.id = { $ne: excludeEmployeeId };

    const existingByCode = await Employee.findOne(query).select('_id').lean().exec();
    const errors = [];
    if (existingByCode) errors.push(`Employee with code '${employeeCode}' already exists`);

    return { isValid: errors.length === 0, errors };
  } catch (error) {
    console.error('Error in uniqueness check:', error);
    return { isValid: false, errors: ['Database error during uniqueness check'] };
  }
};


// export const getWorkerEmployees = async (req, res) => {
//   try {
//     const { companyId, role = "worker", search = "" } = req.query;

//     if (!companyId) {
//       return res.status(400).json({ 
//         success: false,
//         message: "companyId is required" 
//       });
//     }

//     console.log('🔍 Fetching worker employees for company:', companyId);

//     // Convert companyId to numeric for querying
//     const numericCompanyId = parseInt(companyId);

//     if (isNaN(numericCompanyId)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid company ID format"
//       });
//     }

//     console.log('🔢 Numeric company ID:', numericCompanyId);
    
//     // Step 1: Find all company_user records with role = 'worker'
//     const companyUserRecords = await CompanyUser.find({
//       companyId: numericCompanyId,
//       role,
//     }).lean();

//     console.log('👥 Found company user records:', companyUserRecords);
//     const userIds = companyUserRecords.map((cu) => cu.userId);
//     console.log('👥 Found company users with worker role:', userIds.length);

//     if (userIds.length === 0) {
//       return res.json({
//         success: true,
//         data: [],
//         count: 0,
//         message: "No worker users found for this company"
//       });
//     }

//     // Step 2: Get user emails in bulk
//     const emailMap = await getUserEmailsBulk(userIds);

//     // Step 3: Find all employees linked to those users
//     const query = {
//       companyId: numericCompanyId,
//       status: "ACTIVE",
//       userId: { $in: userIds },
//     };

//     // Add search functionality
//     if (search) {
//       query.$or = [
//         { fullName: { $regex: search, $options: 'i' } },
//         { jobTitle: { $regex: search, $options: 'i' } },
//         { employeeCode: { $regex: search, $options: 'i' } }
//       ];
//     }

//     // Step 4: Fetch employees (no population needed)
//     const employees = await Employee.find(query)
//       .select("id employeeCode fullName jobTitle phone status photoUrl userId")
//       .sort({ fullName: 1 })
//       .lean()
//       .exec();

//     console.log('✅ Found active worker employees:', employees.length);

//     // Transform response to include user email
//     const transformedEmployees = employees.map(employee => ({
//       id: employee.id,
//       employeeCode: employee.employeeCode,
//       fullName: employee.fullName,
//       jobTitle: employee.jobTitle,
//       phone: employee.phone,
//       status: employee.status,
//       photoUrl: employee.photoUrl,
//       email: emailMap[employee.userId] || null,
//       userId: employee.userId
//     }));

//     res.json({
//       success: true,
//       data: transformedEmployees,
//       count: transformedEmployees.length,
//       message: `Found ${transformedEmployees.length} active worker employees`
//     });
//   } catch (err) {
//     console.error("❌ Error fetching worker employees:", err);
//     res.status(500).json({ 
//       success: false,
//       message: "Server error while fetching worker employees", 
//       error: err.message 
//     });
//   }
// };
export const getEmployeesByCompany = async (req, res) => {
  try {
    const companyId = parseInt(req.params.companyId, 10);
    
    if (isNaN(companyId) || companyId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid company ID. Must be a positive integer.',
        timestamp: new Date().toISOString()
      });
    }

    console.log(`🔍 Executing employee retrieval for company ID: ${companyId}`);
    
    const companyDrivers = await CompanyUser.find({ companyId, role: 'driver' })
      .select('userId role')
      .lean()
      .exec();

    const userIds = companyDrivers.map(cd => cd.userId);

    if (userIds.length === 0) {
      return res.json({
        success: true,
        count: 0,
        companyId,
        data: [],
        timestamp: new Date().toISOString()
      });
    }

    const employees = await Employee.find({ userId: { $in: userIds } })
      .select('id employeeCode fullName phone jobTitle status photoUrl userId createdAt')
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    
    console.log(`✅ Company employee retrieval successful: ${employees.length} employees found`);
    
    const emailMap = await getUserEmailsBulk(userIds);
    
    const transformedEmployees = employees.map(employee => 
      transformEmployeeResponse(employee, emailMap)
    );

    return res.json({
      success: true,
      count: transformedEmployees.length,
      companyId: companyId,
      data: transformedEmployees,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Company employee retrieval failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Database error during company employee retrieval: ' + error.message,
      timestamp: new Date().toISOString()
    });
  }
};


const generateEmployeeId = async () => {
  try {
    const lastEmployee = await Employee.findOne().sort({ id: -1 }).exec();
    return lastEmployee ? lastEmployee.id + 1 : 1;
  } catch (error) {
    console.error('Error generating employee ID:', error);
    // Fallback to timestamp-based ID
    return Math.floor(Date.now() / 1000);
  }
};

const getUserEmailById = async (userId) => {
  if (!userId) return null;
  try {
    const user = await User.findOne({ id: userId }).select('email').lean().exec();
    return user ? user.email : null;
  } catch (error) {
    console.error(`Error fetching user email for ID ${userId}:`, error);
    return null;
  }
};

const getUserEmailsBulk = async (userIds) => {
  if (!userIds || userIds.length === 0) return {};
  try {
    const users = await User.find({ id: { $in: userIds } }).select('id email').lean().exec();
    const emailMap = {};
    users.forEach(user => { emailMap[user.id] = user.email; });
    return emailMap;
  } catch (error) {
    console.error('Error fetching user emails in bulk:', error);
    return {};
  }
};

const transformEmployeeResponse = (employee, emailMap = {}) => {
  const userEmail = employee.userId ? (emailMap[employee.userId] || null) : null;
  return {
    id: employee.id,
    companyId: employee.companyId,
    userId: employee.userId,
    employeeCode: employee.employeeCode,
    fullName: employee.fullName,
    phone: employee.phone,
    jobTitle: employee.jobTitle,
    status: employee.status,
    photoUrl: employee.photoUrl,
    email: userEmail,
    createdAt: employee.createdAt,
    updatedAt: employee.updatedAt
  };
};


/* ================= Employee CRUD with Files ================= */
export const createEmployeeWithFiles = async (req, res) => {
  try {
    console.log("---", req.body);

    const data = req.body;
    const {
      companyId,
      userId,
      employeeCode,
      fullName,
      dob,
      gender,
      nationality,
      phone,
      email,
      emergencyContactName,
      emergencyPhone,
      jobTitle,
      status,
      joinDate,
      leftDate,
      salaryDetails,
      passport,
      workPass,
      qualifications,
      certifications,
      documents
    } = data;

    // ----------------------------
    //  EASY HELPERS
    // ----------------------------
    const getUploadedFile = (group, index = 0) =>
      req.files?.[group]?.[index] ? req.files[group][index].filename : null;

    const buildFilePath = (folder, file) =>
      file ? `/uploads/employees/${folder}/${file}` : null;

    const fallbackFile = (obj) => obj?.fileName ?? null;

    // ----------------------------
    //  CHECK UNIQUE EMPLOYEE
    // ----------------------------
    const existingEmployee = await Employee.findOne({
      $or: [{ email }, { phone }]
    });

    if (existingEmployee) {
      return res.status(400).json({
        status: "error",
        message: "Employee with this email or phone already exists"
      });
    }

    // ----------------------------
    //  CREATE EMPLOYEE
    // ----------------------------
    const empId = Math.floor(10000 + Math.random() * 90000);

    const {
      basicSalary,
      otCharges,
      housingAllowance,
      transportAllowance,
      otherAllowance,
      housingDeduction,
      transportDeduction,
      otherDeduction,
      annualLeaveDays,
      medicalLeaveDays,
      bonusEligibility
    } = salaryDetails || {};

    const newEmployee = await Employee.create({
      id: empId,
      companyId,
      userId,
      employeeCode,
      fullName,
      dob,
      gender,
      nationality,
      phone,
      email,
      emergencyContactName,
      emergencyPhone,
      jobTitle,
      status,
      joinDate,
      leftDate,

      // Salary Mapping
      basicSalary,
      otCharges,
      housingAllowance,
      transportAllowance,
      otherAllowance,
      housingDeduction,
      transportDeduction,
      otherDeduction,
      annualLeaveDays,
      medicalLeaveDays,
      bonusEligibility
    });

    const employeeId = newEmployee.id;

    // ----------------------------
    //  PASSPORT
    // ----------------------------
    if (passport) {
      const file = fallbackFile(passport.documentPath);
      await EmployeePassport.create({
        employeeId,
        passportNo: passport.passportNo,
        issueDate: passport.issueDate,
        expiryDate: passport.expiryDate,
        issuingCountry: passport.issuingCountry,
        documentPath: buildFilePath("passport", file)
      });
    }

    // ----------------------------
    //  WORK PASS
    // ----------------------------
    if (workPass) {
      const getWorkFile = (field, uploadField) =>
        buildFilePath(
          "workpass",
          getUploadedFile(uploadField) || fallbackFile(workPass[field])
        );

      await EmployeeWorkPass.create({
        employeeId,
        status: workPass.status,
        workPermitNo: workPass.workPermitNo,
        finNumber: workPass.finNumber,
        applicationDate: workPass.applicationDate,
        issuanceDate: workPass.issuanceDate || null,
        expiryDate: workPass.expiryDate || null,
        medicalDate: workPass.medicalDate || null,

        applicationDoc: getWorkFile("applicationDoc", "workPassApplication"),
        medicalDoc: getWorkFile("medicalDoc", "workPassMedical"),
        issuanceDoc: getWorkFile("issuanceDoc", "workPassIssuance"),
        momDoc: getWorkFile("momDoc", "workPassMOM")
      });
    }

    // ----------------------------
    //  QUALIFICATIONS
    // ----------------------------
    if (qualifications?.length) {
      const qualDocs = qualifications.map((q, index) => {
        const file =
          getUploadedFile("qualifications", index) || fallbackFile(q.documentPath);

        return {
          employeeId,
          name: q.name,
          type: q.type,
          institution: q.institution,
          country: q.country,
          year: q.year,
          documentPath: buildFilePath("qualifications", file)
        };
      });

      await EmployeeQualification.insertMany(qualDocs);
    }

    // ----------------------------
    //  CERTIFICATIONS
    // ----------------------------
    if (certifications?.length) {
      const certDocs = certifications.map((c, index) => {
        const file =
          getUploadedFile("certifications", index) || fallbackFile(c.documentPath);

        return {
          employeeId,
          name: c.name,
          type: c.type,
          ownership: c.ownership,
          issueDate: c.issueDate,
          expiryDate: c.expiryDate,
          documentPath: buildFilePath("certifications", file)
        };
      });

      await EmployeeCertification.insertMany(certDocs);
    }

    // ----------------------------
    //  OTHER DOCUMENTS
    // ----------------------------
    if (documents?.length) {
      const otherDocs = documents.map((doc, index) => {
        const file =
          getUploadedFile("documents", index) || fallbackFile(doc.filePath);

        return {
          employeeId,
          documentType: doc.documentType,
          version: doc.version || 1,
          uploadedBy: doc.uploadedBy,
          uploadedAt: new Date(),
          filePath: buildFilePath("documents", file)
        };
      });

      await EmployeeDocument.insertMany(otherDocs);
    }

    // ----------------------------
    //  RESPONSE
    // ----------------------------
    res.status(201).json({
      status: "success",
      employeeId,
      message: "Employee created with files successfully"
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: "error",
      message: "Failed to create employee",
      error: err.message
    });
  }
};




export const getEmployeesWithFiles = async (req, res) => {
  try {
    const employees = await Employee.find().lean(); // lean() improves speed

    res.status(200).json({
      status: "success",
      employees
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: "error",
      message: "Failed to get employees",
      error: err.message
    });
  }
};
export const getEmployeeByIdWithFiles = async (req, res) => {
  try {
    const id = req.params.id;

    // Fetch employee
    const employee = await Employee.findOne({ id:id })
    if (!employee) {
      return res.status(404).json({ status: "error", message: "Employee not found" });
    }

    // -------------------------------------------------
    // Fetch all related data in parallel (70% faster)
    // -------------------------------------------------
    const [
      passport,
      workPass,
      qualifications,
      certifications,
      documents
    ] = await Promise.all([
      EmployeePassport.findOne({ employeeId: id }).lean(),
      EmployeeWorkPass.findOne({ employeeId: id }).lean(),
      EmployeeQualification.find({ employeeId: id }).lean(),
      EmployeeCertification.find({ employeeId: id }).lean(),
      EmployeeDocument.find({ employeeId: id }).lean()
    ]);

    // -------------------------------------------------
    // Construct unified response object
    // -------------------------------------------------
    const employeeData = {
      companyId: employee.companyId,
      userId: employee.userId,
      employeeCode: employee.employeeCode,
      fullName: employee.fullName,
      dob: employee.dob,
      gender: employee.gender,
      nationality: employee.nationality,
      phone: employee.phone,
      email: employee.email,
      emergencyContactName: employee.emergencyContactName,
      emergencyPhone: employee.emergencyPhone,
      jobTitle: employee.jobTitle,
      status: employee.status,
      joinDate: employee.joinDate,
      leftDate: employee.leftDate,

      // Salary grouped for frontend
      salaryDetails: {
        basicSalary: employee.basicSalary,
        otCharges: employee.otCharges,
        housingAllowance: employee.housingAllowance,
        transportAllowance: employee.transportAllowance,
        otherAllowance: employee.otherAllowance,
        housingDeduction: employee.housingDeduction,
        transportDeduction: employee.transportDeduction,
        otherDeduction: employee.otherDeduction,
        annualLeaveDays: employee.annualLeaveDays,
        medicalLeaveDays: employee.medicalLeaveDays,
        bonusEligibility: employee.bonusEligibility
      },

      // Related collections
      passport: passport || null,
      workPass: workPass || null,
      qualifications: qualifications || [],
      certifications: certifications || [],
      documents: documents || []
    };

    // Send response
    res.status(200).json({
      status: "success",
      employee: employeeData
    });

  } catch (error) {
    console.error("Error fetching employee:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch employee",
      error: error.message
    });
  }
};


export const updateEmployeeWithFiles = async (req, res) => {
  try {
    const employeeId = Number(req.params.id);
    let data = req.body;

    // Flatten salaryDetails
    if (data.salaryDetails) {
      data = { ...data, ...data.salaryDetails };
      delete data.salaryDetails;
    }

    // Helpers
    const getFile = (field) => req.files?.[field]?.[0]?.filename || null;
    const filePath = (folder, filename) => filename ? `/uploads/employees/${folder}/${filename}` : null;
    const cleanObj = (obj) => Object.fromEntries(Object.entries(obj).filter(([k, v]) => v !== undefined && v !== null));
    const extractFileName = (fileObj) => {
      if (!fileObj) return null;
      if (typeof fileObj === "string") return fileObj;
      return fileObj.fileName || fileObj.name || null;
    };

    // 1️⃣ Update base employee
    const employee = await Employee.findOne({ id: employeeId });
    if (!employee) return res.status(404).json({ status: "error", message: "Employee not found" });
    await Employee.findOneAndUpdate({ id: employeeId }, cleanObj({ ...employee._doc, ...data }), { new: true });

    // 2️⃣ Passport
    if (data.passport) {
      const passportData = cleanObj({
        ...data.passport,
        documentPath: getFile("passport") ? filePath("passport", getFile("passport")) : extractFileName(data.passport.documentPath)
      });
      await EmployeePassport.findOneAndUpdate(
        { employeeId },
        { employeeId, ...passportData },
        { upsert: true, new: true }
      );
    }

    // 3️⃣ WorkPass
    if (data.workPass) {
      const wpData = cleanObj({
        ...data.workPass,
        applicationDoc: getFile("workPassApplication") ? filePath("workpass", getFile("workPassApplication")) : extractFileName(data.workPass.applicationDoc),
        medicalDoc: getFile("workPassMedical") ? filePath("workpass", getFile("workPassMedical")) : extractFileName(data.workPass.medicalDoc),
        issuanceDoc: getFile("workPassIssuance") ? filePath("workpass", getFile("workPassIssuance")) : extractFileName(data.workPass.issuanceDoc),
        momDoc: getFile("workPassMOM") ? filePath("workpass", getFile("workPassMOM")) : extractFileName(data.workPass.momDoc)
      });
      await EmployeeWorkPass.findOneAndUpdate(
        { employeeId },
        { employeeId, ...wpData },
        { upsert: true, new: true }
      );
    }

    // 4️⃣ Qualifications (update, create, delete)
    if (Array.isArray(data.qualifications)) {
      const payloadIds = data.qualifications.map(q => q._id).filter(Boolean);
      await EmployeeQualification.deleteMany({ employeeId, _id: { $nin: payloadIds } });
      for (const q of data.qualifications) {
        const qData = cleanObj({
          employeeId,
          ...q,
          documentPath: getFile("qualifications") ? filePath("qualifications", getFile("qualifications")) : extractFileName(q.documentPath)
        });
        if (q._id) {
          await EmployeeQualification.findByIdAndUpdate(q._id, qData, { new: true });
        } else {
          await EmployeeQualification.create(qData);
        }
      }
    }

    // 5️⃣ Certifications
    if (Array.isArray(data.certifications)) {
      const payloadIds = data.certifications.map(c => c._id).filter(Boolean);
      await EmployeeCertification.deleteMany({ employeeId, _id: { $nin: payloadIds } });
      for (const c of data.certifications) {
        const cData = cleanObj({
          employeeId,
          ...c,
          documentPath: getFile("certifications") ? filePath("certifications", getFile("certifications")) : extractFileName(c.documentPath)
        });
        if (c._id) {
          await EmployeeCertification.findByIdAndUpdate(c._id, cData, { new: true });
        } else {
          await EmployeeCertification.create(cData);
        }
      }
    }

    // 6️⃣ Documents
    if (Array.isArray(data.documents)) {
      const payloadIds = data.documents.map(d => d._id).filter(Boolean);
      await EmployeeDocument.deleteMany({ employeeId, _id: { $nin: payloadIds } });
      for (const d of data.documents) {
        const dData = cleanObj({
          employeeId,
          ...d,
          filePath: getFile("documents") ? filePath("documents", getFile("documents")) : extractFileName(d.filePath)
        });
        if (d._id) {
          await EmployeeDocument.findByIdAndUpdate(d._id, dData, { new: true });
        } else {
          await EmployeeDocument.create(dData);
        }
      }
    }

    // 7️⃣ Fetch full updated data
    const updatedEmployee = await Employee.findOne({ id: employeeId }).lean();
    const [passport, workPass, qualifications, certifications, documents] = await Promise.all([
      EmployeePassport.findOne({ employeeId }).lean(),
      EmployeeWorkPass.findOne({ employeeId }).lean(),
      EmployeeQualification.find({ employeeId }).lean(),
      EmployeeCertification.find({ employeeId }).lean(),
      EmployeeDocument.find({ employeeId }).lean()
    ]);

    const employeeData = {
      companyId: updatedEmployee.companyId,
      userId: updatedEmployee.userId,
      employeeCode: updatedEmployee.employeeCode,
      fullName: updatedEmployee.fullName,
      dob: updatedEmployee.dob,
      gender: updatedEmployee.gender,
      nationality: updatedEmployee.nationality,
      phone: updatedEmployee.phone,
      email: updatedEmployee.email,
      emergencyContactName: updatedEmployee.emergencyContactName,
      emergencyPhone: updatedEmployee.emergencyPhone,
      jobTitle: updatedEmployee.jobTitle,
      status: updatedEmployee.status,
      joinDate: updatedEmployee.joinDate,
      leftDate: updatedEmployee.leftDate,
      salaryDetails: {
        basicSalary: updatedEmployee.basicSalary,
        otCharges: updatedEmployee.otCharges,
        housingAllowance: updatedEmployee.housingAllowance,
        transportAllowance: updatedEmployee.transportAllowance,
        otherAllowance: updatedEmployee.otherAllowance,
        housingDeduction: updatedEmployee.housingDeduction,
        transportDeduction: updatedEmployee.transportDeduction,
        otherDeduction: updatedEmployee.otherDeduction,
        annualLeaveDays: updatedEmployee.annualLeaveDays,
        medicalLeaveDays: updatedEmployee.medicalLeaveDays,
        bonusEligibility: updatedEmployee.bonusEligibility
      },
      passport: passport || null,
      workPass: workPass || null,
      qualifications: qualifications || [],
      certifications: certifications || [],
      documents: documents || []
    };

    return res.status(200).json({
      status: "success",
      message: "Employee updated successfully",
      employee: employeeData
    });

  } catch (err) {
    console.error("Error updating employee:", err);
    return res.status(500).json({
      status: "error",
      message: "Failed to update employee",
      error: err.message
    });
  }
};




// export const fetchCompanyEmployeesByRole = async (req, res) => {
//   try {
//     const companyId = parseInt(req.params.companyId, 10);
//     const role = req.params.role?.toLowerCase(); // "driver" or "worker"

//     if (isNaN(companyId)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid company ID"
//       });
//     }

//     if (!["driver", "worker"].includes(role)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid role. Must be driver or worker"
//       });
//     }

//     console.log(`🔍 Fetching ${role}s for company ID: ${companyId}`);

//     // users with that role
//     const companyUsers = await CompanyUser.find({ companyId, role })
//       .select("userId role")
//       .lean()
//       .exec();

//     const userIds = companyUsers.map(u => u.userId);

//     if (userIds.length === 0) {
//       return res.json({
//         success: true,
//         count: 0,
//         companyId,
//         role,
//         data: []
//       });
//     }

//     // employees linked to those userIds
//     const employees = await Employee.find({ userId: { $in: userIds } })
//       .select("id employeeCode fullName phone jobTitle status photoUrl userId createdAt")
//       .sort({ createdAt: -1 })
//       .lean()
//       .exec();

//     const emailMap = await getUserEmailsBulk(userIds);

//     const transformed = employees.map((emp) =>
//       transformEmployeeResponse(emp, emailMap)
//     );

//     return res.json({
//       success: true,
//       count: transformed.length,
//       companyId,
//       role,
//       data: transformed
//     });

//   } catch (error) {
//     console.error("❌ Error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Internal error: " + error.message
//     });
//   }
// };


// ------------------- UPDATE -------------------



// ------------------- DELETE -------------------
export const deleteEmployeeWithFiles = async (req, res) => {
  try {
    const employeeId = Number(req.params.id); // 👈 convert to number

    // ------------------------------------------------------
    // Check employee exists by custom id
    // ------------------------------------------------------
    const employee = await Employee.findOne({ id: employeeId });
    if (!employee) {
      return res.status(404).json({
        status: "error",
        message: "Employee not found"
      });
    }

    // ------------------------------------------------------
    // Delete employee + related records in parallel
    // ------------------------------------------------------
    await Promise.all([
      Employee.deleteOne({ id: employeeId }),                         // 👈 custom ID delete
      EmployeePassport.deleteMany({ employeeId: employeeId }),        // 👈 match by employeeId (number)
      EmployeeWorkPass.deleteMany({ employeeId: employeeId }),
      EmployeeQualification.deleteMany({ employeeId: employeeId }),
      EmployeeCertification.deleteMany({ employeeId: employeeId }),
      EmployeeDocument.deleteMany({ employeeId: employeeId })
    ]);

    // ------------------------------------------------------
    // RESPONSE
    // ------------------------------------------------------
    res.status(200).json({
      status: "success",
      message: "Employee and related records deleted successfully"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: "error",
      message: "Failed to delete employee",
      error: err.message
    });
  }
};


// export const createEmployeeWithFiles = async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     console.log('🔄 Starting employee creation with files...');
//     const body = { ...req.body };
    
//     console.log('📦 Raw request body keys:', Object.keys(body));
//     console.log('📁 Received files:', req.files ? Object.keys(req.files) : 'No files');

//     // Parse JSON strings for nested objects
//     try {
//       if (body.passport && typeof body.passport === 'string') {
//         body.passport = JSON.parse(body.passport);
//       }
//       if (body.workPass && typeof body.workPass === 'string') {
//         body.workPass = JSON.parse(body.workPass);
//       }
//       if (body.qualifications && typeof body.qualifications === 'string') {
//         body.qualifications = JSON.parse(body.qualifications);
//       }
//       if (body.certifications && typeof body.certifications === 'string') {
//         body.certifications = JSON.parse(body.certifications);
//       }
//       if (body.documents && typeof body.documents === 'string') {
//         body.documents = JSON.parse(body.documents);
//       }
//     } catch (parseError) {
//       console.error('❌ JSON parsing error:', parseError);
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(400).json({ 
//         success: false, 
//         message: 'Invalid JSON format in request body' 
//       });
//     }

//     // Generate employee ID
//     const employeeId = await generateEmployeeId();
    
//     const normalizedData = normalizeEmployeeData(body);
//     normalizedData.id = employeeId;
    
//     console.log('✅ Normalized employee data:', {
//       id: normalizedData.id,
//       employeeCode: normalizedData.employeeCode,
//       fullName: normalizedData.fullName,
//       companyId: normalizedData.companyId
//     });

//     // Validate input
//     const validationErrors = validateEmployeeInput(normalizedData);
//     if (validationErrors.length > 0) {
//       console.error('❌ Validation errors:', validationErrors);
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(400).json({ 
//         success: false, 
//         message: validationErrors.join(', ') 
//       });
//     }

//     // Check referential integrity and uniqueness
//     const [referentialCheck, uniquenessCheck] = await Promise.all([
//       validateReferentialIntegrity(normalizedData.companyId, normalizedData.userId),
//       checkEmployeeUniqueness(normalizedData.employeeCode)
//     ]);

//     if (!referentialCheck.isValid) {
//       console.error('❌ Referential integrity errors:', referentialCheck.errors);
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(400).json({ 
//         success: false, 
//         message: referentialCheck.errors.join(', ') 
//       });
//     }

//     if (!uniquenessCheck.isValid) {
//       console.error('❌ Uniqueness errors:', uniquenessCheck.errors);
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(409).json({ 
//         success: false, 
//         message: uniquenessCheck.errors.join(', ') 
//       });
//     }

//     // ========== CREATE EMPLOYEE IN MAIN COLLECTION ==========
//     const employeeData = {
//       id: employeeId,
//       companyId: normalizedData.companyId,
//       userId: normalizedData.userId,
//       employeeCode: normalizedData.employeeCode,
//       fullName: normalizedData.fullName,
//       dob: normalizedData.dob,
//       gender: normalizedData.gender,
//       nationality: normalizedData.nationality,
//       phone: normalizedData.phone,
//       email: normalizedData.email,
//       emergencyContactName: normalizedData.emergencyContactName,
//       emergencyPhone: normalizedData.emergencyPhone,
//       jobTitle: normalizedData.jobTitle,
//       joinDate: normalizedData.joinDate,
//       leftDate: normalizedData.leftDate,
//       basicSalary: normalizedData.basicSalary,
//       otCharges: normalizedData.otCharges,
//       housingAllowance: normalizedData.housingAllowance,
//       transportAllowance: normalizedData.transportAllowance,
//       otherAllowance: normalizedData.otherAllowance,
//       housingDeduction: normalizedData.housingDeduction,
//       transportDeduction: normalizedData.transportDeduction,
//       otherDeduction: normalizedData.otherDeduction,
//       annualLeaveDays: normalizedData.annualLeaveDays,
//       medicalLeaveDays: normalizedData.medicalLeaveDays,
//       bonusEligibility: normalizedData.bonusEligibility,
//       status: normalizedData.status,
//       createdAt: normalizedData.createdAt,
//       updatedAt: normalizedData.updatedAt
//     };

//     console.log('🎯 Creating employee in main collection...');
//     const employee = new Employee(employeeData);
//     const savedEmployee = await employee.save({ session });
//     console.log('✅ Employee saved to main collection:', savedEmployee.id);

//     // ========== SAVE TO DIFFERENT COLLECTIONS ==========
//     const saveOperations = [];

//     // 1. Save to EmployeePassport collection
//     if (body.passport && Object.keys(body.passport).length > 0) {
//       const passportData = {
//         employeeId: savedEmployee.id,
//         passportNo: body.passport.passportNo,
//         issueDate: body.passport.issueDate,
//         expiryDate: body.passport.expiryDate,
//         issuingCountry: body.passport.issuingCountry,
//         documentPath: req.files.passport?.[0]?.path || null,
//         createdAt: new Date(),
//         updatedAt: new Date()
//       };
//       console.log('📝 Saving to EmployeePassport collection:', passportData);
//       saveOperations.push(EmployeePassport.create([passportData], { session }));
//     }

//     // 2. Save to EmployeeWorkPass collection
//     if (body.workPass && Object.keys(body.workPass).length > 0) {
//       const workPassData = {
//         employeeId: savedEmployee.id,
//         status: body.workPass.status,
//         workPermitNo: body.workPass.workPermitNo,
//         finNumber: body.workPass.finNumber,
//         applicationDate: body.workPass.applicationDate,
//         issuanceDate: body.workPass.issuanceDate,
//         expiryDate: body.workPass.expiryDate,
//         medicalDate: body.workPass.medicalDate,
//         applicationFile: req.files.workPassApplication?.[0]?.path || null,
//         medicalFile: req.files.workPassMedical?.[0]?.path || null,
//         issuanceFile: req.files.workPassIssuance?.[0]?.path || null,
//         momFile: req.files.workPassMOM?.[0]?.path || null,
//         createdAt: new Date(),
//         updatedAt: new Date()
//       };
//       console.log('📝 Saving to EmployeeWorkPass collection:', workPassData);
//       saveOperations.push(EmployeeWorkPass.create([workPassData], { session }));
//     }

//     // 3. Save to EmployeeQualification collection
//     if (body.qualifications && Array.isArray(body.qualifications) && body.qualifications.length > 0) {
//       const qualificationsData = body.qualifications.map((q, index) => ({
//         employeeId: savedEmployee.id,
//         name: q.name,
//         type: q.type,
//         institution: q.institution,
//         country: q.country,
//         year: q.year,
//         documentPath: req.files.qualifications?.[index]?.path || null,
//         createdAt: new Date(),
//         updatedAt: new Date()
//       }));
//       console.log('📝 Saving to EmployeeQualification collection:', qualificationsData.length, 'records');
//       saveOperations.push(EmployeeQualification.create(qualificationsData, { session }));
//     }

//     // 4. Save to EmployeeCertification collection
//     if (body.certifications && Array.isArray(body.certifications) && body.certifications.length > 0) {
//       const certificationsData = body.certifications.map((c, index) => ({
//         employeeId: savedEmployee.id,
//         name: c.name,
//         type: c.type,
//         ownership: c.ownership,
//         issueDate: c.issueDate,
//         expiryDate: c.expiryDate,
//         documentPath: req.files.certifications?.[index]?.path || null,
//         createdAt: new Date(),
//         updatedAt: new Date()
//       }));
//       console.log('📝 Saving to EmployeeCertification collection:', certificationsData.length, 'records');
//       saveOperations.push(EmployeeCertification.create(certificationsData, { session }));
//     }

//     // 5. Save to EmployeeDocument collection
//     if (body.documents && Array.isArray(body.documents) && body.documents.length > 0) {
//       const documentsData = body.documents.map((d, index) => ({
//         employeeId: savedEmployee.id,
//         documentType: d.documentType,
//         version: d.version || 1,
//         uploadedBy: d.uploadedBy,
//         documentPath: req.files.documents?.[index]?.path || null,
//         createdAt: new Date(),
//         updatedAt: new Date()
//       }));
//       console.log('📝 Saving to EmployeeDocument collection:', documentsData.length, 'records');
//       saveOperations.push(EmployeeDocument.create(documentsData, { session }));
//     }

//     // Execute all save operations to different collections
//     if (saveOperations.length > 0) {
//       console.log('🔄 Saving to', saveOperations.length, 'different collections...');
//       await Promise.all(saveOperations);
//       console.log('✅ All data saved to different collections successfully');
//     }

//     // Commit transaction
//     await session.commitTransaction();
//     session.endSession();

//     console.log('🎉 Employee creation completed successfully across all collections');

//     return res.status(201).json({
//       success: true,
//       message: 'Employee created successfully across all collections',
//       data: {
//         id: savedEmployee.id,
//         employeeCode: savedEmployee.employeeCode,
//         fullName: savedEmployee.fullName,
//         companyId: savedEmployee.companyId,
//         status: savedEmployee.status,
//         collections: [
//           'Employee',
//           ...(body.passport ? ['EmployeePassport'] : []),
//           ...(body.workPass ? ['EmployeeWorkPass'] : []),
//           ...(body.qualifications ? ['EmployeeQualification'] : []),
//           ...(body.certifications ? ['EmployeeCertification'] : []),
//           ...(body.documents ? ['EmployeeDocument'] : [])
//         ]
//       }
//     });

//   } catch (error) {
//     // Abort transaction on error
//     await session.abortTransaction();
//     session.endSession();
    
//     console.error('❌ Error creating employee with files:', error);
    
//     // Clean up uploaded files if transaction failed
//     if (req.files) {
//       Object.values(req.files).flat().forEach(file => {
//         if (fs.existsSync(file.path)) {
//           fs.unlinkSync(file.path);
//         }
//       });
//     }

//     // Handle specific error types
//     if (error.name === 'ValidationError') {
//       const errors = Object.values(error.errors).map(err => err.message);
//       return res.status(400).json({
//         success: false,
//         message: 'Validation error',
//         errors: errors
//       });
//     }

//     if (error.code === 11000) {
//       return res.status(409).json({
//         success: false,
//         message: 'Employee with this code already exists'
//       });
//     }

//     return res.status(500).json({
//       success: false,
//       message: 'Internal server error: ' + error.message
//     });
//   }
// };

// /* ================= Other CRUD Functions ================= */

/**
 * GET /api/employees - Get all employees with optimized query execution
 */
export const getEmployees = async (req, res) => {
  try {
    console.log('🔄 Executing real-time employee retrieval from MongoDB...');
    
    const employees = await Employee.find()
      .select('id companyId userId employeeCode fullName phone jobTitle status photoUrl createdAt')
      .sort({ createdAt: -1 })
      .lean()
      .maxTimeMS(10000)
      .exec();
    
    console.log(`✅ Employee retrieval successful: ${employees.length} records processed`);
    
    const userIds = [...new Set(employees.map(emp => emp.userId).filter(Boolean))];
    const emailMap = await getUserEmailsBulk(userIds);
    
    const transformedEmployees = employees.map(employee => 
      transformEmployeeResponse(employee, emailMap)
    );

    return res.json({
      success: true,
      count: transformedEmployees.length,
      data: transformedEmployees,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Employee retrieval failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Database error during employee retrieval: ' + error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * GET /api/employees/:id - Get specific employee by ID with optimized query
 */
export const getEmployeeById = async (req, res) => {
  try {
    const employeeId = parseInt(req.params.id, 10);
    
    if (isNaN(employeeId) || employeeId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid employee ID. Must be a positive integer.',
        timestamp: new Date().toISOString()
      });
    }

    console.log(`🔍 Executing employee retrieval for ID: ${employeeId}`);
    
    const employee = await Employee.findOne({ id: employeeId })
      .select('-__v')
      .lean()
      .exec();
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: `Employee with ID ${employeeId} not found`,
        timestamp: new Date().toISOString()
      });
    }

    const userEmail = await getUserEmailById(employee.userId);
    
    console.log(`✅ Employee retrieval successful: ${employee.fullName}`);
    
    return res.json({
      success: true,
      data: {
        ...transformEmployeeResponse(employee),
        email: userEmail
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`❌ Employee retrieval failed for ID ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Database error during employee retrieval: ' + error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * GET /api/employees/company/:companyId - Get employees by company ID
 */
// export const getEmployeesByCompany = async (req, res) => {
//   try {
//     const companyId = parseInt(req.params.companyId, 10);

//     if (isNaN(companyId) || companyId <= 0) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid company ID. Must be a positive integer.',
//         timestamp: new Date().toISOString()
//       });
//     }

//     // Get all drivers for this company
//     const companyDrivers = await CompanyUser.find({ companyId, role: 'driver' })
//       .select('userId')
//       .lean();

//     const userIds = companyDrivers.map(cd => cd.userId);
//     if (userIds.length === 0) {
//       return res.json({
//         success: true,
//         count: 0,
//         companyId,
//         data: [],
//         timestamp: new Date().toISOString()
//       });
//     }

//     // Fetch employee data
//     const employees = await Employee.find({ userId: { $in: userIds } })
//       .select('id employeeCode fullName phone jobTitle status photoUrl userId createdAt')
//       .sort({ createdAt: -1 })
//       .lean();

//     // Transform data inline (no external email merge)
//     const data = employees.map(emp => ({
//       ...emp
//     }));

//     return res.json({
//       success: true,
//       count: data.length,
//       companyId,
//       data,
//       timestamp: new Date().toISOString()
//     });

//   } catch (error) {
//     console.error('❌ Company employee retrieval failed:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Database error during company employee retrieval: ' + error.message,
//       timestamp: new Date().toISOString()
//     });
//   }
// };
export const getWorkerEmployees = async (req, res) => {
  try {
    const { companyId, role = "worker", search = "" } = req.query;

    if (!companyId) {
      return res.status(400).json({ 
        success: false,
        message: "companyId is required" 
      });
    }

    console.log('🔍 Fetching worker employees for company:', companyId);

    // Convert companyId to numeric for querying
    const numericCompanyId = parseInt(companyId);

    if (isNaN(numericCompanyId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid company ID format"
      });
    }

    console.log('🔢 Numeric company ID:', numericCompanyId);
    
    // Step 1: Find all company_user records with role = 'worker'
    const companyUserRecords = await CompanyUser.find({
      companyId: numericCompanyId,
      role,
    }).lean();

    console.log('👥 Found company user records:', companyUserRecords);
    const userIds = companyUserRecords.map((cu) => cu.userId);
    console.log('👥 Found company users with worker role:', userIds.length);

    if (userIds.length === 0) {
      return res.json({
        success: true,
        data: [],
        count: 0,
        message: "No worker users found for this company"
      });
    }

    // Step 2: Get user emails in bulk
    const emailMap = await getUserEmailsBulk(userIds);

    // Step 3: Find all employees linked to those users
    const query = {
      companyId: numericCompanyId,
      status: "ACTIVE",
      userId: { $in: userIds },
    };

    // Add search functionality
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { jobTitle: { $regex: search, $options: 'i' } },
        { employeeCode: { $regex: search, $options: 'i' } }
      ];
    }

    // Step 4: Fetch employees (no population needed)
    const employees = await Employee.find(query)
      .select("id employeeCode fullName jobTitle phone status photoUrl userId")
      .sort({ fullName: 1 })
      .lean()
      .exec();

    console.log('✅ Found active worker employees:', employees.length);

    // Transform response to include user email
    const transformedEmployees = employees.map(employee => ({
      id: employee.id,
      employeeCode: employee.employeeCode,
      fullName: employee.fullName,
      jobTitle: employee.jobTitle,
      phone: employee.phone,
      status: employee.status,
      photoUrl: employee.photoUrl,
      email: emailMap[employee.userId] || null,
      userId: employee.userId
    }));

    res.json({
      success: true,
      data: transformedEmployees,
      count: transformedEmployees.length,
      message: `Found ${transformedEmployees.length} active worker employees`
    });
  } catch (err) {
    console.error("❌ Error fetching worker employees:", err);
    res.status(500).json({ 
      success: false,
      message: "Server error while fetching worker employees", 
      error: err.message 
    });
  }
};

/**
 * GET /api/employees/company/:companyId/active - Get active employees for driver assignment
 */
export const getActiveEmployeesByCompany = async (req, res) => {
  try {
    const companyId = parseInt(req.params.companyId, 10);
    
    if (isNaN(companyId) || companyId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid company ID. Must be a positive integer.',
        timestamp: new Date().toISOString()
      });
    }

    console.log(`🔍 Executing active employee retrieval for company ID: ${companyId}`);
    
    const activeEmployees = await Employee.find({ 
      companyId: companyId,
      status: 'ACTIVE'
    })
    .select('id employeeCode fullName jobTitle phone photoUrl userId')
    .sort({ fullName: 1 })
    .lean()
    .exec();
    
    console.log(`✅ Active employee retrieval successful: ${activeEmployees.length} active employees found`);
    
    const userIds = [...new Set(activeEmployees.map(emp => emp.userId).filter(Boolean))];
    const emailMap = await getUserEmailsBulk(userIds);
    
    const transformedEmployees = activeEmployees.map(employee => ({
      id: employee.id,
      employeeCode: employee.employeeCode,
      fullName: employee.fullName,
      jobTitle: employee.jobTitle,
      phone: employee.phone,
      photoUrl: employee.photoUrl,
      email: emailMap[employee.userId] || null,
      userId: employee.userId
    }));

    return res.json({
      success: true,
      count: transformedEmployees.length,
      companyId: companyId,
      data: transformedEmployees,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Active employee retrieval failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Database error during active employee retrieval: ' + error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * GET /api/employees/status/:status - Get employees by status with validation
 */
export const getEmployeesByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const validStatuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];
    
    if (!validStatuses.includes(status.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        timestamp: new Date().toISOString()
      });
    }

    console.log(`🔍 Executing employee retrieval for status: ${status}`);
    
    const employees = await Employee.find({ status: status.toUpperCase() })
      .select('id companyId employeeCode fullName jobTitle photoUrl userId createdAt')
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    
    console.log(`✅ Status-based employee retrieval successful: ${employees.length} employees found`);
    
    const userIds = [...new Set(employees.map(emp => emp.userId).filter(Boolean))];
    const emailMap = await getUserEmailsBulk(userIds);
    
    const transformedEmployees = employees.map(employee => 
      transformEmployeeResponse(employee, emailMap)
    );

    return res.json({
      success: true,
      count: transformedEmployees.length,
      status: status.toUpperCase(),
      data: transformedEmployees,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Status-based employee retrieval failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Database error during status-based employee retrieval: ' + error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * POST /api/employees - Creates a new employee with comprehensive validation
 */
export const createEmployee = async (req, res) => {
  try {
    console.log('👤 Executing employee creation process...');

    const validationErrors = validateEmployeeInput(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: validationErrors.join(', '),
        timestamp: new Date().toISOString()
      });
    }

    const normalizedData = normalizeEmployeeData(req.body);
    
    const employeeId = await generateEmployeeId();
    normalizedData.id = employeeId;

    const [referentialCheck, uniquenessCheck] = await Promise.all([
      validateReferentialIntegrity(normalizedData.companyId, normalizedData.userId),
      checkEmployeeUniqueness(normalizedData.employeeCode)
    ]);

    if (!referentialCheck.isValid) {
      return res.status(400).json({
        success: false,
        message: referentialCheck.errors.join(', '),
        timestamp: new Date().toISOString()
      });
    }

    if (!uniquenessCheck.isValid) {
      return res.status(409).json({
        success: false,
        message: uniquenessCheck.errors.join(', '),
        timestamp: new Date().toISOString()
      });
    }

    const employeeData = {
      id: employeeId,
      companyId: normalizedData.companyId,
      userId: normalizedData.userId || null,
      employeeCode: normalizedData.employeeCode,
      fullName: normalizedData.fullName,
      phone: normalizedData.phone || null,
      jobTitle: normalizedData.jobTitle || null,
      photoUrl: normalizedData.photoUrl || null,
      status: normalizedData.status || 'ACTIVE',
      createdAt: normalizedData.createdAt || new Date(),
      updatedAt: new Date()
    };

    console.log('✅ Employee data validated, proceeding with creation...');

    const employee = new Employee(employeeData);
    const savedEmployee = await employee.save();

    const userEmail = await getUserEmailById(savedEmployee.userId);

    console.log(`✅ Employee creation successful: ${savedEmployee.fullName} (ID: ${savedEmployee.id})`);

    return res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: {
        ...transformEmployeeResponse(savedEmployee.toObject()),
        email: userEmail
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Employee creation process failed:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Data validation error',
        errors: errors,
        timestamp: new Date().toISOString()
      });
    }
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        success: false,
        message: `Employee with this ${field} already exists`,
        timestamp: new Date().toISOString()
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Server error during employee creation: ' + error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * PUT /api/employees/:id - Updates existing employee with comprehensive validation
 */
export const updateEmployee = async (req, res) => {
  try {
    const employeeId = parseInt(req.params.id, 10);
    
    if (isNaN(employeeId) || employeeId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid employee ID. Must be a positive integer.',
        timestamp: new Date().toISOString()
      });
    }

    console.log(`✏️ Executing employee update process for ID: ${employeeId}`);

    const updateData = normalizeEmployeeData(req.body);
    updateData.updatedAt = new Date();

    const [existingEmployee, referentialCheck, uniquenessCheck] = await Promise.all([
      Employee.findOne({ id: employeeId }).exec(),
      updateData.companyId || updateData.userId ? 
        validateReferentialIntegrity(
          updateData.companyId || employeeId, 
          updateData.userId
        ) : 
        Promise.resolve({ isValid: true, errors: [] }),
      updateData.employeeCode ? 
        checkEmployeeUniqueness(updateData.employeeCode, employeeId) : 
        Promise.resolve({ isValid: true, errors: [] })
    ]);

    if (!existingEmployee) {
      return res.status(404).json({
        success: false,
        message: `Employee with ID ${employeeId} not found`,
        timestamp: new Date().toISOString()
      });
    }

    if (!referentialCheck.isValid) {
      return res.status(400).json({
        success: false,
        message: referentialCheck.errors.join(', '),
        timestamp: new Date().toISOString()
      });
    }

    if (!uniquenessCheck.isValid) {
      return res.status(409).json({
        success: false,
        message: uniquenessCheck.errors.join(', '),
        timestamp: new Date().toISOString()
      });
    }

    const employee = await Employee.findOneAndUpdate(
      { id: employeeId },
      updateData,
      { 
        new: true, 
        runValidators: true,
        context: 'query'
      }
    );

    const userEmail = await getUserEmailById(employee.userId);

    console.log(`✅ Employee update successful: ${employee.fullName}`);

    return res.json({
      success: true,
      message: 'Employee updated successfully',
      data: {
        ...transformEmployeeResponse(employee.toObject()),
        email: userEmail
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`❌ Employee update process failed for ID ${req.params.id}:`, error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Data validation error during update',
        errors: errors,
        timestamp: new Date().toISOString()
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Employee with this employee code already exists',
        timestamp: new Date().toISOString()
      });
    }

    return res.status(400).json({
      success: false,
      message: 'Update process failed: ' + error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * DELETE /api/employees/:id - Deletes employee by ID with proper validation
 */
export const deleteEmployee = async (req, res) => {
  try {
    const employeeId = parseInt(req.params.id, 10);
    
    if (isNaN(employeeId) || employeeId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid employee ID. Must be a positive integer.',
        timestamp: new Date().toISOString()
      });
    }

    console.log(`🗑️ Executing employee deletion process for ID: ${employeeId}`);

    const employee = await Employee.findOneAndDelete({ id: employeeId });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: `Employee with ID ${employeeId} not found`,
        timestamp: new Date().toISOString()
      });
    }

    console.log(`✅ Employee deletion successful: ${employee.fullName}`);

    return res.json({
      success: true,
      message: 'Employee deleted successfully',
      deletedEmployee: {
        id: employee.id,
        fullName: employee.fullName,
        employeeCode: employee.employeeCode,
        companyId: employee.companyId,
        status: employee.status,
        createdAt: employee.createdAt
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`❌ Employee deletion process failed for ID ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Database error during employee deletion: ' + error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * PATCH /api/employees/:id/status - Updates employee status with validation
 */
export const updateEmployeeStatus = async (req, res) => {
  try {
    const employeeId = parseInt(req.params.id, 10);
    const { status } = req.body;
    
    if (isNaN(employeeId) || employeeId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid employee ID. Must be a positive integer.',
        timestamp: new Date().toISOString()
      });
    }

    const validStatuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];
    if (!status || !validStatuses.includes(status.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        timestamp: new Date().toISOString()
      });
    }

    console.log(`🔄 Executing status update for employee ${employeeId} to: ${status}`);

    const employee = await Employee.findOneAndUpdate(
      { id: employeeId },
      { status: status.toUpperCase(), updatedAt: new Date() },
      { new: true }
    );

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: `Employee with ID ${employeeId} not found`,
        timestamp: new Date().toISOString()
      });
    }

    const userEmail = await getUserEmailById(employee.userId);

    console.log(`✅ Status update successful: ${employee.fullName} -> ${employee.status}`);

    return res.json({
      success: true,
      message: `Employee status updated to ${employee.status}`,
      data: {
        id: employee.id,
        fullName: employee.fullName,
        employeeCode: employee.employeeCode,
        status: employee.status,
        email: userEmail
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`❌ Status update process failed for employee ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Database error during status update: ' + error.message,
      timestamp: new Date().toISOString()
    });
  }
};

export default {
  createEmployeeWithFiles,
  uploadEmployeeFiles,
  getEmployees,
  getEmployeeById,
  getEmployeesByCompany,
  getActiveEmployeesByCompany,
  getEmployeesByStatus,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  updateEmployeeStatus,
 
};