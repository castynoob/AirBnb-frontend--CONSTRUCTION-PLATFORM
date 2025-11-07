import { useState, useEffect } from "react"
import "../../styles/landinpage.css"
import logo from '../../assets/logo.png'
import { useNavigate } from "react-router-dom"
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import {
  validateEmail,
  validatePassword,
  validateName,
  validatePasswordConfirmation
} from "../../utils/validation";

export default function LandingPage() {
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [selectedRole, setSelectedRole] = useState("")
  const [scrolled, setScrolled] = useState(false)
  const [registrationStep, setRegistrationStep] = useState(1)
  const navigate = useNavigate()

  const [loginFormData, setLoginFormData] = useState({
    email: "",
    password: "",
  })

  const [loginErrors, setLoginErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleLoginChange = (e) => {
    const { name, value } = e.target
    setLoginFormData({
      ...loginFormData,
      [name]: value,
    })
    // Clear error when user starts typing
    if (loginErrors[name]) {
      setLoginErrors({ ...loginErrors, [name]: "" })
    }
  }

  const validateLoginForm = () => {
    const newErrors = {}

    // Email validation
    if (!loginFormData.email) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(loginFormData.email)) {
      newErrors.email = "Email is invalid"
    }

    // Password validation
    if (!loginFormData.password) {
      newErrors.password = "Password is required"
    }

    setLoginErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleLoginSubmit = async (e) => {
    e.preventDefault()

    if (!validateLoginForm()) {
      return
    }

    setIsLoggingIn(true)
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: loginFormData.email,
          password: loginFormData.password,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }

      const data = await response.json()

      let entrepProfile = {}
      let subscription = null

      if(data.user.role == 'entrepreneur') {
        const getEntreProfile = await fetch(`${API_BASE_URL}/api/users/entrepreneur/user/${data.user.id}`, {
          method: "GET",
          headers: {
            'Authorization': `Bearer ${data.accessToken}`
          }
        })

        const getSubsscription = await fetch(`${API_BASE_URL}/api/payments/subscription`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${data.accessToken}`
          }
        })

        if(!getEntreProfile.ok || !getSubsscription.ok) {
          throw new Error(`Error getting profile ${getEntreProfile}`)
        }

        const subs = await getSubsscription.json()
        const entrep = await getEntreProfile.json()
        entrepProfile = entrep.profile
        subscription = subs
      }

      // Construct userProfile
      const userProfile = {
        id: data.user.id || 101,
        name: data.user.name || `${data.user.first_name || ""} ${data.user.last_name || ""}`.trim(),
        email: data.user.email || loginFormData.email,
        role: data.user.role,
        token: data.accessToken || null,
        entrepProfile: data.user.role == 'entrepreneur' ? {entrepProfile, subscription} : null
      }

      console.log(userProfile)

      console.log(userProfile)

      // Save to localStorage (including refresh token for auto-refresh)
      localStorage.setItem("token", userProfile.token);
      localStorage.setItem("refreshToken", data.refreshToken); // Store refresh token
      localStorage.setItem("userId", userProfile.id);
      localStorage.setItem("userProfile", JSON.stringify(userProfile))
      console.log(userProfile)
      // Close modal and redirect
      setShowLoginModal(false)
      navigate(`/homepage/${userProfile.role}`)

    } catch (error) {
      console.error("Login error:", error)
      setLoginErrors({ 
        submit: "Login failed. Please check your credentials and try again." 
      })
    } finally {
      setIsLoggingIn(false)
    }
  }
  

  const closeModals = () => {
    setShowLoginModal(false)
    setShowRegisterModal(false)
    setSelectedRole("")
    setRegistrationStep(1)
    // Reset login form
    setLoginFormData({ email: "", password: "" })
    setLoginErrors({})
    setShowPassword(false)
    setRememberMe(false)
  }

  const openRegisterModal = (role) => {
    setSelectedRole(role)
    setShowRegisterModal(true)
    setRegistrationStep(1)
  }

  const roles = [
    {
      id: "property-manager",
      title: "Property Managers",
      icon: "🧱",
      headline: "Upload & Manage Properties Effortlessly",
      description: "Post maintenance jobs, review competitive bids, and manage multiple properties from one intelligent dashboard.",
      benefits: [
        "Post jobs with detailed requirements",
        "Review and compare contractor bids",
        "Track project progress in real-time",
        "Manage multiple properties seamlessly"
      ],
      color: "primary",
      gradient: "linear-gradient(135deg, #0f223d 0%, #1a3a5c 100%)"
    },
    {
      id: "entrepreneur",
      title: "Entrepreneurs & Contractors",
      icon: "⚒️",
      headline: "Find Jobs, Submit Bids, Grow Your Business",
      description: "Access a steady stream of verified construction projects. Submit competitive bids and build your reputation.",
      benefits: [
        "Discover jobs matching your expertise",
        "Submit bids with transparent pricing",
        "Build your professional portfolio",
        "Grow through verified opportunities"
      ],
      color: "secondary",
      gradient: "linear-gradient(135deg, #00a5a9 0%, #008b8f 100%)"
    },
    {
      id: "resident",
      title: "Residents",
      icon: "🏘️",
      headline: "Stay Informed About Your Property",
      description: "Get real-time updates on maintenance work, repairs, and improvements happening in your building or unit.",
      benefits: [
        "Track repair status for your unit",
        "Receive timely maintenance updates",
        "Transparent communication channel",
        "Submit maintenance requests easily"
      ],
      color: "success",
      gradient: "linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)"
    },
    {
      id: "supplier",
      title: "Suppliers & Vendors",
      icon: "🧰",
      headline: "Connect With Active Projects",
      description: "Supply materials and services to property managers and contractors. Expand your network and grow your business.",
      benefits: [
        "Connect with verified projects",
        "Showcase your product catalog",
        "Direct access to decision makers",
        "Streamlined order management"
      ],
      color: "info",
      gradient: "linear-gradient(135deg, #3498db 0%, #2980b9 100%)"
    },
  ]

  const features = [
    {
      title: "Smart Bidding System",
      description: "Transparent, competitive bidding process that ensures fair pricing and quality work for every project.",
      icon: "⚡",
    },
    {
      title: "Verified Professionals",
      description: "All contractors are vetted and rated by the community, ensuring you work with trusted professionals.",
      icon: "✓",
    },
    {
      title: "Real-Time Updates",
      description: "Track job status, communications, and project milestones instantly from any device.",
      icon: "📊",
    },
    {
      title: "Multi-Property Management",
      description: "Manage multiple buildings, units, and projects from a single, unified dashboard.",
      icon: "🏢",
    },
    {
      title: "Transparent Communication",
      description: "Built-in messaging keeps property managers, contractors, and residents connected throughout projects.",
      icon: "💬",
    },
    {
      title: "Secure Payments",
      description: "Protected payment processing with escrow options for peace of mind on every transaction.",
      icon: "🔒",
    },
  ]

  // Registration form state
  const [registerFormData, setRegisterFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
    confirm_password: "",
    company_name: "",
    address: "",
    license_number: "",
    years_in_business: "",
    num_employees: "",
    specializations: "",
    property_name: "",
    unit_number: "",
    move_in_date: "",
    website: "",
    delivery_areas: "",
    provider: 'local'
  })

  const handleRegisterChange = (e) => {
    const { name, value } = e.target
    setRegisterFormData({
      ...registerFormData,
      [name]: value,
    })

    // Live validation - validate as user types
    let error = "";

    switch (name) {
      case "email":
        error = validateEmail(value);
        break;
      case "password":
        if (registerFormData.provider === "local") {
          error = validatePassword(value);
        }
        break;
      case "confirm_password":
        if (registerFormData.provider === "local") {
          error = validatePasswordConfirmation(registerFormData.password, value);
        }
        break;
      case "first_name":
        error = validateName(value, "First name");
        break;
      case "last_name":
        error = validateName(value, "Last name");
        break;
      default:
        break;
    }

    // Update errors state
    setRegisterErrors({
      ...registerErrors,
      [name]: error
    });
  }
  const handleRegisterSubmit = async (e) => {
      e.preventDefault();
      setIsRegistering(true);

      try {
          const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
          let endpoint = "";

          switch (selectedRole) {
              case "entrepreneur":
                  endpoint = "/api/register/entrepreneur";
                  break;
              case "property-manager":
                  endpoint = "/api/register/manager";
                  break;
              case "resident":
                  endpoint = "/api/register/resident";
                  break;
              case "supplier":
                  endpoint = "/api/register/supplier";
                  break;
              default: {
                  setIsRegistering(false);
                  throw new Error(`Invalid role selected: ${selectedRole}`);
              }
          }
          
          // 1. Prepare the full payload
          // Convert role format: "property-manager" -> "property_manager"
          const roleForBackend = selectedRole.replace(/-/g, '_');
          const payload = {
              ...registerFormData,
              role: roleForBackend
          };

          // 2. Clean the payload before sending
          delete payload.confirm_password; 
          
          // CRITICAL: Remove password if registration was via Google, as the backend shouldn't
          // try to hash an empty password or validate it.
          if (payload.provider === 'google') {
              delete payload.password;
          }
          
          // 3. Convert specializations string to an array (for entrepreneur)
          if (selectedRole === "entrepreneur" && payload.specializations && typeof payload.specializations === "string") {
              payload.specializations = payload.specializations
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean); // Filter out empty strings
          } else if (selectedRole === "entrepreneur") {
              // Ensure it's an empty array if not provided, matching your DB schema (text[])
              payload.specializations = []; 
          }

          console.log("Payload being sent:", payload);

          // 4. Send to backend
          const response = await fetch(`${API_BASE_URL}${endpoint}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
          });

          const data = await response.json();

          // 5. Check response status and handle errors
          if (!response.ok) {
              // Check if backend returned field-specific errors
              if (data.errors && typeof data.errors === 'object') {
                  // Set field-specific errors
                  setRegisterErrors({
                      submit: data.message || "Please check your input and try again",
                      ...data.errors
                  });
              } else {
                  // Generic error (e.g., "Email already registered")
                  setRegisterErrors({ submit: data.message || "Registration failed" });
              }
              return;
          }

          // 6. Success handling (reset form and notify)
          alert("Registration successful! You can now log in.");
          closeModals(); // Close the modal and reset state
          setShowLoginModal(true); // Direct user to the login modal

      } catch (error) {
          console.error("Registration error:", error);
          // Display the specific error message to the user
          setRegisterErrors({ submit: error.message || "Registration failed due to a server error." });
      } finally {
          setIsRegistering(false);
      }
  };

  const [registerErrors, setRegisterErrors] = useState({
    submit: ''
  })

  const [isRegistering, setIsRegistering] = useState(false)

  // Revalidate confirm_password when password changes
  useEffect(() => {
    if (registerFormData.confirm_password && registerFormData.provider === "local") {
      const error = validatePasswordConfirmation(
        registerFormData.password,
        registerFormData.confirm_password
      );
      setRegisterErrors(prev => ({
        ...prev,
        confirm_password: error
      }));
    }
  }, [registerFormData.password])


