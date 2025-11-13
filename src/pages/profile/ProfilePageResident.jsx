import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, MapPin, Calendar, Mail, Phone, LogOut, Edit2, Save, X } from 'lucide-react';
import Nav from '../../components/Nav';
import '../../styles/resident/profilepageresident.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const ProfilePageResident = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    bio: '',
    unit_number: '',
    floor: '',
    building_section: '',
    move_in_date: '',
    show_email: true,
    show_phone: true,
    show_unit: true,
    show_move_in_date: false,
    allow_messages: true,
    show_online_status: true,
    contact_via_email: true,
    contact_via_phone: true,
    contact_via_message: true
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const userProfile = JSON.parse(localStorage.getItem('userProfile'));
      if (!userProfile?.token) {
        setError('Please log in to view your profile');
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/residents/profile`, {
        headers: {
          'Authorization': `Bearer ${userProfile.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch profile');

      const data = await response.json();
      if (data.success) {
        setProfile(data.profile);
        setFormData({
          bio: data.profile.bio || '',
          unit_number: data.profile.unit_number || '',
          floor: data.profile.floor || '',
          building_section: data.profile.building_section || '',
          move_in_date: data.profile.move_in_date ? data.profile.move_in_date.split('T')[0] : '',
          show_email: data.profile.show_email ?? true,
          show_phone: data.profile.show_phone ?? true,
          show_unit: data.profile.show_unit ?? true,
          show_move_in_date: data.profile.show_move_in_date ?? false,
          allow_messages: data.profile.allow_messages ?? true,
          show_online_status: data.profile.show_online_status ?? true,
          contact_via_email: data.profile.contact_via_email ?? true,
          contact_via_phone: data.profile.contact_via_phone ?? true,
          contact_via_message: data.profile.contact_via_message ?? true
        });
      }
    } catch (error) {
      console.error('❌ Error fetching profile:', error);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const userProfile = JSON.parse(localStorage.getItem('userProfile'));

      const response = await fetch(`${API_BASE_URL}/api/residents/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${userProfile.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to update profile');

      const data = await response.json();
      if (data.success) {
        setProfile(data.profile);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      setError('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form data to current profile
    setFormData({
      bio: profile.bio || '',
      unit_number: profile.unit_number || '',
      floor: profile.floor || '',
      building_section: profile.building_section || '',
      move_in_date: profile.move_in_date ? profile.move_in_date.split('T')[0] : '',
      show_email: profile.show_email ?? true,
      show_phone: profile.show_phone ?? true,
      show_unit: profile.show_unit ?? true,
      show_move_in_date: profile.show_move_in_date ?? false,
      allow_messages: profile.allow_messages ?? true,
      show_online_status: profile.show_online_status ?? true,
      contact_via_email: profile.contact_via_email ?? true,
      contact_via_phone: profile.contact_via_phone ?? true,
      contact_via_message: profile.contact_via_message ?? true
    });
    setIsEditing(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('userProfile');
    navigate('/');
  };

  if (loading) {
    return (
      <>
        <Nav />
        <div className="resident-profile-container">
          <div className="resident-loading-container">
            <div className="resident-loading-spinner"></div>
            <p>Loading profile...</p>
          </div>
        </div>
      </>
    );
  }

  if (error && !profile) {
    return (
      <>
        <Nav />
        <div className="resident-profile-container">
          <div className="resident-error-container">
            <p className="resident-error-message">{error}</p>
            <button className="resident-retry-btn" onClick={fetchProfile}>
              Try Again
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Nav />
      <div className="resident-profile-container">
        <div className="resident-profile-header">
          <h1>My Profile</h1>
          {!isEditing ? (
            <button className="resident-edit-btn" onClick={() => setIsEditing(true)}>
              <Edit2 size={18} />
              <span>Edit Profile</span>
            </button>
          ) : (
            <div className="resident-edit-actions">
              <button className="resident-save-btn" onClick={handleSave} disabled={saving}>
                <Save size={18} />
                <span>{saving ? 'Saving...' : 'Save'}</span>
              </button>
              <button className="resident-cancel-btn" onClick={handleCancel} disabled={saving}>
                <X size={18} />
                <span>Cancel</span>
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="resident-error-message-inline">{error}</div>
        )}

        <div className="resident-profile-content">
          {/* Basic Info */}
          <div className="resident-profile-card">
            <div className="resident-profile-avatar-section">
              {profile.profile_picture ? (
                <img
                  src={profile.profile_picture}
                  alt="Profile"
                  className="resident-profile-avatar-large"
                />
              ) : (
                <div className="resident-profile-avatar-placeholder-large">
                  <User size={48} />
                </div>
              )}
              {profile.is_online && (
                <span className="resident-online-badge">Online</span>
              )}
            </div>

            <div className="resident-profile-basic-info">
              <h2>{profile.first_name} {profile.last_name}</h2>

              {/* Logout Button */}
              <button className="resident-logout-btn-profile" onClick={handleLogout}>
                Logout
              </button>

              {isEditing ? (
                <div className="resident-form-group">
                  <label>Bio</label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Tell your neighbors about yourself..."
                    rows={4}
                    className="resident-form-textarea"
                  />
                </div>
              ) : (
                profile.bio && <p className="resident-profile-bio">{profile.bio}</p>
              )}
            </div>
          </div>

          {/* Unit Information */}
          <div className="resident-profile-card">
            <h3 className="resident-card-title">
              <MapPin size={20} />
              Unit Information
            </h3>

            {isEditing ? (
              <div className="resident-form-grid">
                <div className="resident-form-group">
                  <label>Unit Number</label>
                  <input
                    type="text"
                    value={formData.unit_number}
                    onChange={(e) => setFormData({ ...formData, unit_number: e.target.value })}
                    placeholder="e.g., 101"
                    className="resident-form-input"
                  />
                </div>

                <div className="resident-form-group">
                  <label>Floor</label>
                  <input
                    type="number"
                    value={formData.floor}
                    onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                    placeholder="e.g., 1"
                    className="resident-form-input"
                  />
                </div>

                <div className="resident-form-group">
                  <label>Building Section</label>
                  <input
                    type="text"
                    value={formData.building_section}
                    onChange={(e) => setFormData({ ...formData, building_section: e.target.value })}
                    placeholder="e.g., North Wing"
                    className="resident-form-input"
                  />
                </div>

                <div className="resident-form-group">
                  <label>Move-in Date</label>
                  <input
                    type="date"
                    value={formData.move_in_date}
                    onChange={(e) => setFormData({ ...formData, move_in_date: e.target.value })}
                    className="resident-form-input"
                  />
                </div>
              </div>
            ) : (
              <div className="resident-info-grid">
                {profile.unit_number && (
                  <div className="resident-info-item">
                    <span className="resident-info-label">Unit:</span>
                    <span className="resident-info-value">{profile.unit_number}</span>
                  </div>
                )}
                {profile.floor && (
                  <div className="resident-info-item">
                    <span className="resident-info-label">Floor:</span>
                    <span className="resident-info-value">{profile.floor}</span>
                  </div>
                )}
                {profile.building_section && (
                  <div className="resident-info-item">
                    <span className="resident-info-label">Section:</span>
                    <span className="resident-info-value">{profile.building_section}</span>
                  </div>
                )}
                {profile.move_in_date && (
                  <div className="resident-info-item">
                    <span className="resident-info-label">Move-in:</span>
                    <span className="resident-info-value">
                      {new Date(profile.move_in_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Contact Information */}
          <div className="resident-profile-card">
            <h3 className="resident-card-title">
              <Mail size={20} />
              Contact Information
            </h3>

            <div className="resident-info-grid">
              {profile.email && (
                <div className="resident-info-item">
                  <Mail size={16} />
                  <span className="resident-info-value">{profile.email}</span>
                </div>
              )}
              {profile.phone && (
                <div className="resident-info-item">
                  <Phone size={16} />
                  <span className="resident-info-value">{profile.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Privacy Settings */}
          {isEditing && (
            <div className="resident-profile-card">
              <h3 className="resident-card-title">Privacy Settings</h3>

              <div className="resident-privacy-settings">
                <label className="resident-checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.show_email}
                    onChange={(e) => setFormData({ ...formData, show_email: e.target.checked })}
                  />
                  <span>Show email to other residents</span>
                </label>

                <label className="resident-checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.show_phone}
                    onChange={(e) => setFormData({ ...formData, show_phone: e.target.checked })}
                  />
                  <span>Show phone to other residents</span>
                </label>

                <label className="resident-checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.show_unit}
                    onChange={(e) => setFormData({ ...formData, show_unit: e.target.checked })}
                  />
                  <span>Show unit number to other residents</span>
                </label>

                <label className="resident-checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.show_move_in_date}
                    onChange={(e) => setFormData({ ...formData, show_move_in_date: e.target.checked })}
                  />
                  <span>Show move-in date</span>
                </label>

                <label className="resident-checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.show_online_status}
                    onChange={(e) => setFormData({ ...formData, show_online_status: e.target.checked })}
                  />
                  <span>Show when I'm online</span>
                </label>

                <label className="resident-checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.allow_messages}
                    onChange={(e) => setFormData({ ...formData, allow_messages: e.target.checked })}
                  />
                  <span>Allow other residents to message me</span>
                </label>

                <h4 className="resident-subsection-title">Contact Preferences</h4>

                <label className="resident-checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.contact_via_email}
                    onChange={(e) => setFormData({ ...formData, contact_via_email: e.target.checked })}
                  />
                  <span>Allow contact via email</span>
                </label>

                <label className="resident-checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.contact_via_phone}
                    onChange={(e) => setFormData({ ...formData, contact_via_phone: e.target.checked })}
                  />
                  <span>Allow contact via phone</span>
                </label>

                <label className="resident-checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.contact_via_message}
                    onChange={(e) => setFormData({ ...formData, contact_via_message: e.target.checked })}
                  />
                  <span>Allow contact via direct message</span>
                </label>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ProfilePageResident;