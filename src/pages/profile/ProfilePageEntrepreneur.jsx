import { useState, useEffect } from 'react';
import {
  Star, CheckCircle, Award, Briefcase, MapPin, Calendar, Mail, Phone, LogOut,
  MessageSquare, User, Upload, Camera, X, Crown, Check, Zap, Shield, Activity,
  DollarSign, FileText, ArrowUpCircle, AlertCircle, Lock, Eye, EyeOff, Key,
  BarChart3, Menu, Edit, ChevronDown, ChevronUp, Clock, Building, Receipt, Unlock, Settings, Globe
} from 'lucide-react';
import Nav from "../../components/Nav";
import '../../styles/entrepreneur/profilepageentrepreneur-modern.css';
import '../../styles/entrepreneur/subscriptionpage.css';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import EntrepreneurProfileSkeleton from '../../components/loading/EntrepreneurProfileSkeleton'
import SubscriptionPaymentForm from '../../components/SubscriptionPaymentModal'
import UpdatePaymentMethodModal from '../../components/UpdatePaymentMethodModal'
import '../../styles/entrepreneur/subscriptionmodal.css'
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
  const [showCancelConfirmModal, setShowCancelConfirmModal] = useState(false)
  const [isCancellingSubscription, setIsCancellingSubscription] = useState(false)
  const [showPaymentFailedModal, setShowPaymentFailedModal] = useState(false)
  const [showUpdatePaymentModal, setShowUpdatePaymentModal] = useState(false)
  const navigate = useNavigate();

  // Promo code states
  const [promoCode, setPromoCode] = useState('')
  const [isApplyingPromo, setIsApplyingPromo] = useState(false)
  const [promoError, setPromoError] = useState('')

  // Trial promo decision modal states
  const [showTrialPromoModal, setShowTrialPromoModal] = useState(false)
  const [trialPromoData, setTrialPromoData] = useState(null)
  const [isQueueingPromo, setIsQueueingPromo] = useState(false)
  const [isApplyingPromoNow, setIsApplyingPromoNow] = useState(false)
  const [queuedPromo, setQueuedPromo] = useState(null)

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


  // Billing history states
  const [billingHistory, setBillingHistory] = useState([])
  const [billingSummary, setBillingSummary] = useState(null)
  const [billingLoading, setBillingLoading] = useState(false)
  const [invoiceYear, setInvoiceYear] = useState(new Date().getFullYear())

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
    billing: t('profileEntrepreneur.billingHistory'),
    performance: t('profileEntrepreneur.performanceReviews'),
    settings: t('profileEntrepreneur.settings')
  }

  // Refresh subscription data from API (not just localStorage)
  // showModalOnFailure: only show the payment failed modal on initial page load, not after payment update
  const refreshSubscriptionData = async (showModalOnFailure = false) => {
    const uProf = localStorage.getItem('userProfile')
    if (!uProf) return
    const user = JSON.parse(uProf)
    try {
      const response = await fetch(`${API_BASE_URL}/api/payments/subscription`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${user.token}` }
      })
      if (response.ok) {
        const subscriptionData = await response.json()
        const sub = subscriptionData.subscription || {}
        setSubscription(sub)
        const updatedProfile = {
          ...user,
          entrepProfile: { ...user.entrepProfile, subscription: subscriptionData }
        }
        localStorage.setItem('userProfile', JSON.stringify(updatedProfile))
        setUserProfile(updatedProfile)
        // Only auto-show payment failed modal on initial page load
        if (showModalOnFailure && sub.status === 'past_due') {
          setShowPaymentFailedModal(true)
        }
      }
    } catch (error) {
      console.error('Error refreshing subscription:', error)
    }
  }

  useEffect(() => {
    fetchEntreprenuerProfile()
    fetchQueuedPromo()
    refreshSubscriptionData(true)

    const uProfile = localStorage.getItem('userProfile')
    if (uProfile) {
      const u = JSON.parse(uProfile)
      setUserProfile(u)
      if (u.entrepProfile && u.entrepProfile.subscription) {
        setSubscription(u.entrepProfile.subscription.subscription || {})
      }
    }
  }, [])

  // Subscription helper functions
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "N/A";
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

  const generateAnnualInvoice = (year) => {
    const yearPayments = billingHistory.filter(p => {
      const paymentYear = new Date(p.date).getFullYear();
      return paymentYear === year && (p.status === 'active' || p.status === 'succeeded' || p.status === 'trialing');
    });

    if (yearPayments.length === 0) {
      toast.error(t('profileEntrepreneur.noPaymentsForYear'));
      return;
    }

    const totalAmount = yearPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const companyName = profile.companyName || '';
    const companyAddress = profile.address || '';
    const licenseNum = profile.licenseNumber || '';
    const invoiceDate = new Date().toLocaleDateString(language === 'fr' ? 'fr-CA' : 'en-CA');
    const invoiceNumber = `INV-${year}-${Date.now().toString(36).toUpperCase()}`;

    const rows = yearPayments.map(p => {
      const date = new Date(p.date).toLocaleDateString(language === 'fr' ? 'fr-CA' : 'en-CA');
      const desc = p.type === 'subscription'
        ? `${p.description}`
        : `${p.description}`;
      return `<tr>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">${date}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">${desc}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">${p.type === 'subscription' ? t('profileEntrepreneur.subscriptionPayments') : t('profileEntrepreneur.budgetUnlocks')}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600;">$${p.amount?.toFixed(2)}</td>
      </tr>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<title>${t('profileEntrepreneur.annualInvoice')} ${year}</title>
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;margin:0;padding:40px;color:#1a1a2e;font-size:14px;}
  .invoice-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:40px;padding-bottom:20px;border-bottom:3px solid #00A5A9;}
  .company-name{font-size:24px;font-weight:700;color:#00A5A9;margin:0 0 4px 0;}
  .invoice-title{font-size:28px;font-weight:700;color:#1a1a2e;text-align:right;}
  .invoice-meta{text-align:right;color:#5a6c7d;font-size:13px;line-height:1.6;}
  .section-title{font-size:16px;font-weight:600;color:#1a1a2e;margin:30px 0 12px;padding-bottom:8px;border-bottom:1px solid #e5e7eb;}
  .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:30px;}
  .info-block{background:#f8fafc;padding:16px;border-radius:8px;}
  .info-label{font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#7f8c8d;margin-bottom:4px;}
  .info-value{font-size:14px;font-weight:500;color:#1a1a2e;}
  table{width:100%;border-collapse:collapse;margin:16px 0;}
  th{background:#f1f5f9;padding:10px 12px;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;color:#5a6c7d;border-bottom:2px solid #e5e7eb;}
  th:last-child{text-align:right;}
  .total-row{background:#f0fdfa;}
  .total-row td{padding:14px 12px;font-weight:700;font-size:16px;border-top:2px solid #00A5A9;}
  .footer{margin-top:40px;padding-top:20px;border-top:1px solid #e5e7eb;text-align:center;color:#7f8c8d;font-size:12px;}
  @media print{body{padding:20px;} .no-print{display:none;}}
</style>
</head><body>
<div class="no-print" style="text-align:center;margin-bottom:20px;">
  <button onclick="window.print()" style="background:#00A5A9;color:#fff;border:none;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">
    ${t('profileEntrepreneur.printSaveAsPDF')}
  </button>
</div>
<div class="invoice-header">
  <div>
    <h1 class="company-name">${companyName}</h1>
    <div style="color:#5a6c7d;font-size:13px;line-height:1.6;">
      ${companyAddress ? companyAddress + '<br>' : ''}
      ${licenseNum ? t('profileEntrepreneur.licenseNumber') + ': ' + licenseNum : ''}
    </div>
  </div>
  <div>
    <div class="invoice-title">${t('profileEntrepreneur.annualInvoice').toUpperCase()}</div>
    <div class="invoice-meta">
      ${t('profileEntrepreneur.invoiceNumber')}: ${invoiceNumber}<br>
      ${t('profileEntrepreneur.invoiceDate')}: ${invoiceDate}<br>
      ${t('profileEntrepreneur.fiscalYear')}: ${year}
    </div>
  </div>
</div>
<div class="info-grid">
  <div class="info-block">
    <div class="info-label">${t('profileEntrepreneur.totalPayments')}</div>
    <div class="info-value">${yearPayments.length}</div>
  </div>
  <div class="info-block">
    <div class="info-label">${t('profileEntrepreneur.totalAmountPaid')}</div>
    <div class="info-value" style="color:#00A5A9;font-size:18px;">$${totalAmount.toFixed(2)} CAD</div>
  </div>
</div>
<div class="section-title">${t('profileEntrepreneur.paymentDetails')}</div>
<table>
  <thead><tr>
    <th>${t('profileEntrepreneur.date')}</th>
    <th>${t('profileEntrepreneur.description')}</th>
    <th>${t('profileEntrepreneur.paymentType')}</th>
    <th style="text-align:right">${t('profileEntrepreneur.amount')}</th>
  </tr></thead>
  <tbody>
    ${rows}
    <tr class="total-row">
      <td colspan="3">${t('profileEntrepreneur.totalForYear')} ${year}</td>
      <td style="text-align:right;color:#00A5A9;">$${totalAmount.toFixed(2)} CAD</td>
    </tr>
  </tbody>
</table>
<div class="footer">
  <p>${t('profileEntrepreneur.invoiceFooterNote')}</p>
  <p style="margin-top:8px;">InterVos Construction Platform &bull; ${invoiceDate}</p>
</div>
</body></html>`;

    const invoiceWindow = window.open('', '_blank');
    invoiceWindow.document.write(html);
    invoiceWindow.document.close();
  }

  const specializationOptions = [
    'Electrical', 'Plumbing', 'Carpentry', 'Masonry', 'Roofing', 'HVAC',
    'Painting', 'Drywall', 'Flooring', 'Concrete Work', 'Demolition', 'Excavation',
    'Foundation Work', 'Framing', 'Steel Erection', 'Siding Installation',
    'Waterproofing', 'Glazing/Windows', 'Landscaping', 'Paving/Asphalt',
    'Tile Work', 'Insulation', 'Cabinetry', 'Fire Protection', 'Solar Installation',
    'Welding', 'General Contracting'
  ];

  const [otherSpecialization, setOtherSpecialization] = useState('');

  useEffect(() => {
    if (isEditModalOpen) {
      const knownSpecs = profile.specializations?.filter(s => specializationOptions.includes(s)) || [];
      const customSpecs = profile.specializations?.filter(s => !specializationOptions.includes(s)) || [];
      setFormData({
        company_name: profile.companyName,
        license_number: profile.licenseNumber,
        years_in_business: profile.yearsInBusiness,
        num_employees: profile.numEmployees,
        address: profile.address,
        phone: profile.phone,
        email: profile.email,
        specializations: knownSpecs
      });
      setOtherSpecialization(customSpecs.join(', '));
    }
  }, [isEditModalOpen, profile]);

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
            specializations: [
              ...formData.specializations,
              ...otherSpecialization.split(',').map(s => s.trim()).filter(s => s.length > 0)
            ]
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

  const handleCancelSubscription = async () => {
    setIsCancellingSubscription(true)
    try {
      const uProf = localStorage.getItem('userProfile')
      if (!uProf) {
        throw new Error('Please login again')
      }

      const user = JSON.parse(uProf)
      const response = await fetch(`${API_BASE_URL}/api/payments/cancel-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to cancel subscription')
      }

      // Refresh subscription data
      const subResponse = await fetch(`${API_BASE_URL}/api/payments/subscription`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      })

      if (subResponse.ok) {
        const subscriptionData = await subResponse.json()
        setSubscription(subscriptionData.subscription || {})

        const updatedProfile = {
          ...user,
          entrepProfile: {
            ...user.entrepProfile,
            subscription: subscriptionData,
          },
        }
        localStorage.setItem('userProfile', JSON.stringify(updatedProfile))
        setUserProfile(updatedProfile)
      }

      setShowCancelConfirmModal(false)
      setShowPlansModal(false)
      toast.success(t('profileEntrepreneur.subscriptionCancelled') || 'Subscription cancelled successfully')
    } catch (error) {
      console.error('Error cancelling subscription:', error)
      toast.error(error.message || t('profileEntrepreneur.failedCancelSubscription') || 'Failed to cancel subscription')
    } finally {
      setIsCancellingSubscription(false)
    }
  }

  // Promo code handler
  const handleApplyPromoCode = async () => {
    if (!promoCode.trim()) {
      setPromoError(t('profileEntrepreneur.enterPromoCode') || 'Please enter a promo code')
      return
    }

    setIsApplyingPromo(true)
    setPromoError('')

    try {
      const uProf = localStorage.getItem('userProfile')
      if (!uProf) {
        throw new Error('Please login again')
      }

      const user = JSON.parse(uProf)
      const response = await fetch(`${API_BASE_URL}/api/payments/create-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          promo_code: promoCode.toUpperCase().trim()
        })
      })

      const data = await response.json()

      // Handle trial decision required
      if (data.requires_trial_decision) {
        setTrialPromoData(data)
        setShowTrialPromoModal(true)
        setIsApplyingPromo(false)
        return
      }

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Invalid promo code')
      }

      // Update subscription state
      if (data.subscription) {
        setSubscription(data.subscription)

        const updatedProfile = {
          ...user,
          entrepProfile: {
            ...user.entrepProfile,
            subscription: {
              hasSubscription: true,
              subscription: data.subscription,
            },
          },
        }
        localStorage.setItem('userProfile', JSON.stringify(updatedProfile))
        setUserProfile(updatedProfile)
      }

      setPromoCode('')
      toast.success(t('profileEntrepreneur.promoCodeApplied') || 'Promo code applied successfully!')

      // Reload the page to refresh all subscription data
      window.location.reload()
    } catch (error) {
      console.error('Error applying promo code:', error)
      setPromoError(error.message || t('profileEntrepreneur.invalidPromoCode') || 'Invalid promo code')
    } finally {
      setIsApplyingPromo(false)
    }
  }

  // Queue promo code for after trial
  const handleQueuePromoCode = async () => {
    if (!trialPromoData) return

    setIsQueueingPromo(true)

    try {
      const uProf = localStorage.getItem('userProfile')
      if (!uProf) throw new Error('Please login again')

      const user = JSON.parse(uProf)
      const response = await fetch(`${API_BASE_URL}/api/payments/queue-promo-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          promo_code: trialPromoData.promo_code,
          promo_code_id: trialPromoData.promo_code_id
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to queue promo code')
      }

      setQueuedPromo({
        code: trialPromoData.promo_code,
        will_apply_on: trialPromoData.trial_info.trial_end
      })

      setShowTrialPromoModal(false)
      setTrialPromoData(null)
      setPromoCode('')
      toast.success(data.message || t('profileEntrepreneur.promoQueued') || 'Promo code queued for after your trial!')

    } catch (error) {
      console.error('Error queuing promo code:', error)
      toast.error(error.message || 'Failed to queue promo code')
    } finally {
      setIsQueueingPromo(false)
    }
  }

  // Apply promo code now (cancel trial)
  const handleApplyPromoNow = async () => {
    if (!trialPromoData) return

    setIsApplyingPromoNow(true)

    try {
      const uProf = localStorage.getItem('userProfile')
      if (!uProf) throw new Error('Please login again')

      const user = JSON.parse(uProf)
      const response = await fetch(`${API_BASE_URL}/api/payments/apply-promo-now`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          promo_code: trialPromoData.promo_code
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to apply promo code')
      }

      // Update subscription state
      if (data.subscription) {
        setSubscription(data.subscription)

        const updatedProfile = {
          ...user,
          entrepProfile: {
            ...user.entrepProfile,
            subscription: {
              hasSubscription: true,
              subscription: data.subscription,
            },
          },
        }
        localStorage.setItem('userProfile', JSON.stringify(updatedProfile))
        setUserProfile(updatedProfile)
      }

      setShowTrialPromoModal(false)
      setTrialPromoData(null)
      setPromoCode('')
      toast.success(data.message || t('profileEntrepreneur.promoAppliedNow') || 'Promo code applied! You now have free premium access.')

      // Reload the page to refresh all subscription data
      window.location.reload()

    } catch (error) {
      console.error('Error applying promo code now:', error)
      toast.error(error.message || 'Failed to apply promo code')
    } finally {
      setIsApplyingPromoNow(false)
    }
  }

  // Fetch queued promo on mount
  const fetchQueuedPromo = async () => {
    try {
      const uProf = localStorage.getItem('userProfile')
      if (!uProf) return

      const user = JSON.parse(uProf)
      const response = await fetch(`${API_BASE_URL}/api/payments/queued-promo`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      })

      const data = await response.json()

      if (data.has_queued_promo) {
        setQueuedPromo(data.queued_promo)
      }
    } catch (error) {
      console.error('Error fetching queued promo:', error)
    }
  }

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
                title={t('profileEntrepreneur.editProfile')}
              >
                <Edit size={18} />
              </button>
            )}
            <button
              className="ep-mobile-action-btn ep-mobile-logout-btn"
              onClick={handleLogout}
              title={t('profileEntrepreneur.logout')}
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

                      {/* Promo Code Section */}
                      <div className="no-sub-promo-section">
                        <div className="promo-divider">
                          <span>{t('profileEntrepreneur.orUsePromoCode') || 'or use a promo code'}</span>
                        </div>
                        <div className="no-sub-promo-input-wrapper">
                          <input
                            type="text"
                            className={`no-sub-promo-input ${promoError ? 'error' : ''}`}
                            placeholder={t('profileEntrepreneur.enterCodePlaceholder') || 'Enter promo code...'}
                            value={promoCode}
                            onChange={(e) => {
                              setPromoCode(e.target.value.toUpperCase())
                              setPromoError('')
                            }}
                            onKeyPress={(e) => e.key === 'Enter' && handleApplyPromoCode()}
                            disabled={isApplyingPromo}
                          />
                          <button
                            className="no-sub-apply-btn"
                            onClick={handleApplyPromoCode}
                            disabled={isApplyingPromo || !promoCode.trim()}
                          >
                            {isApplyingPromo ? (
                              <span className="spinner-small"></span>
                            ) : (
                              t('profileEntrepreneur.apply') || 'Apply'
                            )}
                          </button>
                        </div>
                        {promoError && (
                          <div className="no-sub-promo-error">
                            <AlertCircle size={14} />
                            {promoError}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Payment Failed / Trial Expired Banner */}
                    {subscription.status === 'past_due' && (
                      <div className="status-banner payment-failed-banner">
                        <div className="banner-content">
                          <div className="banner-icon-wrapper payment-failed">
                            <AlertCircle size={28} />
                          </div>
                          <div className="banner-info">
                            <div className="banner-header">
                              <h3 className="banner-title">
                                {t('profileEntrepreneur.paymentFailedTitle') || 'Payment Failed'}
                              </h3>
                              <div className="trial-badge cancelled">
                                {t('profileEntrepreneur.actionRequired') || 'Action Required'}
                              </div>
                            </div>
                            <p className="banner-text">
                              {t('profileEntrepreneur.paymentFailedDesc') || 'Your trial has ended and we were unable to charge your card. Please update your payment method to continue your subscription.'}
                            </p>
                          </div>
                          <button
                            className="banner-action-btn"
                            onClick={() => setShowUpdatePaymentModal(true)}
                          >
                            <Lock size={18} />
                            {t('profileEntrepreneur.updatePaymentMethod') || 'Update Payment Method'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Trial Banner */}
                    {subscription.is_trial && getTrialInfo() && (
                      <div className={`status-banner trial-banner ${subscription.cancel_at_period_end ? 'trial-cancelled' : ''}`}>
                        <div className="banner-content">
                          <div className="banner-icon-wrapper">
                            {subscription.cancel_at_period_end ? <X size={28} /> : <Zap size={28} />}
                          </div>
                          <div className="banner-info">
                            <div className="banner-header">
                              <h3 className="banner-title">
                                {subscription.cancel_at_period_end
                                  ? t('profileEntrepreneur.trialCancelled') || 'Trial Cancelled'
                                  : t('profileEntrepreneur.premiumTrialActive')}
                              </h3>
                              <div className={`trial-badge ${subscription.cancel_at_period_end ? 'cancelled' : ''}`}>
                                {subscription.cancel_at_period_end
                                  ? t('profileEntrepreneur.cancelled') || 'Cancelled'
                                  : t('profileEntrepreneur.trialPeriod')}
                              </div>
                            </div>
                            <p className="banner-text">
                              {subscription.cancel_at_period_end
                                ? (t('profileEntrepreneur.trialEndsIn') || 'Trial ends in') + ' ' + getTrialInfo().daysRemaining + ' ' + (getTrialInfo().daysRemaining === 1 ? t('profileEntrepreneur.day') : t('profileEntrepreneur.days'))
                                : getTrialInfo().daysRemaining + ' ' + (getTrialInfo().daysRemaining === 1 ? t('profileEntrepreneur.day') : t('profileEntrepreneur.days')) + ' ' + t('profileEntrepreneur.remaining')}
                            </p>
                            <p className="banner-subtext">
                              {subscription.cancel_at_period_end
                                ? (t('profileEntrepreneur.noChargeConfirm') || 'You will not be charged')
                                : t('profileEntrepreneur.trialEndsOn') + ' ' + formatDate(subscription.trial_end)}
                            </p>
                            <div className={`trial-progress-bar ${subscription.cancel_at_period_end ? 'cancelled' : ''}`}>
                              <div
                                className="trial-progress-fill"
                                style={{ width: `${getTrialInfo().percentage}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className="trial-countdown">
                            <div className="countdown-number">{getTrialInfo().daysRemaining}</div>
                            <div className="countdown-label">
                              {subscription.cancel_at_period_end
                                ? t('profileEntrepreneur.daysLeft') || 'Days Left'
                                : t('profileEntrepreneur.daysLeft')}
                            </div>
                          </div>
                        </div>
                        {/* Queued Promo Code Display */}
                        {queuedPromo && (
                          <div className="queued-promo-banner">
                            <div className="queued-promo-content">
                              <div className="queued-promo-icon">
                                <CheckCircle size={18} />
                              </div>
                              <div className="queued-promo-info">
                                <span className="queued-promo-label">
                                  {t('profileEntrepreneur.promoQueued') || 'Promo Code Queued:'}
                                </span>
                                <code className="queued-promo-code">{queuedPromo.code}</code>
                                <span className="queued-promo-note">
                                  {t('profileEntrepreneur.willApplyAfterTrial') || 'Will apply automatically after your trial ends'}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
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
                              <div className={`status-indicator ${subscription.status === 'past_due' ? 'past-due' : subscription.cancel_at_period_end ? 'cancelling' : 'active'}`}>
                                <span className="status-dot"></span>
                                {subscription.status === 'past_due'
                                  ? t('profileEntrepreneur.pastDue') || 'Past Due'
                                  : subscription.cancel_at_period_end
                                    ? t('profileEntrepreneur.cancelling') || 'Cancelling'
                                    : t('profileEntrepreneur.active')}
                              </div>
                            </div>
                            <h2 className="plan-name">{subscription.plan_type === 'premium' ? t('profileEntrepreneur.premiumPlan') : t('profileEntrepreneur.basicPlan')}</h2>
                            <p className="plan-desc">
                              {subscription.cancel_at_period_end
                                ? t('profileEntrepreneur.subscriptionEndsOn') || 'Your subscription will end on'
                                : subscription.plan_type === 'premium' ? t('profileEntrepreneur.bestForProfessionals') : t('profileEntrepreneur.perfectForGettingStarted')}
                              {subscription.cancel_at_period_end && ` ${formatDate(subscription.current_period_end)}`}
                            </p>
                            {!subscription.cancel_at_period_end && (
                              subscription.is_free_access ? (
                                <div className="promo-activated-section">
                                  <div className="promo-activated-badge">
                                    <span>{t('profileEntrepreneur.promoCodeActivated') || 'Promoters Code Activated'}</span>
                                  </div>
                                  <p className="promo-using-features">
                                    {t('profileEntrepreneur.usingPremiumFeatures') || "You're currently using Premium features"}
                                  </p>
                                  <p className="promo-original-price">
                                    {t('profileEntrepreneur.originalPrice') || 'Original price:'} ${subscription.plan_type === 'premium' ? '429' : '250'}/{t('profileEntrepreneur.month') || 'month'}
                                  </p>
                                </div>
                              ) : (
                                <div className="plan-price">
                                  <span className="price-symbol">$</span>
                                  <span className="price-value">{subscription.plan_type === 'premium' ? 429 : 250}</span>
                                  <span className="price-period">{t('profileEntrepreneur.month')}</span>
                                </div>
                              )
                            )}
                          </div>

                          <div className="billing-timeline-card">
                            <div className="card-header">
                              <div className="card-icon">
                                <Calendar size={24} />
                              </div>
                              <h3 className="card-title">{subscription.cancel_at_period_end ? t('profileEntrepreneur.subscriptionEndDate') || 'Subscription End' : t('profileEntrepreneur.billingCycle')}</h3>
                            </div>
                            <div className="timeline-content">
                              <div className="timeline-dates">
                                <div className="date-item">
                                  <span className="date-label">{t('profileEntrepreneur.started')}</span>
                                  <span className="date-value">{formatDate(subscription.current_period_start || subscription.start_date || subscription.start || subscription.created_at)}</span>
                                </div>
                                <div className="date-item">
                                  <span className="date-label">{subscription.cancel_at_period_end ? t('profileEntrepreneur.endsOn') || 'Ends On' : t('profileEntrepreneur.nextBilling')}</span>
                                  <span className="date-value">{formatDate(subscription.current_period_end)}</span>
                                </div>
                              </div>
                              {getSubscriptionDuration() && (
                                <div className="timeline-progress">
                                  <div className="progress-bar-container">
                                    <div
                                      className={`progress-bar-fill ${subscription.cancel_at_period_end ? 'cancelling' : ''}`}
                                      style={{ width: `${getSubscriptionDuration().percentage}%` }}
                                    ></div>
                                  </div>
                                  <div className="progress-info">
                                    <span className="progress-text">
                                      {getSubscriptionDuration().daysRemaining} {subscription.cancel_at_period_end
                                        ? t('profileEntrepreneur.daysUntilEnd') || 'days until subscription ends'
                                        : t('profileEntrepreneur.daysUntilRenewal')}
                                    </span>
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

                    {/* Promo Code Section - Show only if no active paid subscription */}
                    {(!subscription.plan_type || subscription.is_trial) && (
                      <div className="promo-code-section">
                        <div className="promo-code-card">
                          <div className="promo-code-header">
                            <div className="promo-icon">
                              <Zap size={24} />
                            </div>
                            <div className="promo-text">
                              <h3>{t('profileEntrepreneur.havePromoCode') || 'Have a Promo Code?'}</h3>
                              <p>{t('profileEntrepreneur.enterPromoCodeDesc') || 'Enter your code to activate free access or get a discount'}</p>
                            </div>
                          </div>
                          <div className="promo-code-input-wrapper">
                            <input
                              type="text"
                              className={`promo-code-input ${promoError ? 'error' : ''}`}
                              placeholder={t('profileEntrepreneur.enterCodePlaceholder') || 'Enter promo code...'}
                              value={promoCode}
                              onChange={(e) => {
                                setPromoCode(e.target.value.toUpperCase())
                                setPromoError('')
                              }}
                              onKeyPress={(e) => e.key === 'Enter' && handleApplyPromoCode()}
                              disabled={isApplyingPromo}
                            />
                            <button
                              className="apply-promo-btn"
                              onClick={handleApplyPromoCode}
                              disabled={isApplyingPromo || !promoCode.trim()}
                            >
                              {isApplyingPromo ? (
                                <span className="spinner-small"></span>
                              ) : (
                                <>
                                  <CheckCircle size={18} />
                                  {t('profileEntrepreneur.apply') || 'Apply'}
                                </>
                              )}
                            </button>
                          </div>
                          {promoError && (
                            <div className="promo-error">
                              <AlertCircle size={14} />
                              {promoError}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

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
                  <div className="ep-billing-actions">
                    <button
                      className="ep-btn ep-btn-secondary"
                      onClick={fetchBillingHistory}
                      disabled={billingLoading}
                    >
                      {billingLoading ? t('common.loading') : t('profileEntrepreneur.refreshBilling')}
                    </button>
                    <div className="ep-invoice-group">
                      <select
                        className="ep-invoice-year-select"
                        value={invoiceYear}
                        onChange={(e) => setInvoiceYear(parseInt(e.target.value))}
                      >
                        {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                      <button
                        className="ep-btn ep-btn-invoice"
                        onClick={() => generateAnnualInvoice(invoiceYear)}
                        disabled={billingLoading || billingHistory.length === 0}
                      >
                        <Receipt size={16} />
                        {t('profileEntrepreneur.generateInvoice')}
                      </button>
                    </div>
                  </div>
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
                            <span className="ep-language-name">{lang.nativeName}</span>
                            <span className="ep-language-native">{t(`profileEntrepreneur.language${lang.code === 'en' ? 'English' : 'French'}`)}</span>
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
                <h2 className="edit-modal-title">{t('profileEntrepreneur.editCompanyProfile')}</h2>
                <p className="edit-modal-subtitle">{t('profileEntrepreneur.updateBusinessInfo')}</p>
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
                  <span>{t('profileEntrepreneur.companyLogoProfilePicture')}</span>
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
                        <span>{t('profileEntrepreneur.noImage')}</span>
                      </div>
                    )}
                  </div>
                  <div className="edit-image-actions">
                    <label className="edit-upload-btn">
                      <Upload size={18} />
                      {profileImage ? t('profileEntrepreneur.changeImage') : t('profileEntrepreneur.uploadImage')}
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
                        {t('profileEntrepreneur.remove')}
                      </button>
                    )}
                  </div>
                  <p className="edit-image-hint">{t('profileEntrepreneur.imageHint')}</p>
                </div>
              </div>

              {/* Company Information Section */}
              <div className="edit-section">
                <div className="edit-section-header">
                  <Briefcase size={18} className="edit-section-icon" />
                  <span>{t('profileEntrepreneur.companyInformation')}</span>
                </div>

                <div className="edit-form-group">
                  <label className="edit-form-label">
                    <Briefcase size={14} />
                    {t('profileEntrepreneur.companyNameLabel')} <span className="edit-required">*</span>
                  </label>
                  <input
                    type="text"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleInputChange}
                    className="edit-form-input"
                    placeholder={t('profileEntrepreneur.enterCompanyName')}
                  />
                </div>

                <div className="edit-form-group">
                  <label className="edit-form-label">
                    <Award size={14} />
                    {t('profileEntrepreneur.licenseNumberLabel')} <span className="edit-required">*</span>
                  </label>
                  <input
                    type="text"
                    name="license_number"
                    value={formData.license_number}
                    onChange={handleInputChange}
                    className="edit-form-input"
                    placeholder={t('profileEntrepreneur.enterLicenseNumber')}
                  />
                </div>

                <div className="edit-form-row">
                  <div className="edit-form-group">
                    <label className="edit-form-label">
                      <Calendar size={14} />
                      {t('profileEntrepreneur.yearsInBusinessLabel')} <span className="edit-required">*</span>
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
                      {t('profileEntrepreneur.numberOfEmployeesLabel')} <span className="edit-required">*</span>
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
                  <span>{t('profileEntrepreneur.contactInformation')}</span>
                </div>

                <div className="edit-form-row">
                  <div className="edit-form-group">
                    <label className="edit-form-label">
                      <Phone size={14} />
                      {t('profileEntrepreneur.phoneNumber')}
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
                      {t('profileEntrepreneur.emailAddress')}
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
                    {t('profileEntrepreneur.businessAddress')} <span className="edit-required">*</span>
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="edit-form-textarea"
                    placeholder={t('profileEntrepreneur.enterBusinessAddress')}
                    rows="3"
                  />
                </div>
              </div>

              {/* Specializations Section */}
              <div className="edit-section">
                <div className="edit-section-header">
                  <CheckCircle size={18} className="edit-section-icon" />
                  <span>{t('profileEntrepreneur.specializations')}</span>
                  <span className="edit-selected-count">
                    {formData.specializations.length} {t('profileEntrepreneur.selected')}
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
                <div className="edit-other-specialization">
                  <label className="edit-form-label">
                    <Edit size={14} />
                    {t('profileEntrepreneur.otherSpecialization')}
                  </label>
                  <input
                    type="text"
                    value={otherSpecialization}
                    onChange={(e) => setOtherSpecialization(e.target.value)}
                    className="edit-form-input"
                    placeholder={t('profileEntrepreneur.otherSpecializationPlaceholder')}
                  />
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
                  {t('profileEntrepreneur.cancel')}
                </button>
                <button
                  onClick={handleSubmit}
                  className="edit-submit-btn"
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <>
                      <span className="edit-spinner"></span>
                      {isUploadingImage ? t('profileEntrepreneur.uploadingImage') : t('profileEntrepreneur.saving')}
                    </>
                  ) : (
                    <>
                      <Check size={18} />
                      {t('profileEntrepreneur.saveChanges')}
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
                <h2>{t('profileEntrepreneur.subscriptionPlans')}</h2>
                <p className="subtitle">
                  {subscription.plan_type
                    ? `${t('profileEntrepreneur.currentPlan')}: ${subscription.plan_type === 'premium' ? t('profileEntrepreneur.premiumPlan') : t('profileEntrepreneur.basicPlan')}`
                    : t('profileEntrepreneur.selectPlanMessage')}
                </p>
              </div>
            </div>

            <div className="plans-container">
              {/* Basic Plan */}
              <div className={`plan-card ${subscription.plan_type === 'basic' ? 'current-plan' : ''}`}>
                {subscription.plan_type === 'basic' && (
                  <div className="current-plan-badge">{t('profileEntrepreneur.currentPlan')}</div>
                )}
                <div className="plan-header">
                  <div className="plan-label">{t('profileEntrepreneur.basicPlan')}</div>
                  <div className="price">
                    <span className="currency">$</span>
                    <span className="amount">250</span>
                    <span className="period">{t('profileEntrepreneur.month')}</span>
                  </div>
                  <div className="plan-description">
                    {t('profileEntrepreneur.essentialFeatures')}
                  </div>
                </div>

                <ul className="features-list">
                  <li className="feature-item">
                    <svg width="16" height="16" viewBox="0 0 20 20" className="feature-icon">
                      <circle cx="10" cy="10" r="10" fill="#2ECC71"/>
                      <path d="M6 10l3 3 5-6" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>{t('profileEntrepreneur.browseViewJobs')}</span>
                  </li>
                  <li className="feature-item">
                    <svg width="16" height="16" viewBox="0 0 20 20" className="feature-icon">
                      <circle cx="10" cy="10" r="10" fill="#2ECC71"/>
                      <path d="M6 10l3 3 5-6" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>{t('profileEntrepreneur.submitUpTo30Bids')}</span>
                  </li>
                  <li className="feature-item">
                    <svg width="16" height="16" viewBox="0 0 20 20" className="feature-icon">
                      <circle cx="10" cy="10" r="10" fill="#2ECC71"/>
                      <path d="M6 10l3 3 5-6" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>{t('profileEntrepreneur.unlockBudgets')}</span>
                  </li>
                  <li className="feature-item">
                    <svg width="16" height="16" viewBox="0 0 20 20" className="feature-icon">
                      <circle cx="10" cy="10" r="10" fill="#2ECC71"/>
                      <path d="M6 10l3 3 5-6" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>{t('profileEntrepreneur.messageApprovedContacts')}</span>
                  </li>
                </ul>

                <button
                  className="cta-btn btn-basic"
                  onClick={() => handleSelectPlan('basic')}
                  disabled={subscription.plan_type === 'basic' || subscription.plan_type === 'premium'}
                >
                  {subscription.plan_type === 'basic' ? t('profileEntrepreneur.currentPlan') : subscription.plan_type === 'premium' ? t('profileEntrepreneur.unavailablePlan') : t('profileEntrepreneur.selectBasic')}
                </button>
              </div>

              {/* Premium Plan */}
              <div className={`plan-card premium ${subscription.plan_type === 'premium' ? 'current-plan' : ''}`}>
                {subscription.plan_type === 'premium' ? (
                  <div className="current-plan-badge">{t('profileEntrepreneur.currentPlan')}</div>
                ) : (
                  <div className="plan-badge">{t('profileEntrepreneur.recommended')}</div>
                )}

                <div className="plan-header">
                  <div className="plan-label">{t('profileEntrepreneur.premiumPlan')}</div>
                  <div className="price">
                    <span className="currency">$</span>
                    <span className="amount">429</span>
                    <span className="period">{t('profileEntrepreneur.month')}</span>
                  </div>
                  <div className="plan-description">
                    {t('profileEntrepreneur.unlimitedBidding')}
                  </div>
                </div>

                <ul className="features-list">
                  <li className="feature-item">
                    <svg width="16" height="16" viewBox="0 0 20 20" className="feature-icon">
                      <circle cx="10" cy="10" r="10" fill="#2ECC71"/>
                      <path d="M6 10l3 3 5-6" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>{t('profileEntrepreneur.browseViewJobs')}</span>
                  </li>
                  <li className="feature-item highlight">
                    <svg width="16" height="16" viewBox="0 0 20 20" className="feature-icon">
                      <circle cx="10" cy="10" r="10" fill="#00A5A9"/>
                      <path d="M6 10l3 3 5-6" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>{t('profileEntrepreneur.submitUnlimitedBids')}</span>
                  </li>
                  <li className="feature-item">
                    <svg width="16" height="16" viewBox="0 0 20 20" className="feature-icon">
                      <circle cx="10" cy="10" r="10" fill="#2ECC71"/>
                      <path d="M6 10l3 3 5-6" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>{t('profileEntrepreneur.unlockBudgets')}</span>
                  </li>
                  <li className="feature-item">
                    <svg width="16" height="16" viewBox="0 0 20 20" className="feature-icon">
                      <circle cx="10" cy="10" r="10" fill="#2ECC71"/>
                      <path d="M6 10l3 3 5-6" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>{t('profileEntrepreneur.messageApprovedContacts')}</span>
                  </li>
                  <li className="feature-item highlight">
                    <svg width="16" height="16" viewBox="0 0 20 20" className="feature-icon">
                      <circle cx="10" cy="10" r="10" fill="#00A5A9"/>
                      <path d="M6 10l3 3 5-6" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>{t('profileEntrepreneur.prioritySupport')}</span>
                  </li>
                </ul>

                <button
                  className="cta-btn btn-premium"
                  onClick={() => handleSelectPlan('premium')}
                  disabled={subscription.plan_type === 'premium'}
                >
                  {subscription.plan_type === 'premium' ? t('profileEntrepreneur.currentPlan') : t('profileEntrepreneur.upgradeToPremium')}
                </button>
              </div>
            </div>

            {/* Promo Code Section in View Plans Modal */}
            {!subscription.plan_type && (
              <div className="modal-promo-section">
                <div className="modal-promo-divider">
                  <span className="divider-text">{t('profileEntrepreneur.orUsePromoCode') || 'or use a promo code'}</span>
                </div>
                <div className="modal-promo-card">
                  <div className="modal-promo-header">
                    <Zap size={20} className="modal-promo-icon" />
                    <span className="modal-promo-title">{t('profileEntrepreneur.havePromoCode') || 'Have a Promo Code?'}</span>
                  </div>
                  <div className="modal-promo-input-wrapper">
                    <input
                      type="text"
                      className={`modal-promo-input ${promoError ? 'error' : ''}`}
                      placeholder={t('profileEntrepreneur.enterCodePlaceholder') || 'Enter promo code...'}
                      value={promoCode}
                      onChange={(e) => {
                        setPromoCode(e.target.value.toUpperCase())
                        setPromoError('')
                      }}
                      onKeyPress={(e) => e.key === 'Enter' && handleApplyPromoCode()}
                      disabled={isApplyingPromo}
                    />
                    <button
                      className="modal-promo-apply-btn"
                      onClick={handleApplyPromoCode}
                      disabled={isApplyingPromo || !promoCode.trim()}
                    >
                      {isApplyingPromo ? (
                        <span className="spinner-small"></span>
                      ) : (
                        t('profileEntrepreneur.apply') || 'Apply'
                      )}
                    </button>
                  </div>
                  {promoError && (
                    <div className="modal-promo-error">
                      <AlertCircle size={14} />
                      {promoError}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Cancel Subscription Button */}
            {(subscription.plan_type === 'basic' || subscription.plan_type === 'premium') && !subscription.cancel_at_period_end && subscription.status !== 'past_due' && (
              <div className="cancel-subscription-section">
                <button
                  className="cancel-subscription-btn"
                  onClick={() => setShowCancelConfirmModal(true)}
                >
                  <X size={16} />
                  {t('profileEntrepreneur.cancelSubscription') || 'Cancel Subscription'}
                </button>
              </div>
            )}

            {/* Subscription/Trial Cancelled Notice */}
            {subscription.cancel_at_period_end && (
              <div className="cancel-subscription-section">
                <div className={`subscription-cancelled-notice ${subscription.is_trial ? 'trial' : ''}`}>
                  {subscription.is_trial ? <Check size={16} /> : <AlertCircle size={16} />}
                  <span>
                    {subscription.is_trial
                      ? (t('profileEntrepreneur.trialCancelledNotice') || 'Your trial will end on') + ' ' + formatDate(subscription.trial_end || subscription.current_period_end) + '. ' + (t('profileEntrepreneur.noChargeConfirm') || 'You will not be charged.')
                      : (t('profileEntrepreneur.subscriptionCancelledNotice') || 'Your subscription is scheduled to end on') + ' ' + formatDate(subscription.current_period_end)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cancel Subscription Confirmation Modal */}
      {showCancelConfirmModal && (
        <div className="subscription-modal">
          <div className="modal-overlay" onClick={() => !isCancellingSubscription && setShowCancelConfirmModal(false)} />
          <div className="modal-content cancel-confirm-modal">
            <div className="cancel-confirm-header">
              <div className={`cancel-confirm-icon ${subscription.is_trial ? 'trial' : ''}`}>
                <AlertCircle size={48} />
              </div>
              <h2>
                {subscription.is_trial
                  ? t('profileEntrepreneur.cancelTrialTitle') || 'Cancel Trial?'
                  : t('profileEntrepreneur.cancelSubscriptionTitle') || 'Cancel Subscription?'}
              </h2>
              <p>
                {subscription.is_trial
                  ? t('profileEntrepreneur.cancelTrialDesc') || 'If you cancel now, you can still use premium features until your trial ends. You will NOT be charged.'
                  : t('profileEntrepreneur.cancelSubscriptionDesc') || 'Are you sure you want to cancel your subscription? You will lose access to all premium features at the end of your current billing period.'}
              </p>
              {subscription.is_trial && (
                <div className="cancel-trial-note">
                  <Check size={16} />
                  <span>{t('profileEntrepreneur.noChargeNote') || 'No payment will be taken'}</span>
                </div>
              )}
            </div>
            <div className="cancel-confirm-actions">
              <button
                className="cancel-confirm-btn cancel-confirm-no"
                onClick={() => setShowCancelConfirmModal(false)}
                disabled={isCancellingSubscription}
              >
                {subscription.is_trial
                  ? t('profileEntrepreneur.keepTrial') || 'Keep Trial'
                  : t('profileEntrepreneur.keepSubscription') || 'Keep Subscription'}
              </button>
              <button
                className="cancel-confirm-btn cancel-confirm-yes"
                onClick={handleCancelSubscription}
                disabled={isCancellingSubscription}
              >
                {isCancellingSubscription ? (
                  <>
                    <span className="ep-spinner"></span>
                    {t('profileEntrepreneur.cancelling') || 'Cancelling...'}
                  </>
                ) : (
                  <>
                    <X size={16} />
                    {t('profileEntrepreneur.yesCancel') || 'Yes, Cancel'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Failed Modal */}
      {showPaymentFailedModal && (
        <div className="subscription-modal">
          <div className="modal-overlay" onClick={() => setShowPaymentFailedModal(false)} />
          <div className="modal-content cancel-confirm-modal">
            <div className="cancel-confirm-header">
              <div className="cancel-confirm-icon payment-failed">
                <AlertCircle size={48} />
              </div>
              <h2>{t('profileEntrepreneur.paymentFailedTitle') || 'Payment Failed'}</h2>
              <p>
                {t('profileEntrepreneur.paymentFailedModalDesc') || 'Your trial period has ended and your card could not be charged. Please update your payment method to continue your subscription.'}
              </p>
            </div>
            <div className="cancel-confirm-actions">
              <button
                className="cancel-confirm-btn cancel-confirm-no"
                onClick={() => {
                  setShowPaymentFailedModal(false)
                  setShowUpdatePaymentModal(true)
                }}
              >
                <Lock size={16} />
                {t('profileEntrepreneur.updatePaymentMethod') || 'Update Payment Method'}
              </button>
              <button
                className="cancel-confirm-btn cancel-confirm-yes"
                style={{ background: '#6b7280' }}
                onClick={() => setShowPaymentFailedModal(false)}
              >
                {t('profileEntrepreneur.dismissModal') || 'Dismiss'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Payment Method Modal */}
      {showUpdatePaymentModal && userProfile && (
        <UpdatePaymentMethodModal
          token={userProfile.token}
          onClose={() => setShowUpdatePaymentModal(false)}
          onSuccess={() => {
            refreshSubscriptionData()
            toast.success(t('profileEntrepreneur.paymentMethodUpdated') || 'Payment method updated! Your subscription has been restored.')
          }}
        />
      )}

      {/* Trial Promo Decision Modal */}
      {showTrialPromoModal && trialPromoData && (
        <div className="subscription-modal">
          <div className="modal-overlay" onClick={() => !isQueueingPromo && !isApplyingPromoNow && setShowTrialPromoModal(false)} />
          <div className="modal-content trial-promo-modal">
            <button
              className="modal-close-btn"
              onClick={() => setShowTrialPromoModal(false)}
              disabled={isQueueingPromo || isApplyingPromoNow}
            >
              <X size={24} />
            </button>

            <div className="trial-promo-header">
              <div className="trial-promo-icon">
                <Zap size={48} />
              </div>
              <h2>{t('profileEntrepreneur.promoCodeDetected') || 'Promo Code Detected!'}</h2>
              <p className="trial-promo-subtitle">
                {t('profileEntrepreneur.youreOnTrial') || "You're currently on a trial."}
              </p>
              <div className="trial-promo-code-display">
                <code>{trialPromoData.promo_code}</code>
              </div>
            </div>

            <div className="trial-promo-body">
              <p className="trial-promo-question">
                {t('profileEntrepreneur.howToApplyPromo') || 'How would you like to apply this promo code?'}
              </p>

              {/* Option 1: Queue for after trial */}
              <div className="trial-promo-option">
                <div className="option-header">
                  <div className="option-icon queue">
                    <Clock size={24} />
                  </div>
                  <div className="option-info">
                    <h3>{trialPromoData.options.queue.label}</h3>
                    <p>{trialPromoData.options.queue.description}</p>
                  </div>
                </div>
                <button
                  className="trial-promo-btn queue-btn"
                  onClick={handleQueuePromoCode}
                  disabled={isQueueingPromo || isApplyingPromoNow}
                >
                  {isQueueingPromo ? (
                    <>
                      <span className="ep-spinner"></span>
                      {t('profileEntrepreneur.queueing') || 'Queueing...'}
                    </>
                  ) : (
                    <>
                      <Clock size={18} />
                      {t('profileEntrepreneur.applyAfterTrial') || 'Apply After Trial'}
                    </>
                  )}
                </button>
              </div>

              <div className="trial-promo-divider">
                <span>{t('common.or') || 'OR'}</span>
              </div>

              {/* Option 2: Apply now (cancel trial) */}
              <div className="trial-promo-option apply-now">
                <div className="option-header">
                  <div className="option-icon apply-now">
                    <Zap size={24} />
                  </div>
                  <div className="option-info">
                    <h3>{trialPromoData.options.apply_now.label}</h3>
                    <p>{trialPromoData.options.apply_now.description}</p>
                  </div>
                </div>
                <div className="apply-now-warning">
                  <AlertCircle size={16} />
                  <span>{trialPromoData.options.apply_now.warning}</span>
                </div>
                <button
                  className="trial-promo-btn apply-now-btn"
                  onClick={handleApplyPromoNow}
                  disabled={isQueueingPromo || isApplyingPromoNow}
                >
                  {isApplyingPromoNow ? (
                    <>
                      <span className="ep-spinner"></span>
                      {t('profileEntrepreneur.applying') || 'Applying...'}
                    </>
                  ) : (
                    <>
                      <Zap size={18} />
                      {t('profileEntrepreneur.cancelTrialApplyNow') || 'Cancel Trial & Apply Now'}
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="trial-promo-footer">
              <p className="trial-promo-note">
                <Shield size={14} />
                {t('profileEntrepreneur.noSilentBilling') || 'No silent billing changes. You are in control.'}
              </p>
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
