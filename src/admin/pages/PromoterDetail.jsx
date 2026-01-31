import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Megaphone,
  Copy,
  Users,
  Calendar,
  Mail,
  Hash,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAdminAuth } from "../context/AdminAuthContext";
import "../styles/admin-promoters.css";

const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// Status badge colors
const getStatusBadgeClass = (status) => {
  if (!status) return "admin-badge-secondary";
  const statusLower = status.toLowerCase();
  const classes = {
    active: "admin-badge-success",
    pending: "admin-badge-warning",
    inactive: "admin-badge-danger",
    trialing: "admin-badge-info",
    canceled: "admin-badge-danger",
  };
  return classes[statusLower] || "admin-badge-secondary";
};

// Format date
const formatDate = (date) => {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

function PromoterDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAdminAuth();

  // State
  const [promoter, setPromoter] = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [referralsLoading, setReferralsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch promoter details
  const fetchPromoter = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/admin/promoters/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch promoter");

      const data = await response.json();
      setPromoter(data.promoter);
    } catch (error) {
      console.error("Error fetching promoter:", error);
      toast.error("Failed to load promoter");
      navigate("/admin/promoters");
    } finally {
      setLoading(false);
    }
  }, [id, token, navigate]);

  // Fetch referrals
  const fetchReferrals = useCallback(async () => {
    try {
      setReferralsLoading(true);
      const response = await fetch(
        `${API_URL}/api/admin/promoters/${id}/referrals?page=${page}&limit=10`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch referrals");

      const data = await response.json();
      setReferrals(data.referrals || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error("Error fetching referrals:", error);
    } finally {
      setReferralsLoading(false);
    }
  }, [id, token, page]);

  useEffect(() => {
    if (token) {
      fetchPromoter();
    }
  }, [fetchPromoter, token]);

  useEffect(() => {
    if (promoter) {
      fetchReferrals();
    }
  }, [promoter, fetchReferrals]);

  // Toggle promoter status
  const togglePromoterStatus = async () => {
    try {
      const endpoint = promoter.is_active
        ? `${API_URL}/api/admin/promoters/${promoter.id}`
        : `${API_URL}/api/admin/promoters/${promoter.id}/reactivate`;

      const method = promoter.is_active ? "DELETE" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to update promoter");

      toast.success(
        promoter.is_active ? "Promoter deactivated" : "Promoter reactivated"
      );
      fetchPromoter();
    } catch (error) {
      console.error("Error updating promoter:", error);
      toast.error("Failed to update promoter");
    }
  };

  // Copy code to clipboard
  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied to clipboard");
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-loading">
          <div className="admin-spinner" />
          <p>Loading promoter...</p>
        </div>
      </div>
    );
  }

  if (!promoter) {
    return (
      <div className="admin-page">
        <div className="admin-empty">
          <Megaphone size={48} />
          <p>Promoter not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-page-header">
        <div className="admin-page-header-content">
          <button
            className="admin-back-btn"
            onClick={() => navigate("/admin/promoters")}
          >
            <ArrowLeft size={20} />
            Back to Promoters
          </button>
          <h1 className="admin-page-title">
            <Megaphone size={28} />
            {promoter.promoter_name}
          </h1>
          <p className="admin-page-subtitle">{promoter.promoter_email}</p>
        </div>
        <div className="admin-page-actions">
          <button
            className="admin-btn admin-btn-secondary"
            onClick={fetchPromoter}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <button
            className={`admin-btn ${
              promoter.is_active ? "admin-btn-danger" : "admin-btn-success"
            }`}
            onClick={togglePromoterStatus}
          >
            {promoter.is_active ? (
              <>
                <ToggleLeft size={16} />
                Deactivate
              </>
            ) : (
              <>
                <ToggleRight size={16} />
                Reactivate
              </>
            )}
          </button>
        </div>
      </div>

      {/* Promoter Info Cards */}
      <div className="admin-detail-grid">
        {/* Basic Info */}
        <div className="admin-card">
          <h3 className="admin-card-title">Promoter Information</h3>
          <div className="admin-info-list">
            <div className="admin-info-item">
              <span className="admin-info-label">Status</span>
              <span
                className={`admin-badge ${getStatusBadgeClass(promoter.status)}`}
              >
                {promoter.status}
              </span>
            </div>
            <div className="admin-info-item">
              <span className="admin-info-label">Email</span>
              <span className="admin-info-value">
                <Mail size={14} />
                {promoter.promoter_email}
              </span>
            </div>
            <div className="admin-info-item">
              <span className="admin-info-label">Created</span>
              <span className="admin-info-value">
                <Calendar size={14} />
                {formatDate(promoter.created_at)}
              </span>
            </div>
            <div className="admin-info-item">
              <span className="admin-info-label">Activated</span>
              <span className="admin-info-value">
                <Calendar size={14} />
                {formatDate(promoter.activated_at) || "Not yet activated"}
              </span>
            </div>
          </div>
        </div>

        {/* Codes */}
        <div className="admin-card">
          <h3 className="admin-card-title">Promo Codes</h3>
          <div className="admin-info-list">
            <div className="admin-info-item">
              <span className="admin-info-label">Activation Code</span>
              <div className="admin-code-display">
                <code>{promoter.activation_code}</code>
                <button
                  className="admin-btn-icon"
                  onClick={() => copyToClipboard(promoter.activation_code)}
                >
                  <Copy size={14} />
                </button>
              </div>
              <span className="admin-info-hint">
                Promoter uses this for free access
              </span>
            </div>
            <div className="admin-info-item">
              <span className="admin-info-label">Referral Code</span>
              <div className="admin-code-display">
                <code>{promoter.referral_code}</code>
                <button
                  className="admin-btn-icon"
                  onClick={() => copyToClipboard(promoter.referral_code)}
                >
                  <Copy size={14} />
                </button>
              </div>
              <span className="admin-info-hint">
                Audience uses this for {promoter.discount_percent}% off
              </span>
            </div>
            <div className="admin-info-item">
              <span className="admin-info-label">Max Redemptions</span>
              <span className="admin-info-value">
                {promoter.max_redemptions || "Unlimited"}
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="admin-card">
          <h3 className="admin-card-title">Audience Analytics</h3>
          <div className="admin-stats-mini">
            <div className="admin-stat-mini">
              <div className="admin-stat-mini-icon">
                <Users size={20} />
              </div>
              <div className="admin-stat-mini-content">
                <div className="admin-stat-mini-value">
                  {promoter.referral_count || 0}
                </div>
                <div className="admin-stat-mini-label">Total Referrals</div>
              </div>
            </div>
            <div className="admin-stat-mini">
              <div className="admin-stat-mini-icon success">
                <CheckCircle size={20} />
              </div>
              <div className="admin-stat-mini-content">
                <div className="admin-stat-mini-value">
                  {
                    referrals.filter(
                      (r) =>
                        r.subscription_status === "active" ||
                        r.subscription_status === "trialing"
                    ).length
                  }
                </div>
                <div className="admin-stat-mini-label">Active Subscriptions</div>
              </div>
            </div>
            <div className="admin-stat-mini">
              <div className="admin-stat-mini-icon danger">
                <XCircle size={20} />
              </div>
              <div className="admin-stat-mini-content">
                <div className="admin-stat-mini-value">
                  {
                    referrals.filter(
                      (r) => r.subscription_status === "canceled"
                    ).length
                  }
                </div>
                <div className="admin-stat-mini-label">Churned</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Referrals Table */}
      <div className="admin-card">
        <h3 className="admin-card-title">
          <Users size={20} />
          Audience List
        </h3>

        <div className="admin-table-container">
          {referralsLoading ? (
            <div className="admin-loading">
              <div className="admin-spinner" />
              <p>Loading referrals...</p>
            </div>
          ) : referrals.length === 0 ? (
            <div className="admin-empty">
              <Users size={48} />
              <p>No referrals yet</p>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Email</th>
                  <th>Signed Up</th>
                  <th>Plan</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((referral) => (
                  <tr key={referral.id}>
                    <td>
                      {referral.first_name} {referral.last_name}
                    </td>
                    <td>{referral.customer_email}</td>
                    <td>{formatDate(referral.redeemed_at)}</td>
                    <td>
                      <span
                        className={`admin-badge ${
                          referral.plan_type === "premium"
                            ? "admin-badge-premium"
                            : "admin-badge-basic"
                        }`}
                      >
                        {referral.plan_type || "N/A"}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`admin-badge ${getStatusBadgeClass(
                          referral.subscription_status
                        )}`}
                      >
                        {referral.subscription_status || "N/A"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="admin-pagination">
            <button
              className="admin-btn admin-btn-secondary"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft size={16} />
              Previous
            </button>
            <span className="admin-pagination-info">
              Page {page} of {totalPages}
            </span>
            <button
              className="admin-btn admin-btn-secondary"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Note about deactivation */}
      {promoter.is_active && (
        <div className="admin-card admin-card-warning">
          <p>
            <strong>Note:</strong> Deactivating this promoter will revoke their
            free access. However, their referral code will continue to work for
            existing and new audience members.
          </p>
        </div>
      )}
    </div>
  );
}

export default PromoterDetail;
