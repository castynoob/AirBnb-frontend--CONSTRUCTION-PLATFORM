import React, { useState } from 'react';
import { X, AlertTriangle, HelpCircle, MessageSquare, CreditCard, Bug, UserX, FileWarning, Send, Loader2 } from 'lucide-react';
import { createSupportTicket } from '../../utils/api';
import '../../styles/components/reportmodal.css';

const REPORT_CATEGORIES = {
  entrepreneur: [
    {
      id: 'technical',
      label: 'Technical Issue',
      icon: Bug,
      description: 'App bugs, errors, or features not working correctly',
      priority: 'medium'
    },
    {
      id: 'account',
      label: 'Account Problem',
      icon: UserX,
      description: 'Login issues, profile problems, or account access',
      priority: 'high'
    },
    {
      id: 'payment',
      label: 'Payment & Billing',
      icon: CreditCard,
      description: 'Subscription, payment, or payout issues',
      priority: 'high'
    },
    {
      id: 'job_issue',
      label: 'Job Issue',
      icon: FileWarning,
      description: 'Problems with a job posting or bid',
      priority: 'medium'
    },
    {
      id: 'report_user',
      label: 'Report User',
      icon: AlertTriangle,
      description: 'Report inappropriate behavior or content',
      priority: 'high'
    },
    {
      id: 'other',
      label: 'Other',
      icon: HelpCircle,
      description: 'General questions or feedback',
      priority: 'low'
    }
  ],
  property_manager: [
    {
      id: 'technical',
      label: 'Technical Issue',
      icon: Bug,
      description: 'App bugs, errors, or features not working correctly',
      priority: 'medium'
    },
    {
      id: 'account',
      label: 'Account Problem',
      icon: UserX,
      description: 'Login issues, profile problems, or account access',
      priority: 'high'
    },
    {
      id: 'payment',
      label: 'Payment & Billing',
      icon: CreditCard,
      description: 'Contract payment or transaction issues',
      priority: 'high'
    },
    {
      id: 'contractor_issue',
      label: 'Contractor Issue',
      icon: FileWarning,
      description: 'Problems with a contractor or their work',
      priority: 'medium'
    },
    {
      id: 'report_user',
      label: 'Report User',
      icon: AlertTriangle,
      description: 'Report inappropriate behavior or content',
      priority: 'high'
    },
    {
      id: 'other',
      label: 'Other',
      icon: HelpCircle,
      description: 'General questions or feedback',
      priority: 'low'
    }
  ],
  supplier: [
    {
      id: 'technical',
      label: 'Technical Issue',
      icon: Bug,
      description: 'App bugs, errors, or features not working correctly',
      priority: 'medium'
    },
    {
      id: 'account',
      label: 'Account Problem',
      icon: UserX,
      description: 'Login issues, profile problems, or account access',
      priority: 'high'
    },
    {
      id: 'order_issue',
      label: 'Order Issue',
      icon: FileWarning,
      description: 'Problems with material requests or orders',
      priority: 'medium'
    },
    {
      id: 'report_user',
      label: 'Report User',
      icon: AlertTriangle,
      description: 'Report inappropriate behavior or content',
      priority: 'high'
    },
    {
      id: 'other',
      label: 'Other',
      icon: HelpCircle,
      description: 'General questions or feedback',
      priority: 'low'
    }
  ],
  resident: [
    {
      id: 'technical',
      label: 'Technical Issue',
      icon: Bug,
      description: 'App bugs, errors, or features not working correctly',
      priority: 'medium'
    },
    {
      id: 'account',
      label: 'Account Problem',
      icon: UserX,
      description: 'Login issues, profile problems, or account access',
      priority: 'high'
    },
    {
      id: 'property_issue',
      label: 'Property Issue',
      icon: FileWarning,
      description: 'Issues related to your property or building',
      priority: 'medium'
    },
    {
      id: 'report_user',
      label: 'Report User',
      icon: AlertTriangle,
      description: 'Report inappropriate behavior or content',
      priority: 'high'
    },
    {
      id: 'other',
      label: 'Other',
      icon: HelpCircle,
      description: 'General questions or feedback',
      priority: 'low'
    }
  ]
};

