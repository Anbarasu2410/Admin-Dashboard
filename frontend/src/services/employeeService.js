// src/services/employeeService.js
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/employees';

// Helper: handle errors
const handleError = (error) => {
  if (error.response) return error.response.data;
  return { success: false, message: error.message };
};

const EmployeeService = {
  // -------------------- Employee CRUD --------------------
  getAll: async () => {
    try {
      const res = await axios.get(`${API_BASE}`);
      return res.data;
    } catch (error) {
      return handleError(error);
    }
  },

  getAllBasic: async () => {
    try {
      const res = await axios.get(`${API_BASE}/basic/all`);
      return res.data;
    } catch (error) {
      return handleError(error);
    }
  },

  getById: async (id) => {
    try {
      const res = await axios.get(`${API_BASE}/${id}`);
      return res.data;
    } catch (error) {
      return handleError(error);
    }
  },

  getCompleteById: async (id) => {
    try {
      const res = await axios.get(`${API_BASE}/${id}/complete`);
      return res.data;
    } catch (error) {
      return handleError(error);
    }
  },

  getByCompany: async (companyId) => {
    try {
      const res = await axios.get(`${API_BASE}/company/${companyId}`);
      return res.data;
    } catch (error) {
      return handleError(error);
    }
  },

  getActiveByCompany: async (companyId) => {
    try {
      const res = await axios.get(`${API_BASE}/company/${companyId}/active`);
      return res.data;
    } catch (error) {
      return handleError(error);
    }
  },

  getByStatus: async (status) => {
    try {
      const res = await axios.get(`${API_BASE}/status/${status}`);
      return res.data;
    } catch (error) {
      return handleError(error);
    }
  },

  getWorkers: async (companyId, search = '') => {
    try {
      const res = await axios.get(`${API_BASE}/workers`, { params: { companyId, search } });
      return res.data;
    } catch (error) {
      return handleError(error);
    }
  },

  create: async (employeeData) => {
    try {
      const res = await axios.post(`${API_BASE}`, employeeData);
      return res.data;
    } catch (error) {
      return handleError(error);
    }
  },

  update: async (id, employeeData) => {
    try {
      const res = await axios.put(`${API_BASE}/${id}`, employeeData);
      return res.data;
    } catch (error) {
      return handleError(error);
    }
  },

  delete: async (id) => {
    try {
      const res = await axios.delete(`${API_BASE}/${id}`);
      return res.data;
    } catch (error) {
      return handleError(error);
    }
  },

  updateStatus: async (id, status) => {
    try {
      const res = await axios.patch(`${API_BASE}/${id}/status`, { status });
      return res.data;
    } catch (error) {
      return handleError(error);
    }
  },

  // -------------------- File Uploads --------------------
  uploadFile: async (employeeId, type, file) => {
    /**
     * type = 'passport' | 'workPass' | 'qualification' | 'certification' | 'document' | 'photo'
     */
    try {
      const formData = new FormData();
      formData.append(type, file);
      const res = await axios.post(`${API_BASE}/${employeeId}/${type}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    } catch (error) {
      return handleError(error);
    }
  },

  // -------------------- Helper for multiple files --------------------
  uploadMultipleFiles: async (employeeId, files) => {
    /**
     * files = { passport?: File, workPass?: File, qualification?: File, certification?: File, document?: File, photo?: File }
     */
    const results = {};
    for (const type in files) {
      if (files[type]) {
        results[type] = await EmployeeService.uploadFile(employeeId, type, files[type]);
      }
    }
    return results;
  },
};

export default EmployeeService;
