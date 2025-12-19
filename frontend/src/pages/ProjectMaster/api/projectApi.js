import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

// PROJECT MASTER CRUD
export const createProject = (data) => API.post("/projects", data);
export const updateProject = (id, data) => API.put(`/projects/${id}`, data);
export const getProject = (id) => API.get(`/projects/${id}`);
export const deleteProject = (id) => API.delete(`/projects/${id}`);
export const listProjects = () => API.get("/projects");




// LOCATION
export const saveLocation = (id, data) => API.post(`/projects/${id}/location`, data);

// TEAM
export const saveTeam = (id, data) => API.post(`/projects/${id}/team`, data);

// MANPOWER
export const saveManpower = (projectId, data) =>
  API.post(`/projects/${projectId}/manpower`, data);

// GET LIST
export const listManpowerRequirements = (projectId) =>
  API.get(`/projects/${projectId}/manpower`);

export const updateManpowerRequirement = (projectId, mpId, data) =>
  API.put(`/projects/${projectId}/manpower/${mpId}`, data);

// DELETE
export const deleteManpowerRequirement = (projectId, mpId) =>
  API.delete(`/projects/${projectId}/manpower/${mpId}`);



// MATERIALS
export const saveMaterials = (id, data) => API.post(`/projects/${id}/materials`, data);

export const deleteMaterialRequirement = (projectId, materialReqId) =>
  API.delete(`/projects/${projectId}/materials/${materialReqId}`);

// TOOLS
export const saveTools = (id, data) => API.post(`/projects/${id}/tools`, data);

export const deleteToolRequirement = (projectId, toolReqId) =>
  API.delete(`/projects/${projectId}/tools/${toolReqId}`);

// DOCUMENTS
export const uploadDocument = (id, formData) =>
  API.post(`/projects/${id}/documents`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  export const deleteDocument = (projectId, documentId) =>
  API.delete(`/projects/${projectId}/documents/${documentId}`);

// BUDGET
export const saveBudget = (id, data) => API.post(`/projects/${id}/budget`, data);

// TRANSPORT
export const saveTransport = (id, data) => API.post(`/projects/${id}/transport`, data);

// STATUS
export const saveStatus = (id, data) => API.put(`/projects/${id}/status`, data);

// TIMELINE
export const saveTimeline = (id, data) => API.put(`/projects/${id}/timeline`, data);