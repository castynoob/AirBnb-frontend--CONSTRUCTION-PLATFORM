import { useState } from "react";
import toast from "react-hot-toast";
import { X, Megaphone, AlertCircle, User, Mail, Tag, Hash, Gift, Info } from "lucide-react";
import { useAdminAuth } from "../context/AdminAuthContext";

const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

function CreatePromoterModal({ isOpen, onClose, onSuccess }) {
  const { token } = useAdminAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    promoter_name: "",
    promoter_email: "",
    activation_code: "",
    referral_code: "",
    max_redemptions: "",
  });
  const [errors, setErrors] = useState({});

  const validateCode = (code) => {
    return /^[A-Z0-9]{1,10}$/.test(code.toUpperCase());
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Uppercase codes automatically
    if (name === "activation_code" || name === "referral_code") {
      setFormData((prev) => ({
        ...prev,
        [name]: value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.promoter_name.trim()) {
      newErrors.promoter_name = "Name is required";
    }

    if (!formData.promoter_email.trim()) {
      newErrors.promoter_email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.promoter_email)) {
      newErrors.promoter_email = "Invalid email format";
    }

    if (!formData.activation_code.trim()) {
      newErrors.activation_code = "Activation code is required";
    } else if (!validateCode(formData.activation_code)) {
      newErrors.activation_code = "Code must be 1-10 characters, A-Z and 0-9 only";
    }

    if (!formData.referral_code.trim()) {
      newErrors.referral_code = "Referral code is required";
    } else if (!validateCode(formData.referral_code)) {
      newErrors.referral_code = "Code must be 1-10 characters, A-Z and 0-9 only";
    }

    if (formData.activation_code === formData.referral_code) {
      newErrors.referral_code = "Codes must be different";
    }

    if (formData.max_redemptions && parseInt(formData.max_redemptions) < 1) {
      newErrors.max_redemptions = "Must be at least 1";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/api/admin/promoters`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          promoter_name: formData.promoter_name.trim(),
          promoter_email: formData.promoter_email.trim(),
          activation_code: formData.activation_code,
          referral_code: formData.referral_code,
          max_redemptions: formData.max_redemptions
            ? parseInt(formData.max_redemptions)
            : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create promoter");
      }

      toast.success("Promoter created successfully!");

      // Reset form
      setFormData({
        promoter_name: "",
        promoter_email: "",
        activation_code: "",
        referral_code: "",
        max_redemptions: "",
      });

      onSuccess?.();
    } catch (error) {
      console.error("Error creating promoter:", error);
      toast.error(error.message || "Failed to create promoter");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="promo-modal-overlay" onClick={onClose}>
      <div className="promo-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="promo-modal-header">
          <h2 className="promo-modal-title">
            <Megaphone size={26} />
            Create New Promoter
          </h2>
          <button className="promo-modal-close" onClick={onClose}>
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="promo-modal-body">
          {/* Promoter Information Section */}
          <div className="promo-form-section">
            <h3 className="promo-form-section-title">
              <User size={16} />
              Promoter Information
            </h3>
            <div className="promo-form-row">
              <div className="promo-form-group">
                <label className="promo-form-label">
                  Full Name <span className="required">*</span>
                </label>
                <div className="promo-input-wrapper">
                  <User size={18} className="input-icon" />
                  <input
                    type="text"
                    name="promoter_name"
                    value={formData.promoter_name}
                    onChange={handleChange}
                    className={`promo-form-input has-icon ${errors.promoter_name ? "error" : ""}`}
                    placeholder="e.g., John Doe"
                  />
                </div>
                {errors.promoter_name && (
                  <span className="promo-form-error">
                    <AlertCircle size={14} />
                    {errors.promoter_name}
                  </span>
                )}
              </div>

              <div className="promo-form-group">
                <label className="promo-form-label">
                  Email Address <span className="required">*</span>
                </label>
                <div className="promo-input-wrapper">
                  <Mail size={18} className="input-icon" />
                  <input
                    type="email"
                    name="promoter_email"
                    value={formData.promoter_email}
                    onChange={handleChange}
                    className={`promo-form-input has-icon ${errors.promoter_email ? "error" : ""}`}
                    placeholder="e.g., john@example.com"
                  />
                </div>
                {errors.promoter_email && (
                  <span className="promo-form-error">
                    <AlertCircle size={14} />
                    {errors.promoter_email}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Promo Codes Section */}
          <div className="promo-form-section">
            <h3 className="promo-form-section-title">
              <Tag size={16} />
              Promo Codes
            </h3>
            <div className="promo-form-row">
              <div className="promo-form-group">
                <label className="promo-form-label">
                  Activation Code <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="activation_code"
                  value={formData.activation_code}
                  onChange={handleChange}
                  className={`promo-form-input code-input ${errors.activation_code ? "error" : ""}`}
                  placeholder="e.g., JOHNFREE"
                  maxLength={10}
                />
                <span className="promo-form-hint">
                  <Gift size={14} />
                  Promoter enters this code for FREE platform access
                </span>
                <div className={`promo-char-counter ${formData.activation_code.length >= 8 ? (formData.activation_code.length >= 10 ? 'at-limit' : 'near-limit') : ''}`}>
                  {formData.activation_code.length}/10 characters
                </div>
                {errors.activation_code && (
                  <span className="promo-form-error">
                    <AlertCircle size={14} />
                    {errors.activation_code}
                  </span>
                )}
              </div>

              <div className="promo-form-group">
                <label className="promo-form-label">
                  Referral Code <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="referral_code"
                  value={formData.referral_code}
                  onChange={handleChange}
                  className={`promo-form-input code-input ${errors.referral_code ? "error" : ""}`}
                  placeholder="e.g., JOHNDOE"
                  maxLength={10}
                />
                <span className="promo-form-hint">
                  <Hash size={14} />
                  Users enter this code for 20% discount on subscription
                </span>
                <div className={`promo-char-counter ${formData.referral_code.length >= 8 ? (formData.referral_code.length >= 10 ? 'at-limit' : 'near-limit') : ''}`}>
                  {formData.referral_code.length}/10 characters
                </div>
                {errors.referral_code && (
                  <span className="promo-form-error">
                    <AlertCircle size={14} />
                    {errors.referral_code}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Settings Section */}
          <div className="promo-form-section">
            <h3 className="promo-form-section-title">
              <Hash size={16} />
              Referral Settings
            </h3>
            <div className="promo-form-row">
              <div className="promo-form-group">
                <label className="promo-form-label">Max Redemptions</label>
                <input
                  type="number"
                  name="max_redemptions"
                  value={formData.max_redemptions}
                  onChange={handleChange}
                  className={`promo-form-input ${errors.max_redemptions ? "error" : ""}`}
                  placeholder="Unlimited"
                  min="1"
                />
                <span className="promo-form-hint">
                  <Info size={14} />
                  Leave empty for unlimited referral redemptions
                </span>
                {errors.max_redemptions && (
                  <span className="promo-form-error">
                    <AlertCircle size={14} />
                    {errors.max_redemptions}
                  </span>
                )}
              </div>

              <div className="promo-form-group">
                <label className="promo-form-label">Discount Details</label>
                <div className="promo-info-box">
                  <Gift size={20} />
                  <div>
                    <strong>20% off for 1 month</strong>
                    <br />
                    <span style={{ fontSize: '0.8125rem' }}>Fixed discount for all referral codes</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="promo-modal-footer">
            <button
              type="button"
              className="promo-btn promo-btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="promo-btn promo-btn-primary"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Promoter"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreatePromoterModal;
