import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, ArrowLeft, ShieldCheck, CheckCircle, AlertCircle, Check, X } from 'lucide-react';
import logo from '../../assets/logo.png';
import illustrationImg from '../../assets/images/illustration.png';
import { useLanguage } from '../../contexts/LanguageContext';
import '../../styles/auth/authpage.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ResetPassword = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [errors, setErrors] = useState({});
  const [resetSuccess, setResetSuccess] = useState(false);

  const requirements = {
    minLength: formData.password.length >= 8,
    hasUpperCase: /[A-Z]/.test(formData.password),
    hasLowerCase: /[a-z]/.test(formData.password),
    hasNumber: /[0-9]/.test(formData.password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password)
  };

  const passedCount = Object.values(requirements).filter(Boolean).length;

  const getStrengthLabel = () => {
    if (passedCount <= 1) return t('resetPassword.veryWeak');
    if (passedCount <= 2) return t('resetPassword.weak');
    if (passedCount <= 3) return t('resetPassword.fair');
    if (passedCount <= 4) return t('resetPassword.good');
    return t('resetPassword.strong');
  };

  const getStrengthColor = () => {
    const colors = ['#ef4444', '#ef4444', '#f97316', '#eab308', '#22c55e', '#16a34a'];
    return colors[passedCount];
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setMessage({ type: '', text: '' });

    if (formData.password !== formData.confirmPassword) {
      setErrors({ confirmPassword: t('resetPassword.passwordsNoMatch') });
      return;
    }

    if (!Object.values(requirements).every(Boolean)) {
      setErrors({ password: t('resetPassword.requirementsNotMet') });
      return;
    }

    if (!token) {
      setMessage({
        type: 'error',
        text: t('resetPassword.invalidToken')
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: formData.password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password');
      }

      setResetSuccess(true);
      setMessage({
        type: 'success',
        text: data.message || t('resetPassword.successMessage')
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || t('resetPassword.failedMessage')
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    try {
      const userProfile = JSON.parse(localStorage.getItem('userProfile'));
      if (userProfile?.role) {
        navigate('/profile/' + userProfile.role);
        return;
      }
    } catch {}
    navigate('/');
  };

  return (
    <div className="auth-container">
      {/* Left Side - Form */}
      <div className="auth-box">
        <div className="auth-content">
          {/* Brand */}
          <div className="brand-section">
            <img src={logo} alt="INTERVOS" className="brand-logo" />
            <h1 className="brand-name">INTERVOS</h1>
          </div>

          {!resetSuccess ? (
            /* Reset Form */
            <div className="form-section">
              <h2 className="form-title">{t('resetPassword.title')}</h2>
              <p className="form-subtitle">{t('resetPassword.subtitle')}</p>

              {message.type === 'error' && (
                <div className="auth-message auth-message-error">
                  <AlertCircle size={18} style={{ marginRight: '0.5rem', flexShrink: 0 }} />
                  {message.text}
                </div>
              )}

              <form onSubmit={handleSubmit} className="auth-form">
                {/* New Password */}
                <div className="form-field">
                  <label>
                    <Lock size={16} />
                    {t('resetPassword.newPassword')}
                  </label>
                  <div className="password-input">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder={t('resetPassword.enterNewPassword')}
                      required
                      disabled={isLoading}
                      className={errors.password ? 'error' : ''}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.password && (
                    <span className="error-message">
                      <AlertCircle size={14} />
                      {errors.password}
                    </span>
                  )}

                  {/* Password Strength */}
                  {formData.password && (
                    <>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        marginTop: '0.5rem'
                      }}>
                        <div style={{
                          flex: 1,
                          height: '4px',
                          borderRadius: '2px',
                          backgroundColor: '#e5e7eb',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${(passedCount / 5) * 100}%`,
                            height: '100%',
                            borderRadius: '2px',
                            backgroundColor: getStrengthColor(),
                            transition: 'all 0.3s ease'
                          }} />
                        </div>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          color: getStrengthColor(),
                          whiteSpace: 'nowrap'
                        }}>
                          {getStrengthLabel()}
                        </span>
                      </div>

                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '0.25rem 1rem',
                        marginTop: '0.5rem'
                      }}>
                        {[
                          { key: 'minLength', label: t('resetPassword.req8Chars') },
                          { key: 'hasUpperCase', label: t('resetPassword.reqUppercase') },
                          { key: 'hasLowerCase', label: t('resetPassword.reqLowercase') },
                          { key: 'hasNumber', label: t('resetPassword.reqNumber') },
                          { key: 'hasSpecialChar', label: t('resetPassword.reqSpecial') }
                        ].map((req) => (
                          <div
                            key={req.key}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.375rem',
                              fontSize: '0.75rem',
                              color: requirements[req.key] ? '#22c55e' : 'var(--color-text-muted, #6b7280)'
                            }}
                          >
                            {requirements[req.key] ? <Check size={12} /> : <X size={12} />}
                            <span>{req.label}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="form-field">
                  <label>
                    <Lock size={16} />
                    {t('resetPassword.confirmPassword')}
                  </label>
                  <div className="password-input">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder={t('resetPassword.confirmYourPassword')}
                      required
                      disabled={isLoading}
                      className={errors.confirmPassword ? 'error' : ''}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <span className="error-message">
                      <AlertCircle size={14} />
                      {errors.confirmPassword}
                    </span>
                  )}
                  {formData.confirmPassword && formData.password === formData.confirmPassword && (
                    <span style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      fontSize: '0.8125rem',
                      color: '#22c55e',
                      marginTop: '0.25rem'
                    }}>
                      <Check size={14} />
                      {t('resetPassword.passwordsMatch')}
                    </span>
                  )}
                </div>

                <button
                  type="submit"
                  className="submit-btn"
                  disabled={isLoading || !formData.password || !formData.confirmPassword}
                >
                  {isLoading ? t('resetPassword.resetting') : t('resetPassword.resetButton')}
                </button>
              </form>

              <div className="form-footer">
                <p>
                  <a
                    href="#"
                    onClick={(e) => { e.preventDefault(); handleGoBack(); }}
                  >
                    <ArrowLeft size={14} style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} />
                    {t('resetPassword.goBack')}
                  </a>
                </p>
              </div>
            </div>
          ) : (
            /* Success State */
            <div className="form-section">
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.5rem'
              }}>
                <CheckCircle size={32} color="#10b981" />
              </div>
              <h2 className="form-title">{t('resetPassword.successTitle')}</h2>
              <p className="form-subtitle">{t('resetPassword.successSubtitle')}</p>

              <div className="auth-message auth-message-success">
                <CheckCircle size={18} style={{ marginRight: '0.5rem', flexShrink: 0 }} />
                {message.text}
              </div>

              <button
                className="submit-btn"
                onClick={handleGoBack}
                style={{ marginTop: '1.5rem' }}
              >
                {t('resetPassword.goBack')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right Side - Illustration */}
      <div className="auth-illustration">
        <img src={illustrationImg} alt="" />
        <div className="illustration-overlay">
          <ShieldCheck size={48} style={{ marginBottom: '1rem', opacity: 0.9 }} />
          <h2>{t('resetPassword.illustrationTitle')}</h2>
          <p>{t('resetPassword.illustrationSubtitle')}</p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
