import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ element: Component }) => {
  const token = localStorage.getItem("userProfile"); // or sessionStorage

  // If not logged in, redirect to landing/login
  if (!token) {
    return <Navigate to="/" replace />;
  }

  return Component;
};

export default ProtectedRoute;
