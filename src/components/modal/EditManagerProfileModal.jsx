import React, { useEffect, useState, useRef } from "react";
import { X, Camera, Trash2 } from 'lucide-react';
import { FiUser } from 'react-icons/fi';
import { useLanguage } from '../../contexts/LanguageContext';
import "../../styles/manager/editmanagerprofilemodal.css";

function EditManagerProfileModal({ userProfile, onClose, onSave }) {
  const { t } = useLanguage();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const fileInputRef = useRef(null);
  
  const [profileData, setProfileData] = useState({
    first_name: "",
    last_name: "",
    company_name: "",
    email: "",
    address: "",
  });

  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (userProfile) {
      setProfileData({
        first_name: userProfile.profile.first_name || "",
        last_name: userProfile.profile.last_name || "",
        company_name: userProfile.profile.company_name || "",
        email: userProfile.profile.email || "",
        address: userProfile.profile.address || "",
      });
      
      // Set existing profile image if available
      if (userProfile.profile.image) {
        setProfileImage(userProfile.profile.image);
        setImagePreview(userProfile.profile.image);
      }
    }
  }, [userProfile]);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError(t('editManagerModal.selectImageFile'));
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError(t('editManagerModal.imageTooLarge'));
        return;
      }

      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setError("");
      setSuccessMessage("");
    }
  };

  const handleImageUpload = async () => {
    if (!imageFile) {
      setError(t('editManagerModal.selectImageFirst'));
      return;
    }

    setIsUploading(true);
    setError("");
    setSuccessMessage("");

    try {
      const userData = JSON.parse(localStorage.getItem('userProfile'));
      const formData = new FormData();
      formData.append('image', imageFile);

      const response = await fetch(`${API_BASE_URL}/api/users/manager/profile-picture`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userData.token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload image');
      }

      setProfileImage(data.imageUrl);
      setImageFile(null);
      setSuccessMessage(t('editManagerModal.pictureUpdated'));
      
      // Notify parent to refresh
      setTimeout(() => {
        if (onSave) {
          onSave();
        }
      }, 1000);
      
    } catch (error) {
      console.error('Image upload error:', error);
      setError(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteImage = async () => {
    if (!profileImage) return;

    if (!confirm(t('editManagerModal.deleteConfirm'))) {
      return;
    }

    setIsUploading(true);
    setError("");
    setSuccessMessage("");

    try {
      const userData = JSON.parse(localStorage.getItem('userProfile'));
      
      const response = await fetch(`${API_BASE_URL}/api/users/manager/profile-picture`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${userData.token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete image');
      }

      setProfileImage(null);
      setImagePreview(null);
      setImageFile(null);
      setSuccessMessage(t('editManagerModal.pictureRemoved'));
      
      // Notify parent to refresh
      setTimeout(() => {
        if (onSave) {
          onSave();
        }
      }, 1000);
      
    } catch (error) {
      console.error('Image delete error:', error);
      setError(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (successMessage) {
      // If there was a successful change, trigger refresh before closing
      if (onSave) {
        onSave();
      }
    }
    onClose();
  };

  return (
    <div className="mpm-overlay">
      <div className="mpm-modal">
        <div className="mpm-header">
          <h2>{t('editManagerModal.title')}</h2>
          <button className="mpm-close-btn" onClick={handleClose} disabled={isUploading}>
            <X size={20} />
          </button>
        </div>

        <div className="mpm-form">
          {/* Profile Picture Section */}
          <div className="mpm-image-section">
            <label>Profile Picture</label>
            <div className="mpm-image-container">
              <div className="mpm-image-preview">
                {imagePreview ? (
                  <img src={imagePreview} alt="Profile" />
                ) : (
                  <div className="mpm-image-placeholder">
                    <FiUser size={48} />
                  </div>
                )}
              </div>
              
              <div className="mpm-image-actions">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  style={{ display: 'none' }}
                  disabled={isUploading}
                />
                
                <button
                  type="button"
                  className="mpm-btn-upload"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  <Camera size={16} />
                  {imagePreview ? 'Change Photo' : 'Upload Photo'}
                </button>
                
                {imageFile && (
                  <button
                    type="button"
                    className="mpm-btn-save-image"
                    onClick={handleImageUpload}
                    disabled={isUploading}
                  >
                    {isUploading ? 'Uploading...' : 'Save New Photo'}
                  </button>
                )}
                
                {profileImage && !imageFile && (
                  <button
                    type="button"
                    className="mpm-btn-delete-image"
                    onClick={handleDeleteImage}
                    disabled={isUploading}
                  >
                    <Trash2 size={16} />
                    Remove Photo
                  </button>
                )}
              </div>
            </div>
          </div>

          {successMessage && (
            <div className="mpm-success-message">
              ✓ {successMessage}
            </div>
          )}

          {error && (
            <div className="mpm-error-message">
              {error}
            </div>
          )}

          {/* Profile Information - Display Only */}
          <div className="mpm-info-section">
            <h3>Profile Information</h3>
            <div className="mpm-info-grid">
              <div className="mpm-info-item">
                <label>Name</label>
                <p>{profileData.first_name} {profileData.last_name}</p>
              </div>
              <div className="mpm-info-item">
                <label>Email</label>
                <p>{profileData.email}</p>
              </div>
              {profileData.company_name && (
                <div className="mpm-info-item">
                  <label>Company</label>
                  <p>{profileData.company_name}</p>
                </div>
              )}
              {profileData.address && (
                <div className="mpm-info-item">
                  <label>Address</label>
                  <p>{profileData.address}</p>
                </div>
              )}
            </div>
            <p className="mpm-info-note">
              To update your profile information, please contact support.
            </p>
          </div>

          <div className="mpm-actions">
            <button
              type="button"
              className="mpm-btn-close"
              onClick={handleClose}
              disabled={isUploading}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditManagerProfileModal;