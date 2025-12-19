import express from "express";
import {
  createProject,
  updateProject,
  getProject,
  listProjects,
  deleteProject,
  setProjectLocation,
  getProjectLocation,
  assignTeam,
  getTeam,
  removeTeamMember,
  addManpowerRequirements,
  listManpowerRequirements,
  updateManpowerRequirement,
  deleteManpowerRequirement,
  addMaterialRequirement,
  listMaterialRequirements,
  deleteMaterialRequirement,
  addToolRequirement,
  listToolRequirements,
  deleteToolRequirement,
  uploadDocument,
  listDocuments,
  deleteDocument,
  setBudget,
  getBudget,
  setTransportPlan,
  getTransportPlan,
  updateStatus,
  updateTimeline,
  // getProjectDashboard,
  // getAllProjects,
  // getProjectsByCompany,
  // getProjectById
} from "../controllers/projectController.js";

import uploadMiddleware from "../multer/upload.js"; // Multer

const router = express.Router();

// Added three specific GET routes
// router.get("/", getAllProjects);
// router.get("/company/:companyId", getProjectsByCompany);
// router.get("/:id", getProjectById);

// 1. Project core
router.post("/", createProject);
router.put("/:projectId", updateProject);
router.get("/:projectId", getProject);
router.get("/", listProjects);
router.delete("/:projectId", deleteProject);

// 2. Location
router.post("/:projectId/location", setProjectLocation);
router.get("/:projectId/location", getProjectLocation);

// 3. Team
router.post("/:projectId/team", assignTeam);
router.get("/:projectId/team", getTeam);
router.delete("/:projectId/team/:userId", removeTeamMember);

// 4. Manpower
router.post("/:projectId/manpower", addManpowerRequirements); // accept array
router.get("/:projectId/manpower", listManpowerRequirements);
router.put("/:projectId/manpower/:mpId", updateManpowerRequirement);

router.delete("/:projectId/manpower/:mpId", deleteManpowerRequirement);



// 5. Materials
router.post("/:projectId/materials", addMaterialRequirement);
router.get("/:projectId/materials", listMaterialRequirements);
router.delete("/:projectId/materials/:itemId", deleteMaterialRequirement);

// 6. Tools
router.post("/:projectId/tools", addToolRequirement);
router.get("/:projectId/tools", listToolRequirements);
router.delete("/:projectId/tools/:toolReqId", deleteToolRequirement);

// // 7. Documents
 router.post(
 "/:projectId/documents",
   uploadMiddleware.single("file"),
   uploadDocument
);
router.get("/:projectId/documents", listDocuments);
router.delete("/:projectId/documents/:docId", deleteDocument);

// 8. Budget
router.post("/:projectId/budget", setBudget);
router.get("/:projectId/budget", getBudget);

// 9. Transport plan
router.post("/:projectId/transport", setTransportPlan);
router.get("/:projectId/transport", getTransportPlan);

// 10. Status & timeline
router.put("/:projectId/status", updateStatus);
router.put("/:projectId/timeline", updateTimeline);

// router.get("/:projectId/dashboard", getProjectDashboard);

export default router;

/*
router.get('/company/:companyId', getProjectsByCompany);

// GET /api/projects/:id - Get project by numeric ID
router.get('/:id', getProjectById);
router.get('/', getAllProjects);
*/