// Add provider_id to the payload sent to your backend
  const handleSuccess = async (credentialResponse) => {
      const token = credentialResponse.credential;
      const userData = jwtDecode(token);

      console.log("Google user:", userData);
      
      // 1. Get the Google provider_id (sub is the standard unique Google ID)
      const providerId = userData.sub; 

      // 2. Pre-fill the registerFormData state
      setRegisterFormData((prev) => ({
        ...prev,
        // Pre-fill fields from Google
        first_name: userData.given_name || "",
        last_name: userData.family_name || "",
        email: userData.email || "",
        // Set provider details
        provider: "google",
        provider_id: providerId, // Store the Google ID
        // Clear password fields for Google sign-in (backend should ignore these for provider: 'google')
        password: "",
        confirm_password: "",
        // Other fields remain as they were, allowing the user to fill them on the form
      }));

      // 3. Notify the user to complete the form
      alert("Google details pre-filled! Please complete the remaining fields to finalize your registration.");

      // The user remains on registrationStep=2 and submits via handleRegisterSubmit.
  };


  const handleError = () => {
    console.error("Google Sign-In failed");
  };

  const handleLoginSuccess = async (credentialResponse) => {
    const token = credentialResponse.credential;
    const userData = jwtDecode(token);
    
    setIsLoggingIn(true);
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    try {
        // 1. Send Google data to your backend's specialized Google login endpoint
        const response = await fetch(`${API_BASE_URL}/api/auth/google-login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email: userData.email,
                provider_id: userData.sub,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            // Catches "User not found" (404) or any other errors
            throw new Error(data.message || "Google login failed.");
        }

        // 2. Replication of your existing local login success logic
        let entrepProfile = {}
        let subscription = null

        if(data.user.role === 'entrepreneur') {
            const getEntreProfile = await fetch(`${API_BASE_URL}/api/users/entrepreneur/user/${data.user.id}`, {
                method: "GET",
                headers: {
                    'Authorization': `Bearer ${data.accessToken}`
                }
            })

            const getSubsscription = await fetch(`${API_BASE_URL}/api/payments/subscription`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${data.accessToken}`
                }
            })

            if(!getEntreProfile.ok || !getSubsscription.ok) {
                // Use the error message from the response if available
                const entrepError = await getEntreProfile.json()
                const subscriptionError = await getSubsscription.json()
                throw new Error(entrepError.message || subscriptionError.message || `Error getting profile/subscription data`)
            }

            const subs = await getSubsscription.json()
            const entrep = await getEntreProfile.json()
            entrepProfile = entrep.profile
            subscription = subs
        }

        const userProfile = {
            id: data.user.id,
            name: `${data.user.first_name || ""} ${data.user.last_name || ""}`.trim(),
            email: data.user.email,
            role: data.user.role,
            token: data.accessToken || null,
            entrepProfile: data.user.role === 'entrepreneur' ? {entrepProfile, subscription} : null
        }

        localStorage.setItem("userId", userProfile.id);
        localStorage.setItem("userProfile", JSON.stringify(userProfile))
        console.log(userProfile)
        setShowLoginModal(false)
        navigate(`/homepage/${userProfile.role}`)

    } catch (error) {
        console.error("Google Login error:", error);
        setLoginErrors({ 
            submit: error.message || "Login failed. Please try again." 
        });
    } finally {
        setIsLoggingIn(false);
    }
  }

  return (
    <div className="lp-landing-page">
      {/* Navigation Bar */}
      <nav className={`lp-navbar ${scrolled ? "lp-scrolled" : ""}`}>
        <div className="lp-navbar-container">
          <div className="lp-navbar-logo">
            <span className="lp-logo-icon">
              <img src={logo} alt="INTERVOS" />
            </span>
            <span className="lp-logo-text">INTERVOS</span>
          </div>
          <ul className="lp-navbar-links">
            <li><a href="#about">About</a></li>
            <li><a href="#features">Features</a></li>
            <li><a href="#roles">For You</a></li>
            <li><a href="#how-it-works">How It Works</a></li>
          </ul>
          <div className="lp-navbar-actions">
            <button className="lp-btn-login" onClick={() => setShowLoginModal(true)}>
              Log In
            </button>
            <button className="lp-btn-register" onClick={() => setShowRegisterModal(true)}>
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="lp-hero">
        <div className="lp-hero-background">
          <div className="lp-hero-gradient"></div>
        </div>
        <div className="lp-hero-content">
          <div className="lp-hero-badge">Connecting Construction Professionals</div>
          <h1 className="lp-hero-title">Build Smarter with INTERVOS</h1>
          <p className="lp-hero-subtitle">
            The all-in-one platform connecting property managers, contractors, residents, and suppliers. 
            From posting jobs to winning bids — streamline your entire construction workflow.
          </p>
          <div className="lp-hero-buttons">
            <button className="lp-btn-primary lp-btn-large" onClick={() => setShowRegisterModal(true)}>
              Get Started Free
            </button>
            <button className="lp-btn-secondary lp-btn-large" onClick={() => setShowLoginModal(true)}>
              Sign In
            </button>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="lp-about">
        <div className="lp-section-container">
          <div className="lp-about-content">
            <div className="lp-about-text">
              <h2>One Platform. Every Role. Seamless Collaboration.</h2>
              <p>
                INTERVOS revolutionizes property maintenance and construction project management by bringing 
                everyone together in one intelligent ecosystem.
              </p>
              <p>
                Property managers post jobs and repairs for their buildings. Nearby entrepreneurs and contractors 
                see these opportunities, place competitive bids, and deliver quality work. Residents stay informed 
                with real-time updates, while suppliers provide the materials and services needed to complete projects.
              </p>
              <p className="lp-about-highlight">
                All through one smart, transparent system designed for efficiency and trust.
              </p>
            </div>
            <div className="lp-about-visual">
              <div className="lp-connection-diagram">
                <div className="lp-connection-node lp-node-manager">
                  <span className="lp-node-icon">🧱</span>
                  <span className="lp-node-label">Managers</span>
                </div>
                <div className="lp-connection-center">
                  <div className="lp-center-logo">INTERVOS</div>
                </div>
                <div className="lp-connection-node lp-node-contractor">
                  <span className="lp-node-icon">⚒️</span>
                  <span className="lp-node-label">Contractors</span>
                </div>
                <div className="lp-connection-node lp-node-resident">
                  <span className="lp-node-icon">🏘️</span>
                  <span className="lp-node-label">Residents</span>
                </div>
                <div className="lp-connection-node lp-node-supplier">
                  <span className="lp-node-icon">🧰</span>
                  <span className="lp-node-label">Suppliers</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="lp-features">
        <div className="lp-section-header">
          <h2>Everything You Need to Succeed</h2>
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

      {/* Role-Based Sections */}
      <section id="roles" className="lp-roles">
        <div className="lp-section-header">
          <h2>Built Specifically For You</h2>
          <p>Tailored experiences for every user in the construction ecosystem</p>
        </div>
        <div className="lp-roles-container">
          {roles.map((role, index) => (
            <div key={index} className={`lp-role-section lp-role-${role.color}`}>
              <div className="lp-role-content">
                <div className="lp-role-header">
                  <span className="lp-role-icon-large">{role.icon}</span>
                  <div>
                    <h3 className="lp-role-title">{role.title}</h3>
                    <p className="lp-role-headline">{role.headline}</p>
                  </div>
                </div>
                <p className="lp-role-description">{role.description}</p>
                <ul className="lp-role-benefits">
                  {role.benefits.map((benefit, idx) => (
                    <li key={idx}>
                      <span className="lp-benefit-icon">✓</span>
                      {benefit}
                    </li>
                  ))}
                </ul>
                <div className="lp-role-actions">
                  <button 
                    className="lp-btn-role-primary"
                    onClick={() => openRegisterModal(role.id)}
                  >
                    Sign Up as {role.title.split(" ")[0]}
                  </button>
                  <button 
                    className="lp-btn-role-secondary"
                    onClick={() => setShowLoginModal(true)}
                  >
                    Log In
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="lp-how-it-works">
        <div className="lp-section-header">
          <h2>Getting Started Is Simple</h2>
          <p>From registration to project completion in four easy steps</p>
        </div>
        <div className="lp-steps-container">
          <div className="lp-step">
            <div className="lp-step-number">1</div>
            <h3>Choose Your Role</h3>
            <p>Select whether you're a property manager, contractor, resident, or supplier</p>
          </div>
          <div className="lp-step-connector"></div>
          <div className="lp-step">
            <div className="lp-step-number">2</div>
            <h3>Complete Your Profile</h3>
            <p>Add your details, qualifications, and areas of expertise</p>
          </div>
          <div className="lp-step-connector"></div>
          <div className="lp-step">
            <div className="lp-step-number">3</div>
            <h3>Start Collaborating</h3>
            <p>Post jobs, submit bids, or track projects based on your role</p>
          </div>
          <div className="lp-step-connector"></div>
          <div className="lp-step">
            <div className="lp-step-number">4</div>
            <h3>Grow Together</h3>
            <p>Build your reputation and expand your network on the platform</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="lp-cta-section">
        <div className="lp-cta-content">
          <h2>Ready to Transform Your Construction Projects?</h2>
          <p>Join thousands of professionals already using INTERVOS to streamline their workflow</p>
          <button className="lp-btn-cta" onClick={() => setShowRegisterModal(true)}>
            Get Started Today — It's Free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="lp-footer">
        <div className="lp-footer-content">
          <div className="lp-footer-section lp-footer-brand">
            <div className="lp-footer-logo">
              <span className="lp-logo-icon">
                <img src={logo} alt="INTERVOS" />
              </span>
              <span className="lp-logo-text">INTERVOS</span>
            </div>
            <p>Connecting every corner of construction. From posting jobs to winning bids — INTERVOS simplifies it all.</p>
          </div>
          <div className="lp-footer-section">
            <h4>Platform</h4>
            <ul>
              <li><a href="#features">Features</a></li>
              <li><a href="#roles">For You</a></li>
              <li><a href="#how-it-works">How It Works</a></li>
              <li><a href="#pricing">Pricing</a></li>
            </ul>
          </div>
          <div className="lp-footer-section">
            <h4>Company</h4>
            <ul>
              <li><a href="#about">About Us</a></li>
              <li><a href="#contact">Contact</a></li>
              <li><a href="#careers">Careers</a></li>
              <li><a href="#blog">Blog</a></li>
            </ul>
          </div>
          <div className="lp-footer-section">
            <h4>Legal</h4>
            <ul>
              <li><a href="#privacy">Privacy Policy</a></li>
              <li><a href="#terms">Terms of Service</a></li>
              <li><a href="#cookies">Cookie Policy</a></li>
            </ul>
          </div>
        </div>
        <div className="lp-footer-bottom">
          <p>&copy; 2025 INTERVOS. All rights reserved.</p>
          <div className="lp-footer-social">
            <a href="#linkedin">LinkedIn</a>
            <a href="#twitter">Twitter</a>
            <a href="#facebook">Facebook</a>
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="lp-modal-overlay" onClick={closeModals}>
          <div className="lp-modal lp-modal-login" onClick={(e) => e.stopPropagation()}>
            <button className="lp-modal-close" onClick={closeModals}>×</button>
            <div className="lp-modal-header">
              <h2>Welcome Back</h2>
              <p>Log in to your INTERVOS account</p>
            </div>

            {/* 💡 NEW GOOGLE LOGIN BUTTON 💡 */}
            <div className="lp-google-login-container">
              <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
                <GoogleLogin 
                  onSuccess={handleLoginSuccess} // Use the new login handler
                  onError={handleError} 
                  text="signin_with" 
                  width="100%"
                />
              </GoogleOAuthProvider>
            </div>
            
            <div className="lp-modal-divider"><span>OR</span></div>
            <form className="lp-modal-form" onSubmit={handleLoginSubmit}>
              {loginErrors.submit && (
                <div className="lp-form-error-banner">
                  {loginErrors.submit}
                </div>
              )}
              
              <div className="lp-form-group">
                <label htmlFor="login-email">Email Address</label>
                <input
                  id="login-email"
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={loginFormData.email}
                  onChange={handleLoginChange}
                  className={loginErrors.email ? "lp-input-error" : ""}
                  required
                />
                {loginErrors.email && (
                  <span className="lp-error-message">{loginErrors.email}</span>
                )}
              </div>

              <div className="lp-form-group">
                <label htmlFor="login-password">Password</label>
                <div className="lp-password-input-wrapper">
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Enter your password"
                    value={loginFormData.password}
                    onChange={handleLoginChange}
                    className={loginErrors.password ? "lp-input-error" : ""}
                    required
                  />
                  <button
                    type="button"
                    className="lp-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
                {loginErrors.password && (
                  <span className="lp-error-message">{loginErrors.password}</span>
                )}
              </div>

              <div className="lp-form-options">
                <label className="lp-checkbox">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Remember me</span>
                </label>
                <button
                  type="button"
                  className="lp-link"
                  onClick={() => {
                    setShowLoginModal(false);
                    navigate('/forgot-password');
                  }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  Forgot password?
                </button>
              </div>

              <button 
                type="submit" 
                className="lp-btn-primary lp-btn-full"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? "Logging in..." : "Log In"}
              </button>
            </form>
            <div className="lp-modal-footer">
              Don't have an account?{" "}
              <button
                className="lp-link-btn"
                onClick={() => {
                  setShowLoginModal(false)
                  setShowRegisterModal(true)
                }}
              >
                Sign up for free
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Register Modal */}
      {showRegisterModal && (
        <div className="lp-modal-overlay" onClick={closeModals}>
          <div className="lp-modal lp-modal-register" onClick={(e) => e.stopPropagation()}>
            <button className="lp-modal-close" onClick={closeModals}>×</button>
            
            {registrationStep === 1 && (
              <>
                <div className="lp-modal-header">
                  <h2>Join INTERVOS</h2>
                  <p>Choose your role to get started</p>
                </div>
                <div className="lp-role-selector">
                  {roles.map((role) => (
                    <button
                      key={role.id}
                      className={`lp-role-option ${selectedRole === role.id ? 'lp-selected' : ''}`}
                      onClick={() => setSelectedRole(role.id)}
                    >
                      <span className="lp-role-option-icon">{role.icon}</span>
                      <span className="lp-role-option-text">{role.title}</span>
                    </button>
                  ))}
                </div>
                <button 
                  className="lp-btn-primary lp-btn-full"
                  disabled={!selectedRole}
                  onClick={() => setRegistrationStep(2)}
                >
                  Continue
                </button>
                <div className="lp-modal-footer">
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
                </div>
              </>
            )}

            {registrationStep === 2 && (
              <>
                <div className="lp-modal-header">
                  <button className="lp-back-button" onClick={() => setRegistrationStep(1)}>
                    ← Back
                  </button>
                  <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
                    <GoogleLogin onSuccess={handleSuccess} onError={handleError} />
                  </GoogleOAuthProvider>
                  {/* <hr /> */}
                  <h2>Create Your Account</h2>
                  <p>Tell us about yourself</p>
                </div>
                <form className="lp-modal-form" onSubmit={handleRegisterSubmit}>
                  {registerErrors.submit && (
                    <div className="lp-form-error-banner">
                      {registerErrors.submit}
                    </div>
                  )}

                  <input type="hidden" value={registerFormData.provider} name="provider" />

                  <div className="lp-form-row">
                    <div className="lp-form-group">
                      <label>First Name</label>
                      <input
                        type="text"
                        name="first_name"
                        placeholder="John"
                        value={registerFormData.first_name}
                        onChange={handleRegisterChange}
                        required
                        className={registerErrors.first_name ? 'error' : ''}
                      />
                      {registerErrors.first_name && (
                        <span className="lp-field-error">{registerErrors.first_name}</span>
                      )}
                    </div>
                    <div className="lp-form-group">
                      <label>Last Name</label>
                      <input
                        type="text"
                        name="last_name"
                        placeholder="Doe"
                        value={registerFormData.last_name}
                        onChange={handleRegisterChange}
                        required
                        className={registerErrors.last_name ? 'error' : ''}
                      />
                      {registerErrors.last_name && (
                        <span className="lp-field-error">{registerErrors.last_name}</span>
                      )}
                    </div>
                  </div>

                  <div className="lp-form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      name="email"
                      placeholder="john@example.com"
                      value={registerFormData.email}
                      onChange={handleRegisterChange}
                      required
                      className={registerErrors.email ? 'error' : ''}
                    />
                    {registerErrors.email && (
                      <span className="lp-field-error">{registerErrors.email}</span>
                    )}
                  </div>

                  <div className="lp-form-group">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      placeholder="+1 (555) 000-0000"
                      value={registerFormData.phone}
                      onChange={handleRegisterChange}
                      required
                      className={registerErrors.phone ? 'error' : ''}
                    />
                    {registerErrors.phone && (
                      <span className="lp-field-error">{registerErrors.phone}</span>
                    )}
                  </div>

                  {
                    registerFormData.provider == 'local' &&
                    <>
                    <div className="lp-form-group">
                      <label>Password</label>
                      <input
                        type="password"
                        name="password"
                        placeholder="Create a strong password"
                        value={registerFormData.password}
                        onChange={handleRegisterChange}
                        required
                        className={registerErrors.password ? 'error' : ''}
                      />
                      {registerErrors.password && (
                        <span className="lp-field-error">{registerErrors.password}</span>
                      )}
                    </div>

                    <div className="lp-form-group">
                      <label>Confirm Password</label>
                      <input
                        type="password"
                        name="confirm_password"
                        placeholder="Re-enter your password"
                        value={registerFormData.confirm_password}
                        onChange={handleRegisterChange}
                        required
                        className={registerErrors.confirm_password ? 'error' : ''}
                      />
                      {registerErrors.confirm_password && (
                        <span className="lp-field-error">{registerErrors.confirm_password}</span>
                      )}
                    </div>
                    </>
                  }

                  {/* ===== Property Manager Fields ===== */}
                  {selectedRole === "property-manager" && (
                    <>
                      <div className="lp-form-divider">Property Manager Details</div>

                      <div className="lp-form-group">
                        <label>Company Name</label>
                        <input
                          type="text"
                          name="company_name"
                          placeholder="Your property management company"
                          value={registerFormData.company_name}
                          onChange={handleRegisterChange}
                          required
                        />
                      </div>

                      <div className="lp-form-group">
                        <label>Business Address</label>
                        <input
                          type="text"
                          name="address"
                          placeholder="Street address"
                          value={registerFormData.address}
                          onChange={handleRegisterChange}
                          required
                        />
                      </div>

                      <div className="lp-form-group">
                        <label>Number of Properties</label>
                        <input
                          type="number"
                          name="num_properties"
                          placeholder="How many properties do you manage?"
                          value={registerFormData.num_properties || ""}
                          onChange={handleRegisterChange}
                        />
                      </div>
                    </>
                  )}

                  {/* ===== Entrepreneur Fields ===== */}
                  {selectedRole === "entrepreneur" && (
                    <>
                      <div className="lp-form-divider">Contractor Details</div>

                      <div className="lp-form-group">
                        <label>Company Name</label>
                        <input
                          type="text"
                          name="company_name"
                          placeholder="Your construction company"
                          value={registerFormData.company_name}
                          onChange={handleRegisterChange}
                          required
                        />
                      </div>

                      <div className="lp-form-group">
                        <label>Business Address</label>
                        <input
                          type="text"
                          name="address"
                          placeholder="Street address"
                          value={registerFormData.address}
                          onChange={handleRegisterChange}
                          required
                        />
                      </div>

                      <div className="lp-form-group">
                        <label>License Number</label>
                        <input
                          type="text"
                          name="license_number"
                          placeholder="Professional license number"
                          value={registerFormData.license_number}
                          onChange={handleRegisterChange}
                        />
                      </div>

                      <div className="lp-form-row">
                        <div className="lp-form-group">
                          <label>Years in Business</label>
                          <input
                            type="number"
                            name="years_in_business"
                            placeholder="5"
                            value={registerFormData.years_in_business}
                            onChange={handleRegisterChange}
                          />
                        </div>
                        <div className="lp-form-group">
                          <label>Number of Employees</label>
                          <input
                            type="number"
                            name="num_employees"
                            placeholder="10"
                            value={registerFormData.num_employees}
                            onChange={handleRegisterChange}
                          />
                        </div>
                      </div>

                      <div className="lp-form-group">
                        <label>Specializations</label>
                        <input
                          type="text"
                          name="specializations"
                          placeholder="e.g., Plumbing, Electrical, HVAC"
                          value={registerFormData.specializations}
                          onChange={handleRegisterChange}
                        />
                      </div>
                    </>
                  )}

                  {/* ===== Resident Fields ===== */}
                  {selectedRole === "resident" && (
                    <>
                      <div className="lp-form-divider">Resident Details</div>

                      <div className="lp-form-group">
                        <label>Property Name</label>
                        <input
                          type="text"
                          name="property_name"
                          placeholder="Your building or property name"
                          value={registerFormData.property_name}
                          onChange={handleRegisterChange}
                          required
                        />
                      </div>

                      <div className="lp-form-group">
                        <label>Unit Number</label>
                        <input
                          type="text"
                          name="unit_number"
                          placeholder="e.g., Apt 4A"
                          value={registerFormData.unit_number}
                          onChange={handleRegisterChange}
                          required
                        />
                      </div>

                      <div className="lp-form-group">
                        <label>Move-in Date</label>
                        <input
                          type="date"
                          name="move_in_date"
                          value={registerFormData.move_in_date}
                          onChange={handleRegisterChange}
                        />
                      </div>
                    </>
                  )}

                  {/* ===== Supplier Fields ===== */}
                  {selectedRole === "supplier" && (
                    <>
                      <div className="lp-form-divider">Supplier Details</div>

                      <div className="lp-form-group">
                        <label>Company Name</label>
                        <input
                          type="text"
                          name="company_name"
                          placeholder="Your supply company"
                          value={registerFormData.company_name}
                          onChange={handleRegisterChange}
                          required
                        />
                      </div>

                      <div className="lp-form-group">
                        <label>Business Address</label>
                        <input
                          type="text"
                          name="address"
                          placeholder="Street address"
                          value={registerFormData.address}
                          onChange={handleRegisterChange}
                          required
                        />
                      </div>

                      <div className="lp-form-group">
                        <label>Website</label>
                        <input
                          type="url"
                          name="website"
                          placeholder="https://yourwebsite.com"
                          value={registerFormData.website}
                          onChange={handleRegisterChange}
                        />
                      </div>

                      <div className="lp-form-group">
                        <label>Years in Business</label>
                        <input
                          type="number"
                          name="years_in_business"
                          placeholder="10"
                          value={registerFormData.years_in_business}
                          onChange={handleRegisterChange}
                        />
                      </div>

                      <div className="lp-form-group">
                        <label>Delivery Areas</label>
                        <input
                          type="text"
                          name="delivery_areas"
                          placeholder="Cities or regions you serve"
                          value={registerFormData.delivery_areas}
                          onChange={handleRegisterChange}
                        />
                      </div>
                    </>
                  )}

                  <div className="lp-form-group lp-form-checkbox">
                    <label className="lp-checkbox">
                      <input type="checkbox" required />
                      <span>
                        I agree to the <a href="#terms">Terms of Service</a> and{" "}
                        <a href="#privacy">Privacy Policy</a>
                      </span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="lp-btn-primary lp-btn-full"
                    disabled={isRegistering}
                  >
                    {isRegistering ? "Creating Account..." : "Create Account"}
                  </button>
                </form>

              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}