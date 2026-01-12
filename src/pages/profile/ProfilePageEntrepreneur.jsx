import { useState, useEffect } from 'react';
import {
  Star, CheckCircle, Award, Briefcase, MapPin, Calendar, Mail, Phone, LogOut,
  MessageSquare, User, Upload, Camera, X, Crown, Check, Zap, Shield, Activity,
  DollarSign, FileText, ArrowUpCircle, AlertCircle, Lock, Eye, EyeOff, Key,
  BarChart3, Menu, Edit, CreditCard, ExternalLink, Wallet, TrendingUp, ArrowDownCircle,
  Percent, ChevronDown, ChevronUp, Clock, Building, Receipt, Unlock, Settings, Globe
} from 'lucide-react';
import Nav from "../../components/Nav";
import '../../styles/entrepreneur/profilepageentrepreneur-modern.css';
import '../../styles/entrepreneur/subscriptionpage.css';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import EntrepreneurProfileSkeleton from '../../components/loading/EntrepreneurProfileSkeleton'
import SubscriptionPaymentForm from '../../components/SubscriptionPaymentModal'
import '../../styles/entrepreneur/subscriptionmodal.css'
import { getConnectStatus, startOnboarding, getDashboardLink, getPayoutsSummary } from '../../utils/stripeConnectApi'
import { logout } from '../../utils/api'
import { useLanguage, LANGUAGES } from '../../contexts/LanguageContext'

