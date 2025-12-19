import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

export const getTrades = () => API.get("/master/trades");
export const getMaterials = () => API.get("/master/materials");
export const getTools = () => API.get("/master/tools");
export const getUsersByRole = (role) => API.get(`/master/users?role=${role}`);
export const getClients = () => API.get("/master/clients");

