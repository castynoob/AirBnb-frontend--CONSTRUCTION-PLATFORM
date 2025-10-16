import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, AlertCircle } from "lucide-react";
import illustration from "../../assets/images/illustration.png";
import logo from "../../assets/logo-light.png";
import "../../styles/authpage.css";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

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
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    console.log("Login data:", formData);
    alert("Login successful! This is just a UI demo.");
    navigate("/homepage/manager");
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
            <h2 className="form-title">Welcome Back</h2>
            <p className="form-subtitle">Please enter your credentials to continue</p>

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

              {/* Remember Me & Forgot Password */}
              <div className="form-options">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Remember me</span>
                </label>
                <Link to="/forgot-password" className="forgot-link">
                  Forgot password?
                </Link>
              </div>

              <button type="submit" className="submit-btn">
                Sign In
              </button>
            </form>

            <div className="form-footer">
              <p>
                Don't have an account?{" "}
                <Link to="/signup">Sign up</Link>
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

export default Login;