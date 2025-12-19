import Project from "../models/ProjectModel.js";
import ProjectTeamMember from "../models/ProjectTeamMemberModel.js";
import ProjectManpowerRequirement from "../models/ProjectManpowerRequirementModel.js";
import ProjectMaterialRequirement from "../models/ProjectMaterialRequirementModel.js";
import ProjectToolRequirement from "../models/ProjectToolRequirementModel.js";
import ProjectDocument from "../models/ProjectDocumentModel.js";
import Tools from "../models/ToolModel.js"

// 1. CORE PROJECT

export const createProject = async (req, res) => {
  try {
    const data = req.body;

    const project = await Project.create({
      projectName: data.projectName,
      projectCode: data.projectCode,
      companyId: data.companyId,
      clientId: data.clientId,
      projectType: data.projectType,
      department: data.department,
      startDate: data.startDate,
      expectedEndDate: data.expectedEndDate,
      remarks: data.remarks
    });

    return res.json({ status: "success", projectId: project._id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "error", message: err.message });
  }
};

export const updateProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const data = req.body;

    await Project.findByIdAndUpdate(projectId, {
      projectName: data.projectName,
      projectCode: data.projectCode,
      companyId: data.companyId,
      clientId: data.clientId,
      projectType: data.projectType,
      department: data.department,
      startDate: data.startDate,
      expectedEndDate: data.expectedEndDate,
      remarks: data.remarks
    });

    return res.json({ status: "success" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "error", message: err.message });
  }
};

//  export const getProject = async (req, res) => {
  
//   try {
//     const { projectId } = req.params;

//     const project = await Project.findById(projectId).lean();
//     if (!project) return res.status(404).json({ status: "error", message: "Project not found" });

//     return res.json(project);
//   } catch (err) {
//     console.error(err);
//     return res.status(500).json({ status: "error", message: err.message });
//   }
// };


export const getProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    // 1️⃣ Validate projectId format
    if (!projectId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ status: "error", message: "Invalid projectId format" });
    }

    // 2️⃣ Fetch main project
    const project = await Project.findById(projectId).lean();
    if (!project) return res.status(404).json({ status: "error", message: "Project not found" });

    // 3️⃣ Fetch related collections in parallel
    const [teamMembers, manpower, materials, tools, documents, allTools] = await Promise.all([
      ProjectTeamMember.find({ projectId }).lean(),
      ProjectManpowerRequirement.find({ projectId }).lean(),
      ProjectMaterialRequirement.find({ projectId }).lean(),
      ProjectToolRequirement.find({ projectId }).lean(),
      ProjectDocument.find({ projectId }).lean(),
      Tools.find({}).lean() // ✅ fetch all master tools
    ]);

    // 4️⃣ Format team consistently (all arrays)
    const team = {};
    teamMembers.forEach(member => {
      const role = member.role.toLowerCase();
      if (!team[role]) team[role] = [];
      team[role].push(member.userId);
    });

    // 5️⃣ Build response payload
    const payload = {
      basicInfo: {
        projectName: project.projectName,
        projectCode: project.projectCode,
        companyId: project.companyId,
        clientId: project.clientId ?? null,
        projectType: project.projectType ?? null,
        department: project.department ?? null,
        startDate: project.startDate,
        expectedEndDate: project.expectedEndDate ?? null,
        remarks: project.remarks ?? null
      },
      location: {
        latitude: project.latitude ?? null,
        longitude: project.longitude ?? null,
        geofenceRadius: project.geofenceRadius ?? null
      },
      team,
      manpower: manpower.map(m => ({
        _id: m._id,
        tradeName: m.tradeName,
        requiredWorkers: m.requiredWorkers,
        bufferWorkers: m.bufferWorkers
      })),
      materials: materials.map(m => ({
        _id: m._id,
        materialId: m.materialId,
        materialName: m.materialName,
        qty: m.qty,
        unit: m.unit,
        date: m.requiredBy
      })),
      tools: tools.map(t => {
        const masterTool = allTools.find(tool => tool.id === t.toolId);
        return {
          _id: t._id,
          toolId: t.toolId,
          toolName: masterTool?.name || "Unknown", // ✅ get name from master tools
          qty: t.requiredQuantity,
          rentalStart: t.rentalStart,
          rentalEnd: t.rentalEnd
        };
      }),
      budget: {
        labor: project.budgetLabor ?? 0,
        material: project.budgetMaterials ?? 0,
        tools: project.budgetTools ?? 0,
        transport: project.budgetTransport ?? 0,
        warranty: project.budgetWarranty ?? 0,
        certification: project.budgetCertification ?? 0
      },
      transport: {
        required: project.transportRequired ?? false,
        dailyWorkers: project.transportDailyWorkers ?? 0,
        pickupLocation: project.transportPickupLocation ?? null,
        driverId: project.transportDriverId ?? null,
        pickupTime: project.transportPickupTime ?? null,
        dropTime: project.transportDropTime ?? null
      },
      status: {
        projectStatus: project.projectStatus ?? project.status ?? null,
        startDate: project.startDate,
        expectedEndDate: project.expectedEndDate ?? null,
        actualCompletion: project.actualEndDate ?? null
      },
      documents: documents.map(d => ({
        _id: d._id,
        name: d.fileName ?? d.filePath.split("/").pop(),
        type: d.docType,
        uploadedBy: d.uploadedBy,
        uploadedAt: d.createdAt,
        filePath: d.filePath
      }))
    };

    return res.json({ status: "success", data: payload });
  } catch (err) {
    console.error(err);
    if (err.name === "CastError") {
      return res.status(400).json({ status: "error", message: "Invalid projectId format" });
    }
    return res.status(500).json({ status: "error", message: err.message });
  }
};




// export const listProjects = async (req, res) => {
//   try {
//     const projects = await Project.find().lean();
//     return res.json(projects);
//   } catch (err) {
//     console.error(err);
//     return res.status(500).json({ status: "error", message: err.message });
//   }
// };


export const listProjects = async (req, res) => {
  try {
    const filter = {};

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const projects = await Project.find(filter).lean();
    return res.json(projects);

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: "error",
      message: err.message
    });
  }
};

// DELETE /projects/:projectId
export const deleteProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    // Validate projectId format
    if (!projectId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ status: "error", message: "Invalid projectId format" });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ status: "error", message: "Project not found" });
    }

    // Delete main project
    await Project.findByIdAndDelete(projectId);

    // Delete all related collections in parallel
    await Promise.all([
      ProjectTeamMember.deleteMany({ projectId }),
      ProjectManpowerRequirement.deleteMany({ projectId }),
      ProjectMaterialRequirement.deleteMany({ projectId }),
      ProjectToolRequirement.deleteMany({ projectId }),
      ProjectDocument.deleteMany({ projectId })
    ]);

    return res.json({ status: "success", message: "Project and all related data deleted successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "error", message: err.message });
  }
};


// 2. LOCATION / GEOFENCING

export const setProjectLocation = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { latitude, longitude, geofenceRadius } = req.body;

    await Project.findByIdAndUpdate(projectId, { latitude, longitude, geofenceRadius });

    return res.json({ status: "success" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "error", message: err.message });
  }
};

export const getProjectLocation = async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId, "latitude longitude geofenceRadius").lean();
    if (!project) return res.status(404).json({ status: "error", message: "Project not found" });

    return res.json(project);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "error", message: err.message });
  }
};

// 3. TEAM ASSIGNMENT

export const assignTeam = async (req, res) => {
  try {
    const { projectId } = req.params;
    const team = req.body; //

    // Delete existing members for the project
    await ProjectTeamMember.deleteMany({ projectId });

    const docs = [];

    // Iterate over each role in the payload
    for (const [roleKey, value] of Object.entries(team)) {
      if (Array.isArray(value)) {
        value.forEach(userId => docs.push({ projectId, userId, role: roleKey }));
      } else if (value) {
        docs.push({ projectId, userId: value, role: roleKey });
      }
    }

    // Insert into MongoDB
    if (docs.length) await ProjectTeamMember.insertMany(docs);

    return res.json({ status: "success" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "error", message: err.message });
  }
};



export const getTeam = async (req, res) => {
  try {
    const { projectId } = req.params;
    const members = await ProjectTeamMember.find({ projectId }).lean();
    return res.json(members);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "error", message: err.message });
  }
};

