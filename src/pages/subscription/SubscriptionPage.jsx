import React, { useEffect, useState } from 'react';
import { Crown, TrendingUp, Check, X, Zap, Shield, Star, ArrowRight, Building2, FileText, MessageSquare, DollarSign, Calendar, Clock, Activity, AlertTriangle, CreditCard } from 'lucide-react';
import Nav from '../../components/Nav';
import logo from "../../assets/logo.png"
import '../../styles/entrepreneur/subscriptionpage.css';
import '../../styles/entrepreneur/profilepageentrepreneur.css';
import SubscriptionModal from '../../components/SubcriptionModal';
import UpdatePaymentMethodModal from '../../components/UpdatePaymentMethodModal';
import { useLanguage } from '../../contexts/LanguageContext';

function SubscriptionPage() {
  const { t } = useLanguage();
  const [userProfile, setUserProfile] = useState({
    id: 101,
    role: 'entrepreneur',
    subscription: {
      plan_type: 'premium',
      status: 'trialing', // Change to 'active' to see active subscription view
      trial_end: '2025-11-01', // Trial end date for calculation
      trial_days_remaining: 14, // This is now calculated dynamically
      start_date: '2025-01-01',
      current_period_end: '2025-12-01',
      cancel_at_period_end: false,
      bids: {
        used: 12,
        limit: 'unlimited',
        remaining: 'unlimited'
      },
      is_trial: true, // Change to false to see active subscription view
      price: 429
    }
  });

  const [subscription, setSubscription] = useState({})
  const [hasSubscription, setHasSubscription] = useState(false)
  const [showPlansModal, setShowPlansModal] = useState(false)
  const [showUpdatePaymentModal, setShowUpdatePaymentModal] = useState(false)

  useEffect(() => {
    const uProfile = localStorage.getItem('userProfile')
    if (uProfile) {
      const u = JSON.parse(uProfile)
      setUserProfile(u)
      if (u.entrepProfile && u.entrepProfile.subscription) {
        setHasSubscription(u.entrepProfile.subscription.hasSubscription || false)
        setSubscription(u.entrepProfile.subscription.subscription || {})
      }
    }
  }, [])

  const refresher = async () => {
    // Refresh subscription data after successful subscription
    const uProf = localStorage.getItem('userProfile')
    if (uProf) {
      const u = JSON.parse(uProf)
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
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
          setHasSubscription(subscriptionData.hasSubscription || false)

          // Update localStorage with new subscription data
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
    setShowPlansModal(false)
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "N/A";
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const getTrialInfo = () => {
    const trialEndDate = new Date(subscription.trial_end);
    const now = new Date();
    const totalTrialDays = 14; // Standard trial period
    
    // Calculate days remaining
    const timeRemaining = trialEndDate - now;
    const daysRemaining = Math.max(0, Math.ceil(timeRemaining / (1000 * 60 * 60 * 24)));
    
    // Calculate percentage for progress bar
    const percentage = Math.min(Math.max((daysRemaining / totalTrialDays) * 100, 0), 100);
    
    // Calculate hours and minutes for more precision
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
    const start = new Date(subscription.start);
    const end = new Date(subscription.current_period_end);
    const now = new Date();
    
    const totalDuration = end - start;
    const elapsed = now - start;
    const percentage = Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100);
    
    const daysRemaining = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    
    return { percentage, daysRemaining, endDate: end };
  };

  const plans = [
    {
      name: 'Starter',
      price: 89,
      period: 'month',
      description: t('subscriptionPage.starterDescription') || 'For small businesses',
      restriction: t('subscriptionPage.starterRestriction') || 'Projects under $2,500 only',
      features: [
        { text: t('subscriptionPage.feat_browseJobs') || 'Browse construction jobs', included: true },
        { text: t('subscriptionPage.feat_viewJobDetails') || 'View job details & specs', included: true },
        { text: t('subscriptionPage.feat_submitBids') || 'Submit bids', included: true, limit: t('subscriptionPage.limit_15perMonth') || '15 per month' },
        { text: t('subscriptionPage.feat_messageProjects') || 'Message on approved projects', included: true },
        { text: t('subscriptionPage.feat_prioritySupport') || 'Priority support', included: false },
        { text: t('subscriptionPage.feat_advancedAnalytics') || 'Advanced analytics', included: false },
        { text: t('subscriptionPage.feat_customBranding') || 'Custom branding', included: false }
      ],
      popular: false
    },
    {
      name: 'Basic',
      price: 250,
      period: 'month',
      description: t('subscriptionPage.basicDescription') || 'Perfect for getting started',
      features: [
        { text: t('subscriptionPage.feat_browseJobs') || 'Browse construction jobs', included: true },
        { text: t('subscriptionPage.feat_viewJobDetails') || 'View job details & specs', included: true },
        { text: t('subscriptionPage.feat_submitBids') || 'Submit bids', included: true, limit: t('subscriptionPage.limit_30perMonth') || '30 per month' },
        { text: t('subscriptionPage.feat_messageProjects') || 'Message on approved projects', included: true },
        { text: t('subscriptionPage.feat_prioritySupport') || 'Priority support', included: false },
        { text: t('subscriptionPage.feat_advancedAnalytics') || 'Advanced analytics', included: false },
        { text: t('subscriptionPage.feat_customBranding') || 'Custom branding', included: false }
      ],
      popular: false
    },
    {
      name: 'Premium',
      price: 429,
      period: 'month',
      description: t('subscriptionPage.premiumDescription') || 'Best for professionals',
      features: [
        { text: t('subscriptionPage.feat_browseJobs') || 'Browse construction jobs', included: true },
        { text: t('subscriptionPage.feat_viewJobDetails') || 'View job details & specs', included: true },
        { text: t('subscriptionPage.feat_submitBids') || 'Submit bids', included: true, limit: t('subscriptionPage.unlimited') || 'Unlimited' },
        { text: t('subscriptionPage.feat_messageProjects') || 'Message on approved projects', included: true },
        { text: t('subscriptionPage.feat_prioritySupport') || 'Priority support', included: true },
        { text: t('subscriptionPage.feat_advancedAnalytics') || 'Advanced analytics', included: true },
        { text: t('subscriptionPage.feat_customBranding') || 'Custom branding', included: true }
      ],
      popular: true
    }
  ];

  const handleUpgrade = (planName) => {
    console.log(`Upgrade to ${planName}`);
  };

  const currentPlan = plans.find(p => p.name.toLowerCase() === subscription.plan_type);
  const subscriptionProgress = !subscription.is_trial ? getSubscriptionDuration() : null;
  const trialInfo = subscription.is_trial ? getTrialInfo() : null;

  return (
    <div className="subscription-page-container">
      <Nav userProfile={userProfile} />
      
      <main className="subscription-main-content">
        {/* Dashboard Header */}
        <div className="dashboard-header">
          <div className="header-brand">
            <img src={logo} alt="Intervos Logo" className="header-logo" />
            <div className="header-text">
              <h1 className="dashboard-title">{t('subscriptionPage.pageTitle') || 'Subscription Management'}</h1>
              <p className="dashboard-subtitle">{t('subscriptionPage.pageSubtitle') || 'Intervos Construction Bidding Platform'}</p>
            </div>
          </div>
        </div>

        {/* No Subscription State */}
        {!hasSubscription ? (
          <div className="no-subscription-state">
            <div className="no-sub-content">
              <div className="no-sub-icon">
                <Crown size={48} />
              </div>
              <h3 className="no-sub-title">{t('subscriptionPage.noActiveSubscription') || 'No Active Subscription'}</h3>
              <p className="no-sub-description">
                {t('subscriptionPage.subscribeDescription') || 'Subscribe to unlock powerful features like submitting bids, unlocking project budgets, and messaging on approved projects.'}
              </p>
              <button
                className="subscribe-now-btn"
                onClick={() => setShowPlansModal(true)}
              >
                <Crown size={18} />
                {t('subscriptionPage.viewPlans') || 'View Subscription Plans'}
              </button>
            </div>

            {/* Feature Comparison Table for non-subscribers */}
            <div className="comparison-section">
              <div className="section-header">
                <div className="section-icon">
                  <Crown size={24} />
                </div>
                <div className="section-text">
                  <h2 className="section-title">{t('subscriptionPage.featureComparison') || 'Feature Comparison'}</h2>
                  <p className="section-subtitle">{t('subscriptionPage.featureComparisonShort') || 'See what you can unlock with a subscription'}</p>
                </div>
              </div>

              <div className="comparison-table-wrapper">
                <table className="comparison-table">
                  <thead>
                    <tr>
                      <th className="feature-col">{t('subscriptionPage.feature') || 'Feature'}</th>
                      <th className="tier-col">{t('subscriptionPage.noSubscription') || 'No Subscription'}</th>
                      <th className="tier-col">{t('subscriptionPage.starterPlan') || 'Starter Plan'}</th>
                      <th className="tier-col">{t('subscriptionPage.basicPlan') || 'Basic Plan'}</th>
                      <th className="tier-col premium-col">{t('subscriptionPage.premiumPlan') || 'Premium Plan'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="feature-name">{t('subscriptionPage.feat_browseJobs') || 'Browse construction jobs'}</td>
                      <td className="tier-cell"><Check className="icon-yes" size={20} /></td>
                      <td className="tier-cell"><Check className="icon-yes" size={20} /></td>
                      <td className="tier-cell"><Check className="icon-yes" size={20} /></td>
                      <td className="tier-cell premium-cell"><Check className="icon-yes" size={20} /></td>
                    </tr>
                    <tr>
                      <td className="feature-name">{t('subscriptionPage.feat_viewJobDetails') || 'View job details & specs'}</td>
                      <td className="tier-cell"><Check className="icon-yes" size={20} /></td>
                      <td className="tier-cell"><Check className="icon-yes" size={20} /></td>
                      <td className="tier-cell"><Check className="icon-yes" size={20} /></td>
                      <td className="tier-cell premium-cell"><Check className="icon-yes" size={20} /></td>
                    </tr>
                    <tr>
                      <td className="feature-name">{t('subscriptionPage.feat_submitBids') || 'Submit bids'}</td>
                      <td className="tier-cell"><X className="icon-no" size={20} /></td>
                      <td className="tier-cell">
                        <Check className="icon-yes" size={20} />
                        <span className="feature-note">{t('subscriptionPage.note_15max') || '(15 max)'}</span>
                      </td>
                      <td className="tier-cell">
                        <Check className="icon-yes" size={20} />
                        <span className="feature-note">{t('subscriptionPage.note_30max') || '(30 max)'}</span>
                      </td>
                      <td className="tier-cell premium-cell">
                        <Check className="icon-yes" size={20} />
                        <span className="feature-note">{t('subscriptionPage.note_unlimited') || '(unlimited)'}</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="feature-name">{t('subscriptionPage.feat_projectBudgetLimit') || 'Project budget limit'}</td>
                      <td className="tier-cell"><X className="icon-no" size={20} /></td>
                      <td className="tier-cell">
                        <Check className="icon-yes" size={20} />
                        <span className="feature-note">{t('subscriptionPage.note_under2500') || '(under $2,500)'}</span>
                      </td>
                      <td className="tier-cell"><Check className="icon-yes" size={20} /></td>
                      <td className="tier-cell premium-cell"><Check className="icon-yes" size={20} /></td>
                    </tr>
                    <tr>
                      <td className="feature-name">{t('subscriptionPage.feat_messageProjects') || 'Message on approved projects'}</td>
                      <td className="tier-cell"><X className="icon-no" size={20} /></td>
                      <td className="tier-cell"><Check className="icon-yes" size={20} /></td>
                      <td className="tier-cell"><Check className="icon-yes" size={20} /></td>
                      <td className="tier-cell premium-cell"><Check className="icon-yes" size={20} /></td>
                    </tr>
                    <tr>
                      <td className="feature-name">{t('subscriptionPage.feat_prioritySupport') || 'Priority support'}</td>
                      <td className="tier-cell"><X className="icon-no" size={20} /></td>
                      <td className="tier-cell"><X className="icon-no" size={20} /></td>
                      <td className="tier-cell"><X className="icon-no" size={20} /></td>
                      <td className="tier-cell premium-cell"><Check className="icon-yes" size={20} /></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <>
        {/* Past Due Banner - Show when payment failed */}
        {subscription.status === 'past_due' && (
          <div className="status-banner past-due-banner">
            <div className="banner-content">
              <div className="banner-icon-wrapper past-due">
                <AlertTriangle size={28} />
              </div>
              <div className="banner-info">
                <div className="banner-header">
                  <h3 className="banner-title past-due">{t('subscriptionPage.paymentFailed') || 'Payment Failed'}</h3>
                  <div className="past-due-badge">{t('subscriptionPage.actionRequired') || 'Action Required'}</div>
                </div>
                <p className="banner-text">
                  {t('subscriptionPage.paymentFailedMsg') || 'Your subscription payment could not be processed. Please update your payment method to restore full access.'}
                </p>
                <p className="banner-subtext past-due">
                  {t('subscriptionPage.accessLimitedMsg') || 'Your access may be limited until payment is resolved.'}
                </p>
              </div>
              <button
                className="update-payment-btn"
                onClick={() => setShowUpdatePaymentModal(true)}
              >
                <CreditCard size={18} />
                {t('subscriptionPage.updatePaymentMethod') || 'Update Payment Method'}
              </button>
            </div>
          </div>
        )}

        {/* Trial Expired Banner - Show when trial has ended */}
        {subscription.is_trial && trialInfo && trialInfo.daysRemaining <= 0 && (
          <div className="status-banner past-due-banner">
            <div className="banner-content">
              <div className="banner-icon-wrapper past-due">
                <AlertTriangle size={28} />
              </div>
              <div className="banner-info">
                <div className="banner-header">
                  <h3 className="banner-title past-due">{t('subscriptionPage.trialEnded') || 'Free Trial Has Ended'}</h3>
                  <div className="past-due-badge">{t('subscriptionPage.actionRequired') || 'Action Required'}</div>
                </div>
                <p className="banner-text">
                  {(t('subscriptionPage.trialEndedMsg') || 'Your 14-day free trial ended on {{date}}. Your card on file will be charged automatically to continue your subscription.').replace('{{date}}', formatDate(subscription.trial_end))}
                </p>
                <p className="banner-subtext past-due">
                  {t('subscriptionPage.trialEndedSubtext') || 'If your payment method cannot be charged, please update it below to avoid losing access.'}
                </p>
              </div>
              <button
                className="update-payment-btn"
                onClick={() => setShowUpdatePaymentModal(true)}
              >
                <CreditCard size={18} />
                {t('subscriptionPage.updatePaymentMethod') || 'Update Payment Method'}
              </button>
            </div>
          </div>
        )}

        {/* Trial Banner - Only show during active trial (days remaining > 0) */}
        {subscription.is_trial && trialInfo && trialInfo.daysRemaining > 0 && (
          <div className="status-banner trial-banner">
            <div className="banner-content">
              <div className="banner-icon-wrapper">
                <Zap size={28} />
              </div>
              <div className="banner-info">
                <div className="banner-header">
                  {/* Show the ACTUAL plan the user is on trial for. Previously
                      this hardcoded "Premium Trial Active" for every trial —
                      including Starter and Basic users — which contradicted the
                      backend's plan enforcement (e.g. Starter users seeing
                      "Premium Trial Active" then getting blocked at $2,500). */}
                  <h3 className="banner-title">
                    {(() => {
                      const p = subscription.plan_type;
                      const planLabel =
                        p === "starter" ? (t('subscriptionModal.starterPlan') || 'Starter Plan')
                        : p === "basic" ? (t('subscriptionModal.basicPlan') || 'Basic Plan')
                        : (t('subscriptionModal.premiumPlan') || 'Premium Plan');
                      return `${planLabel} ${t('subscriptionPage.trialActive') || 'Trial Active'}`;
                    })()}
                  </h3>
                  <div className="trial-badge">{t('subscriptionPage.trialPeriod') || 'Trial Period'}</div>
                </div>
                <p className="banner-text">
                  {trialInfo.daysRemaining} {trialInfo.daysRemaining === 1 ? (t('subscriptionPage.day') || 'day') : (t('subscriptionPage.days') || 'days')}, {trialInfo.hoursRemaining} {trialInfo.hoursRemaining === 1 ? (t('subscriptionPage.hour') || 'hour') : (t('subscriptionPage.hours') || 'hours')}, {trialInfo.minutesRemaining} {trialInfo.minutesRemaining === 1 ? (t('subscriptionPage.minute') || 'minute') : (t('subscriptionPage.minutes') || 'minutes')} {t('subscriptionPage.remaining') || 'remaining'}
                </p>
                <p className="banner-subtext">
                  {(t('subscriptionPage.trialEndsOn') || 'Trial ends on {{date}}. Your card will be charged automatically after the trial ends.').replace('{{date}}', formatDate(subscription.trial_end))}
                </p>
                <div className="trial-progress-bar">
                  <div
                    className="trial-progress-fill"
                    style={{ width: `${trialInfo.percentage}%` }}
                  ></div>
                </div>
                <div className="trial-progress-label">
                  {(t('subscriptionPage.daysOfTotalRemaining') || '{{remaining}} of {{total}} days remaining ({{pct}}%)')
                    .replace('{{remaining}}', trialInfo.daysRemaining)
                    .replace('{{total}}', trialInfo.totalDays)
                    .replace('{{pct}}', Math.round(trialInfo.percentage))}
                </div>
              </div>
              <div className="trial-countdown">
                <div className="countdown-number">{trialInfo.daysRemaining}</div>
                <div className="countdown-label">{t('subscriptionPage.daysLeft') || 'Days Left'}</div>
                {trialInfo.hoursRemaining > 0 && (
                  <>
                    <div className="countdown-hours">{trialInfo.hoursRemaining}h {trialInfo.minutesRemaining}m</div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Current Plan Display - Only show if not on trial */}
        {!subscription.is_trial && currentPlan && (
          <div className="current-plan-section">
            <div className="plan-overview-grid">
              {/* Plan Info Card */}
              <div className="plan-info-card">
                <div className="card-header">
                  <div className="card-icon">
                    <Shield size={24} />
                  </div>
                  <div className="status-indicator active">
                    <span className="status-dot"></span>
                    {t('subscriptionPage.active') || 'Active'}
                  </div>
                </div>
                <h2 className="plan-name">{currentPlan.name} {t('subscriptionPage.planSuffix') || 'Plan'}</h2>
                <p className="plan-desc">{currentPlan.description}</p>
                <div className="plan-price">
                  <span className="price-symbol">$</span>
                  <span className="price-value">{currentPlan.price}</span>
                  <span className="price-period">{t('subscriptionPage.perMonth') || '/month'}</span>
                </div>
              </div>

              {/* Billing Timeline Card */}
              <div className="billing-timeline-card">
                <div className="card-header">
                  <div className="card-icon">
                    <Calendar size={24} />
                  </div>
                  <h3 className="card-title">{t('subscriptionPage.billingCycle') || 'Billing Cycle'}</h3>
                </div>
                <div className="timeline-content">
                  <div className="timeline-dates">
                    <div className="date-item">
                      <span className="date-label">{t('subscriptionPage.started') || 'Started'}</span>
                      <span className="date-value">{formatDate(subscription.current_period_start || subscription.start_date || subscription.created_at)}</span>
                    </div>
                    <div className="date-item">
                      <span className="date-label">{t('subscriptionPage.nextBilling') || 'Next Billing'}</span>
                      <span className="date-value">{formatDate(subscription.current_period_end)}</span>
                    </div>
                  </div>
                  <div className="timeline-progress">
                    <div className="progress-bar-container">
                      <div
                        className="progress-bar-fill"
                        style={{ width: `${subscriptionProgress?.percentage || 0}%` }}
                      ></div>
                    </div>
                    <div className="progress-info">
                      <span className="progress-text">{subscriptionProgress?.daysRemaining} {t('subscriptionPage.daysUntilRenewal') || 'days until renewal'}</span>
                      <span className="progress-percentage">{Math.round(subscriptionProgress?.percentage || 0)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Features Grid */}
            <div className="features-section">
              <h3 className="features-title">{t('subscriptionPage.activeFeatures') || 'Active Features'}</h3>
              <div className="features-grid">
                {currentPlan.features.filter(f => f.included).map((feature, idx) => (
                  <div key={idx} className="feature-card">
                    <Check className="feature-icon" size={20} />
                    <div className="feature-content">
                      <span className="feature-name">{feature.text}</span>
                      {feature?.limit && <span className="feature-badge">{feature?.limit}</span>}
                    </div>
                  </div>
                ))}
              </div>
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
              <h2 className="section-title">{t('subscriptionPage.usageAnalytics') || 'Usage Analytics'}</h2>
              <p className="section-subtitle">{t('subscriptionPage.usageAnalyticsSubtitle') || 'Monitor your monthly bidding activity'}</p>
            </div>
          </div>

          <div className="stats-grid subs">
            <div className="stat-card subs">
              <div className="stat-header subs">
                <div className="stat-icon bids">
                  <FileText size={22} />
                </div>
                <span className="stat-label">{t('subscriptionPage.bidsSubmitted') || 'Bids Submitted'}</span>
              </div>
              <div className="stat-value subsval">
                {subscription?.bids?.used}
                {subscription?.bids?.limit !== 'unlimited' && (
                  <span className="stat-total"> / {subscription?.bids?.limit}</span>
                )}
              </div>
              {subscription?.bids?.limit !== 'unlimited' && (
                <div className="stat-progress">
                  <div 
                    className="stat-progress-fill"
                    style={{ width: `${(subscription?.bids?.used / subscription?.bids?.limit) * 100}%` }}
                  ></div>
                </div>
              )}
            </div>

            <div className="stat-card subs">
              <div className="stat-header subs">
                <div className="stat-icon remaining">
                  <Zap size={22} />
                </div>
                <span className="stat-label">{t('subscriptionPage.remainingBids') || 'Remaining Bids'}</span>
              </div>
              <div className="stat-value accent subsval">
                {subscription?.bids?.remaining === 'unlimited' 
                  ? '∞' 
                  : subscription?.bids?.remaining}
              </div>
            </div>

            {/* Budget Unlocks card intentionally removed — budgets aren't a
                plan perk, they're a separate per-job $19.99 purchase. Showing
                "Unlimited" here contradicted the paywall users still hit. */}

            <div className="stat-card subs">
              <div className="stat-header subs">
                <div className="stat-icon messages">
                  <MessageSquare size={22} />
                </div>
                <span className="stat-label">{t('subscriptionPage.activeChats') || 'Active Chats'}</span>
              </div>
              <div className="stat-value subsval">{t('subscriptionPage.unlimited') || 'Unlimited'}</div>
            </div>
          </div>
        </div>

        {/* Feature Comparison Table */}
        <div className="comparison-section">
          <div className="section-header">
            <div className="section-icon">
              <Crown size={24} />
            </div>
            <div className="section-text">
              <h2 className="section-title">{t('subscriptionPage.featureComparison') || 'Feature Comparison'}</h2>
              <p className="section-subtitle">{t('subscriptionPage.featureComparisonAll') || 'Compare all features across subscription tiers'}</p>
            </div>
          </div>

          <div className="comparison-table-wrapper">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th className="feature-col">{t('subscriptionPage.feature') || 'Feature'}</th>
                  <th className="tier-col">{t('subscriptionPage.noSubscription') || 'No Subscription'}</th>
                  <th className="tier-col">{t('subscriptionPage.trialStarter') || 'Trial (Starter)'}</th>
                  <th className="tier-col">{t('subscriptionPage.trialBasic') || 'Trial (Basic)'}</th>
                  <th className="tier-col premium-col">{t('subscriptionPage.trialPremium') || 'Trial (Premium)'}</th>
                  <th className="tier-col">{t('subscriptionPage.activeStarter') || 'Active Starter'}</th>
                  <th className="tier-col">{t('subscriptionPage.activeBasic') || 'Active Basic'}</th>
                  <th className="tier-col premium-col">{t('subscriptionPage.activePremium') || 'Active Premium'}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="feature-name">{t('subscriptionPage.feat_browseJobs') || 'Browse construction jobs'}</td>
                  <td className="tier-cell"><X className="icon-no" size={20} /></td>
                  <td className="tier-cell"><Check className="icon-yes" size={20} /></td>
                  <td className="tier-cell"><Check className="icon-yes" size={20} /></td>
                  <td className="tier-cell premium-cell"><Check className="icon-yes" size={20} /></td>
                  <td className="tier-cell"><Check className="icon-yes" size={20} /></td>
                  <td className="tier-cell"><Check className="icon-yes" size={20} /></td>
                  <td className="tier-cell premium-cell"><Check className="icon-yes" size={20} /></td>
                </tr>
                <tr>
                  <td className="feature-name">{t('subscriptionPage.feat_viewJobDetails') || 'View job details & specs'}</td>
                  <td className="tier-cell"><X className="icon-no" size={20} /></td>
                  <td className="tier-cell"><Check className="icon-yes" size={20} /></td>
                  <td className="tier-cell"><Check className="icon-yes" size={20} /></td>
                  <td className="tier-cell premium-cell"><Check className="icon-yes" size={20} /></td>
                  <td className="tier-cell"><Check className="icon-yes" size={20} /></td>
                  <td className="tier-cell"><Check className="icon-yes" size={20} /></td>
                  <td className="tier-cell premium-cell"><Check className="icon-yes" size={20} /></td>
                </tr>
                <tr>
                  <td className="feature-name">{t('subscriptionPage.feat_submitBids') || 'Submit bids'}</td>
                  <td className="tier-cell"><X className="icon-no" size={20} /></td>
                  <td className="tier-cell">
                    <Check className="icon-yes" size={20} />
                    <span className="feature-note">{t('subscriptionPage.note_15max') || '(15 max)'}</span>
                  </td>
                  <td className="tier-cell">
                    <Check className="icon-yes" size={20} />
                    <span className="feature-note">{t('subscriptionPage.note_30max') || '(30 max)'}</span>
                  </td>
                  <td className="tier-cell premium-cell">
                    <Check className="icon-yes" size={20} />
                    <span className="feature-note">{t('subscriptionPage.note_unlimited') || '(unlimited)'}</span>
                  </td>
                  <td className="tier-cell">
                    <Check className="icon-yes" size={20} />
                    <span className="feature-note">{t('subscriptionPage.note_15max') || '(15 max)'}</span>
                  </td>
                  <td className="tier-cell">
                    <Check className="icon-yes" size={20} />
                    <span className="feature-note">{t('subscriptionPage.note_30max') || '(30 max)'}</span>
                  </td>
                  <td className="tier-cell premium-cell">
                    <Check className="icon-yes" size={20} />
                    <span className="feature-note">{t('subscriptionPage.note_unlimited') || '(unlimited)'}</span>
                  </td>
                </tr>
                <tr>
                  <td className="feature-name">{t('subscriptionPage.feat_projectBudgetLimit') || 'Project budget limit'}</td>
                  <td className="tier-cell"><X className="icon-no" size={20} /></td>
                  <td className="tier-cell">
                    <Check className="icon-yes" size={20} />
                    <span className="feature-note">{t('subscriptionPage.note_under2500') || '(under $2,500)'}</span>
                  </td>
                  <td className="tier-cell"><Check className="icon-yes" size={20} /></td>
                  <td className="tier-cell premium-cell"><Check className="icon-yes" size={20} /></td>
                  <td className="tier-cell">
                    <Check className="icon-yes" size={20} />
                    <span className="feature-note">{t('subscriptionPage.note_under2500') || '(under $2,500)'}</span>
                  </td>
                  <td className="tier-cell"><Check className="icon-yes" size={20} /></td>
                  <td className="tier-cell premium-cell"><Check className="icon-yes" size={20} /></td>
                </tr>
                <tr>
                  <td className="feature-name">{t('subscriptionPage.feat_messageProjects') || 'Message on approved projects'}</td>
                  <td className="tier-cell"><X className="icon-no" size={20} /></td>
                  <td className="tier-cell"><Check className="icon-yes" size={20} /></td>
                  <td className="tier-cell"><Check className="icon-yes" size={20} /></td>
                  <td className="tier-cell premium-cell"><Check className="icon-yes" size={20} /></td>
                  <td className="tier-cell"><Check className="icon-yes" size={20} /></td>
                  <td className="tier-cell"><Check className="icon-yes" size={20} /></td>
                  <td className="tier-cell premium-cell"><Check className="icon-yes" size={20} /></td>
                </tr>
                <tr>
                  <td className="feature-name">{t('subscriptionPage.feat_prioritySupport') || 'Priority support'}</td>
                  <td className="tier-cell"><X className="icon-no" size={20} /></td>
                  <td className="tier-cell"><X className="icon-no" size={20} /></td>
                  <td className="tier-cell"><X className="icon-no" size={20} /></td>
                  <td className="tier-cell premium-cell"><Check className="icon-yes" size={20} /></td>
                  <td className="tier-cell"><X className="icon-no" size={20} /></td>
                  <td className="tier-cell"><X className="icon-no" size={20} /></td>
                  <td className="tier-cell premium-cell"><Check className="icon-yes" size={20} /></td>
                </tr>
                <tr>
                  <td className="feature-name">{t('subscriptionPage.feat_advancedAnalytics') || 'Advanced analytics'}</td>
                  <td className="tier-cell"><X className="icon-no" size={20} /></td>
                  <td className="tier-cell"><X className="icon-no" size={20} /></td>
                  <td className="tier-cell"><X className="icon-no" size={20} /></td>
                  <td className="tier-cell premium-cell"><Check className="icon-yes" size={20} /></td>
                  <td className="tier-cell"><X className="icon-no" size={20} /></td>
                  <td className="tier-cell"><X className="icon-no" size={20} /></td>
                  <td className="tier-cell premium-cell"><Check className="icon-yes" size={20} /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
          </>
        )}
      </main>

      {/* Subscription Plans Modal */}
      {showPlansModal && userProfile && (
        <SubscriptionModal
          token={userProfile.token}
          refresher={refresher}
          onClose={() => setShowPlansModal(false)}
          showCloseButton={true}
        />
      )}

      {/* Update Payment Method Modal */}
      {showUpdatePaymentModal && userProfile && (
        <UpdatePaymentMethodModal
          token={userProfile.token}
          onClose={() => setShowUpdatePaymentModal(false)}
          onSuccess={refresher}
        />
      )}
    </div>
  );
}

export default SubscriptionPage;