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
  // Fallback-aware translator — our i18n returns the key itself when the key
  // isn't in the dictionary, so `t('k') || fallback` silently shows the key.
  const tf = (key, fallback) => {
    const v = t(key);
    return v === key ? fallback : v;
  };
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
    // Public specialist directory opt-in. Default false — the platform-wide
    // policy is nobody appears in the public browse page until they
    // explicitly turn it on.
    showcase_enabled: false,
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

  // RBQ live-check state (mirrors the registration form). `status` progresses
  // idle → checking → valid | invalid | restricted | bad-format | unavailable.
  // `enforcementEnabled` is set from the backend response and controls whether
  // a bad status blocks save (backend re-verifies regardless).
  const [rbqCheck, setRbqCheck] = useState({ status: "idle" });
  const rbqDebounceRef = useRef(null);
  const rbqLastRef = useRef(null);
  // Snapshot the license the modal opened with, so we only trigger the live
  // check on ACTUAL edits (avoids a needless network hit on every modal open).
  const initialLicenseRef = useRef("");

  // Portfolio state
  const [portfolioPhotos, setPortfolioPhotos] = useState([]);
  const [isUploadingPortfolio, setIsUploadingPortfolio] = useState(false);
  const [newPhotoCaption, setNewPhotoCaption] = useState("");
  // Extended upload metadata — tag the photo with a trade, mark it as the
  // "before" side of a pair, or link it to an existing "before" photo to
  // form a before/after set that the gallery renders side-by-side.
  const [newPhotoTag, setNewPhotoTag] = useState("");
  const [newPhotoIsBefore, setNewPhotoIsBefore] = useState(false);
  const [newPhotoPairId, setNewPhotoPairId] = useState("");

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
        showcase_enabled: profile.showcase_enabled ?? false,
      });
      setOtherSpecialization(customSpecs.join(", "));
      setInsuranceProofUrl(profile.insurance_proof_url || null);
      setPortfolioPhotos(profile.portfolio || []);
      setProfileImage(null);
      setProfileImagePreview(null);
      // Reset RBQ live-check on open; remember the current license so we can
      // detect actual edits.
      initialLicenseRef.current = profile.licenseNumber || profile.license_number || "";
      rbqLastRef.current = null;
      setRbqCheck({ status: "idle" });
      if (rbqDebounceRef.current) {
        clearTimeout(rbqDebounceRef.current);
        rbqDebounceRef.current = null;
      }
    }
  }, [isOpen, profile]);

  if (!isOpen) return null;

  // Debounced RBQ registry lookup — hits the public /api/register/validate-rbq
  // endpoint the registration form uses. Skips the network call for obvious
  // format failures and dedupes back-to-back checks on the same number.
  const triggerRBQCheck = (rawLicense) => {
    if (rbqDebounceRef.current) clearTimeout(rbqDebounceRef.current);
    const digits = String(rawLicense || "").replace(/\D/g, "");
    if (!digits) {
      setRbqCheck({ status: "idle" });
      return;
    }
    if (digits.length !== 10) {
      setRbqCheck({ status: "bad-format" });
      return;
    }
    const normalised = `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8, 10)}`;
    if (rbqLastRef.current?.license === normalised && rbqLastRef.current?.settled) {
      setRbqCheck(rbqLastRef.current.result);
      return;
    }
    setRbqCheck({ status: "checking" });
    rbqDebounceRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/register/validate-rbq`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ license_number: normalised }),
        });
        const data = await response.json();
        const next = data.ok
          ? {
              status: data.status,
              holderName: data.holderName,
              restrictions: data.restrictions,
              enforcementEnabled: data.enforcementEnabled,
            }
          : { status: data.reason || "unavailable", enforcementEnabled: data.enforcementEnabled };
        rbqLastRef.current = { license: normalised, settled: true, result: next };
        setRbqCheck(next);
      } catch (err) {
        console.error("RBQ check failed:", err);
        setRbqCheck({ status: "unavailable" });
      }
    }, 500);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Kick the RBQ live check only when the license actually changes from
    // whatever the modal opened with.
    if (name === "license_number" && value !== initialLicenseRef.current) {
      triggerRBQCheck(value);
    } else if (name === "license_number" && value === initialLicenseRef.current) {
      // Back to the original value — clear the pill.
      setRbqCheck({ status: "idle" });
    }
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
      if (newPhotoCaption.trim())  fd.append("caption",   newPhotoCaption.trim());
      if (newPhotoTag)             fd.append("trade_tag", newPhotoTag);
      if (newPhotoIsBefore)        fd.append("is_before", "true");
      if (newPhotoPairId)          fd.append("pair_id",   newPhotoPairId);

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
        // Backend returns full updated portfolio — replace to stay in sync
        // (the previous "append data.photo" path also worked but couldn't
        // reflect back-fills like id-generation for legacy rows).
        if (Array.isArray(data.portfolio)) {
          setPortfolioPhotos(data.portfolio);
        } else {
          setPortfolioPhotos((prev) => [...prev, data.photo || data]);
        }
        setNewPhotoCaption("");
        setNewPhotoTag("");
        setNewPhotoIsBefore(false);
        setNewPhotoPairId("");
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

    // Client-side RBQ gate — only when enforcement is on AND the licence was
    // actually edited. Skips a wasted round-trip. Backend re-verifies either
    // way. (bad-format is always blocked; unreachable/invalid/restricted only
    // when the backend is enforcing.)
    const licenseChanged = formData.license_number !== initialLicenseRef.current;
    if (licenseChanged) {
      if (rbqCheck.status === "bad-format") {
        alert(tf('landingPage.register.rbqBadFormat', 'RBQ licences are 10 digits (NNNN-NNNN-NN).'));
        return;
      }
      if (rbqCheck.enforcementEnabled) {
        if (rbqCheck.status === "invalid") {
          alert(tf('landingPage.register.rbqInvalid', 'No such licence in the RBQ registry.'));
          return;
        }
        if (rbqCheck.status === "restricted") {
          alert(tf('landingPage.register.rbqRestricted', 'This RBQ licence has active restrictions.'));
          return;
        }
        if (rbqCheck.status === "unavailable") {
          alert(tf('landingPage.register.rbqUnavailable', 'RBQ registry unreachable. Please try again.'));
          return;
        }
      }
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
            showcase_enabled: !!formData.showcase_enabled,
          }),
        }
      );

      if (!profileResponse.ok) {
        // Surface RBQ + duplicate-licence errors with the backend's message.
        // Any other 4xx/5xx falls back to the generic error.
        let errBody = null;
        try { errBody = await profileResponse.json(); } catch { /* not JSON */ }
        if (errBody?.code === 'duplicate_license') {
          alert(errBody.message || 'This licence number is already registered to another contractor.');
          setIsUpdating(false);
          return;
        }
        if (errBody?.code && errBody.code.startsWith('rbq_')) {
          alert(errBody.message || tf('landingPage.register.rbqInvalid', 'RBQ verification failed.'));
          setIsUpdating(false);
          return;
        }
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
              {/* RBQ live-check status pill — only shows after the user
                  edits the license away from its stored value. */}
              {rbqCheck.status !== "idle" && (
                <div className={`lp-rbq-status lp-rbq-${rbqCheck.status}`} style={{ marginTop: 6, fontSize: 13 }}>
                  {rbqCheck.status === "checking" && (
                    <span>⏳ {tf('landingPage.register.rbqChecking', 'Checking RBQ registry…')}</span>
                  )}
                  {rbqCheck.status === "bad-format" && (
                    <span>⚠ {tf('landingPage.register.rbqBadFormat', 'RBQ licences are 10 digits (NNNN-NNNN-NN).')}</span>
                  )}
                  {rbqCheck.status === "valid" && (
                    <span>✓ {tf('landingPage.register.rbqValid', 'RBQ verified')}{rbqCheck.holderName ? ` — ${rbqCheck.holderName}` : ''}</span>
                  )}
                  {rbqCheck.status === "restricted" && (
                    <span>⚠ {tf('landingPage.register.rbqRestricted', 'This RBQ licence has active restrictions.')}</span>
                  )}
                  {rbqCheck.status === "invalid" && (
                    <span>✗ {tf('landingPage.register.rbqInvalid', 'No such licence in the RBQ registry.')}</span>
                  )}
                  {rbqCheck.status === "unavailable" && (
                    <span>⚠ {tf('landingPage.register.rbqUnavailable', 'RBQ registry unreachable. Please try again.')}</span>
                  )}
                </div>
              )}
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

            {/* Directory opt-in — placed adjacent to the portfolio because
                appearing in the public specialist directory only makes sense
                once the entrepreneur has portfolio photos to show. Default
                off; visible everywhere so contractors always know their
                current visibility. */}
            <div
              style={{
                background: formData.showcase_enabled ? "#ecfeff" : "#f8fafc",
                border: `1px solid ${formData.showcase_enabled ? "#67e8f9" : "#e5e7eb"}`,
                borderRadius: 10,
                padding: "12px 14px",
                marginBottom: 16,
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
              }}
            >
              <label
                htmlFor="showcase-toggle"
                style={{
                  position: "relative",
                  display: "inline-block",
                  width: 40,
                  height: 22,
                  flexShrink: 0,
                  cursor: "pointer",
                }}
              >
                <input
                  id="showcase-toggle"
                  type="checkbox"
                  checked={!!formData.showcase_enabled}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, showcase_enabled: e.target.checked }))
                  }
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: formData.showcase_enabled ? "#14919B" : "#cbd5e1",
                    borderRadius: 22,
                    transition: "background 0.2s",
                  }}
                />
                <span
                  style={{
                    position: "absolute",
                    top: 2,
                    left: formData.showcase_enabled ? 20 : 2,
                    width: 18,
                    height: 18,
                    background: "#fff",
                    borderRadius: "50%",
                    transition: "left 0.2s",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                  }}
                />
              </label>
              <div style={{ flex: 1, minWidth: 0 }}>
                <label htmlFor="showcase-toggle" style={{ display: "block", fontWeight: 600, fontSize: 14, color: "#0F223D", cursor: "pointer" }}>
                  Showcase me in the public specialist directory
                </label>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "#6b7280", lineHeight: 1.55 }}>
                  Property managers and residents can browse contractors at{" "}
                  <code style={{ background: "#e2e8f0", padding: "1px 6px", borderRadius: 4, fontSize: 11 }}>
                    /find-contractors
                  </code>
                  . Only entrepreneurs with at least one portfolio photo are listed.{" "}
                  {formData.showcase_enabled
                    ? "You're currently visible."
                    : "You're currently hidden."}
                </p>
              </div>
            </div>

            {portfolioPhotos.length > 0 && (() => {
              // Group entries into before/after pairs (grouped by pair_id).
              // Standalone photos render as single tiles; pairs render as a
              // side-by-side "Before → After" tile in the same grid row.
              const byPair = new Map();
              const singles = [];
              portfolioPhotos.forEach((p, i) => {
                const enriched = typeof p === "object" ? p : { url: p };
                const item = { ...enriched, __idx: i };
                if (item.pair_id) {
                  if (!byPair.has(item.pair_id)) byPair.set(item.pair_id, []);
                  byPair.get(item.pair_id).push(item);
                } else {
                  singles.push(item);
                }
              });
              // Also treat a photo marked is_before as anchoring a pair (its own id).
              portfolioPhotos.forEach((p, i) => {
                if (typeof p === "object" && p.is_before && p.id) {
                  const partners = portfolioPhotos.filter((q) => typeof q === "object" && q.pair_id === p.id);
                  if (partners.length > 0) {
                    // Move the "before" from singles/pair into a new pair bucket keyed by p.id.
                    const before = { ...p, __idx: i };
                    if (!byPair.has(p.id)) byPair.set(p.id, []);
                    byPair.get(p.id).unshift(before);
                    // Remove from singles if present.
                    const singleIdx = singles.findIndex((s) => s.__idx === i);
                    if (singleIdx !== -1) singles.splice(singleIdx, 1);
                  }
                }
              });

              const renderTile = (item, extraClass = "") => (
                <div key={`t-${item.__idx}`} className={`eepm-portfolio-item ${extraClass}`}>
                  <img
                    src={item.url}
                    alt={item.caption || `Portfolio ${item.__idx + 1}`}
                    className="eepm-portfolio-img"
                  />
                  <button
                    type="button"
                    className="eepm-portfolio-remove"
                    onClick={() => handlePortfolioDelete(item.__idx)}
                    title="Remove photo"
                  >
                    <X size={14} />
                  </button>
                  {(item.trade_tag || item.is_before) && (
                    <div style={{ position: "absolute", top: 8, left: 8, display: "flex", gap: 4 }}>
                      {item.trade_tag && (
                        <span style={{
                          background: "rgba(0, 165, 169, 0.9)", color: "#fff",
                          fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999,
                          textTransform: "uppercase", letterSpacing: 0.4,
                        }}>{item.trade_tag}</span>
                      )}
                      {item.is_before && (
                        <span style={{
                          background: "rgba(15, 34, 61, 0.85)", color: "#fff",
                          fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999,
                        }}>BEFORE</span>
                      )}
                    </div>
                  )}
                  {item.caption && (
                    <span className="eepm-portfolio-caption">{item.caption}</span>
                  )}
                </div>
              );

              return (
                <div className="eepm-portfolio-grid">
                  {/* Pairs rendered as connected tiles. */}
                  {Array.from(byPair.entries()).map(([pairKey, items]) => {
                    const before = items.find((i) => i.is_before) || items[0];
                    const after = items.find((i) => i.id !== before?.id) || items[1];
                    if (!before || !after) return items.map((i) => renderTile(i));
                    return (
                      <div key={`pair-${pairKey}`} style={{
                        gridColumn: "span 2",
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 6,
                        padding: 6,
                        background: "linear-gradient(90deg, #fef3c7 0%, #dcfce7 100%)",
                        borderRadius: 12,
                      }}>
                        {renderTile(before)}
                        {renderTile({ ...after, __idx: after.__idx })}
                      </div>
                    );
                  })}
                  {/* Standalone photos. */}
                  {singles.map((item) => renderTile(item))}
                </div>
              );
            })()}

            {/* Available "before" photos (marked is_before, not yet paired) —
                used to populate the "pair with" dropdown on the next upload. */}
            {(() => {
              const availableBefores = portfolioPhotos
                .map((p, i) => (typeof p === "object" ? { ...p, __idx: i } : null))
                .filter((p) => p && p.is_before && p.id && !portfolioPhotos.some((q) => typeof q === "object" && q.pair_id === p.id));

              return (
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

                  <div className="edit-form-group">
                    <label className="edit-form-label">
                      {t("profileEntrepreneur.photoTrade") || "Trade (optional)"}
                    </label>
                    <select
                      value={newPhotoTag}
                      onChange={(e) => setNewPhotoTag(e.target.value)}
                      className="edit-form-input"
                    >
                      <option value="">{t("profileEntrepreneur.noTag") || "— No tag —"}</option>
                      {(formData.specializations || []).map((spec) => (
                        <option key={spec} value={spec}>{spec}</option>
                      ))}
                    </select>
                  </div>

                  <div className="edit-form-group" style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <label style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13, color: "#334155" }}>
                      <input
                        type="checkbox"
                        checked={newPhotoIsBefore}
                        onChange={(e) => {
                          setNewPhotoIsBefore(e.target.checked);
                          if (e.target.checked) setNewPhotoPairId(""); // can't be both
                        }}
                      />
                      {t("profileEntrepreneur.markAsBefore") || "Mark as \"before\" photo"}
                    </label>

                    {!newPhotoIsBefore && availableBefores.length > 0 && (
                      <select
                        value={newPhotoPairId}
                        onChange={(e) => setNewPhotoPairId(e.target.value)}
                        className="edit-form-input"
                        style={{ flex: 1 }}
                      >
                        <option value="">
                          {t("profileEntrepreneur.pairWith") || "Pair with existing \"before\" photo…"}
                        </option>
                        {availableBefores.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.caption || `Before #${b.__idx + 1}`}
                          </option>
                        ))}
                      </select>
                    )}
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
              );
            })()}
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
