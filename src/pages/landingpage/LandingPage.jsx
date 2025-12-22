import { useState, useEffect } from "react"
import "../../styles/landinpage.css"
import logo from '../../assets/logo.png'
import mockupImage from '../../assets/images/mockup.png'
import phoneImage from '../../assets/images/phone.png'
import { useNavigate, useSearchParams } from "react-router-dom"
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import toast from 'react-hot-toast'
import {
  validateEmail,
  validatePassword,
  validateName,
  validatePasswordConfirmation
} from "../../utils/validation";

export default function LandingPage() {
  // ===== STATE MANAGEMENT =====
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [selectedRole, setSelectedRole] = useState("")
  const [scrolled, setScrolled] = useState(false)
  const [registrationStep, setRegistrationStep] = useState(1)
  const [registeredEmail, setRegisteredEmail] = useState("")
  const [verificationMessage, setVerificationMessage] = useState(null)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Login state
  const [loginFormData, setLoginFormData] = useState({
    email: "",
    password: "",
  })
  const [loginErrors, setLoginErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  // Registration state
  const [registerFormData, setRegisterFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    country_code: "+1",
    password: "",
    confirm_password: "",
    company_name: "",
    address: "",
    license_number: "",
    years_in_business: "",
    num_employees: "",
    specializations: "",
    property_name: "",
    property_id: "",
    unit_number: "",
    move_in_date: "",
    website: "",
    delivery_areas: "",
    provider: 'local',
    num_properties: ""
  })
  const [registerErrors, setRegisterErrors] = useState({ submit: '' })
  const [isRegistering, setIsRegistering] = useState(false)
  const [isResendingVerification, setIsResendingVerification] = useState(false)

  // Password validation state
  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  })
  const [showRegisterPassword, setShowRegisterPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Property selection state (for residents)
  const [properties, setProperties] = useState([])
  const [isLoadingProperties, setIsLoadingProperties] = useState(false)
  const [propertySearchTerm, setPropertySearchTerm] = useState("")
  const [showPropertyDropdown, setShowPropertyDropdown] = useState(false)
  const [filteredProperties, setFilteredProperties] = useState([])

  // Address autocomplete state
  const [addressSuggestions, setAddressSuggestions] = useState([])
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false)
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false)

  // ===== EMAIL VERIFICATION CHECK =====
  useEffect(() => {
    const verification = searchParams.get('verification');
    const reason = searchParams.get('reason');

    if (verification === 'success') {
      setVerificationMessage({
        type: 'success',
        message: 'Email verified successfully! You can now log in.'
      });
      setShowLoginModal(true);
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
      // Auto-hide after 5 seconds
      setTimeout(() => setVerificationMessage(null), 5000);
    } else if (verification === 'failed') {
      let message = 'Email verification failed.';
      if (reason === 'missing_token') message = 'Verification link is invalid (missing token).';
      if (reason === 'invalid_token') message = 'Verification link is invalid or expired.';
      if (reason === 'server_error') message = 'Server error during verification. Please try again.';

      setVerificationMessage({
        type: 'error',
        message
      });
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
      // Auto-hide after 10 seconds
      setTimeout(() => setVerificationMessage(null), 10000);
    }
  }, [searchParams]);

  // ===== SCROLL EFFECT =====
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // ===== PROPERTY FILTERING =====
  useEffect(() => {
    if (propertySearchTerm.trim() === "") {
      setFilteredProperties(properties)
    } else {
      const filtered = properties.filter(property => {
        const searchLower = propertySearchTerm.toLowerCase()
        const buildingName = (property.building_name || "").toLowerCase()
        const address = (property.address || "").toLowerCase()
        const city = (property.city || "").toLowerCase()
        return buildingName.includes(searchLower) ||
               address.includes(searchLower) ||
               city.includes(searchLower)
      })
      setFilteredProperties(filtered)
    }
  }, [propertySearchTerm, properties])

  // ===== CLOSE DROPDOWN WHEN CLICKING OUTSIDE =====
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.searchable-dropdown-container')) {
        setShowPropertyDropdown(false)
      }
    }
    if (showPropertyDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showPropertyDropdown])

  // ===== FETCH PROPERTIES FOR RESIDENTS =====
  useEffect(() => {
    if(selectedRole === "resident" && registrationStep === 2) {
      fetchProperties()
    }
  }, [selectedRole, registrationStep])

  // ===== REVALIDATE CONFIRM PASSWORD =====
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

  // ===== LOGIN HANDLERS =====
  const handleLoginChange = (e) => {
    const { name, value } = e.target
    setLoginFormData({
      ...loginFormData,
      [name]: value,
    })
    if (loginErrors[name]) {
      setLoginErrors({ ...loginErrors, [name]: "" })
    }
  }

  const validateLoginForm = () => {
    const newErrors = {}
    if (!loginFormData.email) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(loginFormData.email)) {
      newErrors.email = "Email is invalid"
    }
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
      const data = await response.json()
      if (!response.ok) {
        if (response.status === 403) {
          setLoginErrors({
            submit: data.message || "Please verify your email before logging in.",
            isEmailNotVerified: true,
            email: loginFormData.email
          })
          return
        }
        setLoginErrors({
          submit: data.message || "Invalid email or password",
          isEmailNotVerified: false
        })
        return
      }

      if (!response.ok) {
        // Handle email not verified error (403)
        if (response.status === 403) {
          setLoginErrors({
            submit: data.message || "Please verify your email before logging in.",
            isEmailNotVerified: true, // Flag to show resend link
            email: loginFormData.email // Store email for resend
          })
          return
        }

        // Handle other errors (401 - invalid credentials, etc.)
        setLoginErrors({
          submit: data.message || "Invalid email or password",
          isEmailNotVerified: false
        })
        return
      }

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

      // let resProfile = {}
      // if(data.user.role == 'resident') {
      //   const getResProfile = await fetch(`${API_BASE_URL}/api/residents/profile`, {
      //     method: "GET",
      //     headers: {
      //       'Authorization': `Bearer ${data.accessToken}`
      //     }
      //   })

      //   const resProfile = await getResProfile.json()

      //   console.log('RESIDENT', resProfile)
      // }

      const userProfile = {
        id: data.user.id || 101,
        name: data.user.name || `${data.user.first_name || ""} ${data.user.last_name || ""}`.trim(),
        email: data.user.email || loginFormData.email,
        role: data.user.role,
        token: data.accessToken || null,
        entrepProfile: data.user.role == 'entrepreneur' ? {entrepProfile, subscription} : null
        // residentProfile: data.user.role = 'resident' ? {  }
      }

      localStorage.setItem("token", userProfile.token);
      localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.setItem("userId", userProfile.id);
      localStorage.setItem("userProfile", JSON.stringify(userProfile))

      setShowLoginModal(false)
      navigate(`/homepage/${userProfile.role}`)
    } catch (error) {
      console.error("Login error:", error)
      setLoginErrors({
        submit: "Login failed. Please check your connection and try again.",
        isEmailNotVerified: false
      })
    } finally {
      setIsLoggingIn(false)
    }
  }

  const handleLoginSuccess = async (credentialResponse) => {
    const token = credentialResponse.credential;
    const userData = jwtDecode(token);
    
    setIsLoggingIn(true);
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    try {
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
        throw new Error(data.message || "Google login failed.");
      }

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

  // ===== REGISTRATION HANDLERS =====
  const handleRegisterChange = (e) => {
    const { name, value } = e.target
    setRegisterFormData({
        ...registerFormData,
        [name]: value,
    })

    // Live password strength validation
    if (name === "password") {
        setPasswordValidation({
            length: value.length >= 8,
            uppercase: /[A-Z]/.test(value),
            lowercase: /[a-z]/.test(value),
            number: /[0-9]/.test(value),
            special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)
        });
    }

    // Live validation - validate as user types
    let error = "";

    // Skip password validation if using Google OAuth
    if (registerFormData.provider === "google" && (name === "password" || name === "confirm_password")) {
        setRegisterErrors({
            ...registerErrors,
            [name]: ""
        });
        return;
    }

    switch (name) {
        case "email":
            error = validateEmail(value);
            break;
        case "password":
            error = validatePassword(value);
            break;
        case "confirm_password":
            error = validatePasswordConfirmation(registerFormData.password, value);
            break;
        case "first_name":
            error = validateName(value, "First name");
            break;
        case "last_name":
            error = validateName(value, "Last name");
            break;
        case "phone":
            // Validate phone number (digits, spaces, dashes, parentheses only)
            if (value && !/^[\d\s\-()]+$/.test(value)) {
                error = "Phone number can only contain digits, spaces, dashes, and parentheses";
            } else if (value && value.replace(/[\s\-()]/g, '').length < 10) {
                error = "Phone number must be at least 10 digits";
            }
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

  // Address autocomplete handler
  const handleAddressChange = async (e) => {
    const value = e.target.value;
    setRegisterFormData({
      ...registerFormData,
      address: value
    });

    if (value.length > 2) {
      setIsLoadingAddresses(true);
      setShowAddressSuggestions(true);

      try {
        // Using Nominatim (OpenStreetMap) API - completely free, no API key needed
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&limit=5&addressdetails=1`,
          {
            headers: {
              'User-Agent': 'INTERVOS Construction Platform' // Required by Nominatim
            }
          }
        );
        const data = await response.json();
        setAddressSuggestions(data);
      } catch (error) {
        console.error('Error fetching address suggestions:', error);
        setAddressSuggestions([]);
      } finally {
        setIsLoadingAddresses(false);
      }
    } else {
      setShowAddressSuggestions(false);
      setAddressSuggestions([]);
    }
  };

  const selectAddress = (suggestion) => {
    setRegisterFormData({
      ...registerFormData,
      address: suggestion.display_name
    });
    setShowAddressSuggestions(false);
    setAddressSuggestions([]);
  };

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

        const roleForBackend = selectedRole.replace(/-/g, '_');
        let payload = {
            ...registerFormData,
            role: roleForBackend
        };

        // Remove unnecessary fields
        delete payload.confirm_password;
        delete payload.property_name;
        delete payload.role; // Don't send role, it's determined by endpoint

        // ✅ FIX: Handle Google OAuth registration
        if (payload.provider === 'google') {
            delete payload.password;
            // Ensure provider_id is included
            if (!payload.provider_id) {
                setRegisterErrors({
                    submit: "Google registration data missing. Please try again."
                });
                setIsRegistering(false);
                return;
            }
            // ✅ FIX: If Google account doesn't have last_name, use first_name or a placeholder
            if (!payload.last_name || payload.last_name.trim() === '') {
                payload.last_name = payload.first_name || 'User';
            }
        } else {
            // For local registration, ensure password exists
            if (!payload.password) {
                setRegisterErrors({ 
                    submit: "Password is required for local registration" 
                });
                setIsRegistering(false);
                return;
            }
        }

        // 3. Convert specializations string to array (for entrepreneur)
        if (selectedRole === "entrepreneur" && payload.specializations && typeof payload.specializations === "string") {
            payload.specializations = payload.specializations
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);
        } else if (selectedRole === "entrepreneur") {
            payload.specializations = [];
        }

        // 4. Convert delivery_areas for supplier
        if (selectedRole === "supplier" && payload.delivery_areas && typeof payload.delivery_areas === "string") {
            payload.delivery_areas = payload.delivery_areas
                .split(",")
                .map((area) => area.trim())
                .filter(Boolean);
        }

        console.log("Payload being sent:", payload);

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        
        const data = await response.json();

        console.log("Backend response data:", data);

        if (!response.ok) {
            console.error("Backend response error:", data);
            if (data.errors && typeof data.errors === 'object') {
                setRegisterErrors({
                    submit: data.message || "Please check your input and try again",
                    ...data.errors
                });
            } else {
                setRegisterErrors({ submit: data.message || "Registration failed" });
            }
            return;
        }

        // ✅ Google users are already verified - redirect to dashboard
        if (registerFormData.provider === 'google') {
            // Backend doesn't return token on registration - need to login to get token
            try {
                const loginResponse = await fetch(`${API_BASE_URL}/api/auth/google-login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        email: data.user.email,
                        provider_id: registerFormData.provider_id
                    }),
                });

                const loginData = await loginResponse.json();

                if (!loginResponse.ok) {
                    console.error("Login after registration failed:", loginData);
                    setRegisterErrors({ submit: "Registration successful but login failed. Please try logging in manually." });
                    return;
                }

                // Get entrepreneur profile if needed (same as handleLoginSuccess)
                let entrepProfile = {};
                if (loginData.user.role === 'entrepreneur') {
                    const getEntreProfile = await fetch(`${API_BASE_URL}/api/users/entrepreneur/user/${loginData.user.id}`, {
                        method: "GET",
                        headers: {
                            'Authorization': `Bearer ${loginData.accessToken}`
                        }
                    });
                    const entreData = await getEntreProfile.json();
                    entrepProfile = entreData || {};
                }

                // Create userProfile object matching login format
                const userProfile = {
                    id: loginData.user.id,
                    name: loginData.user.name || `${loginData.user.first_name || ""} ${loginData.user.last_name || ""}`.trim(),
                    email: loginData.user.email,
                    role: loginData.user.role,
                    token: loginData.accessToken || null,
                    entrepProfile: loginData.user.role === 'entrepreneur' ? entrepProfile : null
                };

                // Store user data in localStorage (same format as login)
                localStorage.setItem('token', userProfile.token);
                localStorage.setItem('refreshToken', loginData.refreshToken);
                localStorage.setItem('userId', userProfile.id);
                localStorage.setItem('userProfile', JSON.stringify(userProfile));

                // Redirect to role-specific homepage
                navigate(`/homepage/${userProfile.role}`);
            } catch (loginError) {
                console.error("Error logging in after registration:", loginError);
                setRegisterErrors({ submit: "Registration successful but automatic login failed. Please try logging in manually." });
            }
        } else {
            // Local users need email verification
            setRegisteredEmail(registerFormData.email);
            setRegistrationStep(4); // Success screen
        }
    } catch (error) {
        console.error("Registration error:", error);
        setRegisterErrors({ submit: error.message || "Registration failed due to a server error." });
    } finally {
        setIsRegistering(false);
    }
  };

  const handleSuccess = async (credentialResponse) => {
    const token = credentialResponse.credential;
    const userData = jwtDecode(token);
    console.log("Google user:", userData);

    const providerId = userData.sub;
    
    // ✅ FIX: Make sure provider_id is set
    setRegisterFormData((prev) => ({
        ...prev,
        first_name: userData.given_name || "",
        last_name: userData.family_name || "",
        email: userData.email || "",
        provider: "google",
        provider_id: providerId, // ✅ Ensure this is set
        password: "",
        confirm_password: "",
        // Preserve other fields that were already filled
        company_name: prev.company_name,
        address: prev.address,
        phone: prev.phone,
        // ... other fields
    }));

    // ✅ Advance to Step 3 (Profile Completion) after Google OAuth
    setRegistrationStep(3);
  };

  const handleError = () => {
    console.error("Google Sign-In failed");
  };

  // Handle Step 2: Authentication (Email/Password entry)
  const handleAuthenticationSubmit = (e) => {
    e.preventDefault();
    const errors = {};

    // Validate first name
    if (!registerFormData.first_name) {
      errors.first_name = "First name is required";
    }

    // Validate last name (only required for local registration, optional for Google)
    if (registerFormData.provider !== 'google' && !registerFormData.last_name) {
      errors.last_name = "Last name is required";
    }

    // Validate email
    if (!registerFormData.email) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(registerFormData.email)) {
      errors.email = "Please enter a valid email address";
    }

    // Validate password (only for local registration, not needed for Google)
    if (registerFormData.provider !== 'google') {
      if (!registerFormData.password) {
        errors.password = "Password is required";
      } else if (registerFormData.password.length < 8) {
        errors.password = "Password must be at least 8 characters";
      }

      // Validate confirm password
      if (!registerFormData.confirm_password) {
        errors.confirm_password = "Please confirm your password";
      } else if (registerFormData.password !== registerFormData.confirm_password) {
        errors.confirm_password = "Passwords do not match";
      }
    }

    if (Object.keys(errors).length > 0) {
      setRegisterErrors(errors);
      return;
    }

    // Clear errors and set provider to local (if not already Google)
    setRegisterErrors({});
    if (registerFormData.provider !== 'google') {
      setRegisterFormData((prev) => ({ ...prev, provider: "local" }));
    }

    // Advance to Step 3 (Profile Completion)
    setRegistrationStep(3);
  };

  // ===== PROPERTY HANDLERS =====
  const fetchProperties = async () => {
    setIsLoadingProperties(true)
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
    try {
      const response = await fetch(`${API_BASE_URL}/api/properties/public`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        }
      })
      if (!response.ok) {
        throw new Error(`Failed to fetch properties: ${response.status}`)
      }
      const data = await response.json()
      setProperties(data.properties || data || [])
    } catch (error) {
      console.error("Error fetching properties:", error)
      setRegisterErrors(prev => ({
        ...prev,
        submit: "Failed to load properties. Please try again."
      }))
    } finally {
      setIsLoadingProperties(false)
    }
  }

  const handlePropertySelect = (property) => {
    setRegisterFormData({
      ...registerFormData,
      property_id: property.id,
      property_name: property.building_name || property.address,
    })
    setPropertySearchTerm(property.building_name || property.address)
    setShowPropertyDropdown(false)
  }

  const handlePropertySearchChange = (e) => {
    setPropertySearchTerm(e.target.value)
    setShowPropertyDropdown(true)
  }

  // ===== EMAIL VERIFICATION =====
  const handleResendVerification = async (emailOverride = null) => {
    let emailToUse;
    if (emailOverride && typeof emailOverride === 'string') {
      emailToUse = emailOverride;
    } else if (registeredEmail) {
      emailToUse = registeredEmail;
    } else if (loginErrors.email && typeof loginErrors.email === 'string') {
      emailToUse = loginErrors.email;
    }

    if (!emailToUse) {
      console.error("No email found for resend verification");
      return;
    }

    setIsResendingVerification(true);
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailToUse }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.message || "Failed to resend verification email", {
          duration: 4000,
          style: {
            borderRadius: '4px',
            background: '#fff',
            color: '#1f2937',
            border: '1px solid #ef4444',
            padding: '16px',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          },
        });
        return;
      }
      toast.success("Verification email has been resent. Please check your inbox.", {
        duration: 5000,
        style: {
          borderRadius: '4px',
          background: '#fff',
          color: '#1f2937',
          border: '1px solid #14919b',
          padding: '16px',
          fontSize: '14px',
          fontWeight: '500',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        },
      });
    } catch (error) {
      console.error("Resend verification error:", error);
      toast.error("Failed to resend verification email. Please try again.", {
        duration: 4000,
        style: {
          borderRadius: '4px',
          background: '#fff',
          color: '#1f2937',
          border: '1px solid #ef4444',
          padding: '16px',
          fontSize: '14px',
          fontWeight: '500',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        },
      });
    } finally {
      setIsResendingVerification(false);
    }
  };

  // ===== MODAL HELPERS =====
  const closeModals = () => {
    setShowLoginModal(false)
    setShowRegisterModal(false)
    setSelectedRole("")
    setRegistrationStep(1)
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

  // ===== DATA =====
  const roles = [
    {
      id: "property-manager",
      title: "Property Manager",
      icon: (
        <svg viewBox="0 0 24 24">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
      headline: "Take Back Control",
      description: "Drowning in maintenance requests? Chasing contractors for updates? Managing properties shouldn't feel like chaos.",
      benefits: [
        "Full visibility: Every property, every job, every contractor — in one dashboard",
        "No more chasing: Automated updates and real-time project tracking",
        "You decide: Review bids, approve work, and control every decision"
      ],
      color: "primary",
      gradient: "linear-gradient(135deg, #0f223d 0%, #1a3a5c 100%)"
    },
    {
      id: "entrepreneur",
      title: "Entrepreneur",
      icon: (
        <svg viewBox="0 0 24 24">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
      ),
      headline: "Get Paid Faster, Work Smarter",
      description: "Tired of hunting for jobs? Waiting weeks for payment? Competing on price alone?",
      benefits: [
        "Steady work pipeline: Verified jobs delivered to your inbox daily",
        "Faster payments: Milestone-based invoicing with escrow protection",
        "Win on value: Showcase your expertise, not just your bid price"
      ],
      color: "secondary",
      gradient: "linear-gradient(135deg, #00a5a9 0%, #008b8f 100%)"
    },
    {
      id: "resident",
      title: "Resident",
      icon: (
        <svg viewBox="0 0 24 24">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
      headline: "Finally Know What's Happening in Your Building",
      description: "No more wondering when that leak will get fixed or why there's construction noise at 7 AM.",
      benefits: [
        "Real-time updates: Track repairs affecting your unit",
        "Direct communication: Message property managers instantly",
        "Request repairs: Submit maintenance tickets in seconds"
      ],
      color: "success",
      gradient: "linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)"
    },
    {
      id: "supplier",
      title: "Supplier",
      icon: (
        <svg viewBox="0 0 24 24">
          <path d="M16 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z" />
          <path d="M2 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z" />
          <path d="M7 21h10" />
          <path d="M12 3v18" />
          <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
        </svg>
      ),
      headline: "Supply the Projects That Matter",
      description: "Stop cold-calling. Connect directly with active construction projects needing your materials.",
      benefits: [
        "Direct access: Connect with active projects needing materials",
        "Expand your network: Reach property managers and contractors",
        "Streamlined ordering: From quote to delivery in one platform"
      ],
      color: "info",
      gradient: "linear-gradient(135deg, #3498db 0%, #2980b9 100%)"
    },
  ]

  const features = [
    {
      title: "Smart Bidding Engine",
      description: "Stop overpaying. Get competitive bids from vetted contractors automatically.",
      iconType: "zap",
    },
    {
      title: "Verified Professionals",
      description: "No more bad hires. Every contractor is background-checked and community-rated.",
      iconType: "check-circle",
    },
    {
      title: "Live Project Dashboard",
      description: "Know exactly what's happening — always. No phone calls required.",
      iconType: "bar-chart",
    },
    {
      title: "Multi-Property Command Center",
      description: "Manage 10 buildings or 100. One login. Complete control.",
      iconType: "building",
    },
    {
      title: "Built-In Messaging",
      description: "Stop chasing people. Instant communication with everyone on your project.",
      iconType: "message",
    },
    {
      title: "Protected Payments",
      description: "Get paid faster with escrow protection and milestone-based billing.",
      iconType: "shield",
    },
  ]

  // Professional SVG Icon Component
  const FeatureIcon = ({ type }) => {
    const icons = {
      'zap': (
        <svg className="lp-feature-icon-svg" viewBox="0 0 24 24">
          <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" />
        </svg>
      ),
      'check-circle': (
        <svg className="lp-feature-icon-svg" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      ),
      'bar-chart': (
        <svg className="lp-feature-icon-svg" viewBox="0 0 24 24">
          <path d="M18 20V10M12 20V4M6 20v-6" />
        </svg>
      ),
      'building': (
        <svg className="lp-feature-icon-svg" viewBox="0 0 24 24">
          <path d="M3 21h18M9 8h1m-1 4h1m-1 4h1M14 8h1m-1 4h1m-1 4h1M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
        </svg>
      ),
      'message': (
        <svg className="lp-feature-icon-svg" viewBox="0 0 24 24">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
      'shield': (
        <svg className="lp-feature-icon-svg" viewBox="0 0 24 24">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
    };
    return <div className="lp-feature-icon-wrapper">{icons[type]}</div>;
  }

  // ===== RENDER =====
  return (
    <div className="lp-landing-page">
      {/* Email Verification Message */}
      {verificationMessage && (
        <div className={`lp-verification-banner ${verificationMessage.type}`}>
          <div className="lp-verification-banner-content">
            {verificationMessage.type === 'success' ? '✅' : '❌'} {verificationMessage.message}
            <button
              className="lp-verification-close"
              onClick={() => setVerificationMessage(null)}
            >
              ×
            </button>
          </div>
        </div>
      )}

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
              Login
            </button>
            <button className="lp-btn-register" onClick={() => setShowRegisterModal(true)}>
              Get Started
            </button>
            {/* Hamburger Menu Icon - Mobile Only */}
            <button className="lp-hamburger-menu" onClick={() => setShowMobileMenu(!showMobileMenu)} aria-label="Toggle menu">
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <div className="lp-mobile-menu-overlay" onClick={() => setShowMobileMenu(false)}>
          <div className="lp-mobile-menu" onClick={(e) => e.stopPropagation()}>
            <div className="lp-mobile-menu-header">
              <div className="lp-navbar-logo">
                <span className="lp-logo-icon">
                  <img src={logo} alt="INTERVOS" />
                </span>
                <span className="lp-logo-text">INTERVOS</span>
              </div>
              <button className="lp-close-menu" onClick={() => setShowMobileMenu(false)} aria-label="Close menu">
                ×
              </button>
            </div>
            <nav className="lp-mobile-nav">
              <a href="#about" onClick={() => setShowMobileMenu(false)}>About</a>
              <a href="#features" onClick={() => setShowMobileMenu(false)}>Features</a>
              <a href="#roles" onClick={() => setShowMobileMenu(false)}>For You</a>
              <a href="#how-it-works" onClick={() => setShowMobileMenu(false)}>How It Works</a>
            </nav>
            <div className="lp-mobile-menu-actions">
              <button className="lp-btn-login lp-btn-full" onClick={() => { setShowLoginModal(true); setShowMobileMenu(false); }}>
                Login
              </button>
              <button className="lp-btn-register lp-btn-full" onClick={() => { setShowRegisterModal(true); setShowMobileMenu(false); }}>
                Get Started
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="lp-hero">
        <div className="lp-hero-background">
          <div className="lp-hero-gradient"></div>
        </div>
        <div className="lp-hero-content">
          <div className="lp-hero-badge">
            Trusted by 1,000+ Property Managers & Contractors
          </div>
          <h1 className="lp-hero-title">
            Property Maintenance, Managed <span className="lp-highlight-teal">Smarter</span>
          </h1>
          <p className="lp-hero-subtitle">
            INTERVOS automates your entire construction workflow — from emergency repairs to major renovations.
            One platform. Zero stress. Full control from day one.
          </p>
          <div className="lp-hero-buttons">
            <button className="lp-btn-primary lp-btn-large" onClick={() => setShowRegisterModal(true)}>
              Start Your First Project
            </button>
            <button className="lp-btn-ghost lp-btn-large" onClick={() => document.getElementById('how-it-works').scrollIntoView({ behavior: 'smooth' })}>
              See How It Works
            </button>
          </div>

          
        </div>

        {/* Laptop Mockup with Dashboard */}
        <div className="lp-hero-dashboard">
          <div className="lp-devices-wrapper">
            {/* Phone Mockup */}
            <div className="lp-phone-mockup">
              <div className="lp-phone-frame">
                <div className="lp-phone-notch"></div>
                <div className="lp-phone-screen">
                  <div className="lp-phone-content">
                    <img src={phoneImage} alt="INTERVOS Mobile App" className="lp-phone-image" />
                  </div>
                </div>
              </div>
            </div>

            {/* Laptop Mockup */}
            <div className="lp-laptop-mockup">
              {/* Laptop Screen */}
              <div className="lp-laptop-screen">
                <div className="lp-laptop-screen-inner">
                  {/* Browser Chrome */}
                  <div className="lp-browser-chrome">
                    <div className="lp-browser-dots">
                      <span className="lp-dot lp-dot-red"></span>
                      <span className="lp-dot lp-dot-yellow"></span>
                      <span className="lp-dot lp-dot-green"></span>
                    </div>
                    <div className="lp-browser-url">intervos.ca/dashboard</div>
                  </div>

                  {/* Dashboard Content */}
                  <div className="lp-dashboard-content">
                    <img src={mockupImage} alt="INTERVOS Dashboard" className="lp-dashboard-image" />
                  </div>
                </div>
              </div>

              {/* Laptop Base */}
              <div className="lp-laptop-base">
                <div className="lp-laptop-notch"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      

      {/* About Section */}
      <section id="about" className="lp-about">
        <div className="lp-section-container">
          <div className="lp-about-content">
            <div className="lp-about-text">
              <div className="lp-founder-note">
                <div className="lp-quote-mark">"</div>
                <h2>After managing 50+ buildings, I realized the system wasn't just slow—it was broken.</h2>
              </div>

              <div className="lp-pain-points">
                <div className="lp-pain-item">
                  <span className="lp-pain-icon">⚠</span>
                  <span>Entrepreneurs not showing up</span>
                </div>
                <div className="lp-pain-item">
                  <span className="lp-pain-icon">⚠</span>
                  <span>Surprise costs eating into budgets</span>
                </div>
                <div className="lp-pain-item">
                  <span className="lp-pain-icon">⚠</span>
                  <span>Residents calling at 2am about leaks</span>
                </div>
                <div className="lp-pain-item">
                  <span className="lp-pain-icon">⚠</span>
                  <span>Invoices lost in email chains</span>
                </div>
              </div>

              <p className="lp-story-text">
                So we asked ourselves: what if there was one place where everything just... worked?
              </p>
              <p className="lp-story-text">
                That's INTERVOS. Property managers post jobs. Entrepreneurs bid. Everyone sees what's happening.
                Money moves when work gets done. Simple.
              </p>

              <div className="lp-about-stats">
                <div className="lp-stat-item">
                  <div className="lp-stat-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                  </div>
                  <div className="lp-stat-number">1,000+</div>
                  <div className="lp-stat-label">Active users</div>
                </div>
                <div className="lp-stat-item">
                  <div className="lp-stat-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                    </svg>
                  </div>
                  <div className="lp-stat-number">$2.5M+</div>
                  <div className="lp-stat-label">Projects completed</div>
                </div>
                <div className="lp-stat-item">
                  <div className="lp-stat-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                  </div>
                  <div className="lp-stat-number">24hrs</div>
                  <div className="lp-stat-label">Avg. response time</div>
                </div>
              </div>
            </div>
            <div className="lp-about-visual">
              <div className="lp-success-dashboard">
                <div className="lp-dashboard-header">
                  <div className="lp-dashboard-title">Recent Activity</div>
                  <div className="lp-dashboard-status">
                    <span className="lp-status-dot"></span>
                    Live
                  </div>
                </div>
                <div className="lp-dashboard-body">
                  <div className="lp-success-card">
                    <div className="lp-success-icon">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M13.5 4L6 11.5L2.5 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className="lp-success-content">
                      <div className="lp-success-title">Project Successfully Completed</div>
                      <div className="lp-success-detail">Plumbing repair - Building 24A</div>
                      <div className="lp-success-time">2 hours ago</div>
                    </div>
                  </div>
                  <div className="lp-metric-card">
                    <div className="lp-metric-label">Fastest Response Time</div>
                    <div className="lp-metric-value">12 mins</div>
                    <div className="lp-metric-trend">↑ 40% faster than average</div>
                  </div>
                  <div className="lp-activity-graph">
                    <div className="lp-graph-label">Project Volume</div>
                    <div className="lp-graph-container">
                      <div className="lp-graph-line">
                        <svg viewBox="0 0 100 70" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="graph-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="#14919b" stopOpacity="0.3" />
                              <stop offset="100%" stopColor="#14919b" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                          <path className="lp-graph-area" d="M 0,70 L 0,38 L 25,28 L 50,14 L 75,7 L 100,11 L 100,70 Z" />
                          <path d="M 0,38 L 25,28 L 50,14 L 75,7 L 100,11" />
                        </svg>
                      </div>
                      <div className="lp-graph-dots">
                        <div className="lp-graph-dot" style={{left: '0%', bottom: '38px'}}></div>
                        <div className="lp-graph-dot" style={{left: '25%', bottom: '28px'}}></div>
                        <div className="lp-graph-dot" style={{left: '50%', bottom: '14px'}}></div>
                        <div className="lp-graph-dot active" style={{left: '75%', bottom: '7px'}}></div>
                        <div className="lp-graph-dot" style={{left: '100%', bottom: '11px'}}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="lp-features">
        <div className="lp-section-header">
          <h2>Everything You Need. Nothing You Don't.</h2>
          <p>Built for modern property management — no complexity, just results</p>
        </div>
        <div className="lp-features-grid">
          {features.map((feature, index) => (
            <div key={index} className="lp-feature-card">
              <FeatureIcon type={feature.iconType} />
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Role-Based Sections */}
      <section id="roles" className="lp-roles">
        <div className="lp-roles-intro">
          <h2>Who uses INTERVOS?</h2>
          <p>Everyone involved in getting work done on buildings.</p>
        </div>

        {/* Property Managers */}
        <div className="lp-role-block lp-role-manager">
          <div className="lp-role-grid">
            <div className="lp-role-text">
              <span className="lp-role-label">Property Managers</span>
              <h3>Stop chasing. Start managing.</h3>
              <p className="lp-role-story">
                "I used to spend 10+ hours a week just tracking down contractors. Did they start the job?
                When will they finish? Why hasn't the invoice come through? Now I just open the dashboard.
                Everything's there."
              </p>
              <p className="lp-role-attribution">— Sarah M., manages 8 buildings in Toronto</p>

              <div className="lp-role-features">
                <div className="lp-feature-item">
                  <strong>Post a job in 60 seconds</strong>
                  <span>Building address, issue description, photos. Done.</span>
                </div>
                <div className="lp-feature-item">
                  <strong>Get bids from verified entrepreneurs</strong>
                  <span>No more calling around. They come to you.</span>
                </div>
                <div className="lp-feature-item">
                  <strong>Track everything in one place</strong>
                  <span>Who's working where. What's done. What's pending.</span>
                </div>
              </div>

              <button className="lp-btn-role" onClick={() => openRegisterModal("property-manager")}>
                Start managing smarter
              </button>
            </div>
            <div className="lp-role-visual">
              <div className="lp-visual-card">
                <div className="lp-card-tag">Active Projects</div>
                <div className="lp-project-list">
                  <div className="lp-project-item">
                    <div className="lp-project-name">Plumbing - Unit 204</div>
                    <div className="lp-project-status in-progress">In Progress</div>
                  </div>
                  <div className="lp-project-item">
                    <div className="lp-project-name">HVAC Repair - Building A</div>
                    <div className="lp-project-status completed">Completed</div>
                  </div>
                  <div className="lp-project-item">
                    <div className="lp-project-name">Roof Leak - Unit 312</div>
                    <div className="lp-project-status bidding">Receiving Bids (3)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Entrepreneurs */}
        <div className="lp-role-block lp-role-entrepreneur">
          <div className="lp-role-grid reverse">
            <div className="lp-role-visual">
              <div className="lp-visual-card">
                <div className="lp-card-tag">Available Jobs Near You</div>
                <div className="lp-job-list">
                  <div className="lp-job-item">
                    <div className="lp-job-title">Kitchen Renovation</div>
                    <div className="lp-job-meta">$8,500 • Yonge & Eglinton • Posted 2h ago</div>
                  </div>
                  <div className="lp-job-item">
                    <div className="lp-job-title">Emergency Electrical Repair</div>
                    <div className="lp-job-meta">$1,200 • Downtown • Posted 4h ago</div>
                  </div>
                  <div className="lp-job-item">
                    <div className="lp-job-title">Bathroom Plumbing Fix</div>
                    <div className="lp-job-meta">$650 • North York • Posted 1d ago</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="lp-role-text">
              <span className="lp-role-label">Entrepreneurs & Contractors</span>
              <h3>Bid on real jobs. Get paid faster.</h3>
              <p className="lp-role-story">
                "Most platforms take 20% and you're competing with 50 other people who undercut you. Here,
                property managers see your profile, your past work, your ratings. I've closed 4 jobs this month
                without a single phone call."
              </p>
              <p className="lp-role-attribution">— Mike T., general contractor, 6 years experience</p>

              <div className="lp-role-features">
                <div className="lp-feature-item">
                  <strong>Jobs sent to your inbox</strong>
                  <span>Filter by location, budget, and trade. Only see what matters.</span>
                </div>
                <div className="lp-feature-item">
                  <strong>Milestone payments</strong>
                  <span>Get paid as you complete work. No more waiting 60 days.</span>
                </div>
                <div className="lp-feature-item">
                  <strong>Build your reputation</strong>
                  <span>Every completed job adds to your profile.</span>
                </div>
              </div>

              <button className="lp-btn-role" onClick={() => openRegisterModal("entrepreneur")}>
                Find work today
              </button>
            </div>
          </div>
        </div>

        {/* Residents */}
        <div className="lp-role-block lp-role-resident">
          <div className="lp-role-grid">
            <div className="lp-role-text">
              <span className="lp-role-label">Residents</span>
              <h3>Know what's happening in your building.</h3>
              <p className="lp-role-story">
                "I submitted a maintenance request about a leaky faucet. Got a notification when the plumber
                was assigned. Another when they were on their way. Another when it was fixed. Felt like magic
                compared to the old 'we'll get to it' approach."
              </p>
              <p className="lp-role-attribution">— James L., resident since 2019</p>

              <div className="lp-role-features">
                <div className="lp-feature-item">
                  <strong>Submit requests instantly</strong>
                  <span>Broken appliance? Maintenance issue? Submit it from your phone.</span>
                </div>
                <div className="lp-feature-item">
                  <strong>Get real updates</strong>
                  <span>No more "we're working on it." See actual progress.</span>
                </div>
                <div className="lp-feature-item">
                  <strong>Message your property manager</strong>
                  <span>Direct line. No phone tag.</span>
                </div>
              </div>

              <button className="lp-btn-role" onClick={() => openRegisterModal("resident")}>
                Connect to your building
              </button>
            </div>
            <div className="lp-role-visual">
              <div className="lp-visual-card">
                <div className="lp-card-tag">Your Requests</div>
                <div className="lp-request-list">
                  <div className="lp-request-item">
                    <div className="lp-request-title">Leaky faucet</div>
                    <div className="lp-request-status fixed">Fixed yesterday</div>
                  </div>
                  <div className="lp-request-item">
                    <div className="lp-request-title">Heating not working</div>
                    <div className="lp-request-status scheduled">Scheduled for tomorrow</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="lp-how-it-works">
        <div className="lp-section-header">
          <h2>From Problem to Solution in 4 Simple Steps</h2>
          <p>Start controlling your projects today — no complexity, just results</p>
        </div>
        <div className="lp-steps-container">
          <div className="lp-step">
            <div className="lp-step-number">1</div>
            <h3>Post Your Project</h3>
            <p>Describe what needs fixing. Set your budget. Define your timeline.</p>
          </div>
          <div className="lp-step-connector"></div>
          <div className="lp-step">
            <div className="lp-step-number">2</div>
            <h3>Review Smart Bids</h3>
            <p>Vetted contractors compete for your work. Compare proposals side-by-side.</p>
          </div>
          <div className="lp-step-connector"></div>
          <div className="lp-step">
            <div className="lp-step-number">3</div>
            <h3>Track in Real-Time</h3>
            <p>Know exactly where your project stands — from first nail to final invoice.</p>
          </div>
          <div className="lp-step-connector"></div>
          <div className="lp-step">
            <div className="lp-step-number">4</div>
            <h3>Pay with Confidence</h3>
            <p>Release payments only when milestones are complete. Everyone stays protected.</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="lp-cta-section">
        <div className="lp-cta-content">
          <h2>Stop Wasting Time. Start Building Smarter.</h2>
          <p>
            Every day you wait is another day of chasing contractors, dealing with cost overruns,
            and frustrated residents. INTERVOS eliminates all of it.
          </p>
          <button className="lp-btn-cta" onClick={() => setShowRegisterModal(true)}>
            Start Your First Project — Free
          </button>
          <p style={{ marginTop: '1rem', fontSize: '0.9rem', opacity: 0.8 }}>
            No credit card required. Cancel anytime. Full control from day one.
          </p>
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
              <p>Sign in to continue to INTERVOS</p>
            </div>

            <form className="lp-modal-form" onSubmit={handleLoginSubmit}>
              {loginErrors.submit && (
                <div className="lp-form-error-banner">
                  {loginErrors.submit}
                  {loginErrors.isEmailNotVerified && (
                    <div className="lp-resend-verification-link">
                      <button
                        type="button"
                        className="lp-btn-link"
                        onClick={() => handleResendVerification(loginErrors.email)}
                        disabled={isResendingVerification}
                      >
                        {isResendingVerification ? "Sending..." : "Click here to resend verification email"}
                      </button>
                    </div>
                  )}
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
                {isLoggingIn ? "Signing you in..." : "Sign In"}
              </button>
            </form>

            <div className="lp-modal-divider"><span>OR</span></div>

            <div className="lp-google-login-container">
              <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
                <GoogleLogin
                  onSuccess={handleLoginSuccess}
                  onError={handleError}
                  text="signin_with"
                  width="100%"
                />
              </GoogleOAuthProvider>
            </div>

            <div className="lp-modal-footer">
              Don't have an account?{" "}
              <button
                className="lp-link-btn"
                onClick={() => {
                  setShowLoginModal(false)
                  setShowRegisterModal(true)
                }}
              >
                Create account
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

            {/* Step 1: Role Selection */}
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
                    Login
                  </button>
                </div>
              </>
            )}

            {/* Step 2: Authentication */}
            {registrationStep === 2 && (
              <>
                <button className="lp-back-button" onClick={() => setRegistrationStep(1)}>
                  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" fill="none" strokeWidth="2">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                  </svg>
                  Back
                </button>
                <div className="lp-modal-header">
                  <h2>Create Your Account</h2>
                  <p>
                    {selectedRole === 'property-manager' && 'Join as a Property Manager'}
                    {selectedRole === 'entrepreneur' && 'Join as an Entrepreneur'}
                    {selectedRole === 'resident' && 'Join as a Resident'}
                    {selectedRole === 'supplier' && 'Join as a Supplier'}
                  </p>
                </div>

                <div className="lp-google-login-section">
                  <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
                    <GoogleLogin onSuccess={handleSuccess} onError={handleError} />
                  </GoogleOAuthProvider>
                </div>

                <div className="lp-modal-divider"><span>OR</span></div>

                <form className="lp-modal-form" onSubmit={handleAuthenticationSubmit}>
                  {registerErrors.submit && (
                    <div className="lp-form-error-banner">
                      {registerErrors.submit}
                    </div>
                  )}

                  <div className="lp-form-row">
                    <div className="lp-form-group">
                      <label>First Name</label>
                      <div className="lp-input-wrapper">
                        <svg className="lp-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                          <circle cx="12" cy="7" r="4"/>
                        </svg>
                        <input
                          type="text"
                          name="first_name"
                          placeholder="John"
                          value={registerFormData.first_name}
                          onChange={handleRegisterChange}
                          required
                          className={registerErrors.first_name ? 'error' : ''}
                          disabled={registerFormData.provider === 'google' && registerFormData.first_name}
                        />
                      </div>
                      {registerErrors.first_name && (
                        <span className="lp-field-error">{registerErrors.first_name}</span>
                      )}
                    </div>
                    <div className="lp-form-group">
                      <label>Last Name {registerFormData.provider === 'google' && '(Optional)'}</label>
                      <div className="lp-input-wrapper">
                        <svg className="lp-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                          <circle cx="12" cy="7" r="4"/>
                        </svg>
                        <input
                          type="text"
                          name="last_name"
                          placeholder="Doe"
                          value={registerFormData.last_name}
                          onChange={handleRegisterChange}
                          required={registerFormData.provider !== 'google'}
                          className={registerErrors.last_name ? 'error' : ''}
                          disabled={registerFormData.provider === 'google' && registerFormData.last_name}
                        />
                      </div>
                      {registerErrors.last_name && (
                        <span className="lp-field-error">{registerErrors.last_name}</span>
                      )}
                    </div>
                  </div>

                  <div className="lp-form-group">
                    <label>Email Address</label>
                    <div className="lp-input-wrapper">
                      <svg className="lp-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                        <polyline points="22,6 12,13 2,6"/>
                      </svg>
                      <input
                        type="email"
                        name="email"
                        placeholder="john@example.com"
                        value={registerFormData.email}
                        onChange={handleRegisterChange}
                        required
                        className={registerErrors.email ? 'error' : ''}
                        disabled={registerFormData.provider === 'google' && registerFormData.email}
                      />
                    </div>
                    {registerErrors.email && (
                      <span className="lp-field-error">{registerErrors.email}</span>
                    )}
                  </div>

                  {/* Password fields - only show for local registration */}
                  {registerFormData.provider !== 'google' && (
                    <>
                      <div className="lp-form-group">
                        <label>Password</label>
                        <div className="lp-input-wrapper">
                          <svg className="lp-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                          </svg>
                          <input
                            type={showRegisterPassword ? "text" : "password"}
                            name="password"
                            placeholder="Create a strong password"
                            value={registerFormData.password}
                            onChange={handleRegisterChange}
                            required
                            className={
                              registerErrors.password
                                ? 'error'
                                : (passwordValidation.length && passwordValidation.uppercase && passwordValidation.lowercase && passwordValidation.number && passwordValidation.special)
                                  ? 'password-valid'
                                  : ''
                            }
                          />
                          <button
                            type="button"
                            className="lp-password-toggle"
                            onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                            tabIndex="-1"
                          >
                            {showRegisterPassword ? (
                              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                                <line x1="1" y1="1" x2="23" y2="23"/>
                              </svg>
                            ) : (
                              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                <circle cx="12" cy="12" r="3"/>
                              </svg>
                            )}
                          </button>
                        </div>
                        {registerFormData.password && !(passwordValidation.length && passwordValidation.uppercase && passwordValidation.lowercase && passwordValidation.number && passwordValidation.special) && (
                          <div className="lp-password-requirements">
                            <div className={`lp-password-requirement ${passwordValidation.length ? 'valid' : ''}`}>
                              <svg viewBox="0 0 16 16" width="14" height="14">
                                <path d="M13.5 4L6 11.5L2.5 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                              </svg>
                              At least 8 characters
                            </div>
                            <div className={`lp-password-requirement ${passwordValidation.uppercase ? 'valid' : ''}`}>
                              <svg viewBox="0 0 16 16" width="14" height="14">
                                <path d="M13.5 4L6 11.5L2.5 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                              </svg>
                              One uppercase letter
                            </div>
                            <div className={`lp-password-requirement ${passwordValidation.lowercase ? 'valid' : ''}`}>
                              <svg viewBox="0 0 16 16" width="14" height="14">
                                <path d="M13.5 4L6 11.5L2.5 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                              </svg>
                              One lowercase letter
                            </div>
                            <div className={`lp-password-requirement ${passwordValidation.number ? 'valid' : ''}`}>
                              <svg viewBox="0 0 16 16" width="14" height="14">
                                <path d="M13.5 4L6 11.5L2.5 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                              </svg>
                              One number
                            </div>
                            <div className={`lp-password-requirement ${passwordValidation.special ? 'valid' : ''}`}>
                              <svg viewBox="0 0 16 16" width="14" height="14">
                                <path d="M13.5 4L6 11.5L2.5 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                              </svg>
                              One special character
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="lp-form-group">
                        <label>Confirm Password</label>
                        <div className="lp-input-wrapper">
                          <svg className="lp-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                          </svg>
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            name="confirm_password"
                            placeholder="Re-enter your password"
                            value={registerFormData.confirm_password}
                            onChange={handleRegisterChange}
                            required
                            className={registerErrors.confirm_password ? 'error' : ''}
                          />
                          <button
                            type="button"
                            className="lp-password-toggle"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            tabIndex="-1"
                          >
                            {showConfirmPassword ? (
                              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                                <line x1="1" y1="1" x2="23" y2="23"/>
                              </svg>
                            ) : (
                              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                <circle cx="12" cy="12" r="3"/>
                              </svg>
                            )}
                          </button>
                        </div>
                        {registerErrors.confirm_password && (
                          <span className="lp-field-error">{registerErrors.confirm_password}</span>
                        )}
                      </div>
                    </>
                  )}

                  <button
                    type="submit"
                    className="lp-btn-primary lp-btn-full"
                  >
                    Continue
                  </button>
                </form>
              </>
            )}

            {/* Step 3: Profile Completion */}
            {registrationStep === 3 && (
              <>
                <button className="lp-back-button" onClick={() => setRegistrationStep(2)}>
                  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" fill="none" strokeWidth="2">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                  </svg>
                  Back
                </button>
                <div className="lp-modal-header">
                  <h2>Complete Your Profile</h2>
                  <p>
                    {selectedRole === 'property-manager' && 'Just a few more details to get started'}
                    {selectedRole === 'entrepreneur' && 'Tell us about your business'}
                    {selectedRole === 'resident' && 'Help us connect you to your building'}
                    {selectedRole === 'supplier' && 'Share your business information'}
                  </p>
                </div>

                <form className="lp-modal-form" onSubmit={handleRegisterSubmit}>
                  {registerErrors.submit && (
                    <div className="lp-form-error-banner">
                      {registerErrors.submit}
                    </div>
                  )}

                  <input type="hidden" value={registerFormData.provider} name="provider" />

                  {/* Property Manager Fields */}
                  {selectedRole === "property-manager" && (
                    <>
                      <div className="lp-form-divider">Property Manager Details</div>
                      <div className="lp-form-group">
                        <label>Company Name</label>
                        <div className="lp-input-wrapper">
                          <svg className="lp-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                            <polyline points="9 22 9 12 15 12 15 22"/>
                          </svg>
                          <input
                            type="text"
                            name="company_name"
                            placeholder="Your property management company"
                            value={registerFormData.company_name}
                            onChange={handleRegisterChange}
                            required
                          />
                        </div>
                      </div>
                      <div className="lp-form-group">
                        <label>Phone Number</label>
                        <PhoneInput
                          international
                          defaultCountry="US"
                          value={registerFormData.phone}
                          onChange={(value) => {
                            setRegisterFormData({
                              ...registerFormData,
                              phone: value || ""
                            });
                          }}
                          className={`lp-phone-input-wrapper ${registerErrors.phone ? 'error' : ''}`}
                          placeholder="Enter phone number"
                        />
                        {registerErrors.phone && (
                          <span className="lp-field-error">{registerErrors.phone}</span>
                        )}
                      </div>
                      <div className="lp-form-group">
                        <label>Business Address</label>
                        <div className="lp-address-autocomplete-wrapper">
                          <div className="lp-input-wrapper">
                            <svg className="lp-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                              <circle cx="12" cy="10" r="3"/>
                            </svg>
                            <input
                              type="text"
                              name="address"
                              placeholder="Start typing your address..."
                              value={registerFormData.address}
                              onChange={handleAddressChange}
                              onFocus={() => registerFormData.address.length > 2 && setShowAddressSuggestions(true)}
                              onBlur={() => setTimeout(() => setShowAddressSuggestions(false), 200)}
                              required
                              autoComplete="off"
                            />
                          </div>
                          {showAddressSuggestions && addressSuggestions.length > 0 && (
                            <div className="lp-address-suggestions">
                              {isLoadingAddresses && (
                                <div className="lp-address-suggestion-item loading">
                                  Loading suggestions...
                                </div>
                              )}
                              {!isLoadingAddresses && addressSuggestions.map((suggestion, index) => (
                                <div
                                  key={index}
                                  className="lp-address-suggestion-item"
                                  onClick={() => selectAddress(suggestion)}
                                >
                                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                                    <circle cx="12" cy="10" r="3"/>
                                  </svg>
                                  <span>{suggestion.display_name}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="lp-form-group">
                        <label>Number of Properties</label>
                        <div className="lp-input-wrapper">
                          <svg className="lp-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 21h18M9 8h1m-1 4h1m-1 4h1M14 8h1m-1 4h1m-1 4h1M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/>
                          </svg>
                          <input
                            type="number"
                            name="num_properties"
                            placeholder="How many properties do you manage?"
                            value={registerFormData.num_properties || ""}
                            onChange={handleRegisterChange}
                            required
                            min="1"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Entrepreneur Fields */}
                  {selectedRole === "entrepreneur" && (
                    <>
                      <div className="lp-form-divider">Entrepreneur Details</div>
                      <div className="lp-form-group">
                        <label>Company Name</label>
                        <div className="lp-input-wrapper">
                          <svg className="lp-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                          </svg>
                          <input
                            type="text"
                            name="company_name"
                            placeholder="Your construction company"
                            value={registerFormData.company_name}
                            onChange={handleRegisterChange}
                            required
                          />
                        </div>
                      </div>
                      <div className="lp-form-group">
                        <label>Phone Number</label>
                        <PhoneInput
                          international
                          defaultCountry="US"
                          value={registerFormData.phone}
                          onChange={(value) => {
                            setRegisterFormData({
                              ...registerFormData,
                              phone: value || ""
                            });
                          }}
                          className={`lp-phone-input-wrapper ${registerErrors.phone ? 'error' : ''}`}
                          placeholder="Enter phone number"
                        />
                        {registerErrors.phone && (
                          <span className="lp-field-error">{registerErrors.phone}</span>
                        )}
                      </div>
                      <div className="lp-form-group">
                        <label>Business Address</label>
                        <div className="lp-address-autocomplete-wrapper">
                          <div className="lp-input-wrapper">
                            <svg className="lp-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                              <circle cx="12" cy="10" r="3"/>
                            </svg>
                            <input
                              type="text"
                              name="address"
                              placeholder="Start typing your address..."
                              value={registerFormData.address}
                              onChange={handleAddressChange}
                              onFocus={() => registerFormData.address.length > 2 && setShowAddressSuggestions(true)}
                              onBlur={() => setTimeout(() => setShowAddressSuggestions(false), 200)}
                              required
                              autoComplete="off"
                            />
                          </div>
                          {showAddressSuggestions && addressSuggestions.length > 0 && (
                            <div className="lp-address-suggestions">
                              {isLoadingAddresses && (
                                <div className="lp-address-suggestion-item loading">
                                  Loading suggestions...
                                </div>
                              )}
                              {!isLoadingAddresses && addressSuggestions.map((suggestion, index) => (
                                <div
                                  key={index}
                                  className="lp-address-suggestion-item"
                                  onClick={() => selectAddress(suggestion)}
                                >
                                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                                    <circle cx="12" cy="10" r="3"/>
                                  </svg>
                                  <span>{suggestion.display_name}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="lp-form-group">
                        <label>License Number</label>
                        <div className="lp-input-wrapper">
                          <svg className="lp-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                            <line x1="16" y1="2" x2="16" y2="6"/>
                            <line x1="8" y1="2" x2="8" y2="6"/>
                            <line x1="3" y1="10" x2="21" y2="10"/>
                          </svg>
                          <input
                            type="text"
                            name="license_number"
                            placeholder="Professional license number"
                            value={registerFormData.license_number}
                            onChange={handleRegisterChange}
                            required
                          />
                        </div>
                      </div>
                      <div className="lp-form-row">
                        <div className="lp-form-group">
                          <label>Years in Business</label>
                          <div className="lp-input-wrapper">
                            <svg className="lp-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10"/>
                              <polyline points="12 6 12 12 16 14"/>
                            </svg>
                            <input
                              type="number"
                              name="years_in_business"
                              placeholder="5"
                              value={registerFormData.years_in_business}
                              onChange={handleRegisterChange}
                              required
                              min="1"
                            />
                          </div>
                        </div>
                        <div className="lp-form-group">
                          <label>Number of Employees</label>
                          <div className="lp-input-wrapper">
                            <svg className="lp-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                              <circle cx="9" cy="7" r="4"/>
                              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                            </svg>
                            <input
                              type="number"
                              name="num_employees"
                              placeholder="10"
                              value={registerFormData.num_employees}
                              onChange={handleRegisterChange}
                              required
                              min="1"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="lp-form-group">
                        <label>Specializations</label>
                        <div className="lp-input-wrapper">
                          <svg className="lp-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                          </svg>
                          <input
                            type="text"
                            name="specializations"
                            placeholder="e.g., Plumbing, Electrical, HVAC"
                            value={registerFormData.specializations}
                            onChange={handleRegisterChange}
                            required
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Resident Fields */}
                  {selectedRole === "resident" && (
                    <>
                      <div className="lp-form-divider">Resident Details</div>
                      <div className="lp-form-group">
                        <label>Phone Number</label>
                        <PhoneInput
                          international
                          defaultCountry="US"
                          value={registerFormData.phone}
                          onChange={(value) => {
                            setRegisterFormData({
                              ...registerFormData,
                              phone: value || ""
                            });
                          }}
                          className={`lp-phone-input-wrapper ${registerErrors.phone ? 'error' : ''}`}
                          placeholder="Enter phone number"
                        />
                        {registerErrors.phone && (
                          <span className="lp-field-error">{registerErrors.phone}</span>
                        )}
                      </div>
                      <div className="lp-form-group">
                        <label htmlFor="property_id" className="form-label">
                          Building/Property <span className="required">*</span>
                        </label>
                        {isLoadingProperties ? (
                          <div className="loading-text">Loading properties...</div>
                        ) : properties.length === 0 ? (
                          <div className="info-message">
                            No properties found. Please add a property first.
                          </div>
                        ) : (
                          <div className="searchable-dropdown-container">
                            <input
                              type="text"
                              className="lp-form-input"
                              placeholder="Search by building name, address, or city..."
                              value={propertySearchTerm}
                              onChange={handlePropertySearchChange}
                              onFocus={() => setShowPropertyDropdown(true)}
                              required
                            />
                            {showPropertyDropdown && filteredProperties.length > 0 && (
                              <div className="property-dropdown-list">
                                {filteredProperties.map((property) => (
                                  <div
                                    key={property.id}
                                    className="property-dropdown-item"
                                    onClick={() => handlePropertySelect(property)}
                                  >
                                    <div className="property-name">
                                      {property.building_name || property.address}
                                    </div>
                                    <div className="property-details">
                                      {property.city}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            {showPropertyDropdown && filteredProperties.length === 0 && propertySearchTerm && (
                              <div className="property-dropdown-list">
                                <div className="property-dropdown-item no-results">
                                  No properties found matching "{propertySearchTerm}"
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="lp-form-group">
                        <label>Unit Number</label>
                        <div className="lp-input-wrapper">
                          <svg className="lp-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                            <polyline points="9 22 9 12 15 12 15 22"/>
                          </svg>
                          <input
                            type="text"
                            name="unit_number"
                            placeholder="e.g., Apt 4A"
                            value={registerFormData.unit_number}
                            onChange={handleRegisterChange}
                            required
                          />
                        </div>
                      </div>
                      <div className="lp-form-group">
                        <label>Move-in Date</label>
                        <div className="lp-input-wrapper">
                          <svg className="lp-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                            <line x1="16" y1="2" x2="16" y2="6"/>
                            <line x1="8" y1="2" x2="8" y2="6"/>
                            <line x1="3" y1="10" x2="21" y2="10"/>
                          </svg>
                          <input
                            type="date"
                            name="move_in_date"
                            value={registerFormData.move_in_date}
                            onChange={handleRegisterChange}
                            required
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Supplier Fields */}
                  {selectedRole === "supplier" && (
                    <>
                      <div className="lp-form-divider">Supplier Details</div>
                      <div className="lp-form-group">
                        <label>Company Name</label>
                        <div className="lp-input-wrapper">
                          <svg className="lp-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M16 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z"/>
                            <path d="M2 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z"/>
                            <path d="M7 21h10"/>
                            <path d="M12 3v18"/>
                            <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>
                          </svg>
                          <input
                            type="text"
                            name="company_name"
                            placeholder="Your supply company"
                            value={registerFormData.company_name}
                            onChange={handleRegisterChange}
                            required
                          />
                        </div>
                      </div>
                      <div className="lp-form-group">
                        <label>Phone Number</label>
                        <PhoneInput
                          international
                          defaultCountry="US"
                          value={registerFormData.phone}
                          onChange={(value) => {
                            setRegisterFormData({
                              ...registerFormData,
                              phone: value || ""
                            });
                          }}
                          className={`lp-phone-input-wrapper ${registerErrors.phone ? 'error' : ''}`}
                          placeholder="Enter phone number"
                        />
                        {registerErrors.phone && (
                          <span className="lp-field-error">{registerErrors.phone}</span>
                        )}
                      </div>
                      <div className="lp-form-group">
                        <label>Business Address</label>
                        <div className="lp-address-autocomplete-wrapper">
                          <div className="lp-input-wrapper">
                            <svg className="lp-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                              <circle cx="12" cy="10" r="3"/>
                            </svg>
                            <input
                              type="text"
                              name="address"
                              placeholder="Start typing your address..."
                              value={registerFormData.address}
                              onChange={handleAddressChange}
                              onFocus={() => registerFormData.address.length > 2 && setShowAddressSuggestions(true)}
                              onBlur={() => setTimeout(() => setShowAddressSuggestions(false), 200)}
                              required
                              autoComplete="off"
                            />
                          </div>
                          {showAddressSuggestions && addressSuggestions.length > 0 && (
                            <div className="lp-address-suggestions">
                              {isLoadingAddresses && (
                                <div className="lp-address-suggestion-item loading">
                                  Loading suggestions...
                                </div>
                              )}
                              {!isLoadingAddresses && addressSuggestions.map((suggestion, index) => (
                                <div
                                  key={index}
                                  className="lp-address-suggestion-item"
                                  onClick={() => selectAddress(suggestion)}
                                >
                                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                                    <circle cx="12" cy="10" r="3"/>
                                  </svg>
                                  <span>{suggestion.display_name}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="lp-form-group">
                        <label>Website</label>
                        <div className="lp-input-wrapper">
                          <svg className="lp-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="2" y1="12" x2="22" y2="12"/>
                            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                          </svg>
                          <input
                            type="url"
                            name="website"
                            placeholder="https://yourwebsite.com"
                            value={registerFormData.website}
                            onChange={handleRegisterChange}
                            required
                          />
                        </div>
                      </div>
                      <div className="lp-form-group">
                        <label>Years in Business</label>
                        <div className="lp-input-wrapper">
                          <svg className="lp-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14"/>
                          </svg>
                          <input
                            type="number"
                            name="years_in_business"
                            placeholder="10"
                            value={registerFormData.years_in_business}
                            onChange={handleRegisterChange}
                            required
                            min="1"
                          />
                        </div>
                      </div>
                      <div className="lp-form-group">
                        <label>Delivery Areas</label>
                        <div className="lp-input-wrapper">
                          <svg className="lp-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="1" y="3" width="15" height="13"/>
                            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                            <circle cx="5.5" cy="18.5" r="2.5"/>
                            <circle cx="18.5" cy="18.5" r="2.5"/>
                          </svg>
                          <input
                            type="text"
                            name="delivery_areas"
                            placeholder="Cities or regions you serve"
                            value={registerFormData.delivery_areas}
                            onChange={handleRegisterChange}
                            required
                          />
                        </div>
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
                    {isRegistering ? "Setting up your account..." : "Start Your First Project"}
                  </button>
                </form>
              </>
            )}

            {/* ===== STEP 4: SUCCESS & EMAIL VERIFICATION ===== */}
            {registrationStep === 4 && (
              <>
                <div className="lp-modal-header">
                  <h2>Registration Successful!</h2>
                  <p>Please verify your email to continue</p>
                </div>

                <div className="lp-verification-content">
                  <div className="lp-success-icon">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M13.5 4L6 11.5L2.5 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>

                  <div className="lp-verification-message">
                    <p className="lp-verification-title">Check your inbox</p>
                    <p className="lp-verification-text">
                      We've sent a verification email to:
                    </p>
                    <p className="lp-verification-email">{registeredEmail}</p>
                    <p className="lp-verification-text">
                      Please click the verification link in the email to activate your account.
                    </p>
                  </div>

                  <div className="lp-verification-actions">
                    <p className="lp-resend-text">Didn't receive the email?</p>
                    <button
                      type="button"
                      className="lp-btn-link"
                      onClick={() => handleResendVerification()}
                      disabled={isResendingVerification}
                    >
                      {isResendingVerification ? "Sending..." : "Resend verification email"}
                    </button>
                  </div>

                  <button
                    type="button"
                    className="lp-btn-primary lp-btn-full"
                    onClick={() => {
                      closeModals();
                      setShowLoginModal(true);
                    }}
                  >
                    Go to Login
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}