import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  FileText,
  CreditCard,
  Shield,
  Building2,
  ClipboardList,
  MessageSquare,
  Flag,
} from "lucide-react";
import { useAdminAuth } from "../context/AdminAuthContext";

function AdminSidebar({ isOpen, onClose }) {
  const { admin, canManageUsers } = useAdminAuth();

  const navSections = [
    {
      title: "Overview",
      items: [
        {
          to: "/admin/dashboard",
          icon: LayoutDashboard,
          label: "Dashboard",
        },
      ],
    },
    {
      title: "Management",
      items: [
        {
          to: "/admin/users",
          icon: Users,
          label: "Users",
          show: canManageUsers(),
        },
        {
          to: "/admin/jobs",
          icon: Briefcase,
          label: "Jobs",
        },
        {
          to: "/admin/bids",
          icon: FileText,
          label: "Bids",
        },
        {
          to: "/admin/properties",
          icon: Building2,
          label: "Properties",
        },
      ],
    },
    {
      title: "Transactions",
      items: [
        {
          to: "/admin/payments",
          icon: CreditCard,
          label: "Payments",
        },
        {
          to: "/admin/subscriptions",
          icon: ClipboardList,
          label: "Subscriptions",
        },
      ],
    },
    {
      title: "Moderation",
      items: [
        {
          to: "/admin/reports",
          icon: Flag,
          label: "Reports",
        },
        {
          to: "/admin/disputes",
          icon: MessageSquare,
          label: "Disputes",
        },
      ],
    },
  ];

  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={`admin-sidebar-overlay ${isOpen ? "visible" : ""}`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside className={`admin-sidebar ${isOpen ? "open" : ""}`}>
        {/* Header */}
        <div className="admin-sidebar-header">
          <a href="/admin/dashboard" className="admin-sidebar-brand">
            <div className="admin-sidebar-logo">
              <Shield size={24} />
            </div>
            <div className="admin-sidebar-brand-text">
              <h2>INTERVOS</h2>
              <span>Admin Panel</span>
            </div>
          </a>
        </div>

        {/* Navigation */}
        <nav className="admin-sidebar-nav">
          {navSections.map((section) => {
            const visibleItems = section.items.filter(
              (item) => item.show === undefined || item.show
            );

            if (visibleItems.length === 0) return null;

            return (
              <div key={section.title} className="admin-nav-section">
                <div className="admin-nav-section-title">{section.title}</div>
                {visibleItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `admin-nav-item ${isActive ? "active" : ""}`
                    }
                    onClick={onClose}
                  >
                    <item.icon size={20} />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="admin-nav-badge">{item.badge}</span>
                    )}
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>

        {/* Footer with User Info */}
        <div className="admin-sidebar-footer">
          <div className="admin-sidebar-user">
            <div className="admin-sidebar-avatar">
              {admin?.first_name?.[0]}
              {admin?.last_name?.[0]}
            </div>
            <div className="admin-sidebar-user-info">
              <div className="admin-sidebar-user-name">
                {admin?.first_name} {admin?.last_name}
              </div>
              <div className="admin-sidebar-user-role">
                {admin?.role?.replace("_", " ").toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export default AdminSidebar;
