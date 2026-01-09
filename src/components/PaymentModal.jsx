import React, { useState, useEffect } from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { X, CreditCard, Shield, CheckCircle, AlertCircle, Building2, User, Briefcase } from 'lucide-react';
import '../styles/manager/paymentmodal.css';
import { stripePromise } from '../utils/stripeConfig';

// Stripe is now initialized dynamically from backend config
console.log('Stripe configured from backend');

// Payment Form Component (inside Elements provider)
function PaymentForm({ amount, onSuccess, onError, isProcessing, setIsProcessing }) {
  const stripe = useStripe();
  const elements = useElements();
  const [paymentError, setPaymentError] = useState(null);
  const [isReady, setIsReady] = useState(false);

  // Log when stripe and elements are available
  useEffect(() => {
    console.log('PaymentForm - stripe:', !!stripe, 'elements:', !!elements);
    if (stripe && elements) {
      setIsReady(true);
    }
  }, [stripe, elements]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      console.error('Stripe or elements not loaded');
      setPaymentError('Payment system not ready. Please try again.');
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/homepage/property_manager`,
        },
        redirect: 'if_required'
      });

      if (error) {
        console.error('Payment error:', error);
        setPaymentError(error.message);
        onError(error.message);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        console.log('Payment succeeded:', paymentIntent);
        onSuccess(paymentIntent);
      } else if (paymentIntent && paymentIntent.status === 'requires_action') {
        setPaymentError('Additional authentication required. Please complete the verification.');
      }
    } catch (err) {
      console.error('Payment exception:', err);
      setPaymentError(err.message);
      onError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="pm-payment-form">
      <div className="pm-payment-element-wrapper">
        <PaymentElement
          options={{
            layout: 'tabs'
          }}
          onReady={() => {
            console.log('PaymentElement is ready');
            setIsReady(true);
          }}
          onLoadError={(err) => {
            console.error('PaymentElement load error:', err);
            setPaymentError('Failed to load payment form. Please refresh and try again.');
          }}
        />
      </div>

      {paymentError && (
        <div className="pm-payment-error">
          <AlertCircle size={16} />
          <span>{paymentError}</span>
        </div>
      )}

      <button
        type="submit"
        className="pm-pay-button"
        disabled={!stripe || !elements || isProcessing}
      >
        {isProcessing ? (
          <>
            <div className="pm-spinner"></div>
            <span>Processing Payment...</span>
          </>
        ) : (
          <>
            <CreditCard size={18} />
            <span>Pay ${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </>
        )}
      </button>
    </form>
  );
}

// Main Payment Modal Component
export default function PaymentModal({
  isOpen,
  onClose,
  bidData,
  contractData,
  clientSecret,
  onPaymentSuccess,
  onPaymentError
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [stripeError, setStripeError] = useState(null);

  // Log when modal opens and clientSecret changes
  useEffect(() => {
    if (isOpen) {
      console.log('PaymentModal opened');
      console.log('- clientSecret exists:', !!clientSecret);
      console.log('- clientSecret value:', clientSecret ? clientSecret.substring(0, 20) + '...' : 'null');
      console.log('- bidData:', bidData);
      console.log('- stripePromise:', !!stripePromise);

      if (!stripePromise) {
        setStripeError('Stripe is not configured. Please add VITE_STRIPE_PUBLISHABLE_KEY to your .env file.');
      } else if (!clientSecret) {
        setStripeError('Payment session not initialized. Please try again.');
      } else {
        setStripeError(null);
      }
    }
  }, [isOpen, clientSecret, bidData]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setPaymentComplete(false);
      setIsProcessing(false);
      setStripeError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePaymentSuccess = (paymentIntent) => {
    setPaymentComplete(true);
    if (onPaymentSuccess) {
      onPaymentSuccess(paymentIntent);
    }
  };

  const handlePaymentError = (error) => {
    if (onPaymentError) {
      onPaymentError(error);
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      onClose();
    }
  };

  // Calculate amounts
  const bidAmount = parseFloat(bidData?.amount || contractData?.contract_amount || 0);

  // Only create stripeOptions if clientSecret exists
  const stripeOptions = clientSecret ? {
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#00A5A9',
        colorBackground: '#ffffff',
        colorText: '#0F223D',
        colorDanger: '#E74C3C',
        fontFamily: 'Inter, system-ui, sans-serif',
        borderRadius: '8px',
        spacingUnit: '4px'
      }
    }
  } : null;

  return (
    <div className="pm-modal-overlay" onClick={handleClose}>
      <div className="pm-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="pm-modal-header">
          <div className="pm-header-icon">
            <CreditCard size={24} />
          </div>
          <div className="pm-header-text">
            <h2>Approve & Pay</h2>
            <p>Complete payment to approve this bid</p>
          </div>
          <button
            className="pm-close-btn"
            onClick={handleClose}
            disabled={isProcessing}
          >
            <X size={20} />
          </button>
        </div>

        <div className="pm-modal-body">
          {paymentComplete ? (
            // Success State
            <div className="pm-success-state">
              <div className="pm-success-icon">
                <CheckCircle size={64} />
              </div>
              <h3>Payment Successful!</h3>
              <p>The bid has been approved and payment is being held securely until the work is completed.</p>
              <button className="pm-done-button" onClick={handleClose}>
                Done
              </button>
            </div>
          ) : (
            <>
              {/* Job & Contractor Info */}
              <div className="pm-info-section">
                <div className="pm-info-card">
                  <div className="pm-info-row">
                    <Briefcase size={16} />
                    <div className="pm-info-content">
                      <span className="pm-info-label">Job</span>
                      <span className="pm-info-value">{bidData?.job_title || 'Job Title'}</span>
                    </div>
                  </div>
                  <div className="pm-info-row">
                    <Building2 size={16} />
                    <div className="pm-info-content">
                      <span className="pm-info-label">Contractor</span>
                      <span className="pm-info-value">{bidData?.company_name || 'Company'}</span>
                    </div>
                  </div>
                  <div className="pm-info-row">
                    <User size={16} />
                    <div className="pm-info-content">
                      <span className="pm-info-label">Contact</span>
                      <span className="pm-info-value">{bidData?.contractor_name || 'Contractor'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Breakdown */}
              <div className="pm-breakdown-section">
                <h4>Payment Breakdown</h4>
                <div className="pm-breakdown-card">
                  <div className="pm-breakdown-row">
                    <span>Bid Amount</span>
                    <span className="pm-amount">${bidAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="pm-breakdown-row pm-total">
                    <span>Total Payment</span>
                    <span className="pm-amount pm-total-amount">${bidAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
                <p className="pm-breakdown-note">
                  <Shield size={14} />
                  Payment is held securely until you approve the completed work
                </p>
              </div>

              {/* Stripe Payment Form */}
              <div className="pm-payment-section">
                <h4>Payment Method</h4>
                {stripeError ? (
                  <div className="pm-payment-error">
                    <AlertCircle size={16} />
                    <span>{stripeError}</span>
                  </div>
                ) : clientSecret && stripePromise && stripeOptions ? (
                  <Elements stripe={stripePromise} options={stripeOptions}>
                    <PaymentForm
                      amount={bidAmount}
                      onSuccess={handlePaymentSuccess}
                      onError={handlePaymentError}
                      isProcessing={isProcessing}
                      setIsProcessing={setIsProcessing}
                    />
                  </Elements>
                ) : (
                  <div className="pm-loading-state">
                    <div className="pm-spinner"></div>
                    <span>Loading payment form...</span>
                  </div>
                )}
              </div>

              {/* Security Note */}
              <div className="pm-security-note">
                <Shield size={16} />
                <span>Payments are securely processed by Stripe</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
