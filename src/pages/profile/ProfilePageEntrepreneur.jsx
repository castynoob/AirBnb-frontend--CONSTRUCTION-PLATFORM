import { useState, useEffect } from 'react';
import {
  Star, CheckCircle, Award, Briefcase, MapPin, Calendar, Mail, Phone, LogOut,
  MessageSquare, User, Upload, Camera, X, Crown, Check, Zap, Shield, Activity,
  DollarSign, FileText, ArrowUpCircle, AlertCircle, Lock, Eye, EyeOff, Key,
  BarChart3, Menu, Edit, CreditCard, ExternalLink
} from 'lucide-react';
import Nav from "../../components/Nav";
import '../../styles/entrepreneur/profilepageentrepreneur-modern.css';
import '../../styles/entrepreneur/subscriptionpage.css';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import EntrepreneurProfileSkeleton from '../../components/loading/EntrepreneurProfileSkeleton'
import SubscriptionPaymentForm from '../../components/SubscriptionPaymentModal'
import '../../styles/entrepreneur/subscriptionmodal.css'
import { getConnectStatus, startOnboarding, getDashboardLink } from '../../utils/stripeConnectApi'

function ProfilePageEntrepreneur() {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [activeTab, setActiveTab] = useState('account');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [profile, setProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [reviews, setReviews] = useState([])
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [profileImage, setProfileImage] = useState(null)
  const [profileImagePreview, setProfileImagePreview] = useState(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [subscription, setSubscription] = useState({})
  const [userProfile, setUserProfile] = useState(null)
  const [showPlansModal, setShowPlansModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedPlanType, setSelectedPlanType] = useState('')
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const navigate = useNavigate();

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

  // Stripe Connect states
  const [stripeStatus, setStripeStatus] = useState(null)
  const [isLoadingStripe, setIsLoadingStripe] = useState(true)
  const [isConnectingStripe, setIsConnectingStripe] = useState(false)

  const [formData, setFormData] = useState({
    company_name: '',
    license_number: '',
    years_in_business: '',
    num_employees: '',
    address: '',
    phone: '',
    email: '',
    specializations: []
  });

  // Tab labels for mobile header
  const tabLabels = {
    account: 'Account',
    subscription: 'Subscription',
    performance: 'Performance & Reviews',
    security: 'Security'
  }

  useEffect(() => {
    fetchEntreprenuerProfile()
    fetchStripeStatus()

    const uProfile = localStorage.getItem('userProfile')
    if (uProfile) {
      const u = JSON.parse(uProfile)
      setUserProfile(u)
      if (u.entrepProfile && u.entrepProfile.subscription) {
        setSubscription(u.entrepProfile.subscription.subscription || {})
      }
    }
  }, [])

  // Fetch Stripe Connect status
  const fetchStripeStatus = async () => {
    try {
      setIsLoadingStripe(true)
      const status = await getConnectStatus()
      setStripeStatus(status)
    } catch (err) {
      console.log('Could not fetch Stripe status:', err.message)
      setStripeStatus(null)
    } finally {
      setIsLoadingStripe(false)
    }
  }

  // Handle Stripe Connect onboarding
  const handleStripeConnect = async () => {
    try {
      setIsConnectingStripe(true)
      const result = await startOnboarding()

      if (result.already_complete) {
        toast.success('Your payment account is already set up!')
        fetchStripeStatus()
        return
      }

      if (result.url) {
        window.location.href = result.url
      }
    } catch (err) {
      console.error('Stripe connect error:', err)
      toast.error(err.message || 'Failed to start payment setup')
    } finally {
      setIsConnectingStripe(false)
    }
  }

  // Handle Stripe Dashboard access
  const handleStripeDashboard = async () => {
    try {
      const result = await getDashboardLink()
      if (result.url) {
        window.open(result.url, '_blank')
      }
    } catch (err) {
      console.error('Dashboard error:', err)
      toast.error('Failed to open Stripe dashboard')
    }
  }

  // Subscription helper functions
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const getTrialInfo = () => {
    if (!subscription.trial_end) return null;
    const trialEndDate = new Date(subscription.trial_end);
    const now = new Date();
    const totalTrialDays = 14;

    const timeRemaining = trialEndDate - now;
    const daysRemaining = Math.max(0, Math.ceil(timeRemaining / (1000 * 60 * 60 * 24)));
    const percentage = Math.min(Math.max((daysRemaining / totalTrialDays) * 100, 0), 100);
    const hoursRemaining = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutesRemaining = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));

    return {
      daysRemaining,
      hoursRemaining,
      minutesRemaining,
      percentage,
      totalDays: totalTrialDays
    };
  };

  const getSubscriptionDuration = () => {
    if (!subscription.start || !subscription.current_period_end) return null;
    const start = new Date(subscription.start);
    const end = new Date(subscription.current_period_end);
    const now = new Date();

    const totalDuration = end - start;
    const elapsed = now - start;
    const percentage = Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100);
    const daysRemaining = Math.ceil((end - now) / (1000 * 60 * 60 * 24));

    return { percentage, daysRemaining, endDate: end };
  };

  const fetchEntreprenuerProfile = async () => {
    const userProfile = localStorage.getItem('userProfile')

    if(userProfile) {
      const user = JSON.parse(userProfile)
      const entrepResponse = await fetch(`${API_BASE_URL}/api/users/entrepreneur/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      })

      if(!entrepResponse.ok) {
        throw new Error(`Error ${entrepResponse.status}`)
      }

      const entrepData = await entrepResponse.json()

      const newEntrepData = {
        userId: user.id,
        companyName: entrepData.profile.company_name,
        licenseNumber: entrepData.profile.license_number,
        yearsInBusiness: entrepData.profile.years_in_business,
        numEmployees: entrepData.profile.num_employees,
        address: entrepData.profile.address,
        phone: entrepData.profile.phone || 'Not provided',
        email: entrepData.profile.email,
        specializations: entrepData.profile.specializations,
        averageRating: entrepData.profile.average_rating,
        totalReviews: entrepData.profile.total_reviews || 0,
        image: entrepData.profile.image
      }

      setProfile(newEntrepData)
      setIsLoading(false)

      fetchReviews(user.id, user.token)
    }
  }

  const fetchReviews = async (userId, token) => {
    setReviewsLoading(true)

    try {
      const reviewsResponse = await fetch(`${API_BASE_URL}/api/reviews/reviewed/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if(reviewsResponse.ok) {
        const reviewsData = await reviewsResponse.json()
        setReviews(reviewsData.reviews || [])
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
      setReviews([])
    } finally {
      setReviewsLoading(false)
    }
  }

  const calculateAverageRating = () => {
    if (reviews.length === 0) return 0
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0)
    return (sum / reviews.length).toFixed(1)
  }

  useEffect(() => {
    if (isEditModalOpen) {
      setFormData({
        company_name: profile.companyName,
        license_number: profile.licenseNumber,
        years_in_business: profile.yearsInBusiness,
        num_employees: profile.numEmployees,
        address: profile.address,
        phone: profile.phone,
        email: profile.email,
        specializations: profile.specializations
      });
    }
  }, [isEditModalOpen, profile]);

  const specializationOptions = [
    'Electrical', 'Plumbing', 'Carpentry', 'Masonry', 'Roofing', 'HVAC',
    'Painting', 'Drywall', 'Flooring', 'Concrete Work', 'Demolition', 'Excavation',
    'Foundation Work', 'Framing', 'Steel Erection', 'Siding Installation',
    'Waterproofing', 'Glazing/Windows', 'Landscaping', 'Paving/Asphalt',
    'Tile Work', 'Insulation', 'Cabinetry', 'Fire Protection', 'Solar Installation',
    'Welding', 'General Contracting'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSpecializationChange = (spec) => {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations.includes(spec)
        ? prev.specializations.filter(s => s !== spec)
        : [...prev.specializations, spec]
    }));
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file')
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should not exceed 5MB')
        return
      }

      setProfileImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfileImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setProfileImage(null)
    setProfileImagePreview(null)
  }

  const handleSubmit = async () => {
    if (!formData.company_name || !formData.license_number || !formData.years_in_business ||
        !formData.num_employees || !formData.address) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsUpdating(true)
    const userProfile = localStorage.getItem('userProfile')
    let imageUploadFailed = false

    try {
      if (userProfile) {
        const user = JSON.parse(userProfile)

        if (profileImage) {
          setIsUploadingImage(true)
          const imageFormData = new FormData()
          imageFormData.append('image', profileImage)

          try {
            const imageResponse = await fetch(`${API_BASE_URL}/api/users/entrepreneur/profile-picture`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${user.token}`
              },
              body: imageFormData
            })

            if (!imageResponse.ok) {
              console.error('Failed to upload profile picture')
              imageUploadFailed = true
            }
          } catch (imageError) {
            console.error('Image upload error:', imageError)
            imageUploadFailed = true
          }

          setIsUploadingImage(false)
        }

        const profileResponse = await fetch(`${API_BASE_URL}/api/users/entrepreneur/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
          },
          body: JSON.stringify({
            company_name: formData.company_name,
            license_number: formData.license_number,
            years_in_business: parseInt(formData.years_in_business),
            num_employees: parseInt(formData.num_employees),
            address: formData.address,
            specializations: formData.specializations
          })
        })

        if (!profileResponse.ok) {
          throw new Error('Failed to update profile')
        }

        if (formData.phone !== profile.phone) {
          await fetch(`${API_BASE_URL}/api/users/phone`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${user.token}`
            },
            body: JSON.stringify({
              phone: formData.phone
            })
          })
        }

        await fetchEntreprenuerProfile()

        setProfileImage(null)
        setProfileImagePreview(null)

        setIsEditModalOpen(false)

        if (imageUploadFailed) {
          toast.success('Profile updated successfully, but the image upload failed. Please try uploading your image again later.')
        } else {
          toast.success('Profile updated successfully!')
        }
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile. Please try again.')
    } finally {
      setIsUpdating(false)
      setIsUploadingImage(false)
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("userProfile");
    localStorage.removeItem("selectedPropertyId")
    navigate("/");
  };

  const handleSelectPlan = (planType) => {
    setSelectedPlanType(planType)
    setShowPlansModal(false)
    setShowPaymentModal(true)
  }

  const handlePaymentModalClose = async (success) => {
    setShowPaymentModal(false)
    setSelectedPlanType('')
    if (success) {
      const uProf = localStorage.getItem('userProfile')
      if (uProf) {
        const u = JSON.parse(uProf)
        try {
          const response = await fetch(`${API_BASE_URL}/api/payments/subscription`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${u.token}`
            }
          })
          if (response.ok) {
            const subscriptionData = await response.json()
            setSubscription(subscriptionData.subscription || {})

            const updatedProfile = {
              ...u,
              entrepProfile: {
                ...u.entrepProfile,
                subscription: subscriptionData,
              },
            }
            localStorage.setItem('userProfile', JSON.stringify(updatedProfile))
            setUserProfile(updatedProfile)
          }
        } catch (error) {
          console.error('Error refreshing subscription:', error)
        }
      }
    }
  };

  // Password change handlers
  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }))
    setPasswordError('')
    setPasswordSuccess('')
  }

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  const getPasswordStrength = (password) => {
    let strength = 0
    if (password.length >= 8) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[a-z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++
    return strength
  }

  const getStrengthLabel = (strength) => {
    const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong']
    return labels[Math.min(strength, 4)]
  }

  const getStrengthColor = (strength) => {
    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#16a34a']
    return colors[Math.min(strength, 4)]
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError('All fields are required')
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match')
      return
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long')
      return
    }

    const strength = getPasswordStrength(passwordForm.newPassword)
    if (strength < 4) {
      setPasswordError('Password must contain uppercase, lowercase, number, and special character')
      return
    }

    setIsChangingPassword(true)

    try {
      const uProfile = localStorage.getItem('userProfile')
      if (!uProfile) {
        throw new Error('Please log in again')
      }

      const user = JSON.parse(uProfile)

      const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
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

      setPasswordSuccess('Password changed successfully!')
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      toast.success('Password changed successfully!')
    } catch (error) {
      setPasswordError(error.message)
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setIsMobileSidebarOpen(false)
  }

  if(isLoading) {
    return (
      <>
        <div>
          <Nav />
          <EntrepreneurProfileSkeleton />
        </div>
      </>
    )
  }

  return (
    <div className="ep-profile-page-modern">
      <Nav />

      <div className="ep-layout">
        {/* Mobile Header */}
        <div className="ep-mobile-header">
          <button
            className="ep-mobile-menu-btn"
            onClick={() => setIsMobileSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>
          <span className="ep-mobile-title">{tabLabels[activeTab]}</span>
          <div className="ep-mobile-actions">
            {activeTab === 'account' && (
              <button
                className="ep-mobile-action-btn"
                onClick={() => setIsEditModalOpen(true)}
                title="Edit Profile"
              >
                <Edit size={18} />
              </button>
            )}
            <button
              className="ep-mobile-action-btn ep-mobile-logout-btn"
              onClick={handleLogout}
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* Mobile Overlay */}
        {isMobileSidebarOpen && (
          <div
            className="ep-mobile-overlay"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`ep-sidebar ${isMobileSidebarOpen ? 'ep-sidebar-open' : ''}`}>
          <button
            className="ep-sidebar-close"
            onClick={() => setIsMobileSidebarOpen(false)}
          >
            <X size={18} />
          </button>

          <div className="ep-sidebar-header">
            <div className="ep-sidebar-avatar">
              {profile.image ? (
                <img src={profile.image} alt={profile.companyName} />
              ) : (
                <Briefcase size={24} />
              )}
            </div>
            <div className="ep-sidebar-user">
              <h3>{profile.companyName}</h3>
              <span>Entrepreneur</span>
            </div>
          </div>

          <nav className="ep-sidebar-nav">
            <button
              className={`ep-nav-item ${activeTab === 'account' ? 'ep-nav-active' : ''}`}
              onClick={() => handleTabChange('account')}
            >
              <User size={18} />
              <span>Account</span>
            </button>
            <button
              className={`ep-nav-item ${activeTab === 'subscription' ? 'ep-nav-active' : ''}`}
              onClick={() => handleTabChange('subscription')}
            >
              <Crown size={18} />
              <span>Subscription</span>
            </button>
            <button
              className={`ep-nav-item ${activeTab === 'performance' ? 'ep-nav-active' : ''}`}
              onClick={() => handleTabChange('performance')}
            >
              <BarChart3 size={18} />
              <span>Performance & Reviews</span>
              {reviews.length > 0 && (
                <span className="ep-nav-badge">{reviews.length}</span>
              )}
            </button>
            <button
              className={`ep-nav-item ${activeTab === 'security' ? 'ep-nav-active' : ''}`}
              onClick={() => handleTabChange('security')}
            >
              <Shield size={18} />
              <span>Security</span>
            </button>
          </nav>

          <div className="ep-sidebar-footer">
            <button className="ep-nav-item ep-nav-logout" onClick={handleLogout}>
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="ep-main-content">
          <div className="ep-tab-content">
            {/* Account Tab */}
            {activeTab === 'account' && (
              <>
                <div className="ep-content-header">
                  <div className="ep-content-header-left">
                    <h2>Account Information</h2>
                    <p>Manage your company profile and contact details</p>
                  </div>
                  <button className="ep-btn ep-btn-primary ep-desktop-only" onClick={() => setIsEditModalOpen(true)}>
                    <Edit size={16} />
                    Edit Profile
                  </button>
                </div>

                {/* Profile Card */}
                <div className="ep-profile-card-modern">
                  <div className="ep-profile-card-left">
                    <div className="ep-avatar-container">
                      <div className="ep-avatar-modern">
                        {profile.image ? (
                          <img src={profile.image} alt={profile.companyName} />
                        ) : (
                          <Briefcase size={36} />
                        )}
                      </div>
                    </div>
                    <div className="ep-profile-info-modern">
                      <h3>{profile.companyName}</h3>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        <span className="ep-role-tag-modern">
                          <Briefcase size={12} />
                          Entrepreneur
                        </span>
                        <span className="ep-license-badge">
                          <CheckCircle size={12} />
                          {profile.licenseNumber}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Stripe Connect Status */}
                  <div className="ep-stripe-status-section">
                    {isLoadingStripe ? (
                      <div className="ep-stripe-status-loading">
                        <div className="ep-stripe-spinner"></div>
                      </div>
                    ) : stripeStatus?.onboarding_complete ? (
                      <div className="ep-stripe-status-card connected">
                        <div className="ep-stripe-status-icon success">
                          <CreditCard size={20} />
                        </div>
                        <div className="ep-stripe-status-info">
                          <span className="ep-stripe-status-label">Payment Account</span>
                          <span className="ep-stripe-status-value success">Connected</span>
                        </div>
                        <button
                          className="ep-stripe-dashboard-btn"
                          onClick={handleStripeDashboard}
                          title="View Stripe Dashboard"
                        >
                          <ExternalLink size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="ep-stripe-status-card pending">
                        <div className="ep-stripe-status-icon pending">
                          <CreditCard size={20} />
                        </div>
                        <div className="ep-stripe-status-info">
                          <span className="ep-stripe-status-label">Payment Account</span>
                          <span className="ep-stripe-status-value pending">Not Connected</span>
                        </div>
                        <button
                          className="ep-stripe-connect-btn"
                          onClick={handleStripeConnect}
                          disabled={isConnectingStripe}
                        >
                          {isConnectingStripe ? 'Connecting...' : 'Set Up'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Company Information */}
                <div className="ep-info-section">
                  <h4 className="ep-info-section-title">Company Information</h4>
                  <div className="ep-info-grid-modern">
                    <div className="ep-info-item-modern">
                      <div className="ep-info-icon-modern">
                        <Briefcase size={18} />
                      </div>
                      <div className="ep-info-details">
                        <label>Company Name</label>
                        <span>{profile.companyName}</span>
                      </div>
                    </div>
                    <div className="ep-info-item-modern">
                      <div className="ep-info-icon-modern">
                        <Award size={18} />
                      </div>
                      <div className="ep-info-details">
                        <label>License Number</label>
                        <span>{profile.licenseNumber}</span>
                      </div>
                    </div>
                    <div className="ep-info-item-modern">
                      <div className="ep-info-icon-modern">
                        <Calendar size={18} />
                      </div>
                      <div className="ep-info-details">
                        <label>Years in Business</label>
                        <span>{profile.yearsInBusiness} years</span>
                      </div>
                    </div>
                    <div className="ep-info-item-modern">
                      <div className="ep-info-icon-modern">
                        <User size={18} />
                      </div>
                      <div className="ep-info-details">
                        <label>Number of Employees</label>
                        <span>{profile.numEmployees}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="ep-info-section">
                  <h4 className="ep-info-section-title">Contact Information</h4>
                  <div className="ep-info-grid-modern">
                    <div className="ep-info-item-modern">
                      <div className="ep-info-icon-modern">
                        <Mail size={18} />
                      </div>
                      <div className="ep-info-details">
                        <label>Email</label>
                        <span>{profile.email}</span>
                      </div>
                    </div>
                    <div className="ep-info-item-modern">
                      <div className="ep-info-icon-modern">
                        <Phone size={18} />
                      </div>
                      <div className="ep-info-details">
                        <label>Phone</label>
                        <span>{profile.phone}</span>
                      </div>
                    </div>
                    <div className="ep-info-item-modern ep-info-full-width">
                      <div className="ep-info-icon-modern">
                        <MapPin size={18} />
                      </div>
                      <div className="ep-info-details">
                        <label>Address</label>
                        <span>{profile.address}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Specializations */}
                <div className="ep-specializations-section">
                  <h4 className="ep-info-section-title">Specializations</h4>
                  <div className="ep-specializations-grid">
                    {profile.specializations.map((spec) => (
                      <span key={spec} className="ep-spec-badge">
                        <CheckCircle size={14} />
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Subscription Tab */}
            {activeTab === 'subscription' && (
              <>
                <div className="ep-content-header">
                  <div className="ep-content-header-left">
                    <h2>Subscription Management</h2>
                    <p>Manage your subscription plan and billing</p>
                  </div>
                </div>

                {/* No Subscription State */}
                {!userProfile?.entrepProfile?.subscription?.hasSubscription ? (
                  <div className="no-subscription-state">
                    <div className="no-sub-content">
                      <div className="no-sub-icon">
                        <Crown size={48} />
                      </div>
                      <h3 className="no-sub-title">No Active Subscription</h3>
                      <p className="no-sub-description">
                        Subscribe to unlock powerful features like submitting bids, unlocking project budgets, and messaging on approved projects.
                      </p>
                      <button
                        className="subscribe-now-btn"
                        onClick={() => setShowPlansModal(true)}
                      >
                        <Crown size={18} />
                        View Subscription Plans
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Trial Banner */}
                    {subscription.is_trial && getTrialInfo() && (
                      <div className="status-banner trial-banner">
                        <div className="banner-content">
                          <div className="banner-icon-wrapper">
                            <Zap size={28} />
                          </div>
                          <div className="banner-info">
                            <div className="banner-header">
                              <h3 className="banner-title">Premium Trial Active</h3>
                              <div className="trial-badge">Trial Period</div>
                            </div>
                            <p className="banner-text">
                              {getTrialInfo().daysRemaining} {getTrialInfo().daysRemaining === 1 ? 'day' : 'days'} remaining
                            </p>
                            <p className="banner-subtext">
                              Trial ends on {formatDate(subscription.trial_end)}
                            </p>
                            <div className="trial-progress-bar">
                              <div
                                className="trial-progress-fill"
                                style={{ width: `${getTrialInfo().percentage}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className="trial-countdown">
                            <div className="countdown-number">{getTrialInfo().daysRemaining}</div>
                            <div className="countdown-label">Days Left</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Current Plan Display */}
                    {!subscription.is_trial && subscription.plan_type && (
                      <div className="current-plan-section">
                        <div className="plan-overview-grid">
                          <div className="plan-info-card">
                            <div className="card-header">
                              <div className="card-icon">
                                <Shield size={24} />
                              </div>
                              <div className="status-indicator active">
                                <span className="status-dot"></span>
                                Active
                              </div>
                            </div>
                            <h2 className="plan-name">{subscription.plan_type === 'premium' ? 'Premium' : 'Basic'} Plan</h2>
                            <p className="plan-desc">
                              {subscription.plan_type === 'premium' ? 'Best for professionals' : 'Perfect for getting started'}
                            </p>
                            <div className="plan-price">
                              <span className="price-symbol">$</span>
                              <span className="price-value">{subscription.price || (subscription.plan_type === 'premium' ? 429 : 250)}</span>
                              <span className="price-period">/month</span>
                            </div>
                          </div>

                          <div className="billing-timeline-card">
                            <div className="card-header">
                              <div className="card-icon">
                                <Calendar size={24} />
                              </div>
                              <h3 className="card-title">Billing Cycle</h3>
                            </div>
                            <div className="timeline-content">
                              <div className="timeline-dates">
                                <div className="date-item">
                                  <span className="date-label">Started</span>
                                  <span className="date-value">{formatDate(subscription.start_date || subscription.start)}</span>
                                </div>
                                <div className="date-item">
                                  <span className="date-label">Next Billing</span>
                                  <span className="date-value">{formatDate(subscription.current_period_end)}</span>
                                </div>
                              </div>
                              {getSubscriptionDuration() && (
                                <div className="timeline-progress">
                                  <div className="progress-bar-container">
                                    <div
                                      className="progress-bar-fill"
                                      style={{ width: `${getSubscriptionDuration().percentage}%` }}
                                    ></div>
                                  </div>
                                  <div className="progress-info">
                                    <span className="progress-text">{getSubscriptionDuration().daysRemaining} days until renewal</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* View Plans Button */}
                    <div className="upgrade-section">
                      <div className="upgrade-card">
                        <div className="upgrade-content">
                          <div className="upgrade-icon">
                            <ArrowUpCircle size={32} />
                          </div>
                          <div className="upgrade-info">
                            <h3 className="upgrade-title">
                              {subscription.plan_type === 'premium' ? 'You\'re on Premium' : 'View Subscription Plans'}
                            </h3>
                            <p className="upgrade-description">
                              {subscription.plan_type === 'premium'
                                ? 'You have access to unlimited bids and priority support'
                                : 'Explore available plans and upgrade to get more features'}
                            </p>
                          </div>
                        </div>
                        <button
                          className="upgrade-btn"
                          onClick={() => setShowPlansModal(true)}
                        >
                          <Crown size={18} />
                          View Plans
                        </button>
                      </div>
                    </div>

                    {/* Usage Stats */}
                    <div className="dashboard-section">
                      <div className="section-header">
                        <div className="section-icon">
                          <Activity size={24} />
                        </div>
                        <div className="section-text">
                          <h2 className="section-title">Usage Analytics</h2>
                          <p className="section-subtitle">Monitor your monthly bidding activity</p>
                        </div>
                      </div>

                      <div className="stats-grid subs">
                        <div className="stat-card subs">
                          <div className="stat-header subs">
                            <div className="stat-icon bids">
                              <FileText size={22} />
                            </div>
                            <span className="stat-label">Bids Submitted</span>
                          </div>
                          <div className="stat-value subsval">
                            {subscription?.bids?.used || 0}
                            {subscription?.bids?.limit !== 'unlimited' && subscription?.bids?.limit && (
                              <span className="stat-total"> / {subscription.bids.limit}</span>
                            )}
                          </div>
                        </div>

                        <div className="stat-card subs">
                          <div className="stat-header subs">
                            <div className="stat-icon remaining">
                              <Zap size={22} />
                            </div>
                            <span className="stat-label">Remaining Bids</span>
                          </div>
                          <div className="stat-value accent subsval">
                            {subscription?.bids?.remaining === 'unlimited'
                              ? '∞'
                              : subscription?.bids?.remaining || '∞'}
                          </div>
                        </div>

                        <div className="stat-card subs">
                          <div className="stat-header subs">
                            <div className="stat-icon budget">
                              <DollarSign size={22} />
                            </div>
                            <span className="stat-label">Budget Unlocks</span>
                          </div>
                          <div className="stat-value subsval">Unlimited</div>
                        </div>

                        <div className="stat-card subs">
                          <div className="stat-header subs">
                            <div className="stat-icon messages">
                              <MessageSquare size={22} />
                            </div>
                            <span className="stat-label">Active Chats</span>
                          </div>
                          <div className="stat-value subsval">Unlimited</div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            {/* Performance & Reviews Tab */}
            {activeTab === 'performance' && (
              <>
                <div className="ep-content-header">
                  <div className="ep-content-header-left">
                    <h2>Performance & Reviews</h2>
                    <p>View your performance metrics and client reviews</p>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="ep-metrics-grid">
                  <div className="ep-metric-card">
                    <div className="ep-metric-icon rating">
                      <Star size={24} />
                    </div>
                    <div className="ep-metric-content">
                      <div className="ep-metric-label">Average Rating</div>
                      <div className="ep-metric-value">{calculateAverageRating() || 'N/A'}</div>
                    </div>
                  </div>
                  <div className="ep-metric-card">
                    <div className="ep-metric-icon reviews">
                      <Award size={24} />
                    </div>
                    <div className="ep-metric-content">
                      <div className="ep-metric-label">Total Reviews</div>
                      <div className="ep-metric-value">{reviews.length}</div>
                    </div>
                  </div>
                  <div className="ep-metric-card">
                    <div className="ep-metric-icon experience">
                      <CheckCircle size={24} />
                    </div>
                    <div className="ep-metric-content">
                      <div className="ep-metric-label">Experience</div>
                      <div className="ep-metric-value">{profile.yearsInBusiness} Years</div>
                    </div>
                  </div>
                  <div className="ep-metric-card">
                    <div className="ep-metric-icon employees">
                      <Briefcase size={24} />
                    </div>
                    <div className="ep-metric-content">
                      <div className="ep-metric-label">Employees</div>
                      <div className="ep-metric-value">{profile.numEmployees}</div>
                    </div>
                  </div>
                </div>

                {/* Reviews Section */}
                <div className="ep-reviews-section">
                  <h4 className="ep-info-section-title">Client Reviews</h4>
                  {reviewsLoading ? (
                    <div className="ep-no-reviews">
                      <div className="ep-spinner"></div>
                      <p>Loading reviews...</p>
                    </div>
                  ) : reviews.length > 0 ? (
                    <div className="ep-reviews-grid">
                      {reviews.map((review) => (
                        <div key={review.id} className="ep-review-card">
                          <div className="ep-review-header">
                            <div className="ep-review-author">
                              <div className="ep-review-avatar">
                                <User size={20} />
                              </div>
                              <div>
                                <div className="ep-review-author-name">
                                  {review.reviewer_first_name} {review.reviewer_last_name}
                                </div>
                                <div className="ep-review-date">
                                  {new Date(review.created_at).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </div>
                              </div>
                            </div>
                            <div className="ep-review-rating">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  size={16}
                                  fill={i < review.rating ? '#F39C12' : 'none'}
                                  color="#F39C12"
                                />
                              ))}
                            </div>
                          </div>
                          {review.job_title && (
                            <div className="ep-review-job">
                              <Briefcase size={14} />
                              <span>{review.job_title}</span>
                            </div>
                          )}
                          <p className="ep-review-comment">{review.comment}</p>
                          {review.images && review.images.length > 0 && (
                            <div className="ep-review-images">
                              {review.images.map((image, idx) => (
                                <img
                                  key={image.id}
                                  src={image.image_url}
                                  alt={`Review ${idx + 1}`}
                                  className="ep-review-image"
                                  onClick={() => window.open(image.image_url, '_blank')}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="ep-no-reviews">
                      <MessageSquare size={48} />
                      <p>No reviews yet</p>
                      <span>Complete jobs to receive reviews from clients</span>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <>
                <div className="ep-content-header">
                  <div className="ep-content-header-left">
                    <h2>Security Settings</h2>
                    <p>Manage your password and security preferences</p>
                  </div>
                </div>

                {/* Password Change Section */}
                <div className="ep-security-section">
                  <div className="ep-security-header">
                    <div className="ep-security-header-left">
                      <div className="ep-security-icon">
                        <Key size={20} />
                      </div>
                      <div>
                        <h3 className="ep-security-title">Change Password</h3>
                        <p className="ep-security-subtitle">Update your account password</p>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleChangePassword} className="ep-password-form-modern">
                    {passwordError && (
                      <div className="ep-alert ep-alert-error">
                        <AlertCircle size={18} />
                        {passwordError}
                      </div>
                    )}
                    {passwordSuccess && (
                      <div className="ep-alert ep-alert-success">
                        <Check size={18} />
                        {passwordSuccess}
                      </div>
                    )}

                    <div className="ep-form-group">
                      <label>Current Password</label>
                      <div className="ep-input-wrapper">
                        <input
                          type={showPasswords.current ? 'text' : 'password'}
                          name="currentPassword"
                          value={passwordForm.currentPassword}
                          onChange={handlePasswordInputChange}
                          placeholder="Enter current password"
                        />
                        <button
                          type="button"
                          className="ep-input-toggle"
                          onClick={() => togglePasswordVisibility('current')}
                        >
                          {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <div className="ep-form-group">
                      <label>New Password</label>
                      <div className="ep-input-wrapper">
                        <input
                          type={showPasswords.new ? 'text' : 'password'}
                          name="newPassword"
                          value={passwordForm.newPassword}
                          onChange={handlePasswordInputChange}
                          placeholder="Enter new password"
                        />
                        <button
                          type="button"
                          className="ep-input-toggle"
                          onClick={() => togglePasswordVisibility('new')}
                        >
                          {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      {passwordForm.newPassword && (
                        <>
                          <div className="ep-strength-indicator">
                            <div className="ep-strength-bar-modern">
                              <div
                                className="ep-strength-fill-modern"
                                style={{
                                  width: `${(getPasswordStrength(passwordForm.newPassword) / 5) * 100}%`,
                                  backgroundColor: getStrengthColor(getPasswordStrength(passwordForm.newPassword))
                                }}
                              />
                            </div>
                            <span style={{ color: getStrengthColor(getPasswordStrength(passwordForm.newPassword)) }}>
                              {getStrengthLabel(getPasswordStrength(passwordForm.newPassword))}
                            </span>
                          </div>
                          <div className="ep-requirements-grid">
                            <span className={`ep-req-item ${passwordForm.newPassword.length >= 8 ? 'ep-req-met' : ''}`}>
                              <Check size={12} /> 8+ characters
                            </span>
                            <span className={`ep-req-item ${/[A-Z]/.test(passwordForm.newPassword) ? 'ep-req-met' : ''}`}>
                              <Check size={12} /> Uppercase
                            </span>
                            <span className={`ep-req-item ${/[a-z]/.test(passwordForm.newPassword) ? 'ep-req-met' : ''}`}>
                              <Check size={12} /> Lowercase
                            </span>
                            <span className={`ep-req-item ${/[0-9]/.test(passwordForm.newPassword) ? 'ep-req-met' : ''}`}>
                              <Check size={12} /> Number
                            </span>
                            <span className={`ep-req-item ${/[!@#$%^&*(),.?":{}|<>]/.test(passwordForm.newPassword) ? 'ep-req-met' : ''}`}>
                              <Check size={12} /> Special char
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="ep-form-group">
                      <label>Confirm New Password</label>
                      <div className="ep-input-wrapper">
                        <input
                          type={showPasswords.confirm ? 'text' : 'password'}
                          name="confirmPassword"
                          value={passwordForm.confirmPassword}
                          onChange={handlePasswordInputChange}
                          placeholder="Confirm new password"
                        />
                        <button
                          type="button"
                          className="ep-input-toggle"
                          onClick={() => togglePasswordVisibility('confirm')}
                        >
                          {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      {passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
                        <span className="ep-input-error">Passwords do not match</span>
                      )}
                    </div>

                    <div className="ep-form-actions">
                      <button
                        type="button"
                        className="ep-btn ep-btn-ghost"
                        onClick={() => setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })}
                        disabled={isChangingPassword}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="ep-btn ep-btn-primary"
                        disabled={isChangingPassword}
                      >
                        {isChangingPassword ? (
                          <>
                            <span className="ep-spinner"></span>
                            Changing...
                          </>
                        ) : (
                          <>
                            <Lock size={16} />
                            Change Password
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      {/* Edit Company Form Modal */}
      {isEditModalOpen && (
        <div className="edit-modal-backdrop">
          <div className="edit-modal-container">
            <div className="edit-modal-header">
              <div className="edit-header-content">
                <h2 className="edit-modal-title">Edit Company Profile</h2>
                <p className="edit-modal-subtitle">Update your business information</p>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="edit-close-btn">
                <X size={24} />
              </button>
            </div>

            <div className="edit-modal-body">
              {/* Profile Image Upload Section */}
              <div className="edit-section">
                <div className="edit-section-header">
                  <Camera size={18} className="edit-section-icon" />
                  <span>Company Logo / Profile Picture</span>
                </div>
                <div className="edit-image-upload-container">
                  <div className="edit-image-preview">
                    {profileImagePreview ? (
                      <img src={profileImagePreview} alt="Preview" className="edit-preview-img" />
                    ) : profile.image ? (
                      <img src={profile.image} alt="Current" className="edit-preview-img" />
                    ) : (
                      <div className="edit-no-image">
                        <Camera size={40} />
                        <span>No image</span>
                      </div>
                    )}
                  </div>
                  <div className="edit-image-actions">
                    <label className="edit-upload-btn">
                      <Upload size={18} />
                      {profileImage ? 'Change Image' : 'Upload Image'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        style={{ display: 'none' }}
                      />
                    </label>
                    {(profileImage || profileImagePreview) && (
                      <button
                        type="button"
                        className="edit-remove-btn"
                        onClick={handleRemoveImage}
                      >
                        <X size={18} />
                        Remove
                      </button>
                    )}
                  </div>
                  <p className="edit-image-hint">Recommended: Square image, max 5MB (JPG, PNG)</p>
                </div>
              </div>

              {/* Company Information Section */}
              <div className="edit-section">
                <div className="edit-section-header">
                  <Briefcase size={18} className="edit-section-icon" />
                  <span>Company Information</span>
                </div>

                <div className="edit-form-group">
                  <label className="edit-form-label">
                    <Briefcase size={14} />
                    Company Name <span className="edit-required">*</span>
                  </label>
                  <input
                    type="text"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleInputChange}
                    className="edit-form-input"
                    placeholder="Enter your company name"
                  />
                </div>

                <div className="edit-form-group">
                  <label className="edit-form-label">
                    <Award size={14} />
                    License Number <span className="edit-required">*</span>
                  </label>
                  <input
                    type="text"
                    name="license_number"
                    value={formData.license_number}
                    onChange={handleInputChange}
                    className="edit-form-input"
                    placeholder="Enter business license number"
                  />
                </div>

                <div className="edit-form-row">
                  <div className="edit-form-group">
                    <label className="edit-form-label">
                      <Calendar size={14} />
                      Years in Business <span className="edit-required">*</span>
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
                      Number of Employees <span className="edit-required">*</span>
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

              {/* Contact Information Section */}
              <div className="edit-section">
                <div className="edit-section-header">
                  <Phone size={18} className="edit-section-icon" />
                  <span>Contact Information</span>
                </div>

                <div className="edit-form-row">
                  <div className="edit-form-group">
                    <label className="edit-form-label">
                      <Phone size={14} />
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="edit-form-input"
                      placeholder="+63 XXX XXX XXXX"
                    />
                  </div>
                  <div className="edit-form-group">
                    <label className="edit-form-label">
                      <Mail size={14} />
                      Email Address
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
                    Business Address <span className="edit-required">*</span>
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="edit-form-textarea"
                    placeholder="Enter your business address"
                    rows="3"
                  />
                </div>
              </div>

              {/* Specializations Section */}
              <div className="edit-section">
                <div className="edit-section-header">
                  <CheckCircle size={18} className="edit-section-icon" />
                  <span>Specializations</span>
                  <span className="edit-selected-count">
                    {formData.specializations.length} selected
                  </span>
                </div>
                <div className="edit-specializations-grid">
                  {specializationOptions.map(spec => (
                    <label
                      key={spec}
                      className={`edit-checkbox-label ${formData.specializations.includes(spec) ? 'checked' : ''}`}
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
              </div>

              {/* Action Buttons */}
              <div className="edit-button-group">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="edit-cancel-btn"
                  disabled={isUpdating}
                >
                  <X size={18} />
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="edit-submit-btn"
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <>
                      <span className="edit-spinner"></span>
                      {isUploadingImage ? 'Uploading Image...' : 'Saving Changes...'}
                    </>
                  ) : (
                    <>
                      <Check size={18} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Plans Modal */}
      {showPlansModal && (
        <div className="subscription-modal">
          <div className="modal-overlay" onClick={() => setShowPlansModal(false)} />

          <div className="modal-content subs">
            <button
              className="modal-close-btn"
              onClick={() => setShowPlansModal(false)}
            >
              <X size={24} />
            </button>

            <div className="modal-header">
              <div className="sub-message">
                <h2>Subscription Plans</h2>
                <p className="subtitle">
                  {subscription.plan_type
                    ? `You are currently on the ${subscription.plan_type === 'premium' ? 'Premium' : 'Basic'} plan`
                    : 'Select the plan that fits your business needs'}
                </p>
              </div>
            </div>

            <div className="plans-container">
              {/* Basic Plan */}
              <div className={`plan-card ${subscription.plan_type === 'basic' ? 'current-plan' : ''}`}>
                {subscription.plan_type === 'basic' && (
                  <div className="current-plan-badge">Current Plan</div>
                )}
                <div className="plan-header">
                  <div className="plan-label">Basic Plan</div>
                  <div className="price">
                    <span className="currency">$</span>
                    <span className="amount">250</span>
                    <span className="period">/month</span>
                  </div>
                  <div className="plan-description">
                    Essential features for contractors
                  </div>
                </div>

                <ul className="features-list">
                  <li className="feature-item">
                    <svg width="16" height="16" viewBox="0 0 20 20" className="feature-icon">
                      <circle cx="10" cy="10" r="10" fill="#2ECC71"/>
                      <path d="M6 10l3 3 5-6" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Browse & view jobs</span>
                  </li>
                  <li className="feature-item">
                    <svg width="16" height="16" viewBox="0 0 20 20" className="feature-icon">
                      <circle cx="10" cy="10" r="10" fill="#2ECC71"/>
                      <path d="M6 10l3 3 5-6" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Submit up to 30 bids</span>
                  </li>
                  <li className="feature-item">
                    <svg width="16" height="16" viewBox="0 0 20 20" className="feature-icon">
                      <circle cx="10" cy="10" r="10" fill="#2ECC71"/>
                      <path d="M6 10l3 3 5-6" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Unlock budgets</span>
                  </li>
                  <li className="feature-item">
                    <svg width="16" height="16" viewBox="0 0 20 20" className="feature-icon">
                      <circle cx="10" cy="10" r="10" fill="#2ECC71"/>
                      <path d="M6 10l3 3 5-6" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Message approved contacts</span>
                  </li>
                </ul>

                <button
                  className="cta-btn btn-basic"
                  onClick={() => handleSelectPlan('basic')}
                  disabled={subscription.plan_type === 'basic'}
                >
                  {subscription.plan_type === 'basic' ? 'Current Plan' : 'Select Basic'}
                </button>
              </div>

              {/* Premium Plan */}
              <div className={`plan-card premium ${subscription.plan_type === 'premium' ? 'current-plan' : ''}`}>
                {subscription.plan_type === 'premium' ? (
                  <div className="current-plan-badge">Current Plan</div>
                ) : (
                  <div className="plan-badge">RECOMMENDED</div>
                )}

                <div className="plan-header">
                  <div className="plan-label">Premium Plan</div>
                  <div className="price">
                    <span className="currency">$</span>
                    <span className="amount">429</span>
                    <span className="period">/month</span>
                  </div>
                  <div className="plan-description">
                    Unlimited bidding for growing businesses
                  </div>
                </div>

                <ul className="features-list">
                  <li className="feature-item">
                    <svg width="16" height="16" viewBox="0 0 20 20" className="feature-icon">
                      <circle cx="10" cy="10" r="10" fill="#2ECC71"/>
                      <path d="M6 10l3 3 5-6" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Browse & view jobs</span>
                  </li>
                  <li className="feature-item highlight">
                    <svg width="16" height="16" viewBox="0 0 20 20" className="feature-icon">
                      <circle cx="10" cy="10" r="10" fill="#00A5A9"/>
                      <path d="M6 10l3 3 5-6" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Submit unlimited bids</span>
                  </li>
                  <li className="feature-item">
                    <svg width="16" height="16" viewBox="0 0 20 20" className="feature-icon">
                      <circle cx="10" cy="10" r="10" fill="#2ECC71"/>
                      <path d="M6 10l3 3 5-6" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Unlock budgets</span>
                  </li>
                  <li className="feature-item">
                    <svg width="16" height="16" viewBox="0 0 20 20" className="feature-icon">
                      <circle cx="10" cy="10" r="10" fill="#2ECC71"/>
                      <path d="M6 10l3 3 5-6" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Message approved contacts</span>
                  </li>
                  <li className="feature-item highlight">
                    <svg width="16" height="16" viewBox="0 0 20 20" className="feature-icon">
                      <circle cx="10" cy="10" r="10" fill="#00A5A9"/>
                      <path d="M6 10l3 3 5-6" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Priority support</span>
                  </li>
                </ul>

                <button
                  className="cta-btn btn-premium"
                  onClick={() => handleSelectPlan('premium')}
                  disabled={subscription.plan_type === 'premium'}
                >
                  {subscription.plan_type === 'premium' ? 'Current Plan' : 'Upgrade to Premium'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && userProfile && (
        <SubscriptionPaymentForm
          token={userProfile.token}
          planType={selectedPlanType}
          handleCloseModal={handlePaymentModalClose}
        />
      )}
    </div>
  );
}

export default ProfilePageEntrepreneur;
