import React, { useState } from 'react';
import '../styles/entrepreneur/subscriptionmodal.css'
import logo from '../assets/logo.png'
import SubscriptionPaymentForm from '../components/SubscriptionPaymentModal'
import { useLanguage } from '../contexts/LanguageContext';

export default function SubscriptionModal({token, refresher, onClose, showCloseButton = true}) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(true);
  const [showPayment, setShowPayment] = useState(false)
  const [planType, setPlanType] = useState('')

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      setIsOpen(false);
    }
  };

  const features = [
    { name: t('subscriptionModal.browseJobs'), noSub: false, starter: true, basic: true, premium: true },
    { name: t('subscriptionModal.viewJobDetails'), noSub: false, starter: true, basic: true, premium: true },
    { name: t('subscriptionModal.submitBids'), noSub: false, starter: t('subscriptionModal.max15'), basic: t('subscriptionModal.max30'), premium: t('subscriptionModal.unlimited') },
    { name: t('subscriptionModal.unlockBudget'), noSub: false, starter: true, basic: true, premium: true },
    { name: t('subscriptionModal.messageApproved'), noSub: false, starter: true, basic: true, premium: true },
    { name: t('subscriptionModal.projectBudgetLimit'), noSub: false, starter: t('subscriptionModal.budget2500Max'), basic: t('subscriptionModal.unlimited'), premium: t('subscriptionModal.unlimited') },
    { name: t('subscriptionModal.prioritySupportFeature'), noSub: false, starter: false, basic: false, premium: true },
  ];

  const handleSubsciption = (type) => {
    setPlanType(type)
    setShowPayment(true)
  }

  const handleCloseModal = (success) => {
    setShowPayment(false)
    if(success) {
      refresher()
    }
  }

  if (!isOpen) {
    return (
      <div className="reopen-container">
        <button className="reopen-btn" onClick={() => setIsOpen(true)}>
          {t('subscriptionModal.viewSubscriptionPlans')}
        </button>
      </div>
    );
  }

  return (
    <>
      {
        showPayment &&
        <SubscriptionPaymentForm token={token} planType={planType} handleCloseModal={handleCloseModal} />
      }

      <div className="subscription-modal">
        <div className="modal-overlay" onClick={showCloseButton ? handleClose : undefined}/>

        <div className="modal-content subs">
          {showCloseButton && (
            <button className="subs-close-btn" onClick={handleClose} aria-label={t('subscriptionModal.closeModal')}>
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
          <div className="modal-header">
            <img src={logo} alt="INTERVOS Logo" className="logo" />
            <div className="sub-message">
              <h2>{t('subscriptionModal.title')}</h2>
              <p className="subtitle">
                {t('subscriptionModal.subtitle')}
              </p>
            </div>
          </div>

          <div className="plans-container">
            {/* Starter Plan */}
              <div className="plan-card">
                <div className="plan-header">
                  <div className="plan-label">{t('subscriptionModal.starterPlan')}</div>
                  <div className="price">
                    <span className="currency">$</span>
                    <span className="amount">{t('subscriptionModal.starterPrice')}</span>
                    <span className="period">{t('subscriptionModal.starterPeriod')}</span>
                  </div>
                  <div className="plan-description">
                    {t('subscriptionModal.starterDescription')}
                  </div>
                </div>

                <ul className="features-list">
                  <li className="feature-item">
                    <svg width="20" height="20" viewBox="0 0 20 20" className="feature-icon">
                      <circle cx="10" cy="10" r="10" fill="#2ECC71"/>
                      <path d="M6 10l3 3 5-6" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>{t('subscriptionModal.browseViewJobs')}</span>
                  </li>
                  <li className="feature-item">
                    <svg width="20" height="20" viewBox="0 0 20 20" className="feature-icon">
                      <circle cx="10" cy="10" r="10" fill="#2ECC71"/>
                      <path d="M6 10l3 3 5-6" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>{t('subscriptionModal.submitUpTo15Bids')}</span>
                  </li>
                  {/* Budget unlock is NOT a plan feature — it's a separate per-job
                      $19.99 purchase available to all subscribers regardless of tier. */}
                  <li className="feature-item">
                    <svg width="20" height="20" viewBox="0 0 20 20" className="feature-icon">
                      <circle cx="10" cy="10" r="10" fill="#2ECC71"/>
                      <path d="M6 10l3 3 5-6" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>{t('subscriptionModal.messageApprovedContacts')}</span>
                  </li>
                </ul>

                <p className="plan-restriction">{t('subscriptionModal.starterRestriction')}</p>
                <button className="cta-btn btn-basic" onClick={() => handleSubsciption('starter')}>{t('subscriptionModal.startStarterTrial')}</button>
              </div>

            {/* Basic Plan */}
              <div className="plan-card">
                <div className="plan-header">
                  <div className="plan-label">{t('subscriptionModal.basicPlan')}</div>
                  <div className="price">
                    <span className="currency">$</span>
                    <span className="amount">{t('subscriptionModal.basicPrice')}</span>
                    <span className="period">{t('subscriptionModal.basicPeriod')}</span>
                  </div>
                  <div className="plan-description">
                    {t('subscriptionModal.basicDescription')}
                  </div>
                </div>

                <ul className="features-list">
                  <li className="feature-item">
                    <svg width="20" height="20" viewBox="0 0 20 20" className="feature-icon">
                      <circle cx="10" cy="10" r="10" fill="#2ECC71"/>
                      <path d="M6 10l3 3 5-6" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>{t('subscriptionModal.browseViewJobs')}</span>
                  </li>
                  <li className="feature-item">
                    <svg width="20" height="20" viewBox="0 0 20 20" className="feature-icon">
                      <circle cx="10" cy="10" r="10" fill="#2ECC71"/>
                      <path d="M6 10l3 3 5-6" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>{t('subscriptionModal.submitUpTo30Bids')}</span>
                  </li>
                  {/* Budget unlock is NOT a plan feature — it's a separate per-job
                      $19.99 purchase available to all subscribers regardless of tier. */}
                  <li className="feature-item">
                    <svg width="20" height="20" viewBox="0 0 20 20" className="feature-icon">
                      <circle cx="10" cy="10" r="10" fill="#2ECC71"/>
                      <path d="M6 10l3 3 5-6" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>{t('subscriptionModal.messageApprovedContacts')}</span>
                  </li>
                </ul>

                <button className="cta-btn btn-basic" onClick={() => handleSubsciption('basic')}>{t('subscriptionModal.startBasicTrial')}</button>
              </div>
            

              <div className="plan-card premium">
                <div className="plan-badge">{t('subscriptionModal.recommended')}</div>

                <div className="plan-header">
                  <div className="plan-label">{t('subscriptionModal.premiumPlan')}</div>
                  <div className="price">
                    <span className="currency">$</span>
                    <span className="amount">{t('subscriptionModal.premiumPrice')}</span>
                    <span className="period">{t('subscriptionModal.premiumPeriod')}</span>
                  </div>
                  <div className="plan-description">
                    {t('subscriptionModal.premiumDescription')}
                  </div>
                </div>

                <ul className="features-list">
                  <li className="feature-item">
                    <svg width="20" height="20" viewBox="0 0 20 20" className="feature-icon">
                      <circle cx="10" cy="10" r="10" fill="#2ECC71"/>
                      <path d="M6 10l3 3 5-6" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>{t('subscriptionModal.browseViewJobs')}</span>
                  </li>
                  <li className="feature-item highlight">
                    <svg width="20" height="20" viewBox="0 0 20 20" className="feature-icon">
                      <circle cx="10" cy="10" r="10" fill="#00A5A9"/>
                      <path d="M6 10l3 3 5-6" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>{t('subscriptionModal.submitUnlimitedBids')}</span>
                  </li>
                  {/* Budget unlock is NOT a plan feature — it's a separate per-job
                      $19.99 purchase available to all subscribers regardless of tier. */}
                  <li className="feature-item">
                    <svg width="20" height="20" viewBox="0 0 20 20" className="feature-icon">
                      <circle cx="10" cy="10" r="10" fill="#2ECC71"/>
                      <path d="M6 10l3 3 5-6" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>{t('subscriptionModal.messageApprovedContacts')}</span>
                  </li>
                  <li className="feature-item highlight">
                    <svg width="20" height="20" viewBox="0 0 20 20" className="feature-icon">
                      <circle cx="10" cy="10" r="10" fill="#00A5A9"/>
                      <path d="M6 10l3 3 5-6" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>{t('subscriptionModal.prioritySupport')}</span>
                  </li>
                </ul>

                <button className="cta-btn btn-premium" onClick={() => handleSubsciption('premium')}>{t('subscriptionModal.startPremiumTrial')}</button>
              </div>
          </div>

          {/* Comparison Table */}
          <div className="comparison-section">
            <h3 className="comparison-title">{t('subscriptionModal.comparisonTitle')}</h3>

            <div className="table-wrapper">
              <table className="comparison-table">
                <thead>
                  <tr>
                    <th>{t('subscriptionModal.feature')}</th>
                    <th>{t('subscriptionModal.noSub')}</th>
                    <th>{t('subscriptionModal.starterPlan')}</th>
                    <th>{t('subscriptionModal.basicPlan')}</th>
                    <th>{t('subscriptionModal.premiumPlan')}</th>
                  </tr>
                </thead>
                <tbody>
                  {features.map((feature, index) => (
                    <tr key={index}>
                      <td>{feature.name}</td>
                      <td>
                        {feature.noSub ? (
                          <svg width="24" height="24" viewBox="0 0 24 24" className="status-icon">
                            <circle cx="12" cy="12" r="11" fill="#2ECC71" opacity="0.15"/>
                            <circle cx="12" cy="12" r="9" fill="#2ECC71"/>
                            <path d="M7 12l4 4 6-7" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        ) : (
                          <svg width="24" height="24" viewBox="0 0 24 24" className="status-icon">
                            <circle cx="12" cy="12" r="11" fill="#E74C3C" opacity="0.15"/>
                            <circle cx="12" cy="12" r="9" fill="#E74C3C"/>
                            <path d="M8 8l8 8M16 8l-8 8" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                          </svg>
                        )}
                      </td>
                      <td>
                        {feature.starter === true ? (
                          <svg width="24" height="24" viewBox="0 0 24 24" className="status-icon">
                            <circle cx="12" cy="12" r="11" fill="#2ECC71" opacity="0.15"/>
                            <circle cx="12" cy="12" r="9" fill="#2ECC71"/>
                            <path d="M7 12l4 4 6-7" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        ) : feature.starter ? (
                          <div>
                            <svg width="24" height="24" viewBox="0 0 24 24" className="status-icon">
                              <circle cx="12" cy="12" r="11" fill="#2ECC71" opacity="0.15"/>
                              <circle cx="12" cy="12" r="9" fill="#2ECC71"/>
                              <path d="M7 12l4 4 6-7" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <div className="limit-text">({feature.starter})</div>
                          </div>
                        ) : (
                          <svg width="24" height="24" viewBox="0 0 24 24" className="status-icon">
                            <circle cx="12" cy="12" r="11" fill="#E74C3C" opacity="0.15"/>
                            <circle cx="12" cy="12" r="9" fill="#E74C3C"/>
                            <path d="M8 8l8 8M16 8l-8 8" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                          </svg>
                        )}
                      </td>
                      <td>
                        {feature.basic === true ? (
                          <svg width="24" height="24" viewBox="0 0 24 24" className="status-icon">
                            <circle cx="12" cy="12" r="11" fill="#2ECC71" opacity="0.15"/>
                            <circle cx="12" cy="12" r="9" fill="#2ECC71"/>
                            <path d="M7 12l4 4 6-7" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        ) : feature.basic ? (
                          <div>
                            <svg width="24" height="24" viewBox="0 0 24 24" className="status-icon">
                              <circle cx="12" cy="12" r="11" fill="#2ECC71" opacity="0.15"/>
                              <circle cx="12" cy="12" r="9" fill="#2ECC71"/>
                              <path d="M7 12l4 4 6-7" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <div className="limit-text">({feature.basic})</div>
                          </div>
                        ) : (
                          <svg width="24" height="24" viewBox="0 0 24 24" className="status-icon">
                            <circle cx="12" cy="12" r="11" fill="#E74C3C" opacity="0.15"/>
                            <circle cx="12" cy="12" r="9" fill="#E74C3C"/>
                            <path d="M8 8l8 8M16 8l-8 8" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                          </svg>
                        )}
                      </td>
                      <td>
                        {feature.premium === true ? (
                          <svg width="24" height="24" viewBox="0 0 24 24" className="status-icon">
                            <circle cx="12" cy="12" r="11" fill="#00A5A9" opacity="0.2"/>
                            <circle cx="12" cy="12" r="9" fill="#00A5A9"/>
                            <path d="M7 12l4 4 6-7" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        ) : feature.premium ? (
                          <div>
                            <svg width="24" height="24" viewBox="0 0 24 24" className="status-icon">
                              <circle cx="12" cy="12" r="11" fill="#00A5A9" opacity="0.2"/>
                              <circle cx="12" cy="12" r="9" fill="#00A5A9"/>
                              <path d="M7 12l4 4 6-7" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <div className="premium-limit-text">({feature.premium})</div>
                          </div>
                        ) : (
                          <svg width="24" height="24" viewBox="0 0 24 24" className="status-icon">
                            <circle cx="12" cy="12" r="11" fill="#E74C3C" opacity="0.15"/>
                            <circle cx="12" cy="12" r="9" fill="#E74C3C"/>
                            <path d="M8 8l8 8M16 8l-8 8" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                          </svg>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="disclaimer">
            <p>{t('subscriptionModal.disclaimer')}</p>
          </div>
        </div>
      </div>
    </>
  );
}