export const removeTeamMember = async (req, res) => {
  try {
    const { projectId, userId } = req.params;
    await ProjectTeamMember.deleteOne({ projectId, userId });
    return res.json({ status: "success" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "error", message: err.message });
  }
};

// 4. MANPOWER REQUIREMENTS

export const addManpowerRequirements = async (req, res) => {
  try {
    const { projectId } = req.params;
    const payload = req.body;

    const items = Array.isArray(payload) ? payload : [payload];
    const docs = items.map(i => ({
      projectId,
      tradeName: i.tradeName || i.trade,
      requiredWorkers: i.requiredWorkers || i.required,
      bufferWorkers: i.bufferWorkers || i.buffer || 0
    }));

    await ProjectManpowerRequirement.insertMany(docs);
    return res.json({ status: "success" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "error", message: err.message });
  }
};

export const listManpowerRequirements = async (req, res) => {
  try {
    const { projectId } = req.params;
    const list = await ProjectManpowerRequirement.find({ projectId }).lean();
    return res.json(list || []); // <-- always an array
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "error", message: err.message });
  }
};

export const updateManpowerRequirement = async (req, res) => {
  try {
    const { mpId } = req.params;
    const payload = req.body;

    const updated = await ProjectManpowerRequirement.findByIdAndUpdate(
      mpId,
      {
        tradeName: payload.tradeName,
        requiredWorkers: payload.requiredWorkers,
        bufferWorkers: payload.bufferWorkers || 0
      },
      { new: true }
    );

    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "error", message: err.message });
  }
};



export const deleteManpowerRequirement = async (req, res) => {
  try {
    const { mpId } = req.params; // <-- Must match route param
    await ProjectManpowerRequirement.findByIdAndDelete(mpId);
    return res.json({ status: "success" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "error", message: err.message });
  }
};


// 5. MATERIAL REQUIREMENTS

export const addMaterialRequirement = async (req, res) => {
  try {
    const { projectId } = req.params;
    const materials = req.body; // expect array

    const newMaterials = await ProjectMaterialRequirement.insertMany(
      materials.map(m => ({
        projectId,
        id: m.id,
        materialId: m.materialId,
        materialName: m.materialName,
        qty: m.qty,
        estimatedQuantity: m.qty,
        unit: m.unit,
        requiredBy: m.date
      }))
    );

    return res.json({ status: "success", data: newMaterials });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "error", message: err.message });
  }
};




export const listMaterialRequirements = async (req, res) => {
  try {
    const { projectId } = req.params;
    const list = await ProjectMaterialRequirement.find({ projectId })
      .populate("materialId", "name unit")
      .lean();

    return res.json(list);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "error", message: err.message });
  }
};

export const deleteMaterialRequirement = async (req, res) => {
  try {
    const { itemId } = req.params;
    await ProjectMaterialRequirement.findByIdAndDelete(itemId);
    return res.json({ status: "success" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "error", message: err.message });
  }
};


// 6. TOOL REQUIREMENTS

export const addToolRequirement = async (req, res) => {
  const { projectId } = req.params;
  const tools = req.body; // expect array

  const inserted = await ProjectToolRequirement.insertMany(
    tools.map(t => ({
      id: t.id,
      projectId,
      toolId: t.toolId,
      requiredQuantity: t.qty,
      rentalStart: t.rentalStart,
      rentalEnd: t.rentalEnd
    }))
  );

  return res.json({ status: "success", data: inserted });
};


export const listToolRequirements = async (req, res) => {
  try {
    const { projectId } = req.params;
    const list = await ProjectToolRequirement.find({ projectId })
      .populate("toolId", "name")
      .lean();
    return res.json(list);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "error", message: err.message });
  }
};

export const deleteToolRequirement = async (req, res) => {
  try {
    const { toolReqId } = req.params;
    await ProjectToolRequirement.findByIdAndDelete(toolReqId);
    return res.json({ status: "success" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "error", message: err.message });
  }
};

// 7. DOCUMENTS

