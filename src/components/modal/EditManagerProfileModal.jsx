import React, { useEffect, useState } from "react";
import { X } from 'lucide-react';
import "../../styles/manager/editmanagerprofilemodal.css";

function EditManagerProfileModal({ userProfile, onClose, onSave }) {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    company_name: "",
    email: "",
    address: "",
  });

  useEffect(() => {
    if (userProfile) {
      setFormData({
        first_name: userProfile.profile.first_name || "",
        last_name: userProfile.profile.last_name || "",
        company_name: userProfile.profile.company_name || "",
        email: userProfile.profile.email || "",
        address: userProfile.profile.address || "",
      });
    }
  }, [userProfile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="mpm-overlay">
      <div className="mpm-modal">
        <div className="mpm-header">
          <h2>Edit Manager Profile</h2>
          <button className="mpm-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form className="mpm-form" onSubmit={handleSubmit}>
          <div className="mpm-form-group">
            <label>First Name</label>
            <input
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mpm-form-group">
            <label>Last Name</label>
            <input
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mpm-form-group">
            <label>Company Name</label>
            <input
              type="text"
              name="company_name"
              value={formData.company_name}
              onChange={handleChange}
            />
          </div>

          <div className="mpm-form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mpm-form-group">
            <label>Address</label>
            <textarea
              name="address"
              rows="3"
              value={formData.address}
              onChange={handleChange}
            />
          </div>

          <div className="mpm-actions">
            <button
              type="button"
              className="mpm-btn-cancel"
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className="mpm-btn-save">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditManagerProfileModal;