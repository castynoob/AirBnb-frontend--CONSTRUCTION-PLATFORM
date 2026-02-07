import { useState, useEffect } from "react"
import { Check, X, Crown } from "lucide-react"
import "../../styles/landinpage.css"
import logo from '../../assets/logo.png'
import logoLight from '../../assets/logo-light.png'
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
import { useSocket } from "../../contexts/SocketContext";
import { useLanguage } from "../../contexts/LanguageContext";

export default function LandingPage() {
  const { t, language, changeLanguage, languages } = useLanguage();
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
  const { reinitializeSocket } = useSocket()

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
    country: "",
    state: "",
    street_address: "",
    city: "",
    zip_code: "",
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

  // Country and State/Province options
  const countryOptions = [
    { value: "", label: "Select Country" },
    { value: "CA", label: "Canada" },
    { value: "US", label: "United States" }
  ];

  const stateProvinceOptions = {
    CA: [
      { value: "", label: "Select Province" },
      { value: "AB", label: "Alberta" },
      { value: "BC", label: "British Columbia" },
      { value: "MB", label: "Manitoba" },
      { value: "NB", label: "New Brunswick" },
      { value: "NL", label: "Newfoundland and Labrador" },
      { value: "NS", label: "Nova Scotia" },
      { value: "NT", label: "Northwest Territories" },
      { value: "NU", label: "Nunavut" },
      { value: "ON", label: "Ontario" },
      { value: "PE", label: "Prince Edward Island" },
      { value: "QC", label: "Quebec" },
      { value: "SK", label: "Saskatchewan" },
      { value: "YT", label: "Yukon" }
    ],
    US: [
      { value: "", label: "Select State" },
      { value: "AL", label: "Alabama" },
      { value: "AK", label: "Alaska" },
      { value: "AZ", label: "Arizona" },
      { value: "AR", label: "Arkansas" },
      { value: "CA", label: "California" },
      { value: "CO", label: "Colorado" },
      { value: "CT", label: "Connecticut" },
      { value: "DE", label: "Delaware" },
      { value: "FL", label: "Florida" },
      { value: "GA", label: "Georgia" },
      { value: "HI", label: "Hawaii" },
      { value: "ID", label: "Idaho" },
      { value: "IL", label: "Illinois" },
      { value: "IN", label: "Indiana" },
      { value: "IA", label: "Iowa" },
      { value: "KS", label: "Kansas" },
      { value: "KY", label: "Kentucky" },
      { value: "LA", label: "Louisiana" },
      { value: "ME", label: "Maine" },
      { value: "MD", label: "Maryland" },
      { value: "MA", label: "Massachusetts" },
      { value: "MI", label: "Michigan" },
      { value: "MN", label: "Minnesota" },
      { value: "MS", label: "Mississippi" },
      { value: "MO", label: "Missouri" },
      { value: "MT", label: "Montana" },
      { value: "NE", label: "Nebraska" },
      { value: "NV", label: "Nevada" },
      { value: "NH", label: "New Hampshire" },
      { value: "NJ", label: "New Jersey" },
      { value: "NM", label: "New Mexico" },
      { value: "NY", label: "New York" },
      { value: "NC", label: "North Carolina" },
      { value: "ND", label: "North Dakota" },
      { value: "OH", label: "Ohio" },
      { value: "OK", label: "Oklahoma" },
      { value: "OR", label: "Oregon" },
      { value: "PA", label: "Pennsylvania" },
      { value: "RI", label: "Rhode Island" },
      { value: "SC", label: "South Carolina" },
      { value: "SD", label: "South Dakota" },
      { value: "TN", label: "Tennessee" },
      { value: "TX", label: "Texas" },
      { value: "UT", label: "Utah" },
      { value: "VT", label: "Vermont" },
      { value: "VA", label: "Virginia" },
      { value: "WA", label: "Washington" },
      { value: "WV", label: "West Virginia" },
      { value: "WI", label: "Wisconsin" },
      { value: "WY", label: "Wyoming" },
      { value: "DC", label: "Washington D.C." }
    ]
  };
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
        message: t('landingPage.verification.success')
      });
      setShowLoginModal(true);
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
      // Auto-hide after 5 seconds
      setTimeout(() => setVerificationMessage(null), 5000);
    } else if (verification === 'failed') {
      let message = t('landingPage.verification.failed');
      if (reason === 'missing_token') message = t('landingPage.verification.missingToken');
      if (reason === 'invalid_token') message = t('landingPage.verification.invalidToken');
      if (reason === 'server_error') message = t('landingPage.verification.serverError');

      setVerificationMessage({
        type: 'error',
        message
      });
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
      // Auto-hide after 10 seconds
      setTimeout(() => setVerificationMessage(null), 10000);
    }
  }, [searchParams, t]);

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
      newErrors.email = t('landingPage.login.emailRequired')
    } else if (!/\S+@\S+\.\S+/.test(loginFormData.email)) {
      newErrors.email = t('landingPage.login.emailInvalid')
    }
    if (!loginFormData.password) {
      newErrors.password = t('landingPage.login.passwordRequired')
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
            submit: data.message || t('landingPage.login.verifyEmailFirst'),
            isEmailNotVerified: true,
            email: loginFormData.email
          })
          return
        }
        setLoginErrors({
          submit: data.message || t('landingPage.login.invalidCredentials'),
          isEmailNotVerified: false
        })
        return
      }

      if (!response.ok) {
        // Handle email not verified error (403)
        if (response.status === 403) {
          setLoginErrors({
            submit: data.message || t('landingPage.login.verifyEmailFirst'),
            isEmailNotVerified: true, // Flag to show resend link
            email: loginFormData.email // Store email for resend
          })
          return
        }

        // Handle other errors (401 - invalid credentials, etc.)
        setLoginErrors({
          submit: data.message || t('landingPage.login.invalidCredentials'),
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
        first_name: data.user.first_name || "",
        last_name: data.user.last_name || "",
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

      // Reinitialize socket connection after login
      reinitializeSocket()

      setShowLoginModal(false)
      navigate(`/homepage/${userProfile.role}`)
    } catch (error) {
      console.error("Login error:", error)
      setLoginErrors({
        submit: t('landingPage.login.loginFailed'),
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
        first_name: data.user.first_name || "",
        last_name: data.user.last_name || "",
        name: `${data.user.first_name || ""} ${data.user.last_name || ""}`.trim(),
        email: data.user.email,
        role: data.user.role,
        token: data.accessToken || null,
        entrepProfile: data.user.role === 'entrepreneur' ? {entrepProfile, subscription} : null
      }

      localStorage.setItem("userId", userProfile.id);
      localStorage.setItem("userProfile", JSON.stringify(userProfile))

      // Reinitialize socket connection after login
      reinitializeSocket()

      setShowLoginModal(false)
      navigate(`/homepage/${userProfile.role}`)
    } catch (error) {
      console.error("Google Login error:", error);
      setLoginErrors({
        submit: error.message || t('landingPage.login.loginFailedRetry')
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
            error = validateName(value, t('landingPage.register.firstName'));
            break;
        case "last_name":
            error = validateName(value, t('landingPage.register.lastName'));
            break;
        case "phone":
            // Validate phone number (digits, spaces, dashes, parentheses only)
            if (value && !/^[\d\s\-()]+$/.test(value)) {
                error = t('landingPage.login.phoneInvalidChars');
            } else if (value && value.replace(/[\s\-()]/g, '').length < 10) {
                error = t('landingPage.login.phoneMinDigits');
            }
            break;
        case "license_number":
            // Validate SIRET (14 digits) or SIREN (9 digits) format
            if (value) {
                const cleanedValue = value.replace(/[\s\-]/g, '');
                if (!/^\d+$/.test(cleanedValue)) {
                    error = t('landingPage.register.licenseInvalidChars');
                } else if (cleanedValue.length !== 9 && cleanedValue.length !== 14) {
                    error = t('landingPage.register.licenseInvalidFormat');
                }
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
        // Using backend proxy to avoid CORS issues with Nominatim
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
        const response = await fetch(
          `${API_BASE_URL}/api/geocode/search?q=${encodeURIComponent(value)}`
        );
        const data = await response.json();
        setAddressSuggestions(data.results || []);
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

  // Check for duplicate license number or phone number
  const checkDuplicates = async (licenseNumber, phone) => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${API_BASE_URL}/api/register/check-duplicates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          license_number: licenseNumber,
          phone: phone
        })
      });
      const data = await response.json();
      return data.duplicates;
    } catch (error) {
      console.error('Error checking duplicates:', error);
      return { license_number: false, phone: false };
    }
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

        // Check for duplicate license number or phone for entrepreneurs
        if (selectedRole === "entrepreneur") {
            const duplicates = await checkDuplicates(
                registerFormData.license_number,
                registerFormData.phone
            );

            if (duplicates.license_number) {
                setRegisterErrors({
                    ...registerErrors,
                    license_number: t('landingPage.register.licenseDuplicate'),
                    submit: t('landingPage.register.licenseDuplicate')
                });
                setIsRegistering(false);
                return;
            }

            if (duplicates.phone) {
                setRegisterErrors({
                    ...registerErrors,
                    phone: t('landingPage.register.phoneDuplicate'),
                    submit: t('landingPage.register.phoneDuplicate')
                });
                setIsRegistering(false);
                return;
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
                    submit: t('landingPage.login.googleDataMissing')
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
                    submit: t('landingPage.login.passwordRequiredLocal')
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

        // 5. Combine address fields into a single address string and prepare fields for users table
        if (payload.street_address || payload.city || payload.state || payload.country || payload.zip_code) {
            const addressParts = [
                payload.street_address,
                payload.city,
                payload.state,
                payload.country === 'CA' ? 'Canada' : payload.country === 'US' ? 'USA' : payload.country,
                payload.zip_code
            ].filter(Boolean);
            payload.address = addressParts.join(', ');
            // Map state to province and zip_code to postal_code for backend users table
            payload.province = payload.state;
            payload.postal_code = payload.zip_code;
            // Clean up street_address from payload (address is now the combined string)
            delete payload.street_address;
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
                    submit: data.message || t('landingPage.login.checkInput'),
                    ...data.errors
                });
            } else {
                setRegisterErrors({ submit: data.message || t('landingPage.login.registrationFailed') });
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
                    setRegisterErrors({ submit: t('landingPage.login.registrationSuccessLoginFailed') });
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
                    first_name: loginData.user.first_name || "",
                    last_name: loginData.user.last_name || "",
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

                // Reinitialize socket connection after login
                reinitializeSocket()

                // Redirect to role-specific homepage
                navigate(`/homepage/${userProfile.role}`);
            } catch (loginError) {
                console.error("Error logging in after registration:", loginError);
                setRegisterErrors({ submit: t('landingPage.login.autoLoginFailed') });
            }
        } else {
            // Local users need email verification
            setRegisteredEmail(registerFormData.email);
            setRegistrationStep(4); // Success screen
        }
    } catch (error) {
        console.error("Registration error:", error);
        setRegisterErrors({ submit: error.message || t('landingPage.login.registrationServerError') });
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
    const nameRegex = /^[A-Za-zÀ-ÿ\s'\-]{2,50}$/;
    if (!registerFormData.first_name) {
      errors.first_name = t('landingPage.login.firstNameRequired');
    } else if (!nameRegex.test(registerFormData.first_name)) {
      errors.first_name = t('landingPage.login.firstNameInvalid');
    }

    // Validate last name (only required for local registration, optional for Google)
    if (registerFormData.provider !== 'google' && !registerFormData.last_name) {
      errors.last_name = t('landingPage.login.lastNameRequired');
    } else if (registerFormData.last_name && !nameRegex.test(registerFormData.last_name)) {
      errors.last_name = t('landingPage.login.lastNameInvalid');
    }

    // Validate email
    if (!registerFormData.email) {
      errors.email = t('landingPage.login.emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(registerFormData.email)) {
      errors.email = t('landingPage.login.emailInvalid');
    }

    // Validate password (only for local registration, not needed for Google)
    if (registerFormData.provider !== 'google') {
      if (!registerFormData.password) {
        errors.password = t('landingPage.login.passwordRequired');
      } else if (registerFormData.password.length < 8) {
        errors.password = t('landingPage.login.passwordMinLength');
      } else if (!/(?=.*[a-z])(?=.*\d)/.test(registerFormData.password)) {
        errors.password = t('landingPage.login.passwordFormatError');
      }

      // Validate confirm password
      if (!registerFormData.confirm_password) {
        errors.confirm_password = t('landingPage.login.confirmPasswordRequired');
      } else if (registerFormData.password !== registerFormData.confirm_password) {
        errors.confirm_password = t('landingPage.login.passwordsDoNotMatch');
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
        submit: t('landingPage.login.loadPropertiesFailed')
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
      title: t('landingPage.register.rolePropertyManager'),
      icon: (
        <svg viewBox="0 0 24 24">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
      headline: t('landingPage.register.rolePropertyManagerHeadline'),
      description: t('landingPage.register.rolePropertyManagerDesc'),
      benefits: [
        t('landingPage.register.pmBenefit1'),
        t('landingPage.register.pmBenefit2'),
        t('landingPage.register.pmBenefit3')
      ],
      color: "primary",
      gradient: "linear-gradient(135deg, #0f223d 0%, #1a3a5c 100%)"
    },
    {
      id: "entrepreneur",
      title: t('landingPage.register.roleEntrepreneur'),
      icon: (
        <svg viewBox="0 0 24 24">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
      ),
      headline: t('landingPage.register.roleEntrepreneurHeadline'),
      description: t('landingPage.register.roleEntrepreneurDesc'),
      benefits: [
        t('landingPage.register.entrBenefit1'),
        t('landingPage.register.entrBenefit2'),
        t('landingPage.register.entrBenefit3')
      ],
      color: "secondary",
      gradient: "linear-gradient(135deg, #00a5a9 0%, #008b8f 100%)"
    },
    {
      id: "resident",
      title: t('landingPage.register.roleResident'),
      icon: (
        <svg viewBox="0 0 24 24">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
      headline: t('landingPage.register.roleResidentHeadline'),
      description: t('landingPage.register.roleResidentDesc'),
      benefits: [
        t('landingPage.register.resBenefit1'),
        t('landingPage.register.resBenefit2'),
        t('landingPage.register.resBenefit3')
      ],
      color: "success",
      gradient: "linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)"
    },
    {
      id: "supplier",
      title: t('landingPage.register.roleSupplier'),
      icon: (
        <svg viewBox="0 0 24 24">
          <path d="M16 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z" />
          <path d="M2 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z" />
          <path d="M7 21h10" />
          <path d="M12 3v18" />
          <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
        </svg>
      ),
      headline: t('landingPage.register.roleSupplierHeadline'),
      description: t('landingPage.register.roleSupplierDesc'),
      benefits: [
        t('landingPage.register.supBenefit1'),
        t('landingPage.register.supBenefit2'),
        t('landingPage.register.supBenefit3')
      ],
      color: "info",
      gradient: "linear-gradient(135deg, #3498db 0%, #2980b9 100%)"
    },
  ]

  const features = [
    {
      title: t('landingPage.features.smartBidding'),
      description: t('landingPage.features.smartBiddingDesc'),
      iconType: "zap",
    },
    {
      title: t('landingPage.features.verifiedProfessionals'),
      description: t('landingPage.features.verifiedProfessionalsDesc'),
      iconType: "check-circle",
    },
    {
      title: t('landingPage.features.liveDashboard'),
      description: t('landingPage.features.liveDashboardDesc'),
      iconType: "bar-chart",
    },
    {
      title: t('landingPage.features.multiProperty'),
      description: t('landingPage.features.multiPropertyDesc'),
      iconType: "building",
    },
    {
      title: t('landingPage.features.builtInMessaging'),
      description: t('landingPage.features.builtInMessagingDesc'),
      iconType: "message",
    },
    {
      title: t('landingPage.features.protectedPayments'),
      description: t('landingPage.features.protectedPaymentsDesc'),
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
            <li><a href="#about">{t('landingPage.nav.about')}</a></li>
            <li><a href="#features">{t('landingPage.nav.features')}</a></li>
            <li><a href="#roles">{t('landingPage.nav.forYou')}</a></li>
            <li><a href="#how-it-works">{t('landingPage.nav.howItWorks')}</a></li>
          </ul>
          <div className="lp-navbar-actions">
            {/* Language Toggle */}
            <div className="lp-language-toggle">
              <button
                className={`lp-lang-btn ${language === 'en' ? 'active' : ''}`}
                onClick={() => changeLanguage('en')}
                aria-label="English"
              >
                EN
              </button>
              <span className="lp-lang-divider">|</span>
              <button
                className={`lp-lang-btn ${language === 'fr' ? 'active' : ''}`}
                onClick={() => changeLanguage('fr')}
                aria-label="Français"
              >
                FR
              </button>
            </div>
            <button className="lp-btn-login" onClick={() => setShowLoginModal(true)}>
              {t('landingPage.nav.login')}
            </button>
            <button className="lp-btn-register" onClick={() => setShowRegisterModal(true)}>
              {t('landingPage.nav.getStarted')}
            </button>
            {/* Hamburger Menu Icon - Mobile Only */}
            <button className="lp-hamburger-menu" onClick={() => setShowMobileMenu(!showMobileMenu)} aria-label={t('landingPage.nav.toggleMenu')}>
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
              <button className="lp-close-menu" onClick={() => setShowMobileMenu(false)} aria-label={t('landingPage.nav.closeMenu')}>
                ×
              </button>
            </div>
            {/* Mobile Language Toggle */}
            <div className="lp-mobile-language-toggle">
              <button
                className={`lp-mobile-lang-btn ${language === 'en' ? 'active' : ''}`}
                onClick={() => changeLanguage('en')}
              >
                English
              </button>
              <button
                className={`lp-mobile-lang-btn ${language === 'fr' ? 'active' : ''}`}
                onClick={() => changeLanguage('fr')}
              >
                Français
              </button>
            </div>
            <nav className="lp-mobile-nav">
              <a href="#about" onClick={() => setShowMobileMenu(false)}>{t('landingPage.nav.about')}</a>
              <a href="#features" onClick={() => setShowMobileMenu(false)}>{t('landingPage.nav.features')}</a>
              <a href="#roles" onClick={() => setShowMobileMenu(false)}>{t('landingPage.nav.forYou')}</a>
              <a href="#how-it-works" onClick={() => setShowMobileMenu(false)}>{t('landingPage.nav.howItWorks')}</a>
            </nav>
            <div className="lp-mobile-menu-actions">
              <button className="lp-btn-login lp-btn-full" onClick={() => { setShowLoginModal(true); setShowMobileMenu(false); }}>
                {t('landingPage.nav.login')}
              </button>
              <button className="lp-btn-register lp-btn-full" onClick={() => { setShowRegisterModal(true); setShowMobileMenu(false); }}>
                {t('landingPage.nav.getStarted')}
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
            {t('landingPage.hero.badge')}
          </div>
          <h1 className="lp-hero-title">
            {t('landingPage.hero.title')} <span className="lp-highlight-teal">{t('landingPage.hero.titleHighlight')}</span>
          </h1>
          <p className="lp-hero-subtitle">
            {t('landingPage.hero.subtitle')}
          </p>
          <div className="lp-hero-buttons">
            <button className="lp-btn-primary lp-btn-large" onClick={() => setShowRegisterModal(true)}>
              {t('landingPage.hero.startProject')}
            </button>
            <button className="lp-btn-ghost lp-btn-large" onClick={() => document.getElementById('how-it-works').scrollIntoView({ behavior: 'smooth' })}>
              {t('landingPage.hero.seeHowItWorks')}
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
                <h2>{t('landingPage.about.founderQuote')}</h2>
              </div>

              <div className="lp-pain-points">
                <div className="lp-pain-item">
                  <span className="lp-pain-icon">⚠</span>
                  <span>{t('landingPage.about.painPoint1')}</span>
                </div>
                <div className="lp-pain-item">
                  <span className="lp-pain-icon">⚠</span>
                  <span>{t('landingPage.about.painPoint2')}</span>
                </div>
                <div className="lp-pain-item">
                  <span className="lp-pain-icon">⚠</span>
                  <span>{t('landingPage.about.painPoint3')}</span>
                </div>
                <div className="lp-pain-item">
                  <span className="lp-pain-icon">⚠</span>
                  <span>{t('landingPage.about.painPoint4')}</span>
                </div>
              </div>

              <p className="lp-story-text">
                {t('landingPage.about.storyText1')}
              </p>
              <p className="lp-story-text">
                {t('landingPage.about.storyText2')}
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
                  <div className="lp-stat-number">{t('landingPage.about.stat1Value')}</div>
                  <div className="lp-stat-label">{t('landingPage.about.stat1Label')}</div>
                </div>
                <div className="lp-stat-item">
                  <div className="lp-stat-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                    </svg>
                  </div>
                  <div className="lp-stat-number">{t('landingPage.about.stat2Value')}</div>
                  <div className="lp-stat-label">{t('landingPage.about.stat2Label')}</div>
                </div>
                <div className="lp-stat-item">
                  <div className="lp-stat-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                  </div>
                  <div className="lp-stat-number">{t('landingPage.about.stat3Value')}</div>
                  <div className="lp-stat-label">{t('landingPage.about.stat3Label')}</div>
                </div>
              </div>
            </div>
            <div className="lp-about-visual">
              <div className="lp-success-dashboard">
                <div className="lp-dashboard-header">
                  <div className="lp-dashboard-title">{t('landingPage.about.recentActivity')}</div>
                  <div className="lp-dashboard-status">
                    <span className="lp-status-dot"></span>
                    {t('landingPage.about.live')}
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
                      <div className="lp-success-title">{t('landingPage.about.projectCompleted')}</div>
                      <div className="lp-success-detail">{t('landingPage.about.plumbingRepair')}</div>
                      <div className="lp-success-time">{t('landingPage.about.hoursAgo')}</div>
                    </div>
                  </div>
                  <div className="lp-metric-card">
                    <div className="lp-metric-label">{t('landingPage.about.fastestResponse')}</div>
                    <div className="lp-metric-value">12 {t('landingPage.about.mins')}</div>
                    <div className="lp-metric-trend">{t('landingPage.about.fasterThanAverage')}</div>
                  </div>
                  <div className="lp-activity-graph">
                    <div className="lp-graph-label">{t('landingPage.about.projectVolume')}</div>
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
          <h2>{t('landingPage.features.title')}</h2>
          <p>{t('landingPage.features.subtitle')}</p>
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
          <h2>{t('landingPage.roles.title')}</h2>
          <p>{t('landingPage.roles.subtitle')}</p>
        </div>

        {/* Property Managers */}
        <div className="lp-role-block lp-role-manager">
          <div className="lp-role-grid">
            <div className="lp-role-text">
              <span className="lp-role-label">{t('landingPage.roles.propertyManagers.label')}</span>
              <h3>{t('landingPage.roles.propertyManagers.headline')}</h3>
              <p className="lp-role-story">
                {t('landingPage.roles.propertyManagers.story')}
              </p>
              <p className="lp-role-attribution">{t('landingPage.roles.propertyManagers.attribution')}</p>

              <div className="lp-role-features">
                <div className="lp-feature-item">
                  <strong>{t('landingPage.roles.propertyManagers.feature1Title')}</strong>
                  <span>{t('landingPage.roles.propertyManagers.feature1Desc')}</span>
                </div>
                <div className="lp-feature-item">
                  <strong>{t('landingPage.roles.propertyManagers.feature2Title')}</strong>
                  <span>{t('landingPage.roles.propertyManagers.feature2Desc')}</span>
                </div>
                <div className="lp-feature-item">
                  <strong>{t('landingPage.roles.propertyManagers.feature3Title')}</strong>
                  <span>{t('landingPage.roles.propertyManagers.feature3Desc')}</span>
                </div>
              </div>

              <button className="lp-btn-role" onClick={() => openRegisterModal("property-manager")}>
                {t('landingPage.roles.propertyManagers.cta')}
              </button>
            </div>
            <div className="lp-role-visual">
              <div className="lp-visual-card">
                <div className="lp-card-tag">{t('landingPage.roles.activeProjects')}</div>
                <div className="lp-project-list">
                  <div className="lp-project-item">
                    <div className="lp-project-name">{t('landingPage.roles.exampleProject1')}</div>
                    <div className="lp-project-status in-progress">{t('landingPage.roles.inProgress')}</div>
                  </div>
                  <div className="lp-project-item">
                    <div className="lp-project-name">{t('landingPage.roles.exampleProject2')}</div>
                    <div className="lp-project-status completed">{t('landingPage.roles.completed')}</div>
                  </div>
                  <div className="lp-project-item">
                    <div className="lp-project-name">{t('landingPage.roles.exampleProject3')}</div>
                    <div className="lp-project-status bidding">{t('landingPage.roles.receivingBids')} (3)</div>
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
                <div className="lp-card-tag">{t('landingPage.roles.availableJobs')}</div>
                <div className="lp-job-list">
                  <div className="lp-job-item">
                    <div className="lp-job-title">{t('landingPage.roles.exampleJob1Title')}</div>
                    <div className="lp-job-meta">{t('landingPage.roles.exampleJob1Meta')}</div>
                  </div>
                  <div className="lp-job-item">
                    <div className="lp-job-title">{t('landingPage.roles.exampleJob2Title')}</div>
                    <div className="lp-job-meta">{t('landingPage.roles.exampleJob2Meta')}</div>
                  </div>
                  <div className="lp-job-item">
                    <div className="lp-job-title">{t('landingPage.roles.exampleJob3Title')}</div>
                    <div className="lp-job-meta">{t('landingPage.roles.exampleJob3Meta')}</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="lp-role-text">
              <span className="lp-role-label">{t('landingPage.roles.entrepreneurs.label')}</span>
              <h3>{t('landingPage.roles.entrepreneurs.headline')}</h3>
              <p className="lp-role-story">
                {t('landingPage.roles.entrepreneurs.story')}
              </p>
              <p className="lp-role-attribution">{t('landingPage.roles.entrepreneurs.attribution')}</p>

              <div className="lp-role-features">
                <div className="lp-feature-item">
                  <strong>{t('landingPage.roles.entrepreneurs.feature1Title')}</strong>
                  <span>{t('landingPage.roles.entrepreneurs.feature1Desc')}</span>
                </div>
                <div className="lp-feature-item">
                  <strong>{t('landingPage.roles.entrepreneurs.feature2Title')}</strong>
                  <span>{t('landingPage.roles.entrepreneurs.feature2Desc')}</span>
                </div>
                <div className="lp-feature-item">
                  <strong>{t('landingPage.roles.entrepreneurs.feature3Title')}</strong>
                  <span>{t('landingPage.roles.entrepreneurs.feature3Desc')}</span>
                </div>
              </div>

              <button className="lp-btn-role" onClick={() => openRegisterModal("entrepreneur")}>
                {t('landingPage.roles.entrepreneurs.cta')}
              </button>
            </div>
          </div>
        </div>

        {/* Residents */}
        <div className="lp-role-block lp-role-resident">
          <div className="lp-role-grid">
            <div className="lp-role-text">
              <span className="lp-role-label">{t('landingPage.roles.residents.label')}</span>
              <h3>{t('landingPage.roles.residents.headline')}</h3>
              <p className="lp-role-story">
                {t('landingPage.roles.residents.story')}
              </p>
              <p className="lp-role-attribution">{t('landingPage.roles.residents.attribution')}</p>

              <div className="lp-role-features">
                <div className="lp-feature-item">
                  <strong>{t('landingPage.roles.residents.feature1Title')}</strong>
                  <span>{t('landingPage.roles.residents.feature1Desc')}</span>
                </div>
                <div className="lp-feature-item">
                  <strong>{t('landingPage.roles.residents.feature2Title')}</strong>
                  <span>{t('landingPage.roles.residents.feature2Desc')}</span>
                </div>
                <div className="lp-feature-item">
                  <strong>{t('landingPage.roles.residents.feature3Title')}</strong>
                  <span>{t('landingPage.roles.residents.feature3Desc')}</span>
                </div>
              </div>

              <button className="lp-btn-role" onClick={() => openRegisterModal("resident")}>
                {t('landingPage.roles.residents.cta')}
              </button>
            </div>
            <div className="lp-role-visual">
              <div className="lp-visual-card">
                <div className="lp-card-tag">{t('landingPage.roles.yourRequests')}</div>
                <div className="lp-request-list">
                  <div className="lp-request-item">
                    <div className="lp-request-title">{t('landingPage.roles.exampleRequest1')}</div>
                    <div className="lp-request-status fixed">{t('landingPage.roles.fixedYesterday')}</div>
                  </div>
                  <div className="lp-request-item">
                    <div className="lp-request-title">{t('landingPage.roles.exampleRequest2')}</div>
                    <div className="lp-request-status scheduled">{t('landingPage.roles.scheduledTomorrow')}</div>
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
          <h2>{t('landingPage.howItWorks.title')}</h2>
          <p>{t('landingPage.howItWorks.subtitle')}</p>
        </div>
        <div className="lp-steps-container">
          <div className="lp-step">
            <div className="lp-step-number">1</div>
            <h3>{t('landingPage.howItWorks.step1Title')}</h3>
            <p>{t('landingPage.howItWorks.step1Desc')}</p>
          </div>
          <div className="lp-step-connector"></div>
          <div className="lp-step">
            <div className="lp-step-number">2</div>
            <h3>{t('landingPage.howItWorks.step2Title')}</h3>
            <p>{t('landingPage.howItWorks.step2Desc')}</p>
          </div>
          <div className="lp-step-connector"></div>
          <div className="lp-step">
            <div className="lp-step-number">3</div>
            <h3>{t('landingPage.howItWorks.step3Title')}</h3>
            <p>{t('landingPage.howItWorks.step3Desc')}</p>
          </div>
          <div className="lp-step-connector"></div>
          <div className="lp-step">
            <div className="lp-step-number">4</div>
            <h3>{t('landingPage.howItWorks.step4Title')}</h3>
            <p>{t('landingPage.howItWorks.step4Desc')}</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="lp-cta-section">
        <div className="lp-cta-content">
          <h2>{t('landingPage.cta.title')}</h2>
          <p>
            {t('landingPage.cta.subtitle')}
          </p>
          <button className="lp-btn-cta" onClick={() => setShowRegisterModal(true)}>
            {t('landingPage.cta.button')}
          </button>
          <p style={{ marginTop: '1rem', fontSize: '0.9rem', opacity: 0.8 }}>
            {t('landingPage.cta.disclaimer')}
          </p>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="lp-pricing-section" id="pricing">
        <div className="lp-pricing-header">
          <span className="lp-pricing-badge">{t('landingPage.pricing.forEntrepreneurs')}</span>
          <h2>{t('landingPage.pricing.title')}</h2>
          <p>{t('landingPage.pricing.subtitle')}</p>
        </div>
        <div className="lp-pricing-cards">
          {/* Basic Plan */}
          <div className="lp-pricing-card">
            <div className="lp-pricing-card-header">
              <h3>{t('landingPage.pricing.basicPlan')}</h3>
              <p className="lp-pricing-desc">{t('landingPage.pricing.basicDesc')}</p>
            </div>
            <div className="lp-pricing-price">
              <span className="lp-price-currency">$</span>
              <span className="lp-price-amount">250</span>
              <span className="lp-price-period">{t('landingPage.pricing.perMonth')}</span>
            </div>
            <ul className="lp-pricing-features">
              <li><Check size={18} className="lp-feature-check" /> {t('landingPage.pricing.feature1')}</li>
              <li><Check size={18} className="lp-feature-check" /> {t('landingPage.pricing.feature2')}</li>
              <li><Check size={18} className="lp-feature-check" /> {t('landingPage.pricing.feature3')} <span className="lp-feature-limit">({t('landingPage.pricing.bidsLimit')})</span></li>
              <li><Check size={18} className="lp-feature-check" /> {t('landingPage.pricing.feature4')}</li>
              <li><Check size={18} className="lp-feature-check" /> {t('landingPage.pricing.feature5')}</li>
              <li className="lp-feature-disabled"><X size={18} className="lp-feature-x" /> {t('landingPage.pricing.feature6')}</li>
              <li className="lp-feature-disabled"><X size={18} className="lp-feature-x" /> {t('landingPage.pricing.feature7')}</li>
              <li className="lp-feature-disabled"><X size={18} className="lp-feature-x" /> {t('landingPage.pricing.feature8')}</li>
            </ul>
            <button className="lp-pricing-btn" onClick={() => setShowRegisterModal(true)}>
              {t('landingPage.pricing.getStarted')}
            </button>
          </div>

          {/* Premium Plan */}
          <div className="lp-pricing-card lp-pricing-popular">
            <div className="lp-popular-badge">
              <Crown size={14} />
              {t('landingPage.pricing.popular')}
            </div>
            <div className="lp-pricing-card-header">
              <h3>{t('landingPage.pricing.premiumPlan')}</h3>
              <p className="lp-pricing-desc">{t('landingPage.pricing.premiumDesc')}</p>
            </div>
            <div className="lp-pricing-price">
              <span className="lp-price-currency">$</span>
              <span className="lp-price-amount">429</span>
              <span className="lp-price-period">{t('landingPage.pricing.perMonth')}</span>
            </div>
            <ul className="lp-pricing-features">
              <li><Check size={18} className="lp-feature-check" /> {t('landingPage.pricing.feature1')}</li>
              <li><Check size={18} className="lp-feature-check" /> {t('landingPage.pricing.feature2')}</li>
              <li><Check size={18} className="lp-feature-check" /> {t('landingPage.pricing.feature3')} <span className="lp-feature-unlimited">({t('landingPage.pricing.unlimited')})</span></li>
              <li><Check size={18} className="lp-feature-check" /> {t('landingPage.pricing.feature4')}</li>
              <li><Check size={18} className="lp-feature-check" /> {t('landingPage.pricing.feature5')}</li>
              <li><Check size={18} className="lp-feature-check" /> {t('landingPage.pricing.feature6')}</li>
              <li><Check size={18} className="lp-feature-check" /> {t('landingPage.pricing.feature7')}</li>
              <li><Check size={18} className="lp-feature-check" /> {t('landingPage.pricing.feature8')}</li>
            </ul>
            <button className="lp-pricing-btn lp-pricing-btn-premium" onClick={() => setShowRegisterModal(true)}>
              {t('landingPage.pricing.getStarted')}
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="lp-footer">
        <div className="lp-footer-content">
          <div className="lp-footer-section lp-footer-brand">
            <div className="lp-footer-logo">
              <span className="lp-logo-icon">
                <img src={logoLight} alt="INTERVOS" />
              </span>
              <span className="lp-logo-text">INTERVOS</span>
            </div>
            <p>{t('landingPage.footer.tagline')}</p>
          </div>
          <div className="lp-footer-section">
            <h4>{t('landingPage.footer.platform')}</h4>
            <ul>
              <li><a href="#features">{t('landingPage.nav.features')}</a></li>
              <li><a href="#roles">{t('landingPage.nav.forYou')}</a></li>
              <li><a href="#how-it-works">{t('landingPage.nav.howItWorks')}</a></li>
              <li><a href="#pricing">{t('landingPage.footer.pricing')}</a></li>
            </ul>
          </div>
          <div className="lp-footer-section">
            <h4>{t('landingPage.footer.company')}</h4>
            <ul>
              <li><a href="#about">{t('landingPage.footer.aboutUs')}</a></li>
            </ul>
          </div>
          <div className="lp-footer-section">
            <h4>{t('landingPage.footer.legal')}</h4>
            <ul>
              <li><a href="/legal?tab=privacy" onClick={(e) => { e.preventDefault(); navigate('/legal?tab=privacy'); }}>{t('landingPage.footer.privacyPolicy')}</a></li>
              <li><a href="/legal?tab=terms" onClick={(e) => { e.preventDefault(); navigate('/legal?tab=terms'); }}>{t('landingPage.footer.termsOfService')}</a></li>
              <li><a href="/legal?tab=cookies" onClick={(e) => { e.preventDefault(); navigate('/legal?tab=cookies'); }}>{t('landingPage.footer.cookiePolicy')}</a></li>
            </ul>
          </div>
          <div className="lp-footer-section">
            <h4>{t('landingPage.footer.contact')}</h4>
            <ul className="lp-footer-contact">
              <li><a href="mailto:support@intervos.com">support@intervos.com</a></li>
              <li><a href="tel:+15551234567">+1 (555) 123-4567</a></li>
            </ul>
          </div>
        </div>
        <div className="lp-footer-bottom">
          <p>{t('landingPage.footer.copyright')}</p>
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
              <h2>{t('landingPage.login.title')}</h2>
              <p>{t('landingPage.login.subtitle')}</p>
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
                        {isResendingVerification ? t('landingPage.register.resending') : t('landingPage.register.resendEmail')}
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="lp-form-group">
                <label htmlFor="login-email">{t('landingPage.login.emailLabel')}</label>
                <div className="lp-input-wrapper">
                  <svg className="lp-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  <input
                    id="login-email"
                    type="email"
                    name="email"
                    placeholder={t('landingPage.login.emailPlaceholder')}
                    value={loginFormData.email}
                    onChange={handleLoginChange}
                    className={loginErrors.email ? "lp-input-error" : ""}
                    required
                  />
                </div>
                {loginErrors.email && (
                  <span className="lp-error-message">{loginErrors.email}</span>
                )}
              </div>

              <div className="lp-form-group">
                <label htmlFor="login-password">{t('landingPage.login.passwordLabel')}</label>
                <div className="lp-input-wrapper">
                  <svg className="lp-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder={t('landingPage.login.passwordPlaceholder')}
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
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                      {showPassword ? (
                        <>
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </>
                      ) : (
                        <>
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </>
                      )}
                    </svg>
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
                  <span>{t('landingPage.login.rememberMe')}</span>
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
                  {t('landingPage.login.forgotPassword')}
                </button>
              </div>

              <button
                type="submit"
                className="lp-btn-primary lp-btn-full"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? t('landingPage.login.loggingIn') : t('landingPage.login.loginButton')}
              </button>
            </form>

            <div className="lp-modal-divider"><span>{t('landingPage.login.orContinueWith')}</span></div>

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
              {t('landingPage.login.noAccount')}{" "}
              <button
                className="lp-link-btn"
                onClick={() => {
                  setShowLoginModal(false)
                  setShowRegisterModal(true)
                }}
              >
                {t('landingPage.login.signUp')}
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
                  <h2>{t('landingPage.register.title')}</h2>
                  <p>{t('landingPage.register.selectRole')}</p>
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
                  {t('landingPage.register.next')}
                </button>
                <div className="lp-modal-footer">
                  {t('landingPage.register.haveAccount')}{" "}
                  <button
                    className="lp-link-btn"
                    onClick={() => {
                      setShowRegisterModal(false)
                      setShowLoginModal(true)
                    }}
                  >
                    {t('landingPage.register.logIn')}
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
                  {t('landingPage.register.back')}
                </button>
                <div className="lp-modal-header">
                  <h2>{t('landingPage.register.createAccountTitle')}</h2>
                  <p>
                    {selectedRole === 'property-manager' && t('landingPage.register.joinAsPropertyManager')}
                    {selectedRole === 'entrepreneur' && t('landingPage.register.joinAsEntrepreneur')}
                    {selectedRole === 'resident' && t('landingPage.register.joinAsResident')}
                    {selectedRole === 'supplier' && t('landingPage.register.joinAsSupplier')}
                  </p>
                </div>

                <div className="lp-google-login-section">
                  <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
                    <GoogleLogin onSuccess={handleSuccess} onError={handleError} />
                  </GoogleOAuthProvider>
                </div>

                <div className="lp-modal-divider"><span>{t('landingPage.register.orDivider')}</span></div>

                <form className="lp-modal-form" onSubmit={handleAuthenticationSubmit}>
                  {registerErrors.submit && (
                    <div className="lp-form-error-banner">
                      {registerErrors.submit}
                    </div>
                  )}

                  <div className="lp-form-row">
                    <div className="lp-form-group">
                      <label>{t('landingPage.register.firstName')}</label>
                      <div className="lp-input-wrapper">
                        <svg className="lp-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                          <circle cx="12" cy="7" r="4"/>
                        </svg>
                        <input
                          type="text"
                          name="first_name"
                          placeholder={t('landingPage.register.firstNamePlaceholder')}
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
                      <label>{t('landingPage.register.lastName')} {registerFormData.provider === 'google' && t('landingPage.register.optional')}</label>
                      <div className="lp-input-wrapper">
                        <svg className="lp-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                          <circle cx="12" cy="7" r="4"/>
                        </svg>
                        <input
                          type="text"
                          name="last_name"
                          placeholder={t('landingPage.register.lastNamePlaceholder')}
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
                    <label>{t('landingPage.register.emailAddress')}</label>
                    <div className="lp-input-wrapper">
                      <svg className="lp-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                        <polyline points="22,6 12,13 2,6"/>
                      </svg>
                      <input
                        type="email"
                        name="email"
                        placeholder={t('landingPage.register.emailPlaceholder')}
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
                        <label>{t('landingPage.register.password')}</label>
                        <div className="lp-input-wrapper">
                          <svg className="lp-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                          </svg>
                          <input
                            type={showRegisterPassword ? "text" : "password"}
                            name="password"
                            placeholder={t('landingPage.register.passwordPlaceholder')}
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
                              {t('landingPage.register.reqLength')}
                            </div>
                            <div className={`lp-password-requirement ${passwordValidation.uppercase ? 'valid' : ''}`}>
                              <svg viewBox="0 0 16 16" width="14" height="14">
                                <path d="M13.5 4L6 11.5L2.5 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                              </svg>
                              {t('landingPage.register.reqUppercase')}
                            </div>
                            <div className={`lp-password-requirement ${passwordValidation.lowercase ? 'valid' : ''}`}>
                              <svg viewBox="0 0 16 16" width="14" height="14">
                                <path d="M13.5 4L6 11.5L2.5 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                              </svg>
                              {t('landingPage.register.reqLowercase')}
                            </div>
                            <div className={`lp-password-requirement ${passwordValidation.number ? 'valid' : ''}`}>
                              <svg viewBox="0 0 16 16" width="14" height="14">
                                <path d="M13.5 4L6 11.5L2.5 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                              </svg>
                              {t('landingPage.register.reqNumber')}
                            </div>
                            <div className={`lp-password-requirement ${passwordValidation.special ? 'valid' : ''}`}>
                              <svg viewBox="0 0 16 16" width="14" height="14">
                                <path d="M13.5 4L6 11.5L2.5 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                              </svg>
                              {t('landingPage.register.reqSpecial')}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="lp-form-group">
                        <label>{t('landingPage.register.confirmPassword')}</label>
                        <div className="lp-input-wrapper">
                          <svg className="lp-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                          </svg>
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            name="confirm_password"
                            placeholder={t('landingPage.register.confirmPasswordPlaceholder')}
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
                    {t('landingPage.register.continue')}
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
                  {t('landingPage.register.back')}
                </button>
                <div className="lp-modal-header">
                  <h2>{t('landingPage.register.completeProfileTitle')}</h2>
                  <p>
                    {selectedRole === 'property-manager' && t('landingPage.register.profileSubtitlePM')}
                    {selectedRole === 'entrepreneur' && t('landingPage.register.profileSubtitleEntr')}
                    {selectedRole === 'resident' && t('landingPage.register.profileSubtitleRes')}
                    {selectedRole === 'supplier' && t('landingPage.register.profileSubtitleSup')}
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
                      <div className="lp-form-divider">{t('landingPage.register.propertyManagerDetails')}</div>
                      <div className="lp-form-group">
                        <label>{t('landingPage.register.companyName')}</label>
                        <div className="lp-input-wrapper">
                          <svg className="lp-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                            <polyline points="9 22 9 12 15 12 15 22"/>
                          </svg>
                          <input
                            type="text"
                            name="company_name"
                            placeholder={t('landingPage.register.companyNamePlaceholder')}
                            value={registerFormData.company_name}
                            onChange={handleRegisterChange}
                            required
                          />
                        </div>
                      </div>
                      <div className="lp-form-group">
                        <label>{t('landingPage.register.phone')}</label>
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
                          placeholder={t('landingPage.register.phone')}
                        />
                        {registerErrors.phone && (
                          <span className="lp-field-error">{registerErrors.phone}</span>
                        )}
                      </div>
                      {/* Address Section */}
                      <div className="lp-form-divider">{t('landingPage.register.addressDetails') || 'Business Address'}</div>
                      <div className="lp-form-group">
                        <label>{t('landingPage.register.streetAddress') || 'Street Address'}</label>
                        <div className="lp-input-wrapper">
                          <svg className="lp-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                            <circle cx="12" cy="10" r="3"/>
                          </svg>
                          <input
                            type="text"
                            name="street_address"
                            placeholder={t('landingPage.register.streetAddressPlaceholder') || 'e.g., 123 Main Street, Unit 5'}
                            value={registerFormData.street_address}
                            onChange={handleRegisterChange}
                            required
                          />
                        </div>
                      </div>
                      <div className="lp-form-row">
                        <div className="lp-form-group">
                          <label>{t('landingPage.register.country') || 'Country'}</label>
                          <div className="lp-input-wrapper lp-select-wrapper">
                            <svg className="lp-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10"/>
                              <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                            </svg>
                            <select
                              name="country"
                              value={registerFormData.country}
                              onChange={(e) => {
                                setRegisterFormData({
                                  ...registerFormData,
                                  country: e.target.value,
                                  state: "" // Reset state when country changes
                                });
                              }}
                              required
                            >
                              {countryOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="lp-form-group">
                          <label>{registerFormData.country === 'CA' ? (t('landingPage.register.province') || 'Province') : (t('landingPage.register.state') || 'State')}</label>
                          <div className="lp-input-wrapper lp-select-wrapper">
                            <svg className="lp-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                              <circle cx="12" cy="10" r="3"/>
                            </svg>
                            <select
                              name="state"
                              value={registerFormData.state}
                              onChange={handleRegisterChange}
                              required
                              disabled={!registerFormData.country}
                            >
                              {(stateProvinceOptions[registerFormData.country] || [{ value: "", label: "Select Country First" }]).map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                      <div className="lp-form-row">
                        <div className="lp-form-group">
                          <label>{t('landingPage.register.city') || 'City'}</label>
                          <div className="lp-input-wrapper">
                            <svg className="lp-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M3 21h18M9 8h1m-1 4h1m-1 4h1M14 8h1m-1 4h1m-1 4h1M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/>
                            </svg>
                            <input
                              type="text"
                              name="city"
                              placeholder={t('landingPage.register.cityPlaceholder') || 'Enter city'}
                              value={registerFormData.city}
                              onChange={handleRegisterChange}
                              required
                            />
                          </div>
                        </div>
                        <div className="lp-form-group">
                          <label>{registerFormData.country === 'CA' ? (t('landingPage.register.postalCode') || 'Postal Code') : (t('landingPage.register.zipCode') || 'ZIP Code')}</label>
                          <div className="lp-input-wrapper">
                            <svg className="lp-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="2" y="4" width="20" height="16" rx="2"/>
                              <path d="M7 9h10M7 13h6"/>
                            </svg>
                            <input
                              type="text"
                              name="zip_code"
                              placeholder={registerFormData.country === 'CA' ? 'A1A 1A1' : '12345'}
                              value={registerFormData.zip_code}
                              onChange={handleRegisterChange}
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <div className="lp-form-group">
                        <label>{t('landingPage.register.numProperties')}</label>
                        <div className="lp-input-wrapper">
                          <svg className="lp-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 21h18M9 8h1m-1 4h1m-1 4h1M14 8h1m-1 4h1m-1 4h1M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/>
                          </svg>
                          <input
                            type="number"
                            name="num_properties"
                            placeholder={t('landingPage.register.numPropertiesPlaceholder')}
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
                      <div className="lp-form-divider">{t('landingPage.register.entrepreneurDetails')}</div>
                      <div className="lp-form-group">
                        <label>{t('landingPage.register.companyName')}</label>
                        <div className="lp-input-wrapper">
                          <svg className="lp-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                          </svg>
                          <input
                            type="text"
                            name="company_name"
                            placeholder={t('landingPage.register.companyNamePlaceholder')}
                            value={registerFormData.company_name}
                            onChange={handleRegisterChange}
                            required
                          />
                        </div>
                      </div>
                      <div className="lp-form-group">
                        <label>{t('landingPage.register.phone')}</label>
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
                          placeholder={t('landingPage.register.phone')}
                        />
                        {registerErrors.phone && (
                          <span className="lp-field-error">{registerErrors.phone}</span>
                        )}
                      </div>
                      {/* Address Section */}
                      <div className="lp-form-divider">{t('landingPage.register.addressDetails') || 'Business Address'}</div>
                      <div className="lp-form-group">
                        <label>{t('landingPage.register.streetAddress') || 'Street Address'}</label>
                        <div className="lp-input-wrapper">
                          <svg className="lp-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                            <circle cx="12" cy="10" r="3"/>
                          </svg>
                          <input
                            type="text"
                            name="street_address"
                            placeholder={t('landingPage.register.streetAddressPlaceholder') || 'e.g., 123 Main Street, Unit 5'}
                            value={registerFormData.street_address}
                            onChange={handleRegisterChange}
                            required
                          />
                        </div>
                      </div>
                      <div className="lp-form-row">
                        <div className="lp-form-group">
                          <label>{t('landingPage.register.country') || 'Country'}</label>
                          <div className="lp-input-wrapper lp-select-wrapper">
                            <svg className="lp-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10"/>
                              <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                            </svg>
                            <select
                              name="country"
                              value={registerFormData.country}
                              onChange={(e) => {
                                setRegisterFormData({
                                  ...registerFormData,
                                  country: e.target.value,
                                  state: ""
                                });
                              }}
                              required
                            >
                              {countryOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="lp-form-group">
                          <label>{registerFormData.country === 'CA' ? (t('landingPage.register.province') || 'Province') : (t('landingPage.register.state') || 'State')}</label>
                          <div className="lp-input-wrapper lp-select-wrapper">
                            <svg className="lp-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                              <circle cx="12" cy="10" r="3"/>
                            </svg>
                            <select
                              name="state"
                              value={registerFormData.state}
                              onChange={handleRegisterChange}
                              required
                              disabled={!registerFormData.country}
                            >
                              {(stateProvinceOptions[registerFormData.country] || [{ value: "", label: "Select Country First" }]).map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                      <div className="lp-form-row">
                        <div className="lp-form-group">
                          <label>{t('landingPage.register.city') || 'City'}</label>
                          <div className="lp-input-wrapper">
                            <svg className="lp-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M3 21h18M9 8h1m-1 4h1m-1 4h1M14 8h1m-1 4h1m-1 4h1M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/>
                            </svg>
                            <input
                              type="text"
                              name="city"
                              placeholder={t('landingPage.register.cityPlaceholder') || 'Enter city'}
                              value={registerFormData.city}
                              onChange={handleRegisterChange}
                              required
                            />
                          </div>
                        </div>
                        <div className="lp-form-group">
                          <label>{registerFormData.country === 'CA' ? (t('landingPage.register.postalCode') || 'Postal Code') : (t('landingPage.register.zipCode') || 'ZIP Code')}</label>
                          <div className="lp-input-wrapper">
                            <svg className="lp-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="2" y="4" width="20" height="16" rx="2"/>
                              <path d="M7 9h10M7 13h6"/>
                            </svg>
                            <input
                              type="text"
                              name="zip_code"
                              placeholder={registerFormData.country === 'CA' ? 'A1A 1A1' : '12345'}
                              value={registerFormData.zip_code}
                              onChange={handleRegisterChange}
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <div className="lp-form-group">
                        <label>{t('landingPage.register.licenseNumber')}</label>
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
                            placeholder={t('landingPage.register.licenseNumberPlaceholder')}
                            value={registerFormData.license_number}
                            onChange={handleRegisterChange}
                            required
                          />
                        </div>
                      </div>
                      <div className="lp-form-row">
                        <div className="lp-form-group">
                          <label>{t('landingPage.register.yearsInBusiness')}</label>
                          <div className="lp-input-wrapper">
                            <svg className="lp-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10"/>
                              <polyline points="12 6 12 12 16 14"/>
                            </svg>
                            <input
                              type="number"
                              name="years_in_business"
                              placeholder={t('landingPage.register.yearsInBusinessPlaceholder')}
                              value={registerFormData.years_in_business}
                              onChange={handleRegisterChange}
                              required
                              min="1"
                            />
                          </div>
                        </div>
                        <div className="lp-form-group">
                          <label>{t('landingPage.register.numEmployees')}</label>
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
                              placeholder={t('landingPage.register.numEmployeesPlaceholder')}
                              value={registerFormData.num_employees}
                              onChange={handleRegisterChange}
                              required
                              min="1"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="lp-form-group">
                        <label>{t('landingPage.register.specializations')}</label>
                        <div className="lp-input-wrapper">
                          <svg className="lp-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                          </svg>
                          <input
                            type="text"
                            name="specializations"
                            placeholder={t('landingPage.register.specializationsPlaceholder')}
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
                      <div className="lp-form-divider">{t('landingPage.register.residentDetails')}</div>
                      <div className="lp-form-group">
                        <label>{t('landingPage.register.phone')}</label>
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
                          placeholder={t('landingPage.register.phone')}
                        />
                        {registerErrors.phone && (
                          <span className="lp-field-error">{registerErrors.phone}</span>
                        )}
                      </div>
                      <div className="lp-form-group">
                        <label htmlFor="property_id" className="form-label">
                          {t('landingPage.register.selectYourBuilding')} <span className="required">*</span>
                        </label>
                        {isLoadingProperties ? (
                          <div className="loading-text">{t('landingPage.register.loadingProperties')}</div>
                        ) : properties.length === 0 ? (
                          <div className="info-message">
                            {t('landingPage.register.noPropertiesFound')}
                          </div>
                        ) : (
                          <div className="searchable-dropdown-container">
                            <input
                              type="text"
                              className="lp-form-input"
                              placeholder={t('landingPage.register.searchProperty')}
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
                                  {t('landingPage.register.noPropertiesFound')}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="lp-form-group">
                        <label>{t('landingPage.register.unitNumber')}</label>
                        <div className="lp-input-wrapper">
                          <svg className="lp-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                            <polyline points="9 22 9 12 15 12 15 22"/>
                          </svg>
                          <input
                            type="text"
                            name="unit_number"
                            placeholder={t('landingPage.register.unitNumberPlaceholder')}
                            value={registerFormData.unit_number}
                            onChange={handleRegisterChange}
                            required
                          />
                        </div>
                      </div>
                      <div className="lp-form-group">
                        <label>{t('landingPage.register.moveInDate')}</label>
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
                      <div className="lp-form-divider">{t('landingPage.register.supplierDetails')}</div>
                      <div className="lp-form-group">
                        <label>{t('landingPage.register.companyName')}</label>
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
                            placeholder={t('landingPage.register.companyNamePlaceholder')}
                            value={registerFormData.company_name}
                            onChange={handleRegisterChange}
                            required
                          />
                        </div>
                      </div>
                      <div className="lp-form-group">
                        <label>{t('landingPage.register.phone')}</label>
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
                          placeholder={t('landingPage.register.phone')}
                        />
                        {registerErrors.phone && (
                          <span className="lp-field-error">{registerErrors.phone}</span>
                        )}
                      </div>
                      <div className="lp-form-divider">{t('landingPage.register.businessAddress')}</div>
                      <div className="lp-form-row">
                        <div className="lp-form-group lp-form-half">
                          <label>{t('landingPage.register.country')}</label>
                          <div className="lp-select-wrapper">
                            <svg className="lp-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10"/>
                              <line x1="2" y1="12" x2="22" y2="12"/>
                              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                            </svg>
                            <select
                              name="country"
                              value={registerFormData.country}
                              onChange={(e) => {
                                setRegisterFormData({
                                  ...registerFormData,
                                  country: e.target.value,
                                  state: ""
                                });
                              }}
                              required
                            >
                              {countryOptions.map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="lp-form-group lp-form-half">
                          <label>{registerFormData.country === "CA" ? t('landingPage.register.province') : t('landingPage.register.state')}</label>
                          <div className="lp-select-wrapper">
                            <svg className="lp-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                              <circle cx="12" cy="10" r="3"/>
                            </svg>
                            <select
                              name="state"
                              value={registerFormData.state}
                              onChange={handleRegisterChange}
                              required
                              disabled={!registerFormData.country}
                            >
                              <option value="">{registerFormData.country === "CA" ? t('landingPage.register.selectProvince') : t('landingPage.register.selectState')}</option>
                              {registerFormData.country && stateProvinceOptions[registerFormData.country]?.map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                      <div className="lp-form-row">
                        <div className="lp-form-group lp-form-half">
                          <label>{t('landingPage.register.city')}</label>
                          <div className="lp-input-wrapper">
                            <svg className="lp-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M3 21h18"/>
                              <path d="M5 21V7l8-4v18"/>
                              <path d="M19 21V11l-6-4"/>
                              <path d="M9 9v.01"/>
                              <path d="M9 12v.01"/>
                              <path d="M9 15v.01"/>
                              <path d="M9 18v.01"/>
                            </svg>
                            <input
                              type="text"
                              name="city"
                              placeholder={t('landingPage.register.cityPlaceholder')}
                              value={registerFormData.city}
                              onChange={handleRegisterChange}
                              required
                            />
                          </div>
                        </div>
                        <div className="lp-form-group lp-form-half">
                          <label>{registerFormData.country === "CA" ? t('landingPage.register.postalCode') : t('landingPage.register.zipCode')}</label>
                          <div className="lp-input-wrapper">
                            <svg className="lp-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v3"/>
                              <path d="M21 16v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3"/>
                              <path d="M4 12h16"/>
                            </svg>
                            <input
                              type="text"
                              name="zip_code"
                              placeholder={registerFormData.country === "CA" ? t('landingPage.register.postalCodePlaceholder') : t('landingPage.register.zipCodePlaceholder')}
                              value={registerFormData.zip_code}
                              onChange={handleRegisterChange}
                              required
                            />
                          </div>
                        </div>
                      </div>
                      <div className="lp-form-group">
                        <label>{t('landingPage.register.website')} <span className="lp-optional-label">{t('landingPage.register.optional')}</span></label>
                        <div className="lp-input-wrapper">
                          <svg className="lp-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="2" y1="12" x2="22" y2="12"/>
                            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                          </svg>
                          <input
                            type="url"
                            name="website"
                            placeholder={t('landingPage.register.websitePlaceholder')}
                            value={registerFormData.website}
                            onChange={handleRegisterChange}
                          />
                        </div>
                      </div>
                      <div className="lp-form-group">
                        <label>{t('landingPage.register.yearsInBusiness')}</label>
                        <div className="lp-input-wrapper">
                          <svg className="lp-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14"/>
                          </svg>
                          <input
                            type="number"
                            name="years_in_business"
                            placeholder={t('landingPage.register.yearsInBusinessPlaceholder')}
                            value={registerFormData.years_in_business}
                            onChange={handleRegisterChange}
                            required
                            min="1"
                          />
                        </div>
                      </div>
                      <div className="lp-form-group">
                        <label>{t('landingPage.register.deliveryAreas')}</label>
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
                            placeholder={t('landingPage.register.deliveryAreasPlaceholder')}
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
                        {t('landingPage.register.agreeToTerms')}{" "}
                        <a href="/legal?tab=terms" target="_blank" rel="noopener noreferrer">
                          {t('landingPage.footer.termsOfService')}
                        </a>{" "}
                        {t('landingPage.register.and')}{" "}
                        <a href="/legal?tab=privacy" target="_blank" rel="noopener noreferrer">
                          {t('landingPage.footer.privacyPolicy')}
                        </a>
                      </span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="lp-btn-primary lp-btn-full"
                    disabled={isRegistering}
                  >
                    {isRegistering ? t('landingPage.register.settingUp') : t('landingPage.register.startProject')}
                  </button>
                </form>
              </>
            )}

            {/* ===== STEP 4: SUCCESS & EMAIL VERIFICATION ===== */}
            {registrationStep === 4 && (
              <>
                <div className="lp-modal-header">
                  <h2>{t('landingPage.register.registrationSuccessTitle')}</h2>
                  <p>{t('landingPage.register.verifyEmailSubtitle')}</p>
                </div>

                <div className="lp-verification-content">
                  <div className="lp-success-icon">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M13.5 4L6 11.5L2.5 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>

                  <div className="lp-verification-message">
                    <p className="lp-verification-title">{t('landingPage.register.checkInbox')}</p>
                    <p className="lp-verification-text">
                      {t('landingPage.register.successMessage')}:
                    </p>
                    <p className="lp-verification-email">{registeredEmail}</p>
                    <p className="lp-verification-text">
                      {t('landingPage.register.successInstructions')}
                    </p>
                  </div>

                  <div className="lp-verification-actions">
                    <p className="lp-resend-text">{t('landingPage.register.didntReceiveEmail')}</p>
                    <button
                      type="button"
                      className="lp-btn-link"
                      onClick={() => handleResendVerification()}
                      disabled={isResendingVerification}
                    >
                      {isResendingVerification ? t('landingPage.register.sending') : t('landingPage.register.resendEmail')}
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
                    {t('landingPage.register.goToLogin')}
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