import React, { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  useStripe,
  useElements,
  CardElement,
} from "@stripe/react-stripe-js";
import "../styles/entrepreneur/subscriptionpayment.css"
import logo from "../assets/logo-light.png";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// Closing/Loading Screen Component
const ClosingScreen = () => {
  return (
    <div className="sp-overlay sp-closing-overlay">
      <div className="sp-closing-content">
        <div className="sp-closing-spinner"></div>
        <div className="sp-closing-icon">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h3 className="sp-closing-title">Payment Successful</h3>
        <p className="sp-closing-text">Activating your subscription...</p>
      </div>
    </div>
  );
};

// Success/Thank You Modal Component
const ThankYouModal = ({ planType, onClose }) => {
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
          <h2 className="sp-success-title">Welcome to Premium!</h2>
          <p className="sp-success-subtitle">
            Your {planType === "premium" ? "Premium" : "Basic"} subscription is now active.
          </p>

          {/* Email notice */}
          <p className="sp-success-email-notice">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
              <path d="M22 6L12 13L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Confirmation sent to your email
          </p>
        </div>

        {/* Right Column - Benefits & CTA */}
        <div className="sp-success-right">
          <h3 className="sp-benefits-title">What's included</h3>

          <div className="sp-success-benefits">
            <div className="sp-benefit-item">
              <div className="sp-benefit-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 8V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <div className="sp-benefit-content">
                <strong>14-Day Free Trial</strong>
                <span>Your trial starts today - no charges until it ends</span>
              </div>
            </div>

            <div className="sp-benefit-item">
              <div className="sp-benefit-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="sp-benefit-content">
                <strong>Premium Features</strong>
                <span>Unlimited budget unlocks & advanced analytics</span>
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
                <strong>Priority Visibility</strong>
                <span>Stand out to property managers seeking bids</span>
              </div>
            </div>

            <div className="sp-benefit-item">
              <div className="sp-benefit-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="sp-benefit-content">
                <strong>Dedicated Support</strong>
                <span>Priority assistance whenever you need help</span>
              </div>
            </div>
          </div>

          <button
            className="sp-success-btn"
            onClick={onClose}
          >
            <span>Start Exploring</span>
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
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Handle closing after successful payment
  const handleSuccessClose = () => {
    setIsClosing(true);
    // Show closing screen for a moment before actually closing
    setTimeout(() => {
      handleCloseModal(true);
    }, 1200);
  };

  const planDetails = {
    premium: {
      name: "Premium Plan",
      price: "$429",
      period: "month",
      features: [
        "Unlimited budget unlocks",
        "Advanced analytics dashboard",
        "Priority listing visibility",
        "Dedicated support channel"
      ]
    },
    basic: {
      name: "Basic Plan",
      price: "$250",
      period: "month",
      features: [
        "10 budget unlocks/month",
        "Basic analytics",
        "Standard visibility",
        "Email support"
      ]
    }
  };

  const currentPlan = planDetails[planType] || planDetails.basic;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setMessage("");

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
        }),
      });

      const data = await res.json();
      console.log("SUBSCRIPTION DATA", data);

      if (res.ok) {
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
              {planType === 'premium' ? 'PREMIUM' : 'BASIC'}
            </div>

            {/* Plan Info */}
            <h2 className="sp-left-title">{currentPlan.name}</h2>
            <div className="sp-left-price">
              <span className="sp-price-amount">{currentPlan.price}</span>
              <span className="sp-price-period">/{currentPlan.period}</span>
            </div>

            {/* Trial Badge */}
            <div className="sp-left-trial">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 8V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
              </svg>
              14-Day Free Trial
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
            <h3 className="sp-right-title">Complete Payment</h3>
            <p className="sp-right-subtitle">Start your 14-day free trial today</p>

            {/* Payment Summary */}
            <div className="sp-summary">
              <div className="sp-summary-header">
                <span>Payment Summary</span>
              </div>
              <div className="sp-summary-row">
                <span>{currentPlan.name}</span>
                <strong>{currentPlan.price}/{currentPlan.period}</strong>
              </div>
              <div className="sp-summary-row sp-trial-row">
                <span>14-Day Trial</span>
                <strong className="sp-free">FREE</strong>
              </div>
              <div className="sp-summary-total">
                <span>Due Today</span>
                <strong>$0.00</strong>
              </div>
            </div>

            {/* Payment Form */}
            <form onSubmit={handleSubmit} className="sp-form">
              <label className="sp-label">Card Details</label>
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
                disabled={!stripe || loading}
              >
                {loading ? (
                  <>
                    <span className="sp-spinner"></span>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2"/>
                      <path d="M8 12L11 15L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Start Free Trial
                  </>
                )}
              </button>

              <p className="sp-card-note">
                Your card will be charged {currentPlan.price} after the trial ends. Cancel anytime.
              </p>
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
            <span>Secure</span>
          </div>
          <div className="sp-security-divider"></div>
          <div className="sp-security-item">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Verified</span>
          </div>
          <div className="sp-security-divider"></div>
          <div className="sp-security-item sp-stripe-badge">
            <span>Powered by</span>
            <strong>Stripe</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function SubscriptionPaymentModal({ token, planType = "basic", handleCloseModal }) {
  return (
    <Elements stripe={stripePromise}>
      <SubscriptionPaymentForm
        token={token}
        planType={planType}
        handleCloseModal={handleCloseModal}
      />
    </Elements>
  );
}
