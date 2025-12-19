import React, { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";

// Create the Context
const AuthContext = createContext();

// Hook for easy access in components
export const useAuth = () => useContext(AuthContext);

// Axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_URL || "http://localhost:5000/api", // adjust to your backend
});

// Provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user on page refresh
  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }

    setLoading(false);
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      const res = await api.post("/auth/login", { email, password });
      const { token, user } = res.data;

      // Save to localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      // Set axios header
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      // Update state
      setUser(user);

      return { success: true, role: user.role };
    } catch (err) {
      console.error("Login failed:", err.response?.data || err.message);
      return {
        success: false,
        message: err.response?.data?.message || "Login failed",
      };
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    delete api.defaults.headers.common["Authorization"];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, api }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
