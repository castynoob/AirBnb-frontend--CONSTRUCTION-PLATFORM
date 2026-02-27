import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, KeyRound, CheckCircle, AlertCircle } from 'lucide-react';
import logo from '../../assets/logo.png';
import illustrationImg from '../../assets/images/illustration.png';
import { useLanguage } from '../../contexts/LanguageContext';
import '../../styles/auth/authpage.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/request-password-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send reset link');
      }

      setMessage({
        type: 'success',
        text: data.message || 'Password reset link has been sent to your email!'
      });
      setEmailSent(true);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to send reset link. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = () => {
    setEmailSent(false);
    setMessage({ type: '', text: '' });
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

          {!emailSent ? (
            /* Request Form */
            <div className="form-section">
              <h2 className="form-title">{t('forgotPassword.title')}</h2>
              <p className="form-subtitle">{t('forgotPassword.subtitle')}</p>

              {message.type === 'error' && (
                <div className="auth-message auth-message-error">
                  <AlertCircle size={18} style={{ marginRight: '0.5rem', flexShrink: 0 }} />
                  {message.text}
                </div>
              )}

              <form onSubmit={handleSubmit} className="auth-form">
                <div className="form-field">
                  <label>
                    <Mail size={16} />
                    {t('forgotPassword.emailLabel')}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    disabled={isLoading}
                  />
                </div>

                <button
                  type="submit"
                  className="submit-btn"
                  disabled={isLoading || !email}
                >
                  {isLoading ? t('forgotPassword.sending') : t('forgotPassword.sendLink')}
                </button>
              </form>

              <div className="form-footer">
                <p>
                  <a
                    href="#"
                    onClick={(e) => { e.preventDefault(); navigate('/'); }}
                  >
                    <ArrowLeft size={14} style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} />
                    {t('forgotPassword.backToLogin')}
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
              <h2 className="form-title">{t('forgotPassword.checkEmail')}</h2>
              <p className="form-subtitle">
                {t('forgotPassword.emailSentTo')}
                <br />
                <strong style={{ color: 'var(--color-text-dark)' }}>{email}</strong>
              </p>

              <div className="auth-message auth-message-success">
                <CheckCircle size={18} style={{ marginRight: '0.5rem', flexShrink: 0 }} />
                {message.text}
              </div>

              <p style={{
                fontSize: '0.875rem',
                color: 'var(--color-text-muted)',
                marginTop: '1.5rem',
                lineHeight: '1.6'
              }}>
                {t('forgotPassword.noEmail')}{' '}
                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); handleResend(); }}
                  style={{
                    color: 'var(--color-secondary)',
                    fontWeight: '600',
                    textDecoration: 'none'
                  }}
                >
                  {t('forgotPassword.tryAgain')}
                </a>
              </p>

              <div className="form-footer">
                <p>
                  <a
                    href="#"
                    onClick={(e) => { e.preventDefault(); navigate('/'); }}
                  >
                    <ArrowLeft size={14} style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} />
                    {t('forgotPassword.backToLogin')}
                  </a>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Side - Illustration */}
      <div className="auth-illustration">
        <img src={illustrationImg} alt="" />
        <div className="illustration-overlay">
          <KeyRound size={48} style={{ marginBottom: '1rem', opacity: 0.9 }} />
          <h2>{t('forgotPassword.illustrationTitle')}</h2>
          <p>{t('forgotPassword.illustrationSubtitle')}</p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