export const uploadDocument = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { docType, uploadedBy } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ status: "error", message: "File is required" });

    const doc = await ProjectDocument.create({
  projectId,
  docType,
  uploadedBy,
  filePath: `/uploads/projectDocuments/${file.filename}` // <-- use this
});

    return res.json({ status: "success", documentId: doc._id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "error", message: err.message });
  }
};

export const listDocuments = async (req, res) => {
  try {
    const { projectId } = req.params;
    const docs = await ProjectDocument.find({ projectId }).lean();
    return res.json(docs);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "error", message: err.message });
  }
};

export const deleteDocument = async (req, res) => {
  try {
    const { docId } = req.params;  // ✅ match the router
    await ProjectDocument.findByIdAndDelete(docId);
    return res.json({ status: "success" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "error", message: err.message });
  }
};


// 8. BUDGET

export const setBudget = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { labor, material, tools, transport, warranty, certification } = req.body;

    await Project.findByIdAndUpdate(projectId, {
      budgetLabor: labor,
      budgetMaterials: material,
      budgetTools: tools,
      budgetTransport: transport,
      budgetWarranty: warranty,
      budgetCertification: certification
    });

    return res.json({ status: "success" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "error", message: err.message });
  }
};

export const getBudget = async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId, "budgetLabor budgetMaterials budgetTools budgetTransport budgetWarranty budgetCertification").lean();
    if (!project) return res.status(404).json({ status: "error", message: "Project not found" });

    return res.json(project);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "error", message: err.message });
  }
};

// 9. TRANSPORT PLAN

export const setTransportPlan = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { transportRequired, dailyWorkers, pickupLocation, driverId, pickupTime, dropTime } = req.body;

   await Project.findByIdAndUpdate(
  projectId,
  {
    transportRequired,
    transportDailyWorkers: dailyWorkers,
    transportPickupLocation: pickupLocation,
    transportDriverId: driverId,
    transportPickupTime: pickupTime,
    transportDropTime: dropTime
  },
  { new: true, runValidators: true } // <--- added
);


    return res.json({ status: "success" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "error", message: err.message });
  }
};

export const getTransportPlan = async (req, res) => {
  try {
    const { projectId } = req.params;
    const plan = await Project.findById(projectId, "transportRequired transportDailyWorkers transportPickupLocation transportDriverId transportPickupTime transportDropTime").lean();
    if (!plan) return res.status(404).json({ status: "error", message: "Project not found" });

    return res.json(plan);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "error", message: err.message });
  }
};

// 10. STATUS & TIMELINE

export const updateStatus = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { status, projectStatus } = req.body; // Accept both fields

    const updateData = {};
    if (status) updateData.status = status;
    if (projectStatus) updateData.projectStatus = projectStatus; // Include projectStatus

    await Project.findByIdAndUpdate(projectId, updateData);
    return res.json({ status: "success" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "error", message: err.message });
  }
};

export const updateTimeline = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { startDate, status, actualCompletion, ...rest } = req.body;

    // Map actualCompletion to actualEndDate if provided
    if (actualCompletion) {
      rest.actualEndDate = actualCompletion;
    }

    // Include startDate and status in the update if needed
    if (startDate) rest.startDate = startDate;
    if (status) rest.status = status;

    const updatedProject = await Project.findByIdAndUpdate(projectId, rest, { new: true });

    return res.json({ 
      status: "success", 
      data: updatedProject // ✅ only return updated project, no separate payload
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "error", message: err.message });
  }
};



// 12. DASHBOARD

// export const getProjectDashboard = async (req, res) => {
//   try {
//     const { projectId } = req.params;

//     const manpowerUsed = await ProjectManpowerRequirement.countDocuments({ projectId });
//     const materialsCount = await ProjectMaterialRequirement.countDocuments({ projectId });
//     const toolsInUse = await ProjectToolRequirement.countDocuments({ projectId });
//     const documentsCount = await ProjectDocument.countDocuments({ projectId });

//     return res.json({
//       manpowerUsed,
//       materialsDelivered: materialsCount,
//       toolsInUse,
//       progressPercentage: 0,
//       documentsCount
//     });
//   } catch (err) {
//     console.error(err);
//     return res.status(500).json({ status: "error", message: err.message });
//   }
// };
