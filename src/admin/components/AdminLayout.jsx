import { useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { Menu } from "lucide-react";
import { useAdminAuth } from "../context/AdminAuthContext";
import AdminSidebar from "./AdminSidebar";
import AdminNotificationBell from "./AdminNotificationBell";
import "../styles/admin-global.css";
import "../styles/admin-layout.css";

function AdminLayout() {
  const { isAuthenticated, loading } = useAdminAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="admin-app">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
          }}
        >
          <div className="admin-spinner" />
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="admin-app">
      <div className="admin-layout">
        {/* Sidebar */}
        <AdminSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main Content */}
        <main className="admin-main">
          {/* Mobile menu toggle — position:fixed in its own CSS, lives independently. */}
          <button
            className="admin-mobile-toggle"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>

          {/* Notification bell floated to the top-right of the content area so
              it aligns visually with each page's action buttons (Refresh,
              New job, etc.) rather than occupying its own row above them. */}
          <div
            style={{
              position: "absolute",
              top: 32,
              right: 24,
              zIndex: 200,
            }}
          >
            <AdminNotificationBell />
          </div>

          {/* Page Content */}
          <div className="admin-content">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
