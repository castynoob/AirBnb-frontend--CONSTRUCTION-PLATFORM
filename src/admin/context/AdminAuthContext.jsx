import { createContext, useContext, useState, useEffect, useCallback } from "react";

const AdminAuthContext = createContext(null);

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get token from localStorage
  const getToken = useCallback(() => {
    return localStorage.getItem("adminToken");
  }, []);

  // Save token to localStorage
  const saveToken = useCallback((token) => {
    localStorage.setItem("adminToken", token);
  }, []);

  // Remove token from localStorage
  const removeToken = useCallback(() => {
    localStorage.removeItem("adminToken");
  }, []);

  // Fetch current admin from API
  const fetchCurrentAdmin = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/admin/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAdmin(data.admin);
      } else {
        // Token is invalid or expired
        removeToken();
        setAdmin(null);
      }
    } catch (err) {
      console.error("Failed to fetch admin:", err);
      removeToken();
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  }, [getToken, removeToken]);

  // Initialize auth state on mount
  useEffect(() => {
    fetchCurrentAdmin();
  }, [fetchCurrentAdmin]);

  // Login function
  const login = async (email, password) => {
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "Login failed");
      }

      saveToken(data.accessToken);
      setAdmin(data.admin);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Logout function
  const logout = async () => {
    const token = getToken();

    try {
      if (token) {
        await fetch(`${API_URL}/api/admin/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      removeToken();
      setAdmin(null);
    }
  };

  // Check if admin has specific role or higher
  const hasRole = useCallback((requiredRole) => {
    if (!admin) return false;

    const roleHierarchy = {
      super_admin: 4,
      admin: 3,
      moderator: 2,
      support: 1,
    };

    const adminLevel = roleHierarchy[admin.role] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;

    return adminLevel >= requiredLevel;
  }, [admin]);

  // Check specific permissions
  const canManageUsers = useCallback(() => hasRole("moderator"), [hasRole]);
  const canSuspendUsers = useCallback(() => hasRole("admin"), [hasRole]);
  const canViewAuditLogs = useCallback(() => hasRole("admin"), [hasRole]);
  const canManageSettings = useCallback(() => hasRole("super_admin"), [hasRole]);
  const isAdminOrHigher = useCallback(() => hasRole("admin"), [hasRole]);
  const isModeratorOrHigher = useCallback(() => hasRole("moderator"), [hasRole]);

  const value = {
    admin,
    loading,
    error,
    isAuthenticated: !!admin,
    login,
    logout,
    hasRole,
    canManageUsers,
    canSuspendUsers,
    canViewAuditLogs,
    canManageSettings,
    isAdminOrHigher,
    isModeratorOrHigher,
    getToken,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
}

export default AdminAuthContext;
