import React, { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  useStripe,
  useElements,
  CardElement,
} from "@stripe/react-stripe-js";
import "../styles/entrepreneur/budgetunlock.css";
import logoLight from "../assets/logo-light.png";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// Closing/Loading Screen Component
const ClosingScreen = () => {
  return (
    <div className="ub-overlay ub-closing-overlay">
      <div className="ub-closing-content">
        <div className="ub-closing-spinner"></div>
        <div className="ub-closing-icon">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h3 className="ub-closing-title">Budget Unlocked!</h3>
        <p className="ub-closing-text">Refreshing job details...</p>
      </div>
    </div>
  );
};

// Success/Thank You Modal Component
const ThankYouModal = ({ onClose }) => {
  return (
    <div className="ub-overlay" onClick={onClose}>
      <div className="ub-success-modal" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="ub-success-close" onClick={onClose}>
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* Left Column - Branding & Success */}
        <div className="ub-success-left">
          {/* Decorative elements */}
          <div className="ub-success-decoration">
            <div className="ub-decoration-circle"></div>
            <div className="ub-decoration-circle"></div>
            <div className="ub-decoration-circle"></div>
          </div>

          {/* Success Icon */}
          <div className="ub-success-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          {/* Branding */}
          <div className="ub-success-brand">
            <img src={logoLight} alt="Intervos" className="ub-success-logo" />
            <span className="ub-brand-text">INTERVOS</span>
          </div>

          {/* Welcome Message */}
          <h2 className="ub-success-title">Budget Unlocked!</h2>
          <p className="ub-success-subtitle">
            You now have access to the full budget details for this job. Use this information wisely to craft a winning bid!
          </p>

          {/* Info Notice */}
          <div className="ub-success-notice">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 16V12M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span>Receipt sent to your email</span>
          </div>
        </div>

        {/* Right Column - Benefits & CTA */}
        <div className="ub-success-right">
          <h3 className="ub-benefits-title">What You've Unlocked</h3>

          <div className="ub-success-benefits">
            <div className="ub-benefit-item">
              <div className="ub-benefit-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2V6M12 18V22M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07M2 12H6M18 12H22M4.93 19.07L7.76 16.24M16.24 7.76L19.07 4.93" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="ub-benefit-content">
                <strong>Full Budget Visibility</strong>
                <span>See the exact min and max budget range</span>
              </div>
            </div>

            <div className="ub-benefit-item">
              <div className="ub-benefit-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="ub-benefit-content">
                <strong>Competitive Advantage</strong>
                <span>Craft bids that align with client expectations</span>
              </div>
            </div>

            <div className="ub-benefit-item">
              <div className="ub-benefit-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="ub-benefit-content">
                <strong>Permanent Access</strong>
                <span>Budget info remains unlocked for this job</span>
              </div>
            </div>
          </div>

          <button className="ub-success-btn" onClick={onClose}>
            <span>View Job Budget</span>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

const UnlockBudgetForm = ({ jobId, token, handleBudgetModal }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showThankYou, setShowThankYou] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Handle closing after successful payment
  const handleSuccessClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      handleBudgetModal(true);
    }, 1200);
  };

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
      const res = await fetch(`${API_BASE_URL}/api/payments/unlock-budget`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          job_id: jobId,
          payment_method_id: paymentMethod.id,
        }),
      });

      const data = await res.json();
      console.log("PAYMENT DATA", data);

      if (res.ok) {
        setShowThankYou(true);
      } else {
        setMessage(data.error || data.message);
      }
    } catch (err) {
      setMessage("Payment failed. Try again later.");
    }

    setLoading(false);
  };

  // Show closing screen when user is closing after success
  if (isClosing) {
    return <ClosingScreen />;
  }

  // Show Thank You Modal on success
  if (showThankYou) {
    return <ThankYouModal onClose={handleSuccessClose} />;
  }

  return (
    <div className="ub-overlay" onClick={() => handleBudgetModal(false)}>
      <div className="ub-modal ub-two-column" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="ub-close-btn" onClick={() => handleBudgetModal(false)}>
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* Two Column Layout */}
        <div className="ub-columns">
          {/* Left Column - Benefits */}
          <div className="ub-left-column">
            {/* Decorative elements */}
            <div className="ub-left-decoration">
              <div className="ub-decoration-circle"></div>
              <div className="ub-decoration-circle"></div>
              <div className="ub-decoration-circle"></div>
            </div>

            {/* Branding */}
            <div className="ub-left-brand">
              <img src={logoLight} alt="Intervos" className="ub-left-logo" />
              <span className="ub-left-brand-text">INTERVOS</span>
            </div>

            {/* Lock Icon */}
            <div className="ub-left-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 15V17M6 21H18C19.1046 21 20 20.1046 20 19V13C20 11.8954 19.1046 11 18 11H6C4.89543 11 4 11.8954 4 13V19C4 20.1046 4.89543 21 6 21ZM16 11V7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7V11H16Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>

            {/* Title */}
            <h2 className="ub-left-title">Unlock Budget</h2>
            <p className="ub-left-subtitle">Gain the competitive edge with full budget visibility</p>

            {/* Benefits List */}
            <div className="ub-left-benefits">
              <div className="ub-left-benefit">
                <div className="ub-left-benefit-icon">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2V6M12 18V22M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07M2 12H6M18 12H22M4.93 19.07L7.76 16.24M16.24 7.76L19.07 4.93" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <div className="ub-left-benefit-text">
                  <strong>Full Budget Visibility</strong>
                  <span>See the exact min and max budget range</span>
                </div>
              </div>

              <div className="ub-left-benefit">
                <div className="ub-left-benefit-icon">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="ub-left-benefit-text">
                  <strong>Competitive Advantage</strong>
                  <span>Craft bids that align with expectations</span>
                </div>
              </div>

              <div className="ub-left-benefit">
                <div className="ub-left-benefit-icon">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="ub-left-benefit-text">
                  <strong>Permanent Access</strong>
                  <span>Budget info remains unlocked for this job</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Checkout */}
          <div className="ub-right-column">
            <h3 className="ub-right-title">Complete Payment</h3>
            <p className="ub-right-subtitle">One-time payment for this job</p>

            {/* Payment Summary */}
            <div className="ub-summary">
              <div className="ub-summary-header">
                <span>Payment Summary</span>
              </div>
              <div className="ub-summary-row">
                <span>Budget Unlock Fee</span>
                <strong>$20.00</strong>
              </div>
              <div className="ub-summary-total">
                <span>Total</span>
                <strong>$20.00</strong>
              </div>
            </div>

            {/* Payment Form */}
            <form onSubmit={handleSubmit} className="ub-form">
              <label className="ub-card-label">Card Details</label>
              <div className="ub-card-wrapper">
                <CardElement
                  options={{
                    style: {
                      base: {
                        fontSize: "16px",
                        color: "#0F223D",
                        fontFamily: "'Inter', sans-serif",
                        "::placeholder": {
                          color: "#9CA3AF",
                        },
                      },
                      invalid: {
                        color: "#E74C3C",
                      },
                    },
                    hidePostalCode: true,
                  }}
                />
              </div>

              {message && (
                <div className="ub-error-message">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 9V13M12 17H12.01M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <span>{message}</span>
                </div>
              )}

              <button type="submit" className="ub-submit-btn" disabled={!stripe || loading}>
                {loading ? (
                  <>
                    <div className="ub-btn-spinner"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 15V17M6 21H18C19.1046 21 20 20.1046 20 19V13C20 11.8954 19.1046 11 18 11H6C4.89543 11 4 11.8954 4 13V19C4 20.1046 4.89543 21 6 21ZM16 11V7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7V11H16Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <span>Unlock Budget — $20</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Security Footer - Bottom spanning full width */}
        <div className="ub-security-footer">
          <div className="ub-security-item">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Secure</span>
          </div>
          <div className="ub-security-divider"></div>
          <div className="ub-security-item">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Verified</span>
          </div>
          <div className="ub-security-divider"></div>
          <div className="ub-stripe-badge">
            Powered by <strong>Stripe</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function UnlockBudgetModal({ jobId, token, handleBudgetModal }) {
  return (
    <Elements stripe={stripePromise}>
      <UnlockBudgetForm
        jobId={jobId}
        token={token}
        handleBudgetModal={handleBudgetModal}
      />
    </Elements>
  );
}
