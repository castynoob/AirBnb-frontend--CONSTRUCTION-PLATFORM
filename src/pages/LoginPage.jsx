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

  const [showPassword, setShowPassword] = useState(false); // toggle visibility

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    alert("This is just a UI demo — no backend connected yet.");
  };

  return (
    <div className="signup-container">
      <div className="signup-box">
        <a href="/" className="brand">
          Construction Pro
        </a>


        <div className="main-form">
          <h2 className="title">Log in</h2>
          <p className="subtext">Welcome to back! Please enter your credentials.</p>


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

            <button type="submit">Log in</button>
          </form>
        </div>

        <div className="other-action">
          <p className="subtitle">Don't have account yet? </p>
          <Link to="/signup">Log in</Link>
        </div>
      </div>

      <div className="illustration">
        <img src={illustration} alt="Illustration" />
      </div>
    </div>
  );
};

export default SignUp;
