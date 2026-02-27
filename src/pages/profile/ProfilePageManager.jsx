// ProfilePageManager.jsx
import React, { useEffect, useState, lazy, Suspense } from 'react'
import Nav from '../../components/Nav'
import "../../styles/manager/profilepagemanager.css"
import {
  User, Mail, Shield, Home, Plus, MapPin, Calendar, X, LogOut,
  Package, Building2, ChevronRight, Briefcase, Phone, Camera,
  Lock, Eye, EyeOff, Key, Check, AlertCircle, BarChart3, Settings, Menu, Edit,
  Star, MessageSquare, TrendingUp, Award, ThumbsUp, Globe
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import EditManagerProfileModal from '../../components/modal/EditManagerProfileModal'
import EditPropertyModal from '../../components/modal/EditPropertyModal'
import ManagerProfileSkeleton from '../../components/loading/ManagerProfileSkeleton'
import { logout } from '../../utils/api'
import { useLanguage } from '../../contexts/LanguageContext'

// Lazy load PropertyMap component to prevent Leaflet initialization errors
const PropertyMap = lazy(() => import('../../components/map/PropertyMap'))

function ProfilePageManager() {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const { t, language, changeLanguage, languages } = useLanguage();
  const [user, setUser] = useState({})
  const [properties, setProperties] = useState([])
  const [selectedProperty, setSelectedProperty] = useState(null)
  const navigate = useNavigate()
  const [uProfile, setUProfile] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [isEditingProperty, setIsEditingProperty] = useState(false)
  const [activeTab, setActiveTab] = useState('account')
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  // Reviews state
  const [reviews, setReviews] = useState([])
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [reviewStats, setReviewStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  })

  // Password change states
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isSendingReset, setIsSendingReset] = useState(false)

  useEffect(() => {
    getProfileAndProperties()
  }, [])

  const getProfileAndProperties = async () => {
    setIsLoading(true)
    const userProfile = localStorage.getItem('userProfile')
    if (userProfile) {
      const userData = JSON.parse(userProfile)
      setUser(userData)

      try {
        const profileRes = await fetch(`${API_BASE_URL}/api/users/manager/${userData.id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${userData.token}`,
          },
        })
        if (!profileRes.ok) throw new Error('Error getting manager profile')
        const profileData = await profileRes.json()
        setUProfile(profileData)

        const propertiesRes = await fetch(`${API_BASE_URL}/api/properties`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${userData.token}`,
          },
        })
        if (!propertiesRes.ok) throw new Error('Error getting properties')
        const propertiesData = await propertiesRes.json()
        setProperties(propertiesData.properties || [])

        // Fetch reviews received by this manager
        await fetchReviews(userData.id, userData.token)
      } catch (error) {
        console.error(error.message)
      } finally {
        setIsLoading(false)
      }
    }
  }

  // Fetch reviews received by this manager
  const fetchReviews = async (userId, token) => {
    setReviewsLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/reviews/reviewed/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        if (response.status === 404) {
          setReviews([])
          return
        }
        throw new Error('Failed to fetch reviews')
      }

      const data = await response.json()
      const reviewsData = data.reviews || []
      setReviews(reviewsData)

      // Calculate stats
      if (reviewsData.length > 0) {
        const totalRating = reviewsData.reduce((sum, r) => sum + (r.rating || 0), 0)
        const avgRating = totalRating / reviewsData.length

        const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
        reviewsData.forEach(r => {
          if (r.rating >= 1 && r.rating <= 5) {
            distribution[r.rating]++
          }
        })

        setReviewStats({
          averageRating: avgRating,
          totalReviews: reviewsData.length,
          ratingDistribution: distribution
        })
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
      setReviews([])
    } finally {
      setReviewsLoading(false)
    }
  }

  const handleAddProperty = () => {
    navigate("/profile/add-property")
  }

  const handlePropertyClick = (property) => {
    setSelectedProperty(property)
  }

  const handleCloseModal = () => {
    setSelectedProperty(null)
  }

  const handelLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
    localStorage.removeItem('userProfile')
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('userId')
    navigate("/");
  }

  const closeEditModal = () => {
    setIsEditingProfile(false)
  }

  const handleSaveProfile = async () => {
    await getProfileAndProperties()
    setIsEditingProfile(false)
  }

  const totalUnits = properties.reduce((sum, prop) => sum + (prop.num_units || 0), 0)
  const totalProperties = properties.length

  // Password validation function
  const validatePassword = (password) => {
    const requirements = {
      minLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    }
    return requirements
  }

  const getPasswordStrength = (password) => {
    const requirements = validatePassword(password)
    const passedCount = Object.values(requirements).filter(Boolean).length
    if (passedCount <= 2) return { label: t('profileManager.weak'), color: '#ef4444' }
    if (passedCount <= 4) return { label: t('profileManager.medium'), color: '#f59e0b' }
    return { label: t('profileManager.strong'), color: '#22c55e' }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError(t('profileManager.allFieldsRequired'))
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError(t('profileManager.passwordsNotMatch'))
      return
    }

    const requirements = validatePassword(passwordForm.newPassword)
    if (!Object.values(requirements).every(Boolean)) {
      setPasswordError(t('profileManager.passwordRequirements'))
      return
    }

    try {
      setIsChangingPassword(true)
      const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
          confirmPassword: passwordForm.confirmPassword
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to change password')
      }

      setPasswordSuccess(t('profileManager.passwordChanged'))
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setTimeout(() => setPasswordSuccess(''), 3000)
    } catch (error) {
      setPasswordError(error.message)
    } finally {
      setIsChangingPassword(false)
    }
  }

  const resetPasswordForm = () => {
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    setPasswordError('')
    setPasswordSuccess('')
  }

  const handleForgotPassword = async () => {
    const email = user?.email
    if (!email) return
    setIsSendingReset(true)
    try {
      await fetch(`${API_BASE_URL}/api/auth/request-password-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      setPasswordSuccess(t('profileManager.resetEmailSent'))
      setTimeout(() => setPasswordSuccess(''), 5000)
    } catch {
      setPasswordError(t('profileManager.resetEmailFailed'))
    } finally {
      setIsSendingReset(false)
    }
  }

  // Tab configuration
  const tabs = [
    { id: 'account', label: t('profileManager.tabAccount'), icon: User },
    { id: 'overview', label: t('profileManager.tabOverview'), icon: BarChart3 },
    { id: 'properties', label: t('profileManager.tabProperties'), icon: Building2, badge: properties.length },
    { id: 'reviews', label: t('profileManager.tabReviews'), icon: Star, badge: reviews.length > 0 ? reviews.length : undefined },
    { id: 'settings', label: t('profileManager.tabSettings'), icon: Settings },
  ]

  if (isLoading) {
    return (
      <>
        <Nav />
        <ManagerProfileSkeleton />
      </>
    )
  }

  // Render tab content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'account':
        return (
          <div className="mp-tab-content">
            <div className="mp-content-header">
              <h2>{t('profileManager.accountInfo')}</h2>
              <p>{t('profileManager.accountInfoDesc')}</p>
            </div>

            {/* Profile Card */}
            <div className="mp-profile-card-modern">
              <div className="mp-profile-card-left">
                <div className="mp-avatar-container">
                  <div className="mp-avatar-modern">
                    {uProfile?.profile?.image ? (
                      <img src={uProfile.profile.image} alt="Profile" />
                    ) : (
                      <User size={40} />
                    )}
                  </div>
                  <button className="mp-avatar-edit-modern" onClick={() => setIsEditingProfile(true)}>
                    <Camera size={14} />
                  </button>
                </div>
                <div className="mp-profile-info-modern">
                  <h3>
                    {uProfile?.profile?.first_name && uProfile?.profile?.last_name
                      ? `${uProfile.profile.first_name} ${uProfile.profile.last_name}`
                      : t('profileManager.propertyManager')}
                  </h3>
                  <span className="mp-role-tag-modern">
                    <Shield size={12} />
                    {t('profileManager.propertyManager')}
                  </span>
                </div>
              </div>
              <button className="mp-btn mp-btn-outline" onClick={() => setIsEditingProfile(true)}>
                <Camera size={16} />
                {t('profileManager.editPhoto')}
              </button>
            </div>

            {/* Info Grid */}
            <div className="mp-info-section">
              <h4 className="mp-info-section-title">{t('profileManager.personalDetails')}</h4>
              <div className="mp-info-grid-modern">
                <div className="mp-info-item-modern">
                  <div className="mp-info-icon-modern">
                    <User size={18} />
                  </div>
                  <div className="mp-info-details">
                    <label>{t('profileManager.firstName')}</label>
                    <span>{uProfile?.profile?.first_name || '—'}</span>
                  </div>
                </div>

                <div className="mp-info-item-modern">
                  <div className="mp-info-icon-modern">
                    <User size={18} />
                  </div>
                  <div className="mp-info-details">
                    <label>{t('profileManager.lastName')}</label>
                    <span>{uProfile?.profile?.last_name || '—'}</span>
                  </div>
                </div>

                <div className="mp-info-item-modern">
                  <div className="mp-info-icon-modern">
                    <Mail size={18} />
                  </div>
                  <div className="mp-info-details">
                    <label>{t('profileManager.emailAddress')}</label>
                    <span>{uProfile?.profile?.email || user?.email || '—'}</span>
                  </div>
                </div>

                <div className="mp-info-item-modern">
                  <div className="mp-info-icon-modern">
                    <Phone size={18} />
                  </div>
                  <div className="mp-info-details">
                    <label>{t('profileManager.phoneNumber')}</label>
                    <span>{uProfile?.profile?.phone || '—'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mp-info-section">
              <h4 className="mp-info-section-title">{t('profileManager.businessInfo')}</h4>
              <div className="mp-info-grid-modern">
                <div className="mp-info-item-modern">
                  <div className="mp-info-icon-modern">
                    <Briefcase size={18} />
                  </div>
                  <div className="mp-info-details">
                    <label>{t('profileManager.companyName')}</label>
                    <span>{uProfile?.profile?.company_name || '—'}</span>
                  </div>
                </div>

                <div className="mp-info-item-modern">
                  <div className="mp-info-icon-modern">
                    <MapPin size={18} />
                  </div>
                  <div className="mp-info-details">
                    <label>{t('profileManager.address')}</label>
                    <span>{uProfile?.profile?.address || '—'}</span>
                  </div>
                </div>

                <div className="mp-info-item-modern">
                  <div className="mp-info-icon-modern">
                    <Shield size={18} />
                  </div>
                  <div className="mp-info-details">
                    <label>{t('profileManager.accountId')}</label>
                    <span className="mp-text-mono">{user?.id?.slice(0, 8) || '—'}...</span>
                  </div>
                </div>

                <div className="mp-info-item-modern">
                  <div className="mp-info-icon-modern">
                    <Calendar size={18} />
                  </div>
                  <div className="mp-info-details">
                    <label>{t('profileManager.memberSince')}</label>
                    <span>
                      {uProfile?.profile?.created_at
                        ? new Date(uProfile.profile.created_at).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
                            month: 'long',
                            year: 'numeric'
                          })
                        : '—'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mp-info-note">
              <Settings size={16} />
              <span>{t('profileManager.updateProfileNote')}</span>
            </div>
          </div>
        )

      case 'overview':
        return (
          <div className="mp-tab-content">
            <div className="mp-content-header">
              <h2>{t('profileManager.overview')}</h2>
              <p>{t('profileManager.overviewDesc')}</p>
            </div>

            <div className="mp-stats-grid-modern">
              <div className="mp-stat-card-modern mp-stat-primary">
                <div className="mp-stat-icon-modern">
                  <Building2 size={24} />
                </div>
                <div className="mp-stat-info">
                  <span className="mp-stat-value-modern">{totalProperties}</span>
                  <span className="mp-stat-label-modern">{t('profileManager.totalProperties')}</span>
                </div>
              </div>

              <div className="mp-stat-card-modern mp-stat-secondary">
                <div className="mp-stat-icon-modern">
                  <Package size={24} />
                </div>
                <div className="mp-stat-info">
                  <span className="mp-stat-value-modern">{totalUnits}</span>
                  <span className="mp-stat-label-modern">{t('profileManager.totalUnits')}</span>
                </div>
              </div>

              <div className="mp-stat-card-modern mp-stat-tertiary">
                <div className="mp-stat-icon-modern">
                  <Home size={24} />
                </div>
                <div className="mp-stat-info">
                  <span className="mp-stat-value-modern">{totalProperties}</span>
                  <span className="mp-stat-label-modern">{t('profileManager.activeProperties')}</span>
                </div>
              </div>
            </div>

            {/* Recent Properties */}
            <div className="mp-recent-section">
              <div className="mp-recent-header">
                <h4>{t('profileManager.recentProperties')}</h4>
                <button className="mp-link-btn" onClick={() => setActiveTab('properties')}>
                  {t('profileManager.viewAll')}
                  <ChevronRight size={16} />
                </button>
              </div>

              {properties.length > 0 ? (
                <div className="mp-recent-list">
                  {properties.slice(0, 3).map((property) => (
                    <div key={property.id} className="mp-recent-item" onClick={() => handlePropertyClick(property)}>
                      <div className="mp-recent-icon">
                        <Building2 size={20} />
                      </div>
                      <div className="mp-recent-info">
                        <h5>{property.building_name || property.address}</h5>
                        <span>{property.city}, {property.province}</span>
                      </div>
                      <div className="mp-recent-meta">
                        <span className="mp-unit-badge">{property.num_units} {t('profileManager.units')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mp-empty-recent">
                  <p>{t('profileManager.noPropertiesYet')}</p>
                </div>
              )}
            </div>
          </div>
        )

      case 'properties':
        return (
          <div className="mp-tab-content">
            <div className="mp-content-header">
              <div className="mp-content-header-left">
                <h2>{t('profileManager.properties')}</h2>
                <p>{t('profileManager.propertiesDesc')}</p>
              </div>
              <button className="mp-btn mp-btn-primary" onClick={handleAddProperty}>
                <Plus size={18} />
                {t('profileManager.addProperty')}
              </button>
            </div>

            {properties.length > 0 ? (
              <div className="mp-properties-grid">
                {properties.map((property) => (
                  <div key={property.id} className="mp-property-card-modern" onClick={() => handlePropertyClick(property)}>
                    <div className="mp-property-card-header">
                      <div className="mp-property-icon">
                        <Building2 size={24} />
                      </div>
                      <span className="mp-property-type-badge">{property.building_type}</span>
                    </div>
                    <div className="mp-property-card-body">
                      <h4>{property.building_name || property.address}</h4>
                      <div className="mp-property-location">
                        <MapPin size={14} />
                        <span>{property.address}, {property.city}</span>
                      </div>
                    </div>
                    <div className="mp-property-card-footer">
                      <div className="mp-property-stat">
                        <Package size={14} />
                        <span>{property.num_units} {property.num_units === 1 ? t('profileManager.unit') : t('profileManager.units')}</span>
                      </div>
                      <ChevronRight size={18} className="mp-property-arrow" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mp-empty-state-modern">
                <div className="mp-empty-icon-modern">
                  <Home size={48} />
                </div>
                <h3>{t('profileManager.noPropertiesTitle')}</h3>
                <p>{t('profileManager.noPropertiesDesc')}</p>
                <button className="mp-btn mp-btn-primary" onClick={handleAddProperty}>
                  <Plus size={18} />
                  {t('profileManager.addProperty')}
                </button>
              </div>
            )}
          </div>
        )

      case 'reviews':
        return (
          <div className="mp-tab-content">
            <div className="mp-content-header">
              <h2>{t('profileManager.reviewsPerformance')}</h2>
              <p>{t('profileManager.reviewsPerformanceDesc')}</p>
            </div>

            {reviewsLoading ? (
              <div className="mp-reviews-loading">
                <div className="mp-spinner"></div>
                <p>{t('profileManager.loadingReviews')}</p>
              </div>
            ) : (
              <>
                {/* Performance Stats */}
                <div className="mp-review-stats-grid">
                  <div className="mp-review-stat-card mp-stat-rating">
                    <div className="mp-review-stat-icon">
                      <Star size={28} />
                    </div>
                    <div className="mp-review-stat-content">
                      <span className="mp-review-stat-value">
                        {reviewStats.averageRating.toFixed(1)}
                      </span>
                      <span className="mp-review-stat-label">{t('profileManager.averageRating')}</span>
                      <div className="mp-review-stars">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={16}
                            fill={star <= Math.round(reviewStats.averageRating) ? '#facc15' : 'none'}
                            stroke="#facc15"
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mp-review-stat-card mp-stat-total">
                    <div className="mp-review-stat-icon">
                      <MessageSquare size={28} />
                    </div>
                    <div className="mp-review-stat-content">
                      <span className="mp-review-stat-value">{reviewStats.totalReviews}</span>
                      <span className="mp-review-stat-label">{t('profileManager.totalReviews')}</span>
                    </div>
                  </div>

                  <div className="mp-review-stat-card mp-stat-positive">
                    <div className="mp-review-stat-icon">
                      <ThumbsUp size={28} />
                    </div>
                    <div className="mp-review-stat-content">
                      <span className="mp-review-stat-value">
                        {reviewStats.totalReviews > 0
                          ? Math.round(((reviewStats.ratingDistribution[4] + reviewStats.ratingDistribution[5]) / reviewStats.totalReviews) * 100)
                          : 0}%
                      </span>
                      <span className="mp-review-stat-label">{t('profileManager.positiveReviews')}</span>
                    </div>
                  </div>
                </div>

                {/* Rating Distribution */}
                {reviewStats.totalReviews > 0 && (
                  <div className="mp-rating-distribution">
                    <h4 className="mp-info-section-title">{t('profileManager.ratingBreakdown')}</h4>
                    <div className="mp-rating-bars">
                      {[5, 4, 3, 2, 1].map((rating) => {
                        const count = reviewStats.ratingDistribution[rating]
                        const percentage = reviewStats.totalReviews > 0
                          ? (count / reviewStats.totalReviews) * 100
                          : 0
                        return (
                          <div key={rating} className="mp-rating-bar-row">
                            <span className="mp-rating-label">
                              {rating} <Star size={12} fill="#facc15" stroke="#facc15" />
                            </span>
                            <div className="mp-rating-bar-track">
                              <div
                                className="mp-rating-bar-fill"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="mp-rating-count">{count}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Reviews List */}
                <div className="mp-reviews-section">
                  <h4 className="mp-info-section-title">{t('profileManager.recentReviews')}</h4>
                  {reviews.length > 0 ? (
                    <div className="mp-reviews-list">
                      {reviews.map((review) => (
                        <div key={review.id} className="mp-review-card">
                          <div className="mp-review-header">
                            <div className="mp-review-author">
                              <div className="mp-review-avatar">
                                {review.reviewer_first_name?.charAt(0) || 'U'}
                              </div>
                              <div className="mp-review-author-info">
                                <span className="mp-review-name">
                                  {review.reviewer_first_name} {review.reviewer_last_name}
                                </span>
                                <span className="mp-review-date">
                                  {new Date(review.created_at).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </span>
                              </div>
                            </div>
                            <div className="mp-review-rating">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  size={16}
                                  fill={star <= review.rating ? '#facc15' : 'none'}
                                  stroke="#facc15"
                                />
                              ))}
                            </div>
                          </div>

                          {review.job_title && (
                            <div className="mp-review-job">
                              <Briefcase size={14} />
                              <span>{review.job_title}</span>
                            </div>
                          )}

                          <p className="mp-review-comment">{review.comment}</p>

                          {review.images && review.images.length > 0 && (
                            <div className="mp-review-images">
                              {review.images.map((img, idx) => (
                                <img
                                  key={idx}
                                  src={img.image_url}
                                  alt={`Review ${idx + 1}`}
                                  className="mp-review-image"
                                  onClick={() => window.open(img.image_url, '_blank')}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mp-empty-reviews">
                      <div className="mp-empty-icon-modern">
                        <Star size={48} />
                      </div>
                      <h3>{t('profileManager.noReviewsYet')}</h3>
                      <p>{t('profileManager.noReviewsDesc')}</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )

      case 'settings':
        return (
          <div className="mp-tab-content">
            <div className="mp-content-header">
              <h2>{t('profileManager.settings')}</h2>
              <p>{t('profileManager.settingsDesc')}</p>
            </div>

            {/* Language Settings */}
            <div className="mp-settings-section">
              <div className="mp-settings-card">
                <div className="mp-settings-card-header">
                  <div className="mp-settings-icon">
                    <Globe size={20} />
                  </div>
                  <div className="mp-settings-info">
                    <h3>{t('profileManager.language')}</h3>
                    <p>{t('profileManager.languageDesc')}</p>
                  </div>
                </div>
                <div className="mp-language-options">
                  {Object.values(languages).map((lang) => (
                    <button
                      key={lang.code}
                      className={`mp-language-option ${language === lang.code ? 'active' : ''}`}
                      onClick={() => changeLanguage(lang.code)}
                    >
                      <span className="mp-language-flag">{lang.flag}</span>
                      <div className="mp-language-details">
                        <span className="mp-language-name">{lang.nativeName}</span>
                        <span className="mp-language-native">{t(`profileManager.language${lang.code === 'en' ? 'English' : 'French'}`)}</span>
                      </div>
                      {language === lang.code && (
                        <Check size={18} className="mp-language-check" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Security Settings */}
            <div className="mp-settings-section">
              <div className="mp-settings-card">
                <div className="mp-settings-card-header">
                  <div className="mp-settings-icon">
                    <Key size={20} />
                  </div>
                  <div className="mp-settings-info">
                    <h3>{t('profileManager.changePassword')}</h3>
                    <p>{t('profileManager.changePasswordDesc')}</p>
                  </div>
                </div>

                {/* Success Message */}
                {passwordSuccess && (
                  <div className="mp-alert mp-alert-success">
                    <Check size={18} />
                    <span>{passwordSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="mp-password-form-modern">
                  {/* Error Message */}
                  {passwordError && (
                    <div className="mp-alert mp-alert-error">
                      <AlertCircle size={18} />
                      <span>{passwordError}</span>
                    </div>
                  )}

                  {/* Current Password */}
                  <div className="mp-form-group">
                    <label>{t('profileManager.currentPassword')}</label>
                    <div className="mp-input-wrapper">
                      <input
                        type={showPasswords.current ? 'text' : 'password'}
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        placeholder={t('profileManager.enterCurrentPassword')}
                      />
                      <button
                        type="button"
                        className="mp-input-toggle"
                        onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                      >
                        {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      disabled={isSendingReset}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-secondary, #14919B)',
                        fontSize: '0.8125rem',
                        fontWeight: '500',
                        cursor: isSendingReset ? 'not-allowed' : 'pointer',
                        padding: '0.25rem 0',
                        marginTop: '0.25rem',
                        alignSelf: 'flex-end',
                        opacity: isSendingReset ? 0.6 : 1
                      }}
                    >
                      {isSendingReset ? t('profileManager.sendingResetLink') : t('profileManager.forgotPasswordLink')}
                    </button>
                  </div>

                  {/* New Password */}
                  <div className="mp-form-group">
                    <label>{t('profileManager.newPassword')}</label>
                    <div className="mp-input-wrapper">
                      <input
                        type={showPasswords.new ? 'text' : 'password'}
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        placeholder={t('profileManager.enterNewPassword')}
                      />
                      <button
                        type="button"
                        className="mp-input-toggle"
                        onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                      >
                        {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>

                    {/* Password Strength */}
                    {passwordForm.newPassword && (
                      <>
                        <div className="mp-strength-indicator">
                          <div className="mp-strength-bar-modern">
                            <div
                              className="mp-strength-fill-modern"
                              style={{
                                width: `${(Object.values(validatePassword(passwordForm.newPassword)).filter(Boolean).length / 5) * 100}%`,
                                backgroundColor: getPasswordStrength(passwordForm.newPassword).color
                              }}
                            />
                          </div>
                          <span style={{ color: getPasswordStrength(passwordForm.newPassword).color }}>
                            {getPasswordStrength(passwordForm.newPassword).label}
                          </span>
                        </div>

                        <div className="mp-requirements-grid">
                          {[
                            { key: 'minLength', label: t('profileManager.minCharacters') },
                            { key: 'hasUpperCase', label: t('profileManager.uppercase') },
                            { key: 'hasLowerCase', label: t('profileManager.lowercase') },
                            { key: 'hasNumber', label: t('profileManager.number') },
                            { key: 'hasSpecialChar', label: t('profileManager.specialChar') }
                          ].map((req) => (
                            <div
                              key={req.key}
                              className={`mp-req-item ${validatePassword(passwordForm.newPassword)[req.key] ? 'mp-req-met' : ''}`}
                            >
                              {validatePassword(passwordForm.newPassword)[req.key] ? (
                                <Check size={12} />
                              ) : (
                                <X size={12} />
                              )}
                              <span>{req.label}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="mp-form-group">
                    <label>{t('profileManager.confirmNewPassword')}</label>
                    <div className="mp-input-wrapper">
                      <input
                        type={showPasswords.confirm ? 'text' : 'password'}
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        placeholder={t('profileManager.confirmYourPassword')}
                      />
                      <button
                        type="button"
                        className="mp-input-toggle"
                        onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                      >
                        {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
                      <p className="mp-input-error">{t('profileManager.passwordsDoNotMatch')}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mp-form-actions">
                    <button
                      type="button"
                      className="mp-btn mp-btn-ghost"
                      onClick={resetPasswordForm}
                      disabled={isChangingPassword}
                    >
                      {t('profileManager.cancel')}
                    </button>
                    <button
                      type="submit"
                      className="mp-btn mp-btn-primary"
                      disabled={isChangingPassword || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                    >
                      {isChangingPassword ? (
                        <>
                          <span className="mp-spinner"></span>
                          {t('profileManager.updating')}
                        </>
                      ) : (
                        <>
                          <Check size={16} />
                          {t('profileManager.updatePassword')}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  // Get current tab info for mobile header
  const currentTab = tabs.find(tab => tab.id === activeTab)

  const handleMobileTabClick = (tabId) => {
    setActiveTab(tabId)
    setIsMobileSidebarOpen(false)
  }

  return (
    <div className="mp-profile-page-modern">
      <Nav />

      <div className="mp-layout">
        {/* Mobile Header */}
        <div className="mp-mobile-header">
          <button
            className="mp-mobile-menu-btn"
            onClick={() => setIsMobileSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>
          <span className="mp-mobile-title">{currentTab?.label || t('profileManager.profile')}</span>
          <button
            className="mp-mobile-logout-btn"
            onClick={handelLogout}
            title={t('profileManager.logout')}
          >
            <LogOut size={20} />
          </button>
        </div>

        {/* Mobile Sidebar Overlay */}
        {isMobileSidebarOpen && (
          <div
            className="mp-mobile-overlay"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`mp-sidebar ${isMobileSidebarOpen ? 'mp-sidebar-open' : ''}`}>
          <div className="mp-sidebar-header">
            <div className="mp-sidebar-avatar">
              {uProfile?.profile?.image ? (
                <img src={uProfile.profile.image} alt="Profile" />
              ) : (
                <User size={24} />
              )}
            </div>
            <div className="mp-sidebar-user">
              <h3>
                {uProfile?.profile?.first_name
                  ? `${uProfile.profile.first_name} ${uProfile.profile.last_name || ''}`
                  : t('profileManager.propertyManager')}
              </h3>
              <span>{user?.email}</span>
            </div>
            <button
              className="mp-sidebar-close"
              onClick={() => setIsMobileSidebarOpen(false)}
            >
              <X size={20} />
            </button>
          </div>

          <nav className="mp-sidebar-nav">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  className={`mp-nav-item ${activeTab === tab.id ? 'mp-nav-active' : ''}`}
                  onClick={() => handleMobileTabClick(tab.id)}
                >
                  <Icon size={18} />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span className="mp-nav-badge">{tab.badge}</span>
                  )}
                </button>
              )
            })}
          </nav>

          <div className="mp-sidebar-footer">
            <button className="mp-nav-item mp-nav-logout" onClick={handelLogout}>
              <LogOut size={18} />
              <span>{t('profileManager.logout')}</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="mp-main-content">
          {renderTabContent()}
        </main>
      </div>

      {/* Property Details Modal */}
      {selectedProperty && (
        <div className="mp-modal-overlay" onClick={handleCloseModal}>
          <div className="mp-modal mp-modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="mp-modal-header">
              <div className="mp-modal-title">
                <Building2 size={18} />
                <h2>{t('profileManager.propertyDetails')}</h2>
              </div>
              <button className="mp-modal-close" onClick={handleCloseModal}>
                <X size={18} />
              </button>
            </div>

            <div className="mp-modal-body">
              <div className="mp-modal-section">
                <h3>{t('profileManager.addressInfo')}</h3>
                <div className="mp-modal-grid">
                  <div className="mp-modal-field">
                    <label>{t('profileManager.buildingName')}</label>
                    <p>{selectedProperty.building_name || '—'}</p>
                  </div>
                  <div className="mp-modal-field">
                    <label>{t('profileManager.address')}</label>
                    <p>{selectedProperty.address}</p>
                  </div>
                  <div className="mp-modal-field">
                    <label>{t('profileManager.city')}</label>
                    <p>{selectedProperty.city}</p>
                  </div>
                  <div className="mp-modal-field">
                    <label>{t('profileManager.province')}</label>
                    <p>{selectedProperty.province}</p>
                  </div>
                  <div className="mp-modal-field">
                    <label>{t('profileManager.postalCode')}</label>
                    <p>{selectedProperty.postal_code}</p>
                  </div>
                </div>
              </div>

              <div className="mp-modal-section">
                <h3>{t('profileManager.propertyDetails')}</h3>
                <div className="mp-modal-grid">
                  <div className="mp-modal-field">
                    <label>{t('profileManager.buildingType')}</label>
                    <p>{selectedProperty.building_type}</p>
                  </div>
                  <div className="mp-modal-field">
                    <label>{t('profileManager.numberOfUnits')}</label>
                    <p>{selectedProperty.num_units}</p>
                  </div>
                  <div className="mp-modal-field">
                    <label>{t('profileManager.propertyId')}</label>
                    <p>{selectedProperty.id}</p>
                  </div>
                  <div className="mp-modal-field">
                    <label>{t('profileManager.createdAt')}</label>
                    <p>{new Date(selectedProperty.created_at).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}</p>
                  </div>
                </div>
              </div>

              {/* Property Location Map */}
              {/* Only show map when not editing to avoid Leaflet conflicts */}
              {selectedProperty.latitude && selectedProperty.longitude && !isEditingProperty && (
                <div className="mp-modal-section">
                  <h3>
                    <MapPin size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                    {t('profileManager.propertyLocation')}
                  </h3>
                  <div className="mp-property-map-container">
                    <Suspense fallback={
                      <div style={{
                        height: '250px',
                        width: '100%',
                        borderRadius: '10px',
                        background: '#f8fafc',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#6b7280',
                        fontSize: '14px'
                      }}>
                        {t('profileManager.loadingMap')}
                      </div>
                    }>
                      <PropertyMap
                        latitude={selectedProperty.latitude}
                        longitude={selectedProperty.longitude}
                        propertyName={selectedProperty.building_name}
                        address={selectedProperty.address}
                        city={selectedProperty.city}
                        height="250px"
                      />
                    </Suspense>
                  </div>
                </div>
              )}
            </div>

            <div className="mp-modal-footer">
              <button className="mp-btn mp-btn-ghost" onClick={handleCloseModal}>
                {t('profileManager.close')}
              </button>
              <button
                className="mp-btn mp-btn-primary"
                onClick={() => {
                  setIsEditingProperty(true)
                }}
              >
                <Edit size={16} />
                {t('profileManager.editProperty')}
              </button>
            </div>
          </div>
        </div>
      )}

      {isEditingProfile && (
        <EditManagerProfileModal
          userProfile={uProfile}
          onClose={closeEditModal}
          onSave={handleSaveProfile}
        />
      )}

      {isEditingProperty && selectedProperty && (
        <EditPropertyModal
          isOpen={isEditingProperty}
          onClose={() => setIsEditingProperty(false)}
          onSuccess={(updatedProperty) => {
            setProperties(prev =>
              prev.map(p => p.id === updatedProperty.id ? updatedProperty : p)
            )
            setSelectedProperty(updatedProperty)
            setIsEditingProperty(false)
          }}
          property={selectedProperty}
        />
      )}
    </div>
  )
}

export default ProfilePageManager
