import React, { useState } from "react";
import './signuppage.css'
import illustration from "../assets/images/illustration.png";
import { Link } from "react-router-dom";

const SignUp = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    first_name: "",
    middle_name: "",
    last_name: "",
  });

  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false); // toggle visibility

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError(""); // Clear error when typing
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    alert("This is just a UI demo — no backend connected yet.");
  };

  return (
    <div className="signup-container">
      <div className="signup-box">
        <a href="/" className="brand">
          Construction Pro
        </a>


        <div className="main-form">
          <h2 className="title">Sign Up</h2>
          <p className="subtext">Welcome to Construction Pro! Please enter your credentials.</p>


          <form onSubmit={handleSubmit} className="form">
            {/* Email */}
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            {/* Password */}
            <div className="field password-field">
              <label htmlFor="password">Password</label>
              <div className="password-wrapper">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <span
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "Hide" : "Show"}
                </span>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="field password-field">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="password-wrapper">
                <input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
                <span
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "Hide" : "Show"}
                </span>
              </div>
              {error && <p className="error-text">{error}</p>}
            </div>

            {/* Names */}
            <div className="name-fields">
              <div className="field">
                <label htmlFor="first_name">First Name</label>
                <input
                  id="first_name"
                  type="text"
                  name="first_name"
                  placeholder="First Name"
                  value={formData.first_name}
                  onChange={handleChange}
                />
              </div>

              <div className="field">
                <label htmlFor="middle_name">Middle Name</label>
                <input
                  id="middle_name"
                  type="text"
                  name="middle_name"
                  placeholder="Middle Name"
                  value={formData.middle_name}
                  onChange={handleChange}
                />
              </div>

              <div className="field">
                <label htmlFor="last_name">Last Name</label>
                <input
                  id="last_name"
                  type="text"
                  name="last_name"
                  placeholder="Last Name"
                  value={formData.last_name}
                  onChange={handleChange}
                />
              </div>
            </div>

            <button type="submit">Sign Up</button>
          </form>
        </div>

        <div className="other-action">
          <p className="subtitle">Already have an account? </p>
          <Link to="/login">Log in</Link>
        </div>
      </div>

      <div className="illustration">
        <img src={illustration} alt="Illustration" />
      </div>
    </div>
  );
};

export default SignUp;
