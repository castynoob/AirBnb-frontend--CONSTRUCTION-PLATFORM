import React, { useState } from "react";
import {
  Elements,
  useStripe,
  useElements,
  CardElement,
} from "@stripe/react-stripe-js";
import "../styles/entrepreneur/subscriptionpayment.css";
import logo from "../assets/logo-light.png";
import { stripePromise } from "../utils/stripeConfig";
import { useLanguage } from "../contexts/LanguageContext";

// Success Modal Component
const SuccessModal = ({ onClose }) => {
  const { t } = useLanguage();
  return (
    <div className="sp-overlay" onClick={onClose}>
      <div className="sp-success-modal sp-update-success" onClick={(e) => e.stopPropagation()}>
        <button className="sp-success-close" onClick={onClose}>
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <div className="sp-success-left">
          <div className="sp-success-decoration">
            <div className="sp-decoration-circle"></div>
            <div className="sp-decoration-circle"></div>
            <div className="sp-decoration-circle"></div>
          </div>

          <div className="sp-success-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          <div className="sp-success-brand">
            <img src={logo} alt="Intervos" className="sp-success-logo" />
            <span className="sp-brand-text">INTERVOS</span>
          </div>

          <h2 className="sp-success-title">{t('updatePayment.methodUpdated') || 'Payment Method Updated!'}</h2>
          <p className="sp-success-subtitle">
            {t('updatePayment.methodUpdatedSubtitle') || 'Your new payment method has been saved successfully.'}
          </p>
        </div>

        <div className="sp-success-right">
          <h3 className="sp-benefits-title">{t('updatePayment.whatHappensNext') || 'What happens next'}</h3>

          <div className="sp-success-benefits">
            <div className="sp-benefit-item">
              <div className="sp-benefit-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
                  <path d="M2 10H22" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <div className="sp-benefit-content">
                <strong>{t('updatePayment.newCardActive') || 'New Card Active'}</strong>
                <span>{t('updatePayment.newCardActiveDesc') || 'Future payments will use your new card'}</span>
              </div>
            </div>

            <div className="sp-benefit-item">
              <div className="sp-benefit-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 8V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <div className="sp-benefit-content">
                <strong>{t('updatePayment.automaticRetry') || 'Automatic Retry'}</strong>
                <span>{t('updatePayment.automaticRetryDesc') || "If you had a failed payment, we'll retry it automatically"}</span>
              </div>
            </div>

            <div className="sp-benefit-item">
              <div className="sp-benefit-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="sp-benefit-content">
                <strong>{t('updatePayment.subscriptionRestored') || 'Subscription Restored'}</strong>
                <span>{t('updatePayment.accessRestored') || 'Your access has been fully restored'}</span>
              </div>
            </div>
          </div>

          <button className="sp-success-btn" onClick={onClose}>
            <span>{t('common.continue') || 'Continue'}</span>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

const UpdatePaymentMethodForm = ({ token, onClose, onSuccess }) => {
  const { t } = useLanguage();
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSuccessClose = () => {
    if (onSuccess) onSuccess();
    onClose();
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
      const res = await fetch(`${API_BASE_URL}/api/payments/payment-method`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          payment_method_id: paymentMethod.id,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setShowSuccess(true);
      } else {
        setMessage(data.error || data.message || "Failed to update payment method. Please try again.");
      }
    } catch (err) {
      setMessage("Failed to update payment method. Please try again later.");
    }

    setLoading(false);
  };

  if (showSuccess) {
    return <SuccessModal onClose={handleSuccessClose} />;
  }

  return (
    <div className="sp-overlay" onClick={onClose}>
      <div className="sp-modal sp-single-column" onClick={(e) => e.stopPropagation()}>
        <button className="sp-close-btn" onClick={onClose}>
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <div className="sp-update-header">
          <div className="sp-update-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
              <path d="M2 10H22" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
          <h3 className="sp-right-title">{t('updatePayment.title') || 'Update Payment Method'}</h3>
          <p className="sp-right-subtitle">{t('updatePayment.subtitle') || 'Enter your new card details below'}</p>
        </div>

        <form onSubmit={handleSubmit} className="sp-form">
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
                {t('updatePayment.updating') || 'Updating...'}
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M8 12L11 15L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {t('updatePayment.title') || 'Update Payment Method'}
              </>
            )}
          </button>

          <p className="sp-card-note">
            {t('updatePayment.cardNote') || 'Your new card will be used for all future subscription payments.'}
          </p>
        </form>

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

export default function UpdatePaymentMethodModal({ token, onClose, onSuccess }) {
  const { language } = useLanguage();
  return (
    <Elements stripe={stripePromise} options={{ locale: language === 'fr' ? 'fr' : 'en' }}>
      <UpdatePaymentMethodForm
        token={token}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    </Elements>
  );
}
