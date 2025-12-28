import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getConnectStatus } from '../../utils/stripeConnectApi';
import '../../styles/entrepreneur/stripeconnectmodal.css';
import logo from '../../assets/logo.png';

const StripeOnboardingCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [stripeStatus, setStripeStatus] = useState(null);

  const isSuccess = searchParams.get('success') === 'true';
  const isRefresh = searchParams.get('refresh') === 'true';

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const statusData = await getConnectStatus();
        setStripeStatus(statusData);

        if (statusData.onboarding_complete) {
          setStatus('complete');
          // Clear the skipped flag since they completed it
          localStorage.removeItem('stripe_onboarding_skipped');
          localStorage.removeItem('stripe_onboarding_skipped_at');
        } else if (isRefresh) {
          setStatus('incomplete');
        } else {
          setStatus('incomplete');
        }
      } catch (err) {
        console.error('Error checking status:', err);
        setStatus('error');
      }
    };

    checkStatus();
  }, [isSuccess, isRefresh]);

  const handleContinue = () => {
    navigate('/homepage/entrepreneur');
  };

  const handleRetryOnboarding = async () => {
    try {
      const { startOnboarding } = await import('../../utils/stripeConnectApi');
      const result = await startOnboarding();
      if (result.url) {
        window.location.href = result.url;
      }
    } catch (err) {
      console.error('Error starting onboarding:', err);
    }
  };

  if (status === 'loading') {
    return (
      <div className="stripe-callback-container">
        <div className="stripe-callback-card">
          <div className="stripe-callback-loading">
            <div className="stripe-spinner-large"></div>
            <p>Verifying your account setup...</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'complete') {
    return (
      <div className="stripe-callback-container">
        <div className="stripe-callback-card">
          <div className="stripe-callback-header">
            <img src={logo} alt="INTERVOS" className="stripe-callback-logo" />
            <div className="stripe-success-icon-large">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" fill="#2ECC71"/>
                <path d="M8 12l3 3 5-6" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h1>Payment Setup Complete!</h1>
            <p>Your Stripe account is now fully connected. You can receive payments for your work.</p>
          </div>

          <div className="stripe-callback-status">
            <div className="status-item">
              <span className="status-label">Account Status</span>
              <span className="status-value success">Active</span>
            </div>
            <div className="status-item">
              <span className="status-label">Payments</span>
              <span className="status-value success">Enabled</span>
            </div>
            <div className="status-item">
              <span className="status-label">Payouts</span>
              <span className="status-value success">Enabled</span>
            </div>
          </div>

          <button className="stripe-callback-btn primary" onClick={handleContinue}>
            Continue to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Incomplete or error status
  return (
    <div className="stripe-callback-container">
      <div className="stripe-callback-card">
        <div className="stripe-callback-header">
          <img src={logo} alt="INTERVOS" className="stripe-callback-logo" />
          <div className="stripe-warning-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" fill="#F39C12"/>
              <path d="M12 8v4M12 16h.01" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1>Setup Not Complete</h1>
          <p>
            {isRefresh
              ? "Your session expired. Please continue where you left off."
              : "There are still some steps to complete before you can receive payments."
            }
          </p>
        </div>

        {stripeStatus && !stripeStatus.onboarding_complete && stripeStatus.requirements?.length > 0 && (
          <div className="stripe-callback-requirements">
            <h3>Remaining Steps:</h3>
            <ul>
              {stripeStatus.requirements.slice(0, 3).map((req, i) => (
                <li key={i}>{req.replace(/_/g, ' ')}</li>
              ))}
              {stripeStatus.requirements.length > 3 && (
                <li>...and {stripeStatus.requirements.length - 3} more</li>
              )}
            </ul>
          </div>
        )}

        <div className="stripe-callback-actions">
          <button className="stripe-callback-btn secondary" onClick={handleContinue}>
            Complete Later
          </button>
          <button className="stripe-callback-btn primary" onClick={handleRetryOnboarding}>
            Continue Setup
          </button>
        </div>
      </div>
    </div>
  );
};

export default StripeOnboardingCallback;
