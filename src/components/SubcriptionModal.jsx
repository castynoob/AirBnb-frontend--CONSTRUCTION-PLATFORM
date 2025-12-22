import React, { useState } from 'react';
import '../styles/entrepreneur/subscriptionmodal.css'
import logo from '../assets/logo.png'
import SubscriptionPaymentForm from '../components/SubscriptionPaymentModal'

export default function SubscriptionModal({token, refresher, onClose, showCloseButton = true}) {
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
    { name: 'Browse jobs', noSub: false, trialBasic: true, trialPremium: true, activeBasic: true, activePremium: true },
    { name: 'View job details', noSub: false, trialBasic: true, trialPremium: true, activeBasic: true, activePremium: true },
    { name: 'Submit bids', noSub: false, trialBasic: '30 max', trialPremium: 'unlimited', activeBasic: '30 max', activePremium: 'unlimited' },
    { name: 'Unlock budget ($20)', noSub: false, trialBasic: true, trialPremium: true, activeBasic: true, activePremium: true },
    { name: 'Message (approved)', noSub: false, trialBasic: true, trialPremium: true, activeBasic: true, activePremium: true },
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
          View Subscription Plans
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
            <button className="subs-close-btn" onClick={handleClose} aria-label="Close modal">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
          <div className="modal-header">
            <img src={logo} alt="INTERVOS Logo" className="logo" />
            <div className="sub-message">
              <h2>Choose Your Subscription Plan</h2>
              <p className="subtitle">
                Select the plan that fits your business needs and start bidding on projects today
              </p>
            </div>
          </div>

          <div className="plans-container">
            {/* Basic Plan */}
              <div className="plan-card">
                <div className="plan-header">
                  <div className="plan-label">Basic Plan</div>
                  <div className="price">
                    <span className="currency">$</span>
                    <span className="amount">250</span>
                    <span className="period">/month</span>
                  </div>
                  <div className="plan-description">
                    Essential features for contractors
                  </div>
                </div>
                
                <ul className="features-list">
                  <li className="feature-item">
                    <svg width="20" height="20" viewBox="0 0 20 20" className="feature-icon">
                      <circle cx="10" cy="10" r="10" fill="#2ECC71"/>
                      <path d="M6 10l3 3 5-6" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Browse & view jobs</span>
                  </li>
                  <li className="feature-item">
                    <svg width="20" height="20" viewBox="0 0 20 20" className="feature-icon">
                      <circle cx="10" cy="10" r="10" fill="#2ECC71"/>
                      <path d="M6 10l3 3 5-6" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Submit up to 30 bids</span>
                  </li>
                  <li className="feature-item">
                    <svg width="20" height="20" viewBox="0 0 20 20" className="feature-icon">
                      <circle cx="10" cy="10" r="10" fill="#2ECC71"/>
                      <path d="M6 10l3 3 5-6" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Unlock budgets</span>
                  </li>
                  <li className="feature-item">
                    <svg width="20" height="20" viewBox="0 0 20 20" className="feature-icon">
                      <circle cx="10" cy="10" r="10" fill="#2ECC71"/>
                      <path d="M6 10l3 3 5-6" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Message approved contacts</span>
                  </li>
                </ul>
                
                <button className="cta-btn btn-basic" onClick={() => handleSubsciption('basic')}>Start Basic Trial</button>
              </div>
            

              <div className="plan-card premium">
                <div className="plan-badge">RECOMMENDED</div>

                <div className="plan-header">
                  <div className="plan-label">Premium Plan</div>
                  <div className="price">
                    <span className="currency">$</span>
                    <span className="amount">429</span>
                    <span className="period">/month</span>
                  </div>
                  <div className="plan-description">
                    Unlimited bidding for growing businesses
                  </div>
                </div>
                
                <ul className="features-list">
                  <li className="feature-item">
                    <svg width="20" height="20" viewBox="0 0 20 20" className="feature-icon">
                      <circle cx="10" cy="10" r="10" fill="#2ECC71"/>
                      <path d="M6 10l3 3 5-6" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Browse & view jobs</span>
                  </li>
                  <li className="feature-item highlight">
                    <svg width="20" height="20" viewBox="0 0 20 20" className="feature-icon">
                      <circle cx="10" cy="10" r="10" fill="#00A5A9"/>
                      <path d="M6 10l3 3 5-6" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Submit unlimited bids</span>
                  </li>
                  <li className="feature-item">
                    <svg width="20" height="20" viewBox="0 0 20 20" className="feature-icon">
                      <circle cx="10" cy="10" r="10" fill="#2ECC71"/>
                      <path d="M6 10l3 3 5-6" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Unlock budgets</span>
                  </li>
                  <li className="feature-item">
                    <svg width="20" height="20" viewBox="0 0 20 20" className="feature-icon">
                      <circle cx="10" cy="10" r="10" fill="#2ECC71"/>
                      <path d="M6 10l3 3 5-6" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Message approved contacts</span>
                  </li>
                  <li className="feature-item highlight">
                    <svg width="20" height="20" viewBox="0 0 20 20" className="feature-icon">
                      <circle cx="10" cy="10" r="10" fill="#00A5A9"/>
                      <path d="M6 10l3 3 5-6" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Priority support</span>
                  </li>
                </ul>
                
                <button className="cta-btn btn-premium" onClick={() => handleSubsciption('premium')} >Start Premium Trial</button>
              </div>
          </div>

          {/* Comparison Table */}
          <div className="comparison-section">
            <h3 className="comparison-title">Detailed Feature Comparison</h3>
            
            <div className="table-wrapper">
              <table className="comparison-table">
                <thead>
                  <tr>
                    <th>Feature</th>
                    <th>No Sub</th>
                    <th>Trial Basic</th>
                    <th>Trial Premium</th>
                    <th>Active Basic</th>
                    <th>Active Premium</th>
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
                        {feature.trialBasic === true ? (
                          <svg width="24" height="24" viewBox="0 0 24 24" className="status-icon">
                            <circle cx="12" cy="12" r="11" fill="#2ECC71" opacity="0.15"/>
                            <circle cx="12" cy="12" r="9" fill="#2ECC71"/>
                            <path d="M7 12l4 4 6-7" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        ) : feature.trialBasic ? (
                          <div>
                            <svg width="24" height="24" viewBox="0 0 24 24" className="status-icon">
                              <circle cx="12" cy="12" r="11" fill="#2ECC71" opacity="0.15"/>
                              <circle cx="12" cy="12" r="9" fill="#2ECC71"/>
                              <path d="M7 12l4 4 6-7" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <div className="limit-text">({feature.trialBasic})</div>
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
                        {feature.trialPremium === true ? (
                          <svg width="24" height="24" viewBox="0 0 24 24" className="status-icon">
                            <circle cx="12" cy="12" r="11" fill="#2ECC71" opacity="0.15"/>
                            <circle cx="12" cy="12" r="9" fill="#2ECC71"/>
                            <path d="M7 12l4 4 6-7" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        ) : feature.trialPremium ? (
                          <div>
                            <svg width="24" height="24" viewBox="0 0 24 24" className="status-icon">
                              <circle cx="12" cy="12" r="11" fill="#2ECC71" opacity="0.15"/>
                              <circle cx="12" cy="12" r="9" fill="#2ECC71"/>
                              <path d="M7 12l4 4 6-7" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <div className="limit-text">({feature.trialPremium})</div>
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
                        {feature.activeBasic === true ? (
                          <svg width="24" height="24" viewBox="0 0 24 24" className="status-icon">
                            <circle cx="12" cy="12" r="11" fill="#2ECC71" opacity="0.15"/>
                            <circle cx="12" cy="12" r="9" fill="#2ECC71"/>
                            <path d="M7 12l4 4 6-7" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        ) : feature.activeBasic ? (
                          <div>
                            <svg width="24" height="24" viewBox="0 0 24 24" className="status-icon">
                              <circle cx="12" cy="12" r="11" fill="#2ECC71" opacity="0.15"/>
                              <circle cx="12" cy="12" r="9" fill="#2ECC71"/>
                              <path d="M7 12l4 4 6-7" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <div className="limit-text">({feature.activeBasic})</div>
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
                        {feature.activePremium === true ? (
                          <svg width="24" height="24" viewBox="0 0 24 24" className="status-icon">
                            <circle cx="12" cy="12" r="11" fill="#00A5A9" opacity="0.2"/>
                            <circle cx="12" cy="12" r="9" fill="#00A5A9"/>
                            <path d="M7 12l4 4 6-7" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        ) : feature.activePremium ? (
                          <div>
                            <svg width="24" height="24" viewBox="0 0 24 24" className="status-icon">
                              <circle cx="12" cy="12" r="11" fill="#00A5A9" opacity="0.2"/>
                              <circle cx="12" cy="12" r="9" fill="#00A5A9"/>
                              <path d="M7 12l4 4 6-7" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <div className="premium-limit-text">({feature.activePremium})</div>
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
            <p>All plans include a 14-day free trial. No credit card required. Cancel anytime.</p>
          </div>
        </div>
      </div>
    </>
  );
}