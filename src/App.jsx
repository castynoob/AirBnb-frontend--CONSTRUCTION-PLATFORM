import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Pages
import LandingPage from "./pages/landingpage/LandingPage";
import HomePage from "./pages/homepage/HomePage";
import Messages from "./pages/messages/Messages";
import Submissions from "./pages/submissions/Submissions";
import FavoriteEntrepreneurs from "./pages/favorites/FavoriteEntrepreneurs";
import AddWorkForm from "./pages/works/AddWorkForm";
import ProfilePageManager from "./pages/profile/ProfilePageManager";
import HomePageEntrepreneur from "./pages/homepage/HomePageEntrepreneur";
import MessagesEntrepreneur from "./pages/messages/MessagesEntrepreneur";
import SubscriptionPage from "./pages/subscription/SubscriptionPage";
import SubmittedBids from "./pages/submissions/SubmittedBids";
import AddPropertyPage from "./pages/profile/AddPropertyPage";
import ProfilePageEntrepreneur from "./pages/profile/ProfilePageEntrepreneur";
import EntrepreneurJobs from "./pages/works/EntrepreneurJobs";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";

// Components
import ProtectedRoute from "./components/ProtectedRoute";
import { SocketProvider } from "./contexts/SocketContext"

function App() {
  return (
    <Router>
      <div className="main-app">
        <Routes>
          {/* ===== PUBLIC ROUTES ===== */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* ===== SOCKET-PROTECTED ROUTES ===== */}
          <Route
            path="/*"
            element={
              <SocketProvider>
                <ProtectedRoutes />
              </SocketProvider>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

function ProtectedRoutes() {
  return (
    <Routes>
      {/* Property Manager protected routes */}
      <Route
        path="/homepage/property_manager"
        element={<ProtectedRoute element={<HomePage />} />}
      />
      <Route
        path="/messages/property_manager"
        element={<ProtectedRoute element={<Messages />} />}
      />
      <Route
        path="/submissions/property_manager"
        element={<ProtectedRoute element={<Submissions />} />}
      />
      <Route
        path="/favorites/property_manager"
        element={<ProtectedRoute element={<FavoriteEntrepreneurs />} />}
      />
      <Route
        path="/add-work/property_manager"
        element={<ProtectedRoute element={<AddWorkForm />} />}
      />
      <Route
        path="/profile/property_manager"
        element={<ProtectedRoute element={<ProfilePageManager />} />}
      />

      {/* Entrepreneur protected routes */}
      <Route
        path="/homepage/entrepreneur"
        element={<ProtectedRoute element={<HomePageEntrepreneur />} />}
      />
      <Route
        path="/messages/entrepreneur"
        element={<ProtectedRoute element={<MessagesEntrepreneur />} />}
      />
      <Route
        path="/subscription/entrepreneur"
        element={<ProtectedRoute element={<SubscriptionPage />} />}
      />
      <Route
        path="/submissions/entrepreneur"
        element={<ProtectedRoute element={<SubmittedBids />} />}
      />
      <Route
        path="/profile/add-property"
        element={<ProtectedRoute element={<AddPropertyPage />} />}
      />
      <Route
        path="/profile/entrepreneur"
        element={<ProtectedRoute element={<ProfilePageEntrepreneur />} />}
      />
      <Route
        path="/jobs/entrepreneur"
        element={<ProtectedRoute element={<EntrepreneurJobs />} />}
      />
    </Routes>
  );
}

export default App;
