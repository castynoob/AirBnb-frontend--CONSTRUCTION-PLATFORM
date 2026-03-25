import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Camera,
  Upload,
  Check,
  Briefcase,
  Award,
  Calendar,
  User,
  Phone,
  Mail,
  MapPin,
  CheckCircle,
  Edit,
  Shield,
  FileText,
  Image,
  Plus,
  Trash2,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import "../../styles/modal/editentrepreneurprofilemodal.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const QUEBEC_REGIONS = [
  "Montreal",
  "Quebec City",
  "Laval",
  "Gatineau",
  "Longueuil",
  "Sherbrooke",
  "Levis",
  "Trois-Rivieres",
  "Saguenay",
  "Terrebonne",
];

const SPECIALIZATION_OPTIONS = [
  "General Renovation",
  "Kitchen Remodeling",
  "Bathroom Remodeling",
  "Electrical",
  "Plumbing",
  "HVAC",
  "Roofing",
  "Painting",
  "Drywall",
  "Flooring",
  "Concrete Work",
  "Demolition",
  "Excavation",
  "Foundation Work",
  "Framing",
  "Steel Erection",
  "Siding Installation",
  "Waterproofing",
  "Glazing/Windows",
  "Landscaping",
  "Paving/Asphalt",
  "Tile Work",
  "Insulation",
  "Cabinetry",
  "Fire Protection",
  "Solar Installation",
  "Welding",
  "General Contracting",
];

