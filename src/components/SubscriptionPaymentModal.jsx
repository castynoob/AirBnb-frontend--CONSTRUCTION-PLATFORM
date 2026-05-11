import React, { useState } from "react";
import {
  Elements,
  useStripe,
  useElements,
  CardElement,
} from "@stripe/react-stripe-js";
import "../styles/entrepreneur/subscriptionpayment.css"
import logo from "../assets/logo-light.png";
import { stripePromise } from "../utils/stripeConfig";
import { useLanguage } from "../contexts/LanguageContext";

// Closing/Loading Screen Component
const ClosingScreen = () => {
  const { t } = useLanguage();
  return (
    <div className="sp-overlay sp-closing-overlay">
      <div className="sp-closing-content">
        <div className="sp-closing-spinner"></div>
        <div className="sp-closing-icon">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h3 className="sp-closing-title">{t('subscriptionPayment.paymentSuccessful') || 'Payment Successful'}</h3>
        <p className="sp-closing-text">{t('subscriptionPayment.activatingSubscription') || 'Activating your subscription...'}</p>
      </div>
    </div>
  );
};

// Success/Thank You Modal Component
const ThankYouModal = ({ planType, onClose }) => {
  const { t } = useLanguage();
  return (
    <div className="sp-overlay" onClick={onClose}>
      <div className="sp-success-modal" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="sp-success-close" onClick={onClose}>
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* Left Column - Branding & Welcome */}
        <div className="sp-success-left">
          {/* Decorative elements */}
          <div className="sp-success-decoration">
            <div className="sp-decoration-circle"></div>
            <div className="sp-decoration-circle"></div>
            <div className="sp-decoration-circle"></div>
          </div>

          {/* Success Icon */}
          <div className="sp-success-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          {/* Branding */}
          <div className="sp-success-brand">
            <img src={logo} alt="Intervos" className="sp-success-logo" />
            <span className="sp-brand-text">INTERVOS</span>
          </div>

          {/* Welcome Message */}
          <h2 className="sp-success-title">{t('subscriptionPayment.welcomeToPremium') || 'Welcome to Premium!'}</h2>
          <p className="sp-success-subtitle">
            {(t('subscriptionPayment.subscriptionActive') || 'Your {{plan}} subscription is now active.')
              .replace('{{plan}}', planType === "premium" ? (t('subscriptionPayment.planPremium') || 'Premium') : planType === "starter" ? (t('subscriptionPayment.planStarter') || 'Starter') : (t('subscriptionPayment.planBasic') || 'Basic'))}
          </p>

          {/* Email notice */}
          <p className="sp-success-email-notice">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
              <path d="M22 6L12 13L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            {t('subscriptionPayment.confirmationEmail') || 'Confirmation sent to your email'}
          </p>
        </div>

        {/* Right Column - Benefits & CTA */}
        <div className="sp-success-right">
          <h3 className="sp-benefits-title">{t('subscriptionPayment.whatsIncluded') || "What's included"}</h3>

          <div className="sp-success-benefits">
            <div className="sp-benefit-item">
              <div className="sp-benefit-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 8V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <div className="sp-benefit-content">
                <strong>{t('subscriptionPayment.benefit_trialTitle') || '14-Day Free Trial'}</strong>
                <span>{t('subscriptionPayment.benefit_trialDesc') || 'Your trial starts today - no charges until it ends'}</span>
              </div>
            </div>

            <div className="sp-benefit-item">
              <div className="sp-benefit-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="sp-benefit-content">
                <strong>{t('subscriptionPayment.benefit_premiumTitle') || 'Premium Features'}</strong>
                <span>{t('subscriptionPayment.benefit_premiumDesc') || 'Unlimited budget unlocks & advanced analytics'}</span>
              </div>
            </div>

            <div className="sp-benefit-item">
              <div className="sp-benefit-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17 21V19C17 16.7909 15.2091 15 13 15H5C2.79086 15 1 16.7909 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                  <path d="M23 21V19C23 17.1362 21.7252 15.5701 20 15.126" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M16 3.12598C17.7252 3.56983 19 5.13616 19 6.99998C19 8.86381 17.7252 10.4301 16 10.874" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="sp-benefit-content">
                <strong>{t('subscriptionPayment.benefit_priorityTitle') || 'Priority Visibility'}</strong>
                <span>{t('subscriptionPayment.benefit_priorityDesc') || 'Stand out to property managers seeking bids'}</span>
              </div>
            </div>

            <div className="sp-benefit-item">
              <div className="sp-benefit-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="sp-benefit-content">
                <strong>{t('subscriptionPayment.benefit_supportTitle') || 'Dedicated Support'}</strong>
                <span>{t('subscriptionPayment.benefit_supportDesc') || 'Priority assistance whenever you need help'}</span>
              </div>
            </div>
          </div>

          <button
            className="sp-success-btn"
            onClick={onClose}
          >
            <span>{t('subscriptionPayment.startExploring') || 'Start Exploring'}</span>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

const SubscriptionPaymentForm = ({ token, planType, handleCloseModal }) => {
  const { t } = useLanguage();
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Promo code state
  const [promoCode, setPromoCode] = useState("");
  const [promoStatus, setPromoStatus] = useState(null); // null | 'checking' | 'valid' | 'invalid'
  const [promoData, setPromoData] = useState(null);
  const [showPromoInput, setShowPromoInput] = useState(false);

  // Handle closing after successful payment
  const handleSuccessClose = () => {
    setIsClosing(true);
    // Show closing screen for a moment before actually closing
    setTimeout(() => {
      handleCloseModal(true);
    }, 1200);
  };

  // Validate promo code
  const validatePromoCode = async () => {
    if (!promoCode.trim()) return;

    setPromoStatus("checking");
    setMessage("");

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
      const res = await fetch(`${API_BASE_URL}/api/payments/validate-promo-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: promoCode.toUpperCase() }),
      });

      const data = await res.json();

      if (data.valid) {
        setPromoStatus("valid");
        setPromoData(data);
      } else {
        setPromoStatus("invalid");
        setPromoData(null);
        setMessage(data.error || "Invalid promo code");
      }
    } catch (err) {
      setPromoStatus("invalid");
      setPromoData(null);
      setMessage("Failed to validate promo code");
    }
  };

  // Clear promo code
  const clearPromoCode = () => {
    setPromoCode("");
    setPromoStatus(null);
    setPromoData(null);
    setMessage("");
  };

  // Quebec sales taxes — GST (TPS) 5% + QST (TVQ) 9.975%, both on the pre-tax amount.
  const GST_RATE = 0.05;
  const QST_RATE = 0.09975;

  const buildPlanTaxes = (basePrice) => {
    const gst = parseFloat((basePrice * GST_RATE).toFixed(2));
    const qst = parseFloat((basePrice * QST_RATE).toFixed(2));
    return {
      gst,
      qst,
      tax: parseFloat((gst + qst).toFixed(2)),
      totalWithTax: parseFloat((basePrice + gst + qst).toFixed(2)),
    };
  };

  const planDetails = {
    premium: {
      name: t('subscriptionPayment.premiumPlan') || "Premium Plan",
      basePrice: 429,
      price: "$429",
      ...buildPlanTaxes(429),
      period: t('subscriptionPayment.month') || "month",
      features: [
        t('subscriptionPayment.feat_unlimitedBids') || "Unlimited bids per month",
        t('subscriptionPayment.feat_noBudgetLimit') || "No project budget limit",
        t('subscriptionPayment.feat_advancedDashboard') || "Advanced analytics dashboard",
        t('subscriptionPayment.feat_priorityListing') || "Priority listing visibility"
      ]
    },
    basic: {
      name: t('subscriptionPayment.basicPlan') || "Basic Plan",
      basePrice: 250,
      price: "$250",
      ...buildPlanTaxes(250),
      period: t('subscriptionPayment.month') || "month",
      features: [
        t('subscriptionPayment.feat_30bids') || "30 bids per month",
        t('subscriptionPayment.feat_noBudgetLimit') || "No project budget limit",
        t('subscriptionPayment.feat_basicAnalytics') || "Basic analytics",
        t('subscriptionPayment.feat_standardVisibility') || "Standard visibility"
      ]
    },
    starter: {
      name: t('subscriptionPayment.starterPlan') || "Starter Plan",
      basePrice: 89,
      price: "$89",
      ...buildPlanTaxes(89),
      period: t('subscriptionPayment.month') || "month",
      features: [
        t('subscriptionPayment.feat_15bids') || "15 bids per month",
        t('subscriptionPayment.feat_under2500') || "Projects up to $2,500",
        t('subscriptionPayment.feat_basicAnalytics') || "Basic analytics",
        t('subscriptionPayment.feat_emailSupport') || "Email support"
      ]
    }
  };

  const currentPlan = planDetails[planType] || planDetails.basic;

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    // If activation code (promoter), skip payment
    if (promoData?.type === "activation") {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
        const res = await fetch(`${API_BASE_URL}/api/payments/create-subscription`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            plan_type: planType,
            promo_code: promoCode,
          }),
        });

        const data = await res.json();

        if (res.ok) {
          // Update user profile with new subscription data
          const userProfile = JSON.parse(localStorage.getItem("userProfile") || "{}");
          if (userProfile.entrepProfile && data.subscription) {
            userProfile.entrepProfile.subscription = {
              ...userProfile.entrepProfile.subscription,
              subscription: {
                ...data.subscription,
                current_period_start: data.subscription.current_period_start,
                current_period_end: data.subscription.current_period_end,
              }
            };
            localStorage.setItem("userProfile", JSON.stringify(userProfile));
          }
          setIsSuccess(true);
          setShowThankYou(true);
        } else {
          setMessage(data.error || data.message || "Activation failed. Please try again.");
        }
      } catch (err) {
        setMessage("Activation failed. Please try again later.");
      }

      setLoading(false);
      return;
    }

    // Regular subscription flow
    if (!stripe || !elements) return;

    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: "card",
      card: elements.getElement(CardElement),
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
      const res = await fetch(`${API_BASE_URL}/api/payments/create-subscription`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          plan_type: planType,
          payment_method_id: paymentMethod.id,
          promo_code: promoStatus === "valid" ? promoCode : undefined,
        }),
      });

      const data = await res.json();
      console.log("SUBSCRIPTION DATA", data);

      if (res.ok) {
        // Update user profile with new subscription data
        const userProfile = JSON.parse(localStorage.getItem("userProfile") || "{}");
        if (userProfile.entrepProfile && data.subscription) {
          userProfile.entrepProfile.subscription = {
            ...userProfile.entrepProfile.subscription,
            subscription: {
              ...data.subscription,
              current_period_start: data.subscription.current_period_start,
              current_period_end: data.subscription.current_period_end,
            }
          };
          localStorage.setItem("userProfile", JSON.stringify(userProfile));
        }
        setIsSuccess(true);
        setShowThankYou(true);
      } else {
        setMessage(data.error || data.message || "Payment failed. Please try again.");
      }
    } catch (err) {
      setMessage("Payment failed. Please try again later.");
    }

    setLoading(false);
  };

  // Show closing screen when user is closing after success
  if (isClosing) {
    return <ClosingScreen />;
  }

  // Show Thank You Modal on success
  if (showThankYou) {
    return <ThankYouModal planType={planType} onClose={handleSuccessClose} />;
  }

  return (
    <div className="sp-overlay" onClick={() => handleCloseModal(isSuccess)}>
      <div className="sp-modal sp-two-column" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="sp-close-btn" onClick={() => handleCloseModal(isSuccess)}>
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* Two Column Layout */}
        <div className="sp-columns">
          {/* Left Column - Plan Information */}
          <div className="sp-left-column">
            {/* Decorative elements */}
            <div className="sp-left-decoration">
              <div className="sp-decoration-circle"></div>
              <div className="sp-decoration-circle"></div>
              <div className="sp-decoration-circle"></div>
            </div>

            {/* Branding */}
            <div className="sp-left-brand">
              <img src={logo} alt="Intervos" className="sp-left-logo" />
              <span className="sp-left-brand-text">INTERVOS</span>
            </div>

            {/* Plan Badge */}
            <div className="sp-left-badge">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor"/>
              </svg>
              {planType === 'premium'
                ? (t('subscriptionPayment.badgePremium') || 'PREMIUM')
                : planType === 'starter'
                  ? (t('subscriptionPayment.badgeStarter') || 'STARTER')
                  : (t('subscriptionPayment.badgeBasic') || 'BASIC')}
            </div>

            {/* Plan Info */}
            <h2 className="sp-left-title">{currentPlan.name}</h2>
            <div className="sp-left-price">
              <span className="sp-price-amount">${currentPlan.totalWithTax.toFixed(2)}</span>
              <span className="sp-price-period">/{currentPlan.period}</span>
            </div>
            <div className="sp-price-tax-note">
              {(t('subscriptionPayment.inclTaxes') || 'incl. ${{amount}} GST + QST').replace('{{amount}}', currentPlan.tax.toFixed(2))}
            </div>

            {/* Trial Badge */}
            <div className="sp-left-trial">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 8V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
              </svg>
              {t('subscriptionPayment.trial14DayFree') || '14-Day Free Trial'}
            </div>

            {/* Features List */}
            <div className="sp-left-features">
              {currentPlan.features.map((feature, index) => (
                <div key={index} className="sp-left-feature">
                  <div className="sp-left-feature-icon">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Checkout */}
          <div className="sp-right-column">
            <h3 className="sp-right-title">{t('subscriptionPayment.completePayment') || 'Complete Payment'}</h3>
            <p className="sp-right-subtitle">{t('subscriptionPayment.startTrialToday') || 'Start your 14-day free trial today'}</p>

            {/* Payment Summary */}
            <div className="sp-summary">
              <div className="sp-summary-header">
                <span>{t('subscriptionPayment.paymentSummary') || 'Payment Summary'}</span>
              </div>
              <div className="sp-summary-row">
                <span>{currentPlan.name}</span>
                <strong>${currentPlan.basePrice.toFixed(2)}/{currentPlan.period}</strong>
              </div>
              <div className="sp-summary-row sp-tax-row">
                <span>GST ({(GST_RATE * 100).toFixed(0)}%)</span>
                <strong>${currentPlan.gst.toFixed(2)}/{currentPlan.period}</strong>
              </div>
              <div className="sp-summary-row sp-tax-row">
                <span>QST ({(QST_RATE * 100).toFixed(3)}%)</span>
                <strong>${currentPlan.qst.toFixed(2)}/{currentPlan.period}</strong>
              </div>
              <div className="sp-summary-row sp-trial-row">
                <span>{t('subscriptionPayment.trial14Day') || '14-Day Trial'}</span>
                <strong className="sp-free">{t('subscriptionPayment.free') || 'FREE'}</strong>
              </div>
              <div className="sp-summary-total">
                <span>{t('subscriptionPayment.dueToday') || 'Due Today'}</span>
                <strong>$0.00</strong>
              </div>
              <div className="sp-summary-after-trial">
                <span>{t('subscriptionPayment.afterTrial') || 'After trial'}</span>
                <strong>${currentPlan.totalWithTax.toFixed(2)}/{currentPlan.period}</strong>
              </div>
            </div>

            {/* Payment Form */}
            <form onSubmit={handleSubmit} className="sp-form">
              {/* Promo Code Section */}
              <div className="sp-promo-section">
                {!showPromoInput ? (
                  <button
                    type="button"
                    className="sp-promo-toggle"
                    onClick={() => setShowPromoInput(true)}
                  >
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
                      <path d="M20.59 13.41L13.42 20.58C13.2343 20.766 13.0137 20.9135 12.7709 21.0141C12.5281 21.1148 12.2678 21.1666 12.005 21.1666C11.7422 21.1666 11.4819 21.1148 11.2391 21.0141C10.9963 20.9135 10.7757 20.766 10.59 20.58L2 12V2H12L20.59 10.59C20.9625 10.9647 21.1716 11.4716 21.1716 12C21.1716 12.5284 20.9625 13.0353 20.59 13.41Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M7 7H7.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {t('subscriptionPayment.havePromoCode') || 'Have a promo code?'}
                  </button>
                ) : (
                  <div className="sp-promo-input-wrapper">
                    <div className="sp-promo-input-row">
                      <input
                        type="text"
                        className="sp-promo-input"
                        placeholder={t('subscriptionPayment.enterPromoCode') || 'Enter promo code'}
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                        maxLength={10}
                        disabled={promoStatus === "valid"}
                      />
                      {promoStatus !== "valid" ? (
                        <button
                          type="button"
                          className="sp-promo-apply-btn"
                          onClick={validatePromoCode}
                          disabled={promoStatus === "checking" || !promoCode.trim()}
                        >
                          {promoStatus === "checking" ? "..." : (t('subscriptionPayment.apply') || 'Apply')}
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="sp-promo-clear-btn"
                          onClick={clearPromoCode}
                        >
                          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
                            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      )}
                    </div>

                    {promoStatus === "valid" && promoData?.type === "activation" && (
                      <div className="sp-promo-success sp-promo-activation">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="18" height="18">
                          <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <div>
                          <strong>{t('subscriptionPayment.promoActivated') || 'Promoter Code Activated!'}</strong>
                          <p>{t('subscriptionPayment.promoActivatedDesc') || 'You will receive FREE platform access. No payment required.'}</p>
                        </div>
                      </div>
                    )}

                    {promoStatus === "valid" && promoData?.type === "referral" && (
                      <div className="sp-promo-success">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="18" height="18">
                          <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <div>
                          <strong>{(t('subscriptionPayment.promoDiscount') || '{{pct}}% off for {{months}} month!').replace('{{pct}}', promoData.discount_percent).replace('{{months}}', promoData.discount_duration)}</strong>
                          <p>{(t('subscriptionPayment.promoCodeFrom') || 'Code from: {{name}}').replace('{{name}}', promoData.promoter_name)}</p>
                        </div>
                      </div>
                    )}

                    {promoStatus === "invalid" && (
                      <div className="sp-promo-error">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                          <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                        {t('subscriptionPayment.invalidPromo') || 'Invalid or expired promo code'}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Hide card details for activation codes */}
              {promoData?.type !== "activation" && (
                <>
                  <label className="sp-label">{t('subscriptionPayment.cardDetails') || 'Card Details'}</label>
                  <div className="sp-card-element-wrapper">
                    <CardElement
                  options={{
                    style: {
                      base: {
                        fontSize: "16px",
                        color: "#0F223D",
                        fontFamily: "'Poppins', sans-serif",
                        "::placeholder": {
                          color: "#7F8C8D",
                        },
                      },
                      invalid: {
                        color: "#E74C3C",
                        iconColor: "#E74C3C",
                      },
                    },
                    hidePostalCode: true,
                  }}
                />
              </div>
                </>
              )}

              {message && (
                <div className="sp-error-message">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  {message}
                </div>
              )}

              <button
                type="submit"
                className="sp-submit-btn"
                disabled={promoData?.type === "activation" ? loading : (!stripe || loading)}
              >
                {loading ? (
                  <>
                    <span className="sp-spinner"></span>
                    {promoData?.type === "activation"
                      ? (t('subscriptionPayment.activating') || 'Activating...')
                      : (t('subscriptionPayment.processing') || 'Processing...')}
                  </>
                ) : promoData?.type === "activation" ? (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {t('subscriptionPayment.activateFreeAccess') || 'Activate Free Access'}
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2"/>
                      <path d="M8 12L11 15L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {t('subscriptionPayment.startFreeTrial') || 'Start Free Trial'}
                  </>
                )}
              </button>

              {promoData?.type !== "activation" && (
                <p className="sp-card-note">
                  {(t('subscriptionPayment.cardChargeNote') || 'Your card will be charged ${{amount}} (incl. tax) after the trial ends. Cancel anytime.')
                    .replace('{{amount}}', currentPlan.totalWithTax.toFixed(2))}
                </p>
              )}
            </form>
          </div>
        </div>

        {/* Security Footer - Bottom spanning full width */}
        <div className="sp-security-footer">
          <div className="sp-security-item">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2"/>
              <path d="M7 11V7C7 4.23858 9.23858 2 12 2C14.7614 2 17 4.23858 17 7V11" stroke="currentColor" strokeWidth="2"/>
            </svg>
            <span>{t('unlockBudget.secure') || 'Secure'}</span>
          </div>
          <div className="sp-security-divider"></div>
          <div className="sp-security-item">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>{t('unlockBudget.verified') || 'Verified'}</span>
          </div>
          <div className="sp-security-divider"></div>
          <div className="sp-security-item sp-stripe-badge">
            <span>{t('unlockBudget.poweredBy') || 'Powered by'}</span>
            <strong>Stripe</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function SubscriptionPaymentModal({ token, planType = "basic", handleCloseModal }) {
  const { language } = useLanguage();
  return (
    <Elements stripe={stripePromise} options={{ locale: language === 'fr' ? 'fr' : 'en' }}>
      <SubscriptionPaymentForm
        token={token}
        planType={planType}
        handleCloseModal={handleCloseModal}
      />
    </Elements>
  );
}
