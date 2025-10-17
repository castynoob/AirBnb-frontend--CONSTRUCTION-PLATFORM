import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, CheckCircle } from "lucide-react";
import illustration from "../../assets/images/illustration.png";
import logo from "../../assets/logo-light.png";
import "../../styles/auth/authpage.css"

const SignUp = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    first_name: "",
    middle_name: "",
    last_name: "",
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    // First name validation
    if (!formData.first_name.trim()) {
      newErrors.first_name = "First name is required";
    }

    // Last name validation
    if (!formData.last_name.trim()) {
      newErrors.last_name = "Last name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    console.log("Sign up data:", formData);
    alert("Account created successfully! This is just a UI demo.");
    navigate("/login");
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="auth-content">
          <div className="brand-section">
            <img src={logo} alt="Logo" className="brand-logo" />
            <h1 className="brand-name">INVERTOS</h1>
          </div>

          <div className="form-section">
            <h2 className="form-title">Create Account</h2>
            <p className="form-subtitle">Sign up to get started with INVERTOS</p>

            <form onSubmit={handleSubmit} className="auth-form">
              {/* Email */}
              <div className="form-field">
                <label htmlFor="email">
                  <Mail size={16} />
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className={errors.email ? "error" : ""}
                />
                {errors.email && (
                  <span className="error-message">
                    <AlertCircle size={14} />
                    {errors.email}
                  </span>
                )}
              </div>

              {/* Name Fields */}
              <div className="name-grid">
                <div className="form-field">
                  <label htmlFor="first_name">
                    <User size={16} />
                    First Name
                  </label>
                  <input
                    id="first_name"
                    type="text"
                    name="first_name"
                    placeholder="John"
                    value={formData.first_name}
                    onChange={handleChange}
                    className={errors.first_name ? "error" : ""}
                  />
                  {errors.first_name && (
                    <span className="error-message">
                      <AlertCircle size={14} />
                      {errors.first_name}
                    </span>
                  )}
                </div>

                <div className="form-field">
                  <label htmlFor="middle_name">
                    <User size={16} />
                    Middle Name (Optional)
                  </label>
                  <input
                    id="middle_name"
                    type="text"
                    name="middle_name"
                    placeholder="M."
                    value={formData.middle_name}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="last_name">
                    <User size={16} />
                    Last Name
                  </label>
                  <input
                    id="last_name"
                    type="text"
                    name="last_name"
                    placeholder="Doe"
                    value={formData.last_name}
                    onChange={handleChange}
                    className={errors.last_name ? "error" : ""}
                  />
                  {errors.last_name && (
                    <span className="error-message">
                      <AlertCircle size={14} />
                      {errors.last_name}
                    </span>
                  )}
                </div>
              </div>

              {/* Password */}
              <div className="form-field">
                <label htmlFor="password">
                  <Lock size={16} />
                  Password
                </label>
                <div className="password-input">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className={errors.password ? "error" : ""}
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
              </div>

              {/* Confirm Password */}
              <div className="form-field">
                <label htmlFor="confirmPassword">
                  <Lock size={16} />
                  Confirm Password
                </label>
                <div className="password-input">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={errors.confirmPassword ? "error" : ""}
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
              </div>

              <button type="submit" className="submit-btn">
                Create Account
              </button>
            </form>

            <div className="form-footer">
              <p>
                Already have an account?{" "}
                <Link to="/login">Sign in</Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-illustration">
        <div className="illustration-overlay">
          <h2>Welcome to INVERTOS</h2>
          <p>Manage your construction projects with ease</p>
        </div>
        <img src={illustration} alt="Construction Management" />
      </div>
    </div>
  );
};

export default SignUp;