function ProfilePageEntrepreneur() {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const { t, language, changeLanguage, languages } = useLanguage();
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

  // Payouts states
  const [payoutsSummary, setPayoutsSummary] = useState(null)
  const [isLoadingPayouts, setIsLoadingPayouts] = useState(false)
  const [chartPeriod, setChartPeriod] = useState('monthly') // 'monthly' or 'weekly'
  const [expandedTransaction, setExpandedTransaction] = useState(null)

  // Billing history states
  const [billingHistory, setBillingHistory] = useState([])
  const [billingSummary, setBillingSummary] = useState(null)
  const [billingLoading, setBillingLoading] = useState(false)

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
    account: t('profileEntrepreneur.account'),
    subscription: t('profileEntrepreneur.subscription'),
    payouts: t('profileEntrepreneur.payouts'),
    billing: t('profileEntrepreneur.billingHistory'),
    performance: t('profileEntrepreneur.performanceReviews'),
    settings: t('profileEntrepreneur.settings')
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

  // Fetch payouts summary
  const fetchPayoutsSummary = async () => {
    try {
      setIsLoadingPayouts(true)
      const data = await getPayoutsSummary()
      setPayoutsSummary(data)
    } catch (err) {
      console.log('Could not fetch payouts summary:', err.message)
      setPayoutsSummary(null)
    } finally {
      setIsLoadingPayouts(false)
    }
  }

  // Handle Stripe Connect onboarding
  const handleStripeConnect = async () => {
    try {
      setIsConnectingStripe(true)
      const result = await startOnboarding()

      if (result.already_complete) {
        toast.success(t('profileEntrepreneur.paymentAccountSetUp'))
        fetchStripeStatus()
        return
      }

      if (result.url) {
        window.location.href = result.url
      }
    } catch (err) {
      console.error('Stripe connect error:', err)
      toast.error(err.message || t('profileEntrepreneur.failedPaymentSetup'))
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
      toast.error(t('profileEntrepreneur.failedOpenDashboard'))
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

  // Fetch billing history
  const fetchBillingHistory = async () => {
    setBillingLoading(true)
    try {
      const uProfile = localStorage.getItem('userProfile')
      if (!uProfile) return

      const user = JSON.parse(uProfile)
      const response = await fetch(`${API_BASE_URL}/api/payments/billing-history`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setBillingHistory(data.payments || [])
        setBillingSummary(data.summary || null)
      }
    } catch (error) {
      console.error('Error fetching billing history:', error)
      setBillingHistory([])
      setBillingSummary(null)
    } finally {
      setBillingLoading(false)
    }
  }

  // Fetch billing history when tab changes to billing
  useEffect(() => {
    if (activeTab === 'billing' && billingHistory.length === 0 && !billingLoading) {
      fetchBillingHistory()
    }
  }, [activeTab])

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
        toast.error(t('profileEntrepreneur.selectValidImage'))
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error(t('profileEntrepreneur.imageSizeExceed'))
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
      toast.error(t('profileEntrepreneur.fillRequiredFields'));
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
          toast.success(t('profileEntrepreneur.profileUpdatedImageFailed'))
        } else {
          toast.success(t('profileEntrepreneur.profileUpdatedSuccess'))
        }
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error(t('profileEntrepreneur.failedUpdateProfile'))
    } finally {
      setIsUpdating(false)
      setIsUploadingImage(false)
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
    localStorage.removeItem("userProfile");
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("selectedPropertyId");
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
    const labels = [
      t('profileEntrepreneur.veryWeak'),
      t('profileEntrepreneur.weak'),
      t('profileEntrepreneur.fair'),
      t('profileEntrepreneur.good'),
      t('profileEntrepreneur.strong')
    ]
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
      setPasswordError(t('profileEntrepreneur.allFieldsRequired'))
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError(t('profileEntrepreneur.passwordsDoNotMatch'))
      return
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordError(t('profileEntrepreneur.passwordMinLength'))
      return
    }

    const strength = getPasswordStrength(passwordForm.newPassword)
    if (strength < 4) {
      setPasswordError(t('profileEntrepreneur.passwordRequirements'))
      return
    }

    setIsChangingPassword(true)

    try {
      const uProfile = localStorage.getItem('userProfile')
      if (!uProfile) {
        throw new Error(t('profileEntrepreneur.pleaseLoginAgain'))
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
        throw new Error(data.message || t('profileEntrepreneur.failedChangePassword'))
      }

      setPasswordSuccess(t('profileEntrepreneur.passwordChangedSuccess'))
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      toast.success(t('profileEntrepreneur.passwordChangedSuccess'))
    } catch (error) {
      setPasswordError(error.message)
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setIsMobileSidebarOpen(false)

    // Fetch payouts when switching to payouts tab
    if (tab === 'payouts' && !payoutsSummary && stripeStatus?.onboarding_complete) {
      fetchPayoutsSummary()
    }
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
              <span>{t('profileEntrepreneur.entrepreneur')}</span>
            </div>
          </div>

          <nav className="ep-sidebar-nav">
            <button
              className={`ep-nav-item ${activeTab === 'account' ? 'ep-nav-active' : ''}`}
              onClick={() => handleTabChange('account')}
            >
              <User size={18} />
              <span>{t('profileEntrepreneur.account')}</span>
            </button>
            <button
              className={`ep-nav-item ${activeTab === 'subscription' ? 'ep-nav-active' : ''}`}
              onClick={() => handleTabChange('subscription')}
            >
              <Crown size={18} />
              <span>{t('profileEntrepreneur.subscription')}</span>
            </button>
            <button
              className={`ep-nav-item ${activeTab === 'payouts' ? 'ep-nav-active' : ''}`}
              onClick={() => handleTabChange('payouts')}
            >
              <Wallet size={18} />
              <span>{t('profileEntrepreneur.payouts')}</span>
            </button>
            <button
              className={`ep-nav-item ${activeTab === 'billing' ? 'ep-nav-active' : ''}`}
              onClick={() => handleTabChange('billing')}
            >
              <Receipt size={18} />
              <span>{t('profileEntrepreneur.billingHistory')}</span>
            </button>
            <button
              className={`ep-nav-item ${activeTab === 'performance' ? 'ep-nav-active' : ''}`}
              onClick={() => handleTabChange('performance')}
            >
              <BarChart3 size={18} />
              <span>{t('profileEntrepreneur.performanceReviews')}</span>
              {reviews.length > 0 && (
                <span className="ep-nav-badge">{reviews.length}</span>
              )}
            </button>
            <button
              className={`ep-nav-item ${activeTab === 'settings' ? 'ep-nav-active' : ''}`}
              onClick={() => handleTabChange('settings')}
            >
              <Settings size={18} />
              <span>{t('profileEntrepreneur.settings')}</span>
            </button>
          </nav>

          <div className="ep-sidebar-footer">
            <button className="ep-nav-item ep-nav-logout" onClick={handleLogout}>
              <LogOut size={18} />
              <span>{t('profileEntrepreneur.logout')}</span>
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
                    <h2>{t('profileEntrepreneur.accountInformation')}</h2>
                    <p>{t('profileEntrepreneur.manageCompanyProfile')}</p>
                  </div>
                  <button className="ep-btn ep-btn-primary ep-desktop-only" onClick={() => setIsEditModalOpen(true)}>
                    <Edit size={16} />
                    {t('profileEntrepreneur.editProfile')}
                  </button>
                </div>

                {/* Profile Cards */}
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
                          {t('profileEntrepreneur.entrepreneur')}
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
                          <span className="ep-stripe-status-label">{t('profileEntrepreneur.paymentAccount')}</span>
                          <span className="ep-stripe-status-value success">{t('profileEntrepreneur.connected')}</span>
                        </div>
                        <button
                          className="ep-stripe-dashboard-btn"
                          onClick={handleStripeDashboard}
                          title={t('stripeConnectModal.viewStripeDashboard')}
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
                          <span className="ep-stripe-status-label">{t('profileEntrepreneur.paymentAccount')}</span>
                          <span className="ep-stripe-status-value pending">{t('profileEntrepreneur.notConnected')}</span>
                        </div>
                        <button
                          className="ep-stripe-connect-btn"
                          onClick={handleStripeConnect}
                          disabled={isConnectingStripe}
                        >
                          {isConnectingStripe ? t('profileEntrepreneur.connecting') : t('profileEntrepreneur.setUp')}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Company Information */}
                <div className="ep-info-section">
                  <h4 className="ep-info-section-title">{t('profileEntrepreneur.companyInformation')}</h4>
                  <div className="ep-info-grid-modern">
                    <div className="ep-info-item-modern">
                      <div className="ep-info-icon-modern">
                        <Briefcase size={18} />
                      </div>
                      <div className="ep-info-details">
                        <label>{t('profileEntrepreneur.companyName')}</label>
                        <span>{profile.companyName}</span>
                      </div>
                    </div>
                    <div className="ep-info-item-modern">
                      <div className="ep-info-icon-modern">
                        <Award size={18} />
                      </div>
                      <div className="ep-info-details">
                        <label>{t('profileEntrepreneur.licenseNumber')}</label>
                        <span>{profile.licenseNumber}</span>
                      </div>
                    </div>
                    <div className="ep-info-item-modern">
                      <div className="ep-info-icon-modern">
                        <Calendar size={18} />
                      </div>
                      <div className="ep-info-details">
                        <label>{t('profileEntrepreneur.yearsInBusiness')}</label>
                        <span>{profile.yearsInBusiness} {t('profileEntrepreneur.years')}</span>
                      </div>
                    </div>
                    <div className="ep-info-item-modern">
                      <div className="ep-info-icon-modern">
                        <User size={18} />
                      </div>
                      <div className="ep-info-details">
                        <label>{t('profileEntrepreneur.numberOfEmployees')}</label>
                        <span>{profile.numEmployees}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="ep-info-section">
                  <h4 className="ep-info-section-title">{t('profileEntrepreneur.contactInformation')}</h4>
                  <div className="ep-info-grid-modern">
                    <div className="ep-info-item-modern">
                      <div className="ep-info-icon-modern">
                        <Mail size={18} />
                      </div>
                      <div className="ep-info-details">
                        <label>{t('profileEntrepreneur.email')}</label>
                        <span>{profile.email}</span>
                      </div>
                    </div>
                    <div className="ep-info-item-modern">
                      <div className="ep-info-icon-modern">
                        <Phone size={18} />
                      </div>
                      <div className="ep-info-details">
                        <label>{t('profileEntrepreneur.phone')}</label>
                        <span>{profile.phone}</span>
                      </div>
                    </div>
                    <div className="ep-info-item-modern ep-info-full-width">
                      <div className="ep-info-icon-modern">
                        <MapPin size={18} />
                      </div>
                      <div className="ep-info-details">
                        <label>{t('profileEntrepreneur.address')}</label>
                        <span>{profile.address}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Specializations */}
                <div className="ep-specializations-section">
                  <h4 className="ep-info-section-title">{t('profileEntrepreneur.specializations')}</h4>
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
                    <h2>{t('profileEntrepreneur.subscriptionManagement')}</h2>
                    <p>{t('profileEntrepreneur.manageSubscriptionPlan')}</p>
                  </div>
                </div>

                {/* No Subscription State */}
                {!userProfile?.entrepProfile?.subscription?.hasSubscription ? (
                  <div className="no-subscription-state">
                    <div className="no-sub-content">
                      <div className="no-sub-icon">
                        <Crown size={48} />
                      </div>
                      <h3 className="no-sub-title">{t('profileEntrepreneur.noActiveSubscription')}</h3>
                      <p className="no-sub-description">
                        {t('profileEntrepreneur.noSubscriptionDesc')}
                      </p>
                      <button
                        className="subscribe-now-btn"
                        onClick={() => setShowPlansModal(true)}
                      >
                        <Crown size={18} />
                        {t('profileEntrepreneur.viewSubscriptionPlans')}
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
                              <h3 className="banner-title">{t('profileEntrepreneur.premiumTrialActive')}</h3>
                              <div className="trial-badge">{t('profileEntrepreneur.trialPeriod')}</div>
                            </div>
                            <p className="banner-text">
                              {getTrialInfo().daysRemaining} {getTrialInfo().daysRemaining === 1 ? t('profileEntrepreneur.day') : t('profileEntrepreneur.days')} {t('profileEntrepreneur.remaining')}
                            </p>
                            <p className="banner-subtext">
                              {t('profileEntrepreneur.trialEndsOn')} {formatDate(subscription.trial_end)}
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
                            <div className="countdown-label">{t('profileEntrepreneur.daysLeft')}</div>
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
                                {t('profileEntrepreneur.active')}
                              </div>
                            </div>
                            <h2 className="plan-name">{subscription.plan_type === 'premium' ? t('profileEntrepreneur.premiumPlan') : t('profileEntrepreneur.basicPlan')}</h2>
                            <p className="plan-desc">
                              {subscription.plan_type === 'premium' ? t('profileEntrepreneur.bestForProfessionals') : t('profileEntrepreneur.perfectForGettingStarted')}
                            </p>
                            <div className="plan-price">
                              <span className="price-symbol">$</span>
                              <span className="price-value">{subscription.plan_type === 'premium' ? 429 : 250}</span>
                              <span className="price-period">{t('profileEntrepreneur.month')}</span>
                            </div>
                          </div>

                          <div className="billing-timeline-card">
                            <div className="card-header">
                              <div className="card-icon">
                                <Calendar size={24} />
                              </div>
                              <h3 className="card-title">{t('profileEntrepreneur.billingCycle')}</h3>
                            </div>
                            <div className="timeline-content">
                              <div className="timeline-dates">
                                <div className="date-item">
                                  <span className="date-label">{t('profileEntrepreneur.started')}</span>
                                  <span className="date-value">{formatDate(subscription.start_date || subscription.start)}</span>
                                </div>
                                <div className="date-item">
                                  <span className="date-label">{t('profileEntrepreneur.nextBilling')}</span>
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
                                    <span className="progress-text">{getSubscriptionDuration().daysRemaining} {t('profileEntrepreneur.daysUntilRenewal')}</span>
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
                              {subscription.plan_type === 'premium' ? t('profileEntrepreneur.youreOnPremium') : t('profileEntrepreneur.viewSubscriptionPlans')}
                            </h3>
                            <p className="upgrade-description">
                              {subscription.plan_type === 'premium'
                                ? t('profileEntrepreneur.unlimitedBidsAccess')
                                : t('profileEntrepreneur.explorePlansDesc')}
                            </p>
                          </div>
                        </div>
                        <button
                          className="upgrade-btn"
                          onClick={() => setShowPlansModal(true)}
                        >
                          <Crown size={18} />
                          {t('profileEntrepreneur.viewPlans')}
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
                          <h2 className="section-title">{t('profileEntrepreneur.usageAnalytics')}</h2>
                          <p className="section-subtitle">{t('profileEntrepreneur.monitorBiddingActivity')}</p>
                        </div>
                      </div>

                      <div className="stats-grid subs">
                        <div className="stat-card subs">
                          <div className="stat-header subs">
                            <div className="stat-icon bids">
                              <FileText size={22} />
                            </div>
                            <span className="stat-label">{t('profileEntrepreneur.bidsSubmitted')}</span>
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
                            <span className="stat-label">{t('profileEntrepreneur.remainingBids')}</span>
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
                            <span className="stat-label">{t('profileEntrepreneur.budgetUnlocks')}</span>
                          </div>
                          <div className="stat-value subsval">{t('profileEntrepreneur.unlimited')}</div>
                        </div>

                        <div className="stat-card subs">
                          <div className="stat-header subs">
                            <div className="stat-icon messages">
                              <MessageSquare size={22} />
                            </div>
                            <span className="stat-label">{t('profileEntrepreneur.activeChats')}</span>
                          </div>
                          <div className="stat-value subsval">{t('profileEntrepreneur.unlimited')}</div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            {/* Billing History Tab */}
            {activeTab === 'billing' && (
              <>
                <div className="ep-content-header">
                  <div className="ep-content-header-left">
                    <h2>{t('profileEntrepreneur.billingHistory')}</h2>
                    <p>{t('profileEntrepreneur.viewBillingHistory')}</p>
                  </div>
                  <button
                    className="ep-btn ep-btn-secondary"
                    onClick={fetchBillingHistory}
                    disabled={billingLoading}
                  >
                    {billingLoading ? t('common.loading') : t('profileEntrepreneur.refreshBilling')}
                  </button>
                </div>

                {/* Summary Cards */}
                {billingSummary && (
                  <div className="ep-billing-summary">
                    <div className="ep-billing-stat-card">
                      <div className="ep-billing-stat-icon total">
                        <DollarSign size={24} />
                      </div>
                      <div className="ep-billing-stat-content">
                        <span className="ep-billing-stat-value">
                          ${billingSummary.total_spent?.toFixed(2) || '0.00'}
                        </span>
                        <span className="ep-billing-stat-label">{t('profileEntrepreneur.totalSpent')}</span>
                      </div>
                    </div>
                    <div className="ep-billing-stat-card">
                      <div className="ep-billing-stat-icon subscription">
                        <Crown size={24} />
                      </div>
                      <div className="ep-billing-stat-content">
                        <span className="ep-billing-stat-value">
                          ${billingSummary.subscription_spent?.toFixed(2) || '0.00'}
                        </span>
                        <span className="ep-billing-stat-label">{t('profileEntrepreneur.subscriptionPayments')}</span>
                      </div>
                    </div>
                    <div className="ep-billing-stat-card">
                      <div className="ep-billing-stat-icon unlock">
                        <Unlock size={24} />
                      </div>
                      <div className="ep-billing-stat-content">
                        <span className="ep-billing-stat-value">
                          ${billingSummary.budget_unlock_spent?.toFixed(2) || '0.00'}
                        </span>
                        <span className="ep-billing-stat-label">{t('profileEntrepreneur.budgetUnlocks')} ({billingSummary.total_budget_unlocks || 0})</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment History List */}
                <div className="ep-billing-section">
                  <h4 className="ep-info-section-title">{t('profileEntrepreneur.paymentHistory')}</h4>

                  {billingLoading ? (
                    <div className="ep-billing-loading">
                      <div className="ep-spinner"></div>
                      <p>{t('profileEntrepreneur.loadingBillingHistory')}</p>
                    </div>
                  ) : billingHistory.length > 0 ? (
                    <div className="ep-billing-list">
                      {billingHistory.map((payment) => (
                        <div key={payment.id} className={`ep-billing-item ${payment.type}`}>
                          <div className="ep-billing-item-left">
                            <div className={`ep-billing-icon ${payment.type}`}>
                              {payment.type === 'subscription' ? (
                                <Crown size={20} />
                              ) : (
                                <Unlock size={20} />
                              )}
                            </div>
                            <div className="ep-billing-details">
                              <span className="ep-billing-description">{payment.description}</span>
                              <div className="ep-billing-meta">
                                <span className="ep-billing-date">
                                  <Clock size={12} />
                                  {new Date(payment.date).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </span>
                                {payment.type === 'subscription' && payment.period_end && (
                                  <span className="ep-billing-period">
                                    <Calendar size={12} />
                                    {t('profileEntrepreneur.periodEnds')} {new Date(payment.period_end).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')}
                                  </span>
                                )}
                                {payment.job_category && (
                                  <span className="ep-billing-category">
                                    <Briefcase size={12} />
                                    {payment.job_category}
                                  </span>
                                )}
                                {payment.stripe_id && (
                                  <span className="ep-billing-stripe-id" title={payment.stripe_id}>
                                    <FileText size={12} />
                                    {payment.stripe_id.length > 20
                                      ? `${payment.stripe_id.substring(0, 20)}...`
                                      : payment.stripe_id}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="ep-billing-item-right">
                            <span className="ep-billing-amount">${payment.amount?.toFixed(2)}</span>
                            <span className={`ep-billing-status ${payment.status}`}>
                              {payment.status === 'active' || payment.status === 'succeeded' ? (
                                <><CheckCircle size={12} /> {t('profileEntrepreneur.paid')}</>
                              ) : payment.status === 'trialing' ? (
                                <><Zap size={12} /> {t('profileEntrepreneur.trial')}</>
                              ) : (
                                <>{payment.status}</>
                              )}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="ep-billing-empty">
                      <Receipt size={48} />
                      <h3>{t('profileEntrepreneur.noPaymentHistory')}</h3>
                      <p>{t('profileEntrepreneur.noPaymentHistoryDesc')}</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Performance & Reviews Tab */}
            {activeTab === 'performance' && (
              <>
                <div className="ep-content-header">
                  <div className="ep-content-header-left">
                    <h2>{t('profileEntrepreneur.performanceOverview')}</h2>
                    <p>{t('profileEntrepreneur.trackReputation')}</p>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="ep-metrics-grid">
                  <div className="ep-metric-card">
                    <div className="ep-metric-icon rating">
                      <Star size={24} />
                    </div>
                    <div className="ep-metric-content">
                      <div className="ep-metric-label">{t('profileEntrepreneur.averageRating')}</div>
                      <div className="ep-metric-value">{calculateAverageRating() || 'N/A'}</div>
                    </div>
                  </div>
                  <div className="ep-metric-card">
                    <div className="ep-metric-icon reviews">
                      <Award size={24} />
                    </div>
                    <div className="ep-metric-content">
                      <div className="ep-metric-label">{t('profileEntrepreneur.totalReviews')}</div>
                      <div className="ep-metric-value">{reviews.length}</div>
                    </div>
                  </div>
                  <div className="ep-metric-card">
                    <div className="ep-metric-icon experience">
                      <CheckCircle size={24} />
                    </div>
                    <div className="ep-metric-content">
                      <div className="ep-metric-label">{t('profileEntrepreneur.experience')}</div>
                      <div className="ep-metric-value">{profile.yearsInBusiness} {t('profileEntrepreneur.years')}</div>
                    </div>
                  </div>
                  <div className="ep-metric-card">
                    <div className="ep-metric-icon employees">
                      <Briefcase size={24} />
                    </div>
                    <div className="ep-metric-content">
                      <div className="ep-metric-label">{t('profileEntrepreneur.employees')}</div>
                      <div className="ep-metric-value">{profile.numEmployees}</div>
                    </div>
                  </div>
                </div>

                {/* Reviews Section */}
                <div className="ep-reviews-section">
                  <h4 className="ep-info-section-title">{t('profileEntrepreneur.clientReviews')}</h4>
                  {reviewsLoading ? (
                    <div className="ep-no-reviews">
                      <div className="ep-spinner"></div>
                      <p>{t('profileEntrepreneur.loadingReviews')}</p>
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
                      <p>{t('profileEntrepreneur.noReviewsYet')}</p>
                      <span>{t('profileEntrepreneur.completeJobsForReviews')}</span>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Payouts Tab */}
            {activeTab === 'payouts' && (
              <>
                <div className="ep-content-header">
                  <div className="ep-content-header-left">
                    <h2>{t('profileEntrepreneur.payoutsEarnings')}</h2>
                    <p>{t('profileEntrepreneur.managePayouts')}</p>
                  </div>
                  {stripeStatus?.onboarding_complete && (
                    <button
                      className="ep-btn ep-btn-secondary"
                      onClick={async () => {
                        try {
                          const result = await getDashboardLink()
                          window.open(result.url, '_blank')
                        } catch (err) {
                          toast.error(t('profileEntrepreneur.failedOpenDashboard'))
                        }
                      }}
                    >
                      <ExternalLink size={16} />
                      {t('stripeConnectModal.viewStripeDashboard')}
                    </button>
                  )}
                </div>

                {/* Stripe Connect Status */}
                {!stripeStatus?.onboarding_complete ? (
                  <div className="ep-payouts-setup">
                    <div className="ep-payouts-setup-icon">
                      <Wallet size={48} />
                    </div>
                    <h3>{t('profileEntrepreneur.setUpPayouts')}</h3>
                    <p>{t('profileEntrepreneur.connectStripeDesc')}</p>
                    <button
                      className="ep-btn ep-btn-primary"
                      onClick={handleStripeConnect}
                      disabled={isConnectingStripe}
                    >
                      {isConnectingStripe ? (
                        <>
                          <span className="ep-spinner"></span>
                          {t('profileEntrepreneur.connecting')}
                        </>
                      ) : (
                        <>
                          <CreditCard size={16} />
                          {t('profileEntrepreneur.connectStripeAccount')}
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Earnings Summary Cards */}
                    {isLoadingPayouts ? (
                      <div className="ep-payouts-loading">
                        <span className="ep-spinner-lg"></span>
                        <p>{t('profileEntrepreneur.loadingEarningsData')}</p>
                      </div>
                    ) : payoutsSummary ? (
                      <>
                        {/* Summary Cards Row */}
                        <div className="ep-payouts-summary">
                          <div className="ep-payout-card ep-payout-total">
                            <div className="ep-payout-card-icon">
                              <DollarSign size={24} />
                            </div>
                            <div className="ep-payout-card-content">
                              <span className="ep-payout-label">{t('profileEntrepreneur.netEarnings')}</span>
                              <span className="ep-payout-amount">${payoutsSummary.total_earnings?.toLocaleString(language === 'fr' ? 'fr-CA' : 'en-CA', { minimumFractionDigits: 2 }) || '0.00'}</span>
                            </div>
                          </div>
                          <div className="ep-payout-card ep-payout-pending">
                            <div className="ep-payout-card-icon">
                              <Clock size={24} />
                            </div>
                            <div className="ep-payout-card-content">
                              <span className="ep-payout-label">{t('profileEntrepreneur.pendingPayouts')}</span>
                              <span className="ep-payout-amount">${payoutsSummary.pending_amount?.toLocaleString(language === 'fr' ? 'fr-CA' : 'en-CA', { minimumFractionDigits: 2 }) || '0.00'}</span>
                            </div>
                          </div>
                          <div className="ep-payout-card ep-payout-received">
                            <div className="ep-payout-card-icon">
                              <ArrowDownCircle size={24} />
                            </div>
                            <div className="ep-payout-card-content">
                              <span className="ep-payout-label">{t('profileEntrepreneur.totalReceived')}</span>
                              <span className="ep-payout-amount">${payoutsSummary.total_paid?.toLocaleString(language === 'fr' ? 'fr-CA' : 'en-CA', { minimumFractionDigits: 2 }) || '0.00'}</span>
                            </div>
                          </div>
                          <div className="ep-payout-card ep-payout-contracts">
                            <div className="ep-payout-card-icon">
                              <FileText size={24} />
                            </div>
                            <div className="ep-payout-card-content">
                              <span className="ep-payout-label">{t('profileEntrepreneur.contracts')}</span>
                              <span className="ep-payout-amount">{payoutsSummary.completed_contracts || 0} / {payoutsSummary.total_contracts || 0}</span>
                            </div>
                          </div>
                        </div>

                        {/* Platform Fee Breakdown */}
                        <div className="ep-fee-breakdown">
                          <div className="ep-fee-breakdown-header">
                            <div className="ep-fee-icon">
                              <Percent size={20} />
                            </div>
                            <div>
                              <h3>{t('profileEntrepreneur.platformFeeBreakdown')}</h3>
                              <p>{t('profileEntrepreneur.platformFeeOverviewDesc')}</p>
                            </div>
                          </div>
                          <div className="ep-fee-breakdown-content">
                            <div className="ep-fee-row">
                              <span className="ep-fee-label">{t('profileEntrepreneur.grossContractValue')}</span>
                              <span className="ep-fee-value">${payoutsSummary.gross_earnings?.toLocaleString(language === 'fr' ? 'fr-CA' : 'en-CA', { minimumFractionDigits: 2 }) || '0.00'}</span>
                            </div>
                            <div className="ep-fee-row ep-fee-deduction">
                              <span className="ep-fee-label">{t('profileEntrepreneur.platformFee')} ({payoutsSummary.platform_fee_percentage || 7.6}%)</span>
                              <span className="ep-fee-value">-${payoutsSummary.total_platform_fees?.toLocaleString(language === 'fr' ? 'fr-CA' : 'en-CA', { minimumFractionDigits: 2 }) || '0.00'}</span>
                            </div>
                            <div className="ep-fee-row ep-fee-total">
                              <span className="ep-fee-label">{t('profileEntrepreneur.yourNetEarnings')}</span>
                              <span className="ep-fee-value">${payoutsSummary.total_earnings?.toLocaleString(language === 'fr' ? 'fr-CA' : 'en-CA', { minimumFractionDigits: 2 }) || '0.00'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Revenue Chart */}
                        <div className="ep-revenue-chart">
                          <div className="ep-chart-header">
                            <h3>{t('profileEntrepreneur.revenueOverview')}</h3>
                            <div className="ep-chart-toggle">
                              <button
                                className={`ep-toggle-btn ${chartPeriod === 'weekly' ? 'ep-toggle-active' : ''}`}
                                onClick={() => setChartPeriod('weekly')}
                              >
                                {t('profileEntrepreneur.weekly')}
                              </button>
                              <button
                                className={`ep-toggle-btn ${chartPeriod === 'monthly' ? 'ep-toggle-active' : ''}`}
                                onClick={() => setChartPeriod('monthly')}
                              >
                                {t('profileEntrepreneur.monthly')}
                              </button>
                            </div>
                          </div>
                          <div className="ep-chart-container">
                            {(chartPeriod === 'monthly' ? payoutsSummary.monthly_chart : payoutsSummary.weekly_chart)?.length > 0 ? (
                              <div className="ep-bar-chart">
                                {(chartPeriod === 'monthly' ? payoutsSummary.monthly_chart : payoutsSummary.weekly_chart).map((item, index) => {
                                  const maxEarnings = Math.max(...(chartPeriod === 'monthly' ? payoutsSummary.monthly_chart : payoutsSummary.weekly_chart).map(i => i.earnings));
                                  const heightPercent = maxEarnings > 0 ? (item.earnings / maxEarnings) * 100 : 0;
                                  return (
                                    <div key={index} className="ep-bar-item">
                                      <div className="ep-bar-value">${item.earnings.toLocaleString('en-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
                                      <div className="ep-bar-wrapper">
                                        <div
                                          className="ep-bar"
                                          style={{ height: `${Math.max(heightPercent, 5)}%` }}
                                        />
                                      </div>
                                      <div className="ep-bar-label">{item.label}</div>
                                      <div className="ep-bar-contracts">{item.contracts} {item.contracts !== 1 ? t('profileEntrepreneur.jobs') : t('profileEntrepreneur.job')}</div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="ep-chart-empty">
                                <BarChart3 size={48} />
                                <p>{t('profileEntrepreneur.noDataForPeriod')}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Transaction History Table */}
                        <div className="ep-payouts-transactions">
                          <div className="ep-transactions-header">
                            <h3>{t('profileEntrepreneur.transactionHistory')}</h3>
                            <span className="ep-transactions-count">{payoutsSummary.transactions?.length || 0} {t('profileEntrepreneur.transactions')}</span>
                          </div>
                          {payoutsSummary.transactions && payoutsSummary.transactions.length > 0 ? (
                            <div className="ep-transactions-table">
                              <div className="ep-table-header">
                                <span className="ep-th-job">{t('profileEntrepreneur.tableHeaderJob')}</span>
                                <span className="ep-th-client">{t('profileEntrepreneur.tableHeaderClient')}</span>
                                <span className="ep-th-amount">{t('profileEntrepreneur.tableHeaderContract')}</span>
                                <span className="ep-th-fee">{t('profileEntrepreneur.tableHeaderFee')}</span>
                                <span className="ep-th-net">{t('profileEntrepreneur.tableHeaderNet')}</span>
                                <span className="ep-th-status">{t('profileEntrepreneur.tableHeaderStatus')}</span>
                                <span className="ep-th-date">{t('profileEntrepreneur.tableHeaderDate')}</span>
                              </div>
                              <div className="ep-transactions-list">
                                {payoutsSummary.transactions.map((tx) => (
                                  <div key={tx.id} className="ep-transaction-row-wrapper">
                                    <div
                                      className={`ep-transaction-row ${expandedTransaction === tx.id ? 'ep-row-expanded' : ''}`}
                                      onClick={() => setExpandedTransaction(expandedTransaction === tx.id ? null : tx.id)}
                                    >
                                      <span className="ep-td-job" title={tx.job_title}>
                                        {tx.job_title?.length > 25 ? tx.job_title.substring(0, 25) + '...' : tx.job_title}
                                      </span>
                                      <span className="ep-td-client">{tx.manager_name}</span>
                                      <span className="ep-td-amount">${tx.contract_amount?.toLocaleString('en-CA', { minimumFractionDigits: 2 })}</span>
                                      <span className="ep-td-fee">-${tx.platform_fee?.toLocaleString('en-CA', { minimumFractionDigits: 2 })}</span>
                                      <span className="ep-td-net ep-amount-green">+${tx.amount?.toLocaleString('en-CA', { minimumFractionDigits: 2 })}</span>
                                      <span className={`ep-td-status ${tx.status === 'completed' ? 'ep-status-completed' : 'ep-status-pending'}`}>
                                        {tx.status === 'completed' ? t('profileEntrepreneur.paid') : t('profileEntrepreneur.pending')}
                                      </span>
                                      <span className="ep-td-date">
                                        {new Date(tx.date).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}
                                      </span>
                                      <span className="ep-td-expand">
                                        {expandedTransaction === tx.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                      </span>
                                    </div>
                                    {expandedTransaction === tx.id && (
                                      <div className="ep-transaction-details">
                                        <div className="ep-detail-row">
                                          <span className="ep-detail-label">{t('profileEntrepreneur.contractAmountLabel')}</span>
                                          <span className="ep-detail-value">${tx.contract_amount?.toLocaleString(language === 'fr' ? 'fr-CA' : 'en-CA', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="ep-detail-row">
                                          <span className="ep-detail-label">{t('profileEntrepreneur.platformFeeLabel')} ({tx.platform_fee_percentage}%):</span>
                                          <span className="ep-detail-value ep-amount-red">-${tx.platform_fee?.toLocaleString(language === 'fr' ? 'fr-CA' : 'en-CA', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="ep-detail-row ep-detail-total">
                                          <span className="ep-detail-label">{t('profileEntrepreneur.yourPayout')}</span>
                                          <span className="ep-detail-value ep-amount-green">${tx.amount?.toLocaleString(language === 'fr' ? 'fr-CA' : 'en-CA', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                        {tx.paid_at && (
                                          <div className="ep-detail-row">
                                            <span className="ep-detail-label">{t('profileEntrepreneur.paymentReceivedLabel')}</span>
                                            <span className="ep-detail-value">{new Date(tx.paid_at).toLocaleDateString(language === 'fr' ? 'fr-CA' : 'en-CA', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                          </div>
                                        )}
                                        {tx.payout_completed_at && (
                                          <div className="ep-detail-row">
                                            <span className="ep-detail-label">{t('profileEntrepreneur.payoutCompletedLabel')}</span>
                                            <span className="ep-detail-value">{new Date(tx.payout_completed_at).toLocaleDateString(language === 'fr' ? 'fr-CA' : 'en-CA', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="ep-no-transactions">
                              <FileText size={48} />
                              <p>{t('profileEntrepreneur.noTransactions')}</p>
                              <span>{t('profileEntrepreneur.completeContractsForHistory')}</span>
                            </div>
                          )}
                        </div>

                        {/* Payout Schedule Info */}
                        <div className="ep-payout-schedule">
                          <div className="ep-schedule-header">
                            <Calendar size={20} />
                            <h3>{t('profileEntrepreneur.payoutSchedule')}</h3>
                          </div>
                          <div className="ep-schedule-content">
                            <div className="ep-schedule-item">
                              <span className="ep-schedule-label">{t('profileEntrepreneur.payoutFrequency')}</span>
                              <span className="ep-schedule-value">{t('profileEntrepreneur.afterWorkApproval')}</span>
                            </div>
                            <div className="ep-schedule-item">
                              <span className="ep-schedule-label">{t('profileEntrepreneur.processingTime')}</span>
                              <span className="ep-schedule-value">{t('profileEntrepreneur.processingTimeValue')}</span>
                            </div>
                            <div className="ep-schedule-item">
                              <span className="ep-schedule-label">{t('profileEntrepreneur.minimumPayout')}</span>
                              <span className="ep-schedule-value">{t('profileEntrepreneur.noMinimum')}</span>
                            </div>
                            <p className="ep-schedule-note">
                              {t('profileEntrepreneur.payoutScheduleNote')}
                            </p>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="ep-payouts-error">
                        <AlertCircle size={48} />
                        <p>{t('profileEntrepreneur.couldNotLoadEarnings')}</p>
                        <button className="ep-btn ep-btn-secondary" onClick={fetchPayoutsSummary}>
                          {t('profileEntrepreneur.tryAgain')}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <>
                <div className="ep-content-header">
                  <div className="ep-content-header-left">
                    <h2>{t('profileEntrepreneur.accountSettings')}</h2>
                    <p>{t('profileEntrepreneur.manageSecurityPreferences')}</p>
                  </div>
                </div>

                {/* Language Settings */}
                <div className="ep-settings-section">
                  <div className="ep-settings-card">
                    <div className="ep-settings-card-header">
                      <div className="ep-settings-icon">
                        <Globe size={20} />
                      </div>
                      <div className="ep-settings-info">
                        <h3>{t('profileEntrepreneur.languagePreferences')}</h3>
                        <p>{t('profileEntrepreneur.selectLanguage')}</p>
                      </div>
                    </div>
                    <div className="ep-language-options">
                      {Object.values(languages).map((lang) => (
                        <button
                          key={lang.code}
                          className={`ep-language-option ${language === lang.code ? 'active' : ''}`}
                          onClick={() => changeLanguage(lang.code)}
                        >
                          <span className="ep-language-flag">{lang.flag}</span>
                          <div className="ep-language-details">
                            <span className="ep-language-name">{lang.name}</span>
                            <span className="ep-language-native">{lang.nativeName}</span>
                          </div>
                          {language === lang.code && (
                            <Check size={18} className="ep-language-check" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Security Settings */}
                <div className="ep-settings-section">
                  <div className="ep-settings-card">
                    <div className="ep-settings-card-header">
                      <div className="ep-settings-icon">
                        <Key size={20} />
                      </div>
                      <div className="ep-settings-info">
                        <h3>{t('profileEntrepreneur.changePassword')}</h3>
                        <p>{t('profileEntrepreneur.updatePasswordDesc')}</p>
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
                        <label>{t('profileEntrepreneur.currentPassword')}</label>
                        <div className="ep-input-wrapper">
                          <input
                            type={showPasswords.current ? 'text' : 'password'}
                            name="currentPassword"
                            value={passwordForm.currentPassword}
                            onChange={handlePasswordInputChange}
                            placeholder={t('profileEntrepreneur.currentPassword')}
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
                        <label>{t('profileEntrepreneur.newPassword')}</label>
                        <div className="ep-input-wrapper">
                          <input
                            type={showPasswords.new ? 'text' : 'password'}
                            name="newPassword"
                            value={passwordForm.newPassword}
                            onChange={handlePasswordInputChange}
                            placeholder={t('profileEntrepreneur.newPassword')}
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
                        <label>{t('profileEntrepreneur.confirmNewPassword')}</label>
                        <div className="ep-input-wrapper">
                          <input
                            type={showPasswords.confirm ? 'text' : 'password'}
                            name="confirmPassword"
                            value={passwordForm.confirmPassword}
                            onChange={handlePasswordInputChange}
                            placeholder={t('profileEntrepreneur.confirmNewPassword')}
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
                          <span className="ep-input-error">{t('profileEntrepreneur.passwordsDoNotMatch')}</span>
                        )}
                      </div>

                      <div className="ep-form-actions">
                        <button
                          type="button"
                          className="ep-btn ep-btn-ghost"
                          onClick={() => setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })}
                          disabled={isChangingPassword}
                        >
                          {t('profileEntrepreneur.cancel')}
                        </button>
                        <button
                          type="submit"
                          className="ep-btn ep-btn-primary"
                          disabled={isChangingPassword}
                        >
                          {isChangingPassword ? (
                            <>
                              <span className="ep-spinner"></span>
                              {t('profileEntrepreneur.changingPassword')}
                            </>
                          ) : (
                            <>
                              <Lock size={16} />
                              {t('profileEntrepreneur.changePassword')}
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
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
