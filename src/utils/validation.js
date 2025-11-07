/**
 * Frontend Validation Utilities
 * Consistent validation rules matching backend requirements
 */

// Email validation
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email) {
    return 'Email is required';
  }

  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address';
  }

  if (email.length > 255) {
    return 'Email is too long';
  }

  return '';
};

// Password strength validation
export const validatePassword = (password) => {
  if (!password) {
    return 'Password is required';
  }

  if (password.length < 8) {
    return 'Password must be at least 8 characters';
  }

  if (password.length > 128) {
    return 'Password must be less than 128 characters';
  }

  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter';
  }

  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }

  if (!/\d/.test(password)) {
    return 'Password must contain at least one number';
  }

  if (!/[@$!%*?&#^()_\-+={}[\]:;"'<>,.?/\\|`~]/.test(password)) {
    return 'Password must contain at least one special character';
  }

  return '';
};

// Password strength calculator
export const getPasswordStrength = (password) => {
  if (!password) return { strength: 0, label: '', color: '' };

  let strength = 0;

  // Length check
  if (password.length >= 8) strength += 1;
  if (password.length >= 12) strength += 1;

  // Character variety
  if (/[a-z]/.test(password)) strength += 1;
  if (/[A-Z]/.test(password)) strength += 1;
  if (/\d/.test(password)) strength += 1;
  if (/[@$!%*?&#^()_\-+={}[\]:;"'<>,.?/\\|`~]/.test(password)) strength += 1;

  // Determine label and color
  if (strength <= 2) {
    return { strength, label: 'Weak', color: '#e74c3c' };
  } else if (strength <= 4) {
    return { strength, label: 'Medium', color: '#f39c12' };
  } else {
    return { strength, label: 'Strong', color: '#27ae60' };
  }
};

// Name validation
export const validateName = (name, fieldName = 'Name') => {
  const nameRegex = /^[A-Za-zÀ-ÿ\s'\-]{2,50}$/;

  if (!name) {
    return `${fieldName} is required`;
  }

  if (!nameRegex.test(name)) {
    if (name.length < 2) {
      return `${fieldName} must be at least 2 characters`;
    }
    if (name.length > 50) {
      return `${fieldName} must be less than 50 characters`;
    }
    return `${fieldName} can only contain letters, spaces, hyphens, and apostrophes`;
  }

  return '';
};

// Password confirmation validation
export const validatePasswordConfirmation = (password, confirmPassword) => {
  if (!confirmPassword) {
    return 'Please confirm your password';
  }

  if (password !== confirmPassword) {
    return 'Passwords do not match';
  }

  return '';
};

// Role validation
export const validateRole = (role) => {
  const validRoles = ['entrepreneur', 'property_manager', 'resident', 'supplier'];

  if (!role) {
    return 'Please select a role';
  }

  if (!validRoles.includes(role)) {
    return 'Please select a valid role';
  }

  return '';
};

// Generic required field validation
export const validateRequired = (value, fieldName = 'This field') => {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return `${fieldName} is required`;
  }
  return '';
};

// Validate entire registration form
export const validateRegistrationForm = (formData) => {
  const errors = {};

  // Validate email
  const emailError = validateEmail(formData.email);
  if (emailError) errors.email = emailError;

  // Validate password
  const passwordError = validatePassword(formData.password);
  if (passwordError) errors.password = passwordError;

  // Validate password confirmation
  const confirmPasswordError = validatePasswordConfirmation(
    formData.password,
    formData.confirmPassword
  );
  if (confirmPasswordError) errors.confirmPassword = confirmPasswordError;

  // Validate first name
  const firstNameError = validateName(formData.first_name, 'First name');
  if (firstNameError) errors.first_name = firstNameError;

  // Validate last name
  const lastNameError = validateName(formData.last_name, 'Last name');
  if (lastNameError) errors.last_name = lastNameError;

  // Validate role
  const roleError = validateRole(formData.role);
  if (roleError) errors.role = roleError;

  return errors;
};

// Validate login form
export const validateLoginForm = (formData) => {
  const errors = {};

  // Validate email
  const emailError = validateEmail(formData.email);
  if (emailError) errors.email = emailError;

  // Validate password (just check if provided)
  if (!formData.password) {
    errors.password = 'Password is required';
  }

  return errors;
};
