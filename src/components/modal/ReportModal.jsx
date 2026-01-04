import React, { useState, useMemo } from 'react';
import { X, AlertTriangle, HelpCircle, MessageSquare, CreditCard, Bug, UserX, FileWarning, Send, Loader2 } from 'lucide-react';
import { createSupportTicket } from '../../utils/api';
import { useLanguage } from '../../contexts/LanguageContext';
import '../../styles/components/reportmodal.css';

// Category definitions with translation keys
const CATEGORY_DEFINITIONS = {
  technical: { icon: Bug, labelKey: 'technicalIssue', descKey: 'technicalIssueDesc', priority: 'medium' },
  account: { icon: UserX, labelKey: 'accountProblem', descKey: 'accountProblemDesc', priority: 'high' },
  payment_entrepreneur: { icon: CreditCard, labelKey: 'paymentBilling', descKey: 'paymentBillingDescEntrepreneur', priority: 'high' },
  payment_manager: { icon: CreditCard, labelKey: 'paymentBilling', descKey: 'paymentBillingDescManager', priority: 'high' },
  job_issue: { icon: FileWarning, labelKey: 'jobIssue', descKey: 'jobIssueDesc', priority: 'medium' },
  contractor_issue: { icon: FileWarning, labelKey: 'contractorIssue', descKey: 'contractorIssueDesc', priority: 'medium' },
  order_issue: { icon: FileWarning, labelKey: 'orderIssue', descKey: 'orderIssueDesc', priority: 'medium' },
  property_issue: { icon: FileWarning, labelKey: 'propertyIssue', descKey: 'propertyIssueDesc', priority: 'medium' },
  report_user: { icon: AlertTriangle, labelKey: 'reportUser', descKey: 'reportUserDesc', priority: 'high' },
  other: { icon: HelpCircle, labelKey: 'other', descKey: 'otherDesc', priority: 'low' }
};

// Role-based category lists (using category keys)
const ROLE_CATEGORIES = {
  entrepreneur: ['technical', 'account', 'payment_entrepreneur', 'job_issue', 'report_user', 'other'],
  property_manager: ['technical', 'account', 'payment_manager', 'contractor_issue', 'report_user', 'other'],
  supplier: ['technical', 'account', 'order_issue', 'report_user', 'other'],
  resident: ['technical', 'account', 'property_issue', 'report_user', 'other']
};

export default function ReportModal({ onClose, userRole = 'entrepreneur' }) {
  const { t } = useLanguage();
  const [step, setStep] = useState(1); // 1: select category, 2: fill form
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [formData, setFormData] = useState({
    subject: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Build translated categories based on user role
  const categories = useMemo(() => {
    const categoryKeys = ROLE_CATEGORIES[userRole] || ROLE_CATEGORIES.entrepreneur;
    return categoryKeys.map(key => {
      const def = CATEGORY_DEFINITIONS[key];
      return {
        id: key.replace('_entrepreneur', '').replace('_manager', ''),
        icon: def.icon,
        label: t(`reportModal.${def.labelKey}`),
        description: t(`reportModal.${def.descKey}`),
        priority: def.priority
      };
    });
  }, [userRole, t]);

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
      setError(t('reportModal.subjectRequired'));
      return;
    }

    if (!formData.description.trim()) {
      setError(t('reportModal.descriptionRequired'));
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
        setError(response.message || t('reportModal.submitFailed'));
      }
    } catch (err) {
      console.error('Error submitting report:', err);
      setError(err.message || t('reportModal.submitFailed'));
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
            <h2>{t('reportModal.reportSubmitted')}</h2>
            <p>{t('reportModal.thankYouMessage')}</p>
            <button className="rpt-btn-primary" onClick={onClose}>
              {t('reportModal.close')}
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
              <h2>{t('reportModal.howCanWeHelp')}</h2>
              <p>{t('reportModal.selectIssueType')}</p>
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
                {t('reportModal.back')}
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
                <label htmlFor="subject">{t('reportModal.subject')}</label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  placeholder={t('reportModal.subjectPlaceholder')}
                  maxLength={255}
                />
              </div>

              <div className="rpt-form-group">
                <label htmlFor="description">{t('reportModal.description')}</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder={t('reportModal.descriptionPlaceholder')}
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
                  {t('reportModal.cancel')}
                </button>
                <button
                  type="submit"
                  className="rpt-btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="rpt-spinner" />
                      {t('reportModal.submitting')}
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      {t('reportModal.submitReport')}
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