function EditEntrepreneurProfileModal({ isOpen, profile, onClose, onSave, invalidateProfile }) {
  const { t } = useLanguage();
  const insuranceFileRef = useRef(null);
  const portfolioFileRef = useRef(null);

  const [formData, setFormData] = useState({
    company_name: "",
    license_number: "",
    years_in_business: "",
    num_employees: "",
    address: "",
    phone: "",
    email: "",
    specializations: [],
    rbq_license_number: "",
    insurance_provider: "",
    insurance_expiry: "",
    service_area: [],
  });

  const [otherSpecialization, setOtherSpecialization] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);

  // Insurance proof state
  const [insuranceProofUrl, setInsuranceProofUrl] = useState(null);
  const [isUploadingInsurance, setIsUploadingInsurance] = useState(false);

  // Service area state
  const [serviceAreaInput, setServiceAreaInput] = useState("");
  const [showRegionDropdown, setShowRegionDropdown] = useState(false);

  // Portfolio state
  const [portfolioPhotos, setPortfolioPhotos] = useState([]);
  const [isUploadingPortfolio, setIsUploadingPortfolio] = useState(false);
  const [newPhotoCaption, setNewPhotoCaption] = useState("");

  const getAuthToken = () => {
    try {
      const userData = JSON.parse(localStorage.getItem("userProfile"));
      return userData?.token;
    } catch {
      return null;
    }
  };

  // Pre-fill form data when modal opens
  useEffect(() => {
    if (isOpen && profile) {
      const knownSpecs =
        profile.specializations?.filter((s) =>
          SPECIALIZATION_OPTIONS.includes(s)
        ) || [];
      const customSpecs =
        profile.specializations?.filter(
          (s) => !SPECIALIZATION_OPTIONS.includes(s)
        ) || [];

      setFormData({
        company_name: profile.companyName || profile.company_name || "",
        license_number: profile.licenseNumber || profile.license_number || "",
        years_in_business: profile.yearsInBusiness || profile.years_in_business || "",
        num_employees: profile.numEmployees || profile.num_employees || "",
        address: profile.address || "",
        phone: profile.phone || "",
        email: profile.email || "",
        specializations: knownSpecs,
        rbq_license_number: profile.rbq_license_number || "",
        insurance_provider: profile.insurance_provider || "",
        insurance_expiry: profile.insurance_expiry
          ? profile.insurance_expiry.substring(0, 10)
          : "",
        service_area: profile.service_area || [],
      });
      setOtherSpecialization(customSpecs.join(", "));
      setInsuranceProofUrl(profile.insurance_proof_url || null);
      setPortfolioPhotos(profile.portfolio || []);
      setProfileImage(null);
      setProfileImagePreview(null);
    }
  }, [isOpen, profile]);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSpecializationChange = (spec) => {
    setFormData((prev) => ({
      ...prev,
      specializations: prev.specializations.includes(spec)
        ? prev.specializations.filter((s) => s !== spec)
        : [...prev.specializations, spec],
    }));
  };

  // Image handling
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) return;
      if (file.size > 5 * 1024 * 1024) return;
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setProfileImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setProfileImage(null);
    setProfileImagePreview(null);
  };

  // --- Service Area ---
  const filteredRegions = QUEBEC_REGIONS.filter(
    (r) =>
      !formData.service_area.includes(r) &&
      r.toLowerCase().includes(serviceAreaInput.toLowerCase())
  );

  const addServiceArea = (region) => {
    if (region && !formData.service_area.includes(region)) {
      setFormData((prev) => ({
        ...prev,
        service_area: [...prev.service_area, region],
      }));
    }
    setServiceAreaInput("");
    setShowRegionDropdown(false);
  };

  const removeServiceArea = (region) => {
    setFormData((prev) => ({
      ...prev,
      service_area: prev.service_area.filter((r) => r !== region),
    }));
  };

  const handleServiceAreaKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const val = serviceAreaInput.trim();
      if (val) {
        addServiceArea(val);
      }
    }
  };

  // --- Insurance Proof Upload ---
  const handleInsuranceUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploadingInsurance(true);
    try {
      const token = getAuthToken();
      const fd = new FormData();
      fd.append("file", file);

      const response = await fetch(
        `${API_BASE_URL}/api/users/entrepreneur-profile/insurance-proof`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        }
      );

      if (response.ok) {
        const data = await response.json();
        setInsuranceProofUrl(data.url || data.insurance_proof_url);
      }
    } catch (error) {
      console.error("Insurance upload error:", error);
    } finally {
      setIsUploadingInsurance(false);
    }
  };

  // --- Portfolio ---
  const handlePortfolioUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploadingPortfolio(true);
    try {
      const token = getAuthToken();
      const fd = new FormData();
      fd.append("photo", file);
      if (newPhotoCaption.trim()) {
        fd.append("caption", newPhotoCaption.trim());
      }

      const response = await fetch(
        `${API_BASE_URL}/api/users/entrepreneur-profile/portfolio`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        }
      );

      if (response.ok) {
        const data = await response.json();
        setPortfolioPhotos((prev) => [...prev, data.photo || data]);
        setNewPhotoCaption("");
      }
    } catch (error) {
      console.error("Portfolio upload error:", error);
    } finally {
      setIsUploadingPortfolio(false);
    }
  };

  const handlePortfolioDelete = async (index) => {
    try {
      const token = getAuthToken();
      const response = await fetch(
        `${API_BASE_URL}/api/users/entrepreneur-profile/portfolio/${index}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        setPortfolioPhotos((prev) => prev.filter((_, i) => i !== index));
      }
    } catch (error) {
      console.error("Portfolio delete error:", error);
    }
  };

  // --- Main form submit ---
  const handleSubmit = async () => {
    if (
      !formData.company_name ||
      !formData.license_number ||
      !formData.years_in_business ||
      !formData.num_employees ||
      !formData.address
    ) {
      return;
    }

    setIsUpdating(true);
    const token = getAuthToken();
    let imageUploadFailed = false;

    try {
      // Upload profile image if changed
      if (profileImage) {
        setIsUploadingImage(true);
        const imageFormData = new FormData();
        imageFormData.append("image", profileImage);

        try {
          const imageResponse = await fetch(
            `${API_BASE_URL}/api/users/entrepreneur/profile-picture`,
            {
              method: "POST",
              headers: { Authorization: `Bearer ${token}` },
              body: imageFormData,
            }
          );
          if (!imageResponse.ok) imageUploadFailed = true;
        } catch {
          imageUploadFailed = true;
        }
        setIsUploadingImage(false);
      }

      // Update profile data
      const profileResponse = await fetch(
        `${API_BASE_URL}/api/users/entrepreneur/profile`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            company_name: formData.company_name,
            license_number: formData.license_number,
            years_in_business: parseInt(formData.years_in_business),
            num_employees: parseInt(formData.num_employees),
            address: formData.address,
            specializations: [
              ...formData.specializations,
              ...otherSpecialization
                .split(",")
                .map((s) => s.trim())
                .filter((s) => s.length > 0),
            ],
            rbq_license_number: formData.rbq_license_number,
            insurance_provider: formData.insurance_provider,
            insurance_expiry: formData.insurance_expiry || null,
            service_area: formData.service_area,
          }),
        }
      );

      if (!profileResponse.ok) {
        throw new Error("Failed to update profile");
      }

      // Update phone if changed
      if (formData.phone !== (profile.phone || "")) {
        await fetch(`${API_BASE_URL}/api/users/phone`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ phone: formData.phone }),
        });
      }

      if (invalidateProfile) {
        await invalidateProfile();
      }

      setProfileImage(null);
      setProfileImagePreview(null);

      if (onSave) onSave();
      onClose();
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setIsUpdating(false);
      setIsUploadingImage(false);
    }
  };

  return (
    <div className="edit-modal-backdrop">
      <div className="edit-modal-container">
        <div className="edit-modal-header">
          <div className="edit-header-content">
            <h2 className="edit-modal-title">
              {t("profileEntrepreneur.editCompanyProfile") || "Edit Company Profile"}
            </h2>
            <p className="edit-modal-subtitle">
              {t("profileEntrepreneur.updateBusinessInfo") || "Update your business information"}
            </p>
          </div>
          <button onClick={onClose} className="edit-close-btn" disabled={isUpdating}>
            <X size={24} />
          </button>
        </div>

        <div className="edit-modal-body">
          {/* Profile Image Upload Section */}
          <div className="edit-section">
            <div className="edit-section-header">
              <Camera size={18} className="edit-section-icon" />
              <span>
                {t("profileEntrepreneur.companyLogoProfilePicture") || "Company Logo / Profile Picture"}
              </span>
            </div>
            <div className="edit-image-upload-container">
              <div className="edit-image-preview">
                {profileImagePreview ? (
                  <img src={profileImagePreview} alt="Preview" className="edit-preview-img" />
                ) : profile?.image ? (
                  <img src={profile.image} alt="Current" className="edit-preview-img" />
                ) : (
                  <div className="edit-no-image">
                    <Camera size={40} />
                    <span>{t("profileEntrepreneur.noImage") || "No Image"}</span>
                  </div>
                )}
              </div>
              <div className="edit-image-actions">
                <label className="edit-upload-btn">
                  <Upload size={18} />
                  {profileImage
                    ? t("profileEntrepreneur.changeImage") || "Change Image"
                    : t("profileEntrepreneur.uploadImage") || "Upload Image"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    style={{ display: "none" }}
                  />
                </label>
                {(profileImage || profileImagePreview) && (
                  <button type="button" className="edit-remove-btn" onClick={handleRemoveImage}>
                    <X size={18} />
                    {t("profileEntrepreneur.remove") || "Remove"}
                  </button>
                )}
              </div>
              <p className="edit-image-hint">
                {t("profileEntrepreneur.imageHint") || "Max 5MB. JPG, PNG or WebP."}
              </p>
            </div>
          </div>

          {/* Company Information Section */}
          <div className="edit-section">
            <div className="edit-section-header">
              <Briefcase size={18} className="edit-section-icon" />
              <span>{t("profileEntrepreneur.companyInformation") || "Company Information"}</span>
            </div>

            <div className="edit-form-group">
              <label className="edit-form-label">
                <Briefcase size={14} />
                {t("profileEntrepreneur.companyNameLabel") || "Company Name"}{" "}
                <span className="edit-required">*</span>
              </label>
              <input
                type="text"
                name="company_name"
                value={formData.company_name}
                onChange={handleInputChange}
                className="edit-form-input"
                placeholder={t("profileEntrepreneur.enterCompanyName") || "Enter company name"}
              />
            </div>

            <div className="edit-form-group">
              <label className="edit-form-label">
                <Award size={14} />
                {t("profileEntrepreneur.licenseNumberLabel") || "License Number"}{" "}
                <span className="edit-required">*</span>
              </label>
              <input
                type="text"
                name="license_number"
                value={formData.license_number}
                onChange={handleInputChange}
                className="edit-form-input"
                placeholder={t("profileEntrepreneur.enterLicenseNumber") || "Enter license number"}
              />
            </div>

            {/* RBQ License Section */}
            <div className="edit-form-group">
              <label className="edit-form-label">
                <Shield size={14} />
                {t("profileEntrepreneur.rbqLicense") || "RBQ License Number"}
              </label>
              <input
                type="text"
                name="rbq_license_number"
                value={formData.rbq_license_number}
                onChange={handleInputChange}
                className="edit-form-input"
                placeholder="e.g. 1234-5678-90"
              />
              <a
                href="https://www.rbq.gouv.qc.ca/en/licence-holders/find-a-licence-holder/"
                target="_blank"
                rel="noopener noreferrer"
                className="eepm-rbq-verify-link"
              >
                {t("profileEntrepreneur.verifyOnRBQ") || "Verify on RBQ"} &rarr;
              </a>
            </div>

            <div className="edit-form-row">
              <div className="edit-form-group">
                <label className="edit-form-label">
                  <Calendar size={14} />
                  {t("profileEntrepreneur.yearsInBusinessLabel") || "Years in Business"}{" "}
                  <span className="edit-required">*</span>
                </label>
                <input
                  type="number"
                  name="years_in_business"
                  value={formData.years_in_business}
                  onChange={handleInputChange}
                  className="edit-form-input"
                  placeholder="0"
                  min="0"
                />
              </div>
              <div className="edit-form-group">
                <label className="edit-form-label">
                  <User size={14} />
                  {t("profileEntrepreneur.numberOfEmployeesLabel") || "Number of Employees"}{" "}
                  <span className="edit-required">*</span>
                </label>
                <input
                  type="number"
                  name="num_employees"
                  value={formData.num_employees}
                  onChange={handleInputChange}
                  className="edit-form-input"
                  placeholder="0"
                  min="1"
                />
              </div>
            </div>
          </div>

          {/* Insurance Section */}
          <div className="edit-section">
            <div className="edit-section-header">
              <FileText size={18} className="edit-section-icon" />
              <span>{t("profileEntrepreneur.insurance") || "Insurance"}</span>
            </div>

            <div className="edit-form-group">
              <label className="edit-form-label">
                <Shield size={14} />
                {t("profileEntrepreneur.insuranceProvider") || "Insurance Provider"}
              </label>
              <input
                type="text"
                name="insurance_provider"
                value={formData.insurance_provider}
                onChange={handleInputChange}
                className="edit-form-input"
                placeholder={t("profileEntrepreneur.enterInsuranceProvider") || "Insurance company name"}
              />
            </div>

            <div className="edit-form-group">
              <label className="edit-form-label">
                <Calendar size={14} />
                {t("profileEntrepreneur.insuranceExpiry") || "Insurance Expiry Date"}
              </label>
              <input
                type="date"
                name="insurance_expiry"
                value={formData.insurance_expiry}
                onChange={handleInputChange}
                className="edit-form-input"
              />
            </div>

            <div className="edit-form-group">
              <label className="edit-form-label">
                <FileText size={14} />
                {t("profileEntrepreneur.insuranceProof") || "Insurance Proof Document"}
              </label>
              <div className="eepm-insurance-actions">
                <input
                  ref={insuranceFileRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  onChange={handleInsuranceUpload}
                  style={{ display: "none" }}
                />
                <button
                  type="button"
                  className="edit-upload-btn"
                  onClick={() => insuranceFileRef.current?.click()}
                  disabled={isUploadingInsurance}
                >
                  {isUploadingInsurance ? (
                    <>
                      <Loader2 size={16} className="eepm-spinner" />
                      {t("profileEntrepreneur.uploading") || "Uploading..."}
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      {t("profileEntrepreneur.uploadProof") || "Upload Proof"}
                    </>
                  )}
                </button>
                {insuranceProofUrl && (
                  <a
                    href={insuranceProofUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="eepm-view-document-link"
                  >
                    <ExternalLink size={14} />
                    {t("profileEntrepreneur.viewDocument") || "View Document"}
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Contact Information Section */}
          <div className="edit-section">
            <div className="edit-section-header">
              <Phone size={18} className="edit-section-icon" />
              <span>{t("profileEntrepreneur.contactInformation") || "Contact Information"}</span>
            </div>

            <div className="edit-form-row">
              <div className="edit-form-group">
                <label className="edit-form-label">
                  <Phone size={14} />
                  {t("profileEntrepreneur.phoneNumber") || "Phone Number"}
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="edit-form-input"
                  placeholder="+1 XXX XXX XXXX"
                />
              </div>
              <div className="edit-form-group">
                <label className="edit-form-label">
                  <Mail size={14} />
                  {t("profileEntrepreneur.emailAddress") || "Email Address"}
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="edit-form-input"
                  placeholder="email@example.com"
                  disabled
                />
              </div>
            </div>

            <div className="edit-form-group">
              <label className="edit-form-label">
                <MapPin size={14} />
                {t("profileEntrepreneur.businessAddress") || "Business Address"}{" "}
                <span className="edit-required">*</span>
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="edit-form-textarea"
                placeholder={t("profileEntrepreneur.enterBusinessAddress") || "Enter business address"}
                rows="3"
              />
            </div>
          </div>

          {/* Service Area Section */}
          <div className="edit-section">
            <div className="edit-section-header">
              <MapPin size={18} className="edit-section-icon" />
              <span>{t("profileEntrepreneur.serviceArea") || "Service Area"}</span>
            </div>

            <div className="eepm-service-area-tags">
              {formData.service_area.map((region, idx) => (
                <span key={idx} className="eepm-tag">
                  {region}
                  <button
                    type="button"
                    className="eepm-tag-remove"
                    onClick={() => removeServiceArea(region)}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>

            <div className="eepm-service-area-input-wrapper">
              <input
                type="text"
                value={serviceAreaInput}
                onChange={(e) => {
                  setServiceAreaInput(e.target.value);
                  setShowRegionDropdown(true);
                }}
                onFocus={() => setShowRegionDropdown(true)}
                onKeyDown={handleServiceAreaKeyDown}
                className="edit-form-input"
                placeholder={
                  t("profileEntrepreneur.addServiceArea") || "Type a region and press Enter..."
                }
              />
              {showRegionDropdown && serviceAreaInput && filteredRegions.length > 0 && (
                <div className="eepm-region-dropdown">
                  {filteredRegions.map((region) => (
                    <button
                      key={region}
                      type="button"
                      className="eepm-region-option"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        addServiceArea(region);
                      }}
                    >
                      <MapPin size={14} />
                      {region}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="edit-image-hint">
              {t("profileEntrepreneur.serviceAreaHint") ||
                "Select from Quebec regions or type a custom area and press Enter."}
            </p>
          </div>

          {/* Specializations Section */}
          <div className="edit-section">
            <div className="edit-section-header">
              <CheckCircle size={18} className="edit-section-icon" />
              <span>{t("profileEntrepreneur.specializations") || "Specializations"}</span>
              <span className="edit-selected-count">
                {formData.specializations.length} {t("profileEntrepreneur.selected") || "selected"}
              </span>
            </div>
            <div className="edit-specializations-grid">
              {SPECIALIZATION_OPTIONS.map((spec) => (
                <label
                  key={spec}
                  className={`edit-checkbox-label ${
                    formData.specializations.includes(spec) ? "checked" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.specializations.includes(spec)}
                    onChange={() => handleSpecializationChange(spec)}
                    className="edit-checkbox-input"
                  />
                  <span className="edit-checkbox-text">{spec}</span>
                  {formData.specializations.includes(spec) && (
                    <Check size={14} className="edit-check-icon" />
                  )}
                </label>
              ))}
            </div>
            <div className="edit-other-specialization">
              <label className="edit-form-label">
                <Edit size={14} />
                {t("profileEntrepreneur.otherSpecialization") || "Other Specialization"}
              </label>
              <input
                type="text"
                value={otherSpecialization}
                onChange={(e) => setOtherSpecialization(e.target.value)}
                className="edit-form-input"
                placeholder={
                  t("profileEntrepreneur.otherSpecializationPlaceholder") ||
                  "e.g. Custom Homes, Heritage Restoration"
                }
              />
            </div>
          </div>

          {/* Portfolio Section */}
          <div className="edit-section">
            <div className="edit-section-header">
              <Image size={18} className="edit-section-icon" />
              <span>{t("profileEntrepreneur.photoPortfolio") || "Photo Portfolio"}</span>
            </div>

            {portfolioPhotos.length > 0 && (
              <div className="eepm-portfolio-grid">
                {portfolioPhotos.map((photo, index) => (
                  <div key={index} className="eepm-portfolio-item">
                    <img
                      src={typeof photo === "string" ? photo : photo.url}
                      alt={
                        typeof photo === "object" && photo.caption
                          ? photo.caption
                          : `Portfolio ${index + 1}`
                      }
                      className="eepm-portfolio-img"
                    />
                    <button
                      type="button"
                      className="eepm-portfolio-remove"
                      onClick={() => handlePortfolioDelete(index)}
                      title="Remove photo"
                    >
                      <X size={14} />
                    </button>
                    {typeof photo === "object" && photo.caption && (
                      <span className="eepm-portfolio-caption">{photo.caption}</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="eepm-portfolio-upload-section">
              <div className="edit-form-group">
                <label className="edit-form-label">
                  <Edit size={14} />
                  {t("profileEntrepreneur.photoCaption") || "Caption (optional)"}
                </label>
                <input
                  type="text"
                  value={newPhotoCaption}
                  onChange={(e) => setNewPhotoCaption(e.target.value)}
                  className="edit-form-input"
                  placeholder={
                    t("profileEntrepreneur.captionPlaceholder") || "Describe this photo..."
                  }
                />
              </div>

              <input
                ref={portfolioFileRef}
                type="file"
                accept="image/*"
                onChange={handlePortfolioUpload}
                style={{ display: "none" }}
              />
              <button
                type="button"
                className="edit-upload-btn"
                onClick={() => portfolioFileRef.current?.click()}
                disabled={isUploadingPortfolio}
              >
                {isUploadingPortfolio ? (
                  <>
                    <Loader2 size={16} className="eepm-spinner" />
                    {t("profileEntrepreneur.uploading") || "Uploading..."}
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    {t("profileEntrepreneur.addPhoto") || "Add Photo"}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="edit-button-group">
            <button
              onClick={onClose}
              className="edit-cancel-btn"
              disabled={isUpdating}
            >
              <X size={18} />
              {t("profileEntrepreneur.cancel") || "Cancel"}
            </button>
            <button
              onClick={handleSubmit}
              className="edit-submit-btn"
              disabled={isUpdating}
            >
              {isUpdating ? (
                <>
                  <span className="edit-spinner"></span>
                  {isUploadingImage
                    ? t("profileEntrepreneur.uploadingImage") || "Uploading image..."
                    : t("profileEntrepreneur.saving") || "Saving..."}
                </>
              ) : (
                <>
                  <Check size={18} />
                  {t("profileEntrepreneur.saveChanges") || "Save Changes"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditEntrepreneurProfileModal;
