import { useState, useEffect } from "react"
import "../../styles/landinpage.css"
import logo from '../../assets/logo.png'
import { useNavigate } from "react-router-dom"

export default function LandingPage() {
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const naigate = useNavigate()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const roles = [
    {
      title: "Property Managers",
      description: "Streamline property management with real-time bidding and transparent pricing.",
      icon: "🏢",
      color: "primary",
    },
    {
      title: "Contractors",
      description: "Access qualified projects and manage bids efficiently in one platform.",
      icon: "🔨",
      color: "secondary",
    },
    {
      title: "Entrepreneurs",
      description: "Grow your business by connecting with property managers and contractors.",
      icon: "📈",
      color: "success",
    },
    {
      title: "Investors",
      description: "Monitor project performance and ROI with comprehensive analytics.",
      icon: "💰",
      color: "info",
    },
  ]

  const features = [
    {
      title: "Efficient Bidding",
      description: "Connect with qualified professionals quickly and transparently.",
      icon: "⚡",
    },
    {
      title: "Real-time Management",
      description: "Track job status and communications in real-time.",
      icon: "📊",
    },
    {
      title: "Transparent Pricing",
      description: "Manage budgets effectively with clear cost breakdowns.",
      icon: "💵",
    },
    {
      title: "Secure Platform",
      description: "Enterprise-grade security for all your transactions.",
      icon: "🔒",
    },
    {
      title: "Mobile Access",
      description: "Manage projects on-the-go with our mobile app.",
      icon: "📱",
    },
    {
      title: "24/7 Support",
      description: "Dedicated support team ready to help anytime.",
      icon: "🎧",
    },
  ]

  return (
    <div className="lp-landing-page">
      {/* Navigation Bar */}
      <nav className={`lp-navbar ${scrolled ? "lp-scrolled" : ""}`}>
        <div className="lp-navbar-container">
          <div className="lp-navbar-logo">
            <span className="lp-logo-icon">
                <img src={logo} alt="" />
            </span>
            <span className="lp-logo-text">INTERVOS</span>
          </div>
          <ul className="lp-navbar-links">
            <li>
              <a href="#features">Features</a>
            </li>
            <li>
              <a href="#how-it-works">How It Works</a>
            </li>
            <li>
              <a href="#roles">Roles</a>
            </li>
            <li>
              <a href="#contact">Contact</a>
            </li>
          </ul>
          <div className="lp-navbar-actions">
            <button className="lp-btn-login" onClick={
              () => {
                naigate('/login')
              }
            }>
              Log In
            </button>
            <button className="lp-btn-register" onClick={() => setShowRegisterModal(true)}>
              Register
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="lp-hero">
        <div className="lp-hero-content">
          <h1 className="lp-hero-title">Streamline Your Property Management and Construction Bidding</h1>
          <p className="lp-hero-subtitle">
            Connect property managers, contractors, and entrepreneurs on a unified platform for seamless project
            collaboration.
          </p>
          <button className="lp-btn-primary lp-btn-large" onClick={() => setShowRegisterModal(true)}>
            Get Started - Join INTERVOS
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="lp-features">
        <div className="lp-section-header">
          <h2>Why Choose INTERVOS?</h2>
          <p>Powerful features designed for modern construction and property management</p>
        </div>
        <div className="lp-features-grid">
          {features.map((feature, index) => (
            <div key={index} className="lp-feature-card">
              <div className="lp-feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="lp-how-it-works">
        <div className="lp-section-header">
          <h2>How It Works</h2>
          <p>Simple steps to get started with INTERVOS</p>
        </div>
        <div className="lp-steps-container">
          <div className="lp-step">
            <div className="lp-step-number">1</div>
            <h3>Create Account</h3>
            <p>Sign up and choose your role on the platform</p>
          </div>
          <div className="lp-step-arrow">→</div>
          <div className="lp-step">
            <div className="lp-step-number">2</div>
            <h3>Complete Profile</h3>
            <p>Add your details and qualifications</p>
          </div>
          <div className="lp-step-arrow">→</div>
          <div className="lp-step">
            <div className="lp-step-number">3</div>
            <h3>Start Bidding</h3>
            <p>Browse projects and submit competitive bids</p>
          </div>
          <div className="lp-step-arrow">→</div>
          <div className="lp-step">
            <div className="lp-step-number">4</div>
            <h3>Collaborate</h3>
            <p>Manage projects and communicate seamlessly</p>
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section id="roles" className="lp-roles">
        <div className="lp-section-header">
          <h2>Built for Every Role</h2>
          <p>Tailored solutions for property managers, contractors, entrepreneurs, and investors</p>
        </div>
        <div className="lp-roles-grid">
          {roles.map((role, index) => (
            <div key={index} className={`lp-role-card lp-role-${role.color}`}>
              <div className="lp-role-icon">{role.icon}</div>
              <h3>{role.title}</h3>
              <p>{role.description}</p>
              <button className="lp-btn-secondary">Learn More</button>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="lp-cta-section">
        <div className="lp-cta-content">
          <h2>Ready to Transform Your Business?</h2>
          <p>Join thousands of professionals using INTERVOS</p>
          <button className="lp-btn-primary lp-btn-large" onClick={() => setShowRegisterModal(true)}>
            Start Your Free Trial
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="lp-footer">
        <div className="lp-footer-content">
          <div className="lp-footer-section">
            <h4>INTERVOS</h4>
            <p>Revolutionizing construction bidding and property management</p>
          </div>
          <div className="lp-footer-section">
            <h4>Quick Links</h4>
            <ul>
              <li>
                <a href="#features">Features</a>
              </li>
              <li>
                <a href="#how-it-works">How It Works</a>
              </li>
              <li>
                <a href="#roles">Roles</a>
              </li>
            </ul>
          </div>
          <div className="lp-footer-section">
            <h4>Legal</h4>
            <ul>
              <li>
                <a href="#privacy">Privacy Policy</a>
              </li>
              <li>
                <a href="#terms">Terms of Service</a>
              </li>
              <li>
                <a href="#contact">Contact</a>
              </li>
            </ul>
          </div>
        </div>
        <div className="lp-footer-bottom">
          <p>&copy; 2025 INTERVOS. All rights reserved.</p>
        </div>
      </footer>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="lp-modal-overlay" onClick={() => setShowLoginModal(false)}>
          <div className="lp-modal" onClick={(e) => e.stopPropagation()}>
            <button className="lp-modal-close" onClick={() => setShowLoginModal(false)}>
              ×
            </button>
            <h2>Log In to INTERVOS</h2>
            <form>
              <input type="email" placeholder="Email Address" required />
              <input type="password" placeholder="Password" required />
              <button type="submit" className="lp-btn-primary">
                Log In
              </button>
            </form>
            <p className="lp-modal-footer">
              Don't have an account?{" "}
              <button
                className="lp-link-btn"
                onClick={() => {
                  setShowLoginModal(false)
                  setShowRegisterModal(true)
                }}
              >
                Register here
              </button>
            </p>
          </div>
        </div>
      )}

      {/* Register Modal */}
      {showRegisterModal && (
        <div className="lp-modal-overlay" onClick={() => setShowRegisterModal(false)}>
          <div className="lp-modal" onClick={(e) => e.stopPropagation()}>
            <button className="lp-modal-close" onClick={() => setShowRegisterModal(false)}>
              ×
            </button>
            <h2>Join INTERVOS</h2>
            <form>
              <input type="text" placeholder="Full Name" required />
              <input type="email" placeholder="Email Address" required />
              <input type="password" placeholder="Password" required />
              <select required>
                <option value="">Select Your Role</option>
                <option value="property-manager">Property Manager</option>
                <option value="contractor">Contractor</option>
                <option value="entrepreneur">Entrepreneur</option>
                <option value="investor">Investor</option>
              </select>
              <button type="submit" className="lp-btn-primary">
                Create Account
              </button>
            </form>
            <p className="lp-modal-footer">
              Already have an account?{" "}
              <button
                className="lp-link-btn"
                onClick={() => {
                  setShowRegisterModal(false)
                  setShowLoginModal(true)
                }}
              >
                Log in here
              </button>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
