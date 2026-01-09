import React, { useState, useEffect } from 'react';
import { startOnboarding, getConnectStatus, getDashboardLink } from '../utils/stripeConnectApi';
import { useLanguage } from '../contexts/LanguageContext';
import '../styles/entrepreneur/stripeconnectmodal.css';
import logo from '../assets/logo.png';

export default function StripeConnectModal({
  onClose,
  showSkipButton = true,
  isApprovedBid = false,
  onComplete = () => {}
}) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const statusData = await getConnectStatus();
      setStatus(statusData);
    } catch (err) {
      console.error('Error checking Stripe status:', err);
    }
  };

  const handleStartOnboarding = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await startOnboarding();

      if (result.already_complete) {
        setStatus(result.status);
        onComplete();
        return;
      }

      // Redirect to Stripe's hosted onboarding
      if (result.url) {
        window.location.href = result.url;
      }
    } catch (err) {
      console.error('Onboarding error:', err);
      setError(err.message || t('stripeConnectModal.failedOnboarding'));
    } finally {
      setLoading(false);
    }
  };

  const handleViewDashboard = async () => {
    try {
      const result = await getDashboardLink();
      if (result.url) {
        window.open(result.url, '_blank');
      }
    } catch (err) {
      console.error('Dashboard error:', err);
      setError(t('stripeConnectModal.failedDashboard'));
    }
  };

  const handleSkip = () => {
    // Store that user has seen this modal
    localStorage.setItem('stripe_onboarding_skipped', 'true');
    localStorage.setItem('stripe_onboarding_skipped_at', new Date().toISOString());
    onClose();
  };

  // Already completed
  if (status?.onboarding_complete) {
    return (
      <div className="stripe-connect-modal">
        <div className="stripe-modal-overlay" onClick={onClose} />
        <div className="stripe-modal-content">
          <button className="stripe-close-btn" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          <div className="stripe-modal-header">
            <div className="stripe-success-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" fill="#2ECC71"/>
                <path d="M8 12l3 3 5-6" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2>{t('stripeConnectModal.paymentSetupComplete')}</h2>
            <p className="stripe-subtitle">
              {t('stripeConnectModal.accountConnectedDesc')}
            </p>
          </div>

          <div className="stripe-status-card success">
            <div className="status-row">
              <span>{t('stripeConnectModal.accountStatus')}</span>
              <span className="status-badge success">{t('stripeConnectModal.active')}</span>
            </div>
            <div className="status-row">
              <span>{t('stripeConnectModal.canReceivePayments')}</span>
              <span className="status-badge success">{t('stripeConnectModal.yes')}</span>
            </div>
          </div>

          <div className="stripe-modal-actions">
            <button className="stripe-btn-secondary" onClick={handleViewDashboard}>
              {t('stripeConnectModal.viewStripeDashboard')}
            </button>
            <button className="stripe-btn-primary" onClick={onClose}>
              {t('stripeConnectModal.continue')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="stripe-connect-modal">
      <div className="stripe-modal-overlay" onClick={showSkipButton ? onClose : undefined} />
      <div className="stripe-modal-content">
        {showSkipButton && (
          <button className="stripe-close-btn" onClick={handleSkip}>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}

        <div className="stripe-modal-header">
          <img src={logo} alt="INTERVOS Logo" className="stripe-logo" />
          <h2>{t('stripeConnectModal.setUpPaymentAccount')}</h2>
          <p className="stripe-subtitle">
            {isApprovedBid
              ? t('stripeConnectModal.bidApprovedDesc')
              : t('stripeConnectModal.connectStripeDesc')
            }
          </p>
        </div>

        <div className="stripe-benefits">
          <div className="benefit-item">
            <div className="benefit-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="#00A5A9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="#00A5A9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="benefit-text">
              <h4>{t('stripeConnectModal.securePayments')}</h4>
              <p>{t('stripeConnectModal.securePaymentsDesc')}</p>
            </div>
          </div>

          <div className="benefit-item">
            <div className="benefit-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 1v22M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 010 7H6" stroke="#00A5A9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="benefit-text">
              <h4>{t('stripeConnectModal.directDeposits')}</h4>
              <p>{t('stripeConnectModal.directDepositsDesc')}</p>
            </div>
          </div>

          <div className="benefit-item">
            <div className="benefit-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#00A5A9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="benefit-text">
              <h4>{t('stripeConnectModal.protectedEarnings')}</h4>
              <p>{t('stripeConnectModal.protectedEarningsDesc')}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="stripe-error-message">
            {error}
          </div>
        )}

        <div className="stripe-modal-actions">
          {showSkipButton && !isApprovedBid && (
            <button className="stripe-btn-secondary" onClick={handleSkip}>
              {t('stripeConnectModal.skipForNow')}
            </button>
          )}
          <button
            className="stripe-btn-primary"
            onClick={handleStartOnboarding}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="stripe-spinner"></span>
                {t('stripeConnectModal.connecting')}
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="stripe-icon">
                  <rect x="1" y="4" width="22" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
                  <line x1="1" y1="10" x2="23" y2="10" stroke="currentColor" strokeWidth="2"/>
                </svg>
                {t('stripeConnectModal.connectWithStripe')}
              </>
            )}
          </button>
        </div>

        <p className="stripe-footer-note">
          {t('stripeConnectModal.footerNote')}
        </p>

        <div className="stripe-powered-by">
          <span>{t('stripeConnectModal.poweredBy')}</span>
          <svg viewBox="0 0 60 25" fill="none" xmlns="http://www.w3.org/2000/svg" className="stripe-wordmark">
            <path d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95v3.32a12.09 12.09 0 01-4.56.88c-4.12 0-6.99-2.73-6.99-7.04 0-3.87 2.6-7.03 6.42-7.03 3.81 0 5.94 3.17 5.94 7.05v1.22zm-5.97-5.36c-1.27 0-2.25.95-2.49 2.61h4.81c-.1-1.53-.9-2.61-2.32-2.61zM40.95 20h4.3V6.26h-4.3V20zm-4.97-8.9c0-.7-.55-1.26-1.27-1.26-.7 0-1.27.56-1.27 1.26 0 .7.57 1.26 1.27 1.26.72 0 1.27-.56 1.27-1.26zM33.2 20h4.3V6.26h-4.3V20zm-4.97-7.65V6.26h-4.3v.46c0 1.54-.64 2.39-2.05 2.39h-.41v3.62h2.32v4.35c0 2.31 1.17 3.1 4.44 2.92v-3.24c-1.05.05-1.48-.17-1.48-.93v-3.1h1.48v-3.38h-1.48l1.48.01zM16.83 20h4.3V6.26h-4.3V20zm-4.97-8.9c0-.7-.55-1.26-1.27-1.26-.7 0-1.27.56-1.27 1.26 0 .7.57 1.26 1.27 1.26.72 0 1.27-.56 1.27-1.26zM9.1 20h4.3V6.26H9.1V20zM4.13 20H8.4V6.26H4.13V20zM0 13.66c0-3.94 2.98-7.63 7.75-7.63 4.44 0 7.21 3.32 7.21 7.4 0 4.19-2.96 7.56-7.59 7.56C2.96 21 0 17.59 0 13.66z" fill="#635BFF"/>
          </svg>
        </div>
      </div>
    </div>
  );
}