export default function ReportModal({ onClose, userRole = 'entrepreneur' }) {
  const [step, setStep] = useState(1); // 1: select category, 2: fill form
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [formData, setFormData] = useState({
    subject: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const categories = REPORT_CATEGORIES[userRole] || REPORT_CATEGORIES.entrepreneur;

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setStep(2);
    setError(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.subject.trim()) {
      setError('Please enter a subject for your report');
      return;
    }

    if (!formData.description.trim()) {
      setError('Please provide a description of your issue');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const ticketData = {
        subject: formData.subject,
        description: formData.description,
        category: selectedCategory.id,
        priority: selectedCategory.priority
      };

      const response = await createSupportTicket(ticketData);

      if (response.success) {
        setSuccess(true);
      } else {
        setError(response.message || 'Failed to submit report. Please try again.');
      }
    } catch (err) {
      console.error('Error submitting report:', err);
      setError(err.message || 'Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep(1);
    setSelectedCategory(null);
    setFormData({ subject: '', description: '' });
    setError(null);
  };

  // Success view
  if (success) {
    return (
      <div className="rpt-modal">
        <div className="rpt-modal-overlay" onClick={onClose} />
        <div className="rpt-modal-content">
          <button className="rpt-close-btn" onClick={onClose}>
            <X size={20} />
          </button>

          <div className="rpt-success">
            <div className="rpt-success-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" fill="#00A5A9"/>
                <path d="M8 12l3 3 5-6" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2>Report Submitted!</h2>
            <p>Thank you for your report. Our support team will review it and get back to you as soon as possible.</p>
            <button className="rpt-btn-primary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rpt-modal">
      <div className="rpt-modal-overlay" onClick={onClose} />
      <div className="rpt-modal-content">
        <button className="rpt-close-btn" onClick={onClose}>
          <X size={20} />
        </button>

        {step === 1 ? (
          // Step 1: Select Category
          <>
            <div className="rpt-header">
              <MessageSquare size={28} className="rpt-header-icon" />
              <h2>How can we help?</h2>
              <p>Select the type of issue you're experiencing</p>
            </div>

            <div className="rpt-categories">
              {categories.map((category) => {
                const IconComponent = category.icon;
                return (
                  <button
                    key={category.id}
                    className="rpt-category-card"
                    onClick={() => handleCategorySelect(category)}
                  >
                    <div className="rpt-category-icon">
                      <IconComponent size={24} />
                    </div>
                    <div className="rpt-category-info">
                      <h4>{category.label}</h4>
                      <p>{category.description}</p>
                    </div>
                    <svg className="rpt-category-arrow" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          // Step 2: Fill Form
          <>
            <div className="rpt-header">
              <button className="rpt-back-btn" onClick={handleBack}>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Back
              </button>
              <div className="rpt-selected-category">
                {selectedCategory && (
                  <>
                    {React.createElement(selectedCategory.icon, { size: 20 })}
                    <span>{selectedCategory.label}</span>
                  </>
                )}
              </div>
            </div>

            <form className="rpt-form" onSubmit={handleSubmit}>
              <div className="rpt-form-group">
                <label htmlFor="subject">Subject</label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  placeholder="Brief summary of your issue"
                  maxLength={255}
                />
              </div>

              <div className="rpt-form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Please provide as much detail as possible about your issue..."
                  rows={6}
                />
              </div>

              {error && (
                <div className="rpt-error">
                  <AlertTriangle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <div className="rpt-form-actions">
                <button
                  type="button"
                  className="rpt-btn-secondary"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rpt-btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="rpt-spinner" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      Submit Report
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
