import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from 'react-hot-toast';

// Pages
import LandingPage from "./pages/landingpage/LandingPage";
import HomePage from "./pages/homepage/HomePage";
import Messages from "./pages/messages/MessagesNew";
import Submissions from "./pages/submissions/Submissions";
import FavoriteEntrepreneurs from "./pages/favorites/FavoriteEntrepreneurs";
import AddWorkForm from "./pages/works/AddWorkForm";
import ProfilePageManager from "./pages/profile/ProfilePageManager";
import HomePageEntrepreneur from "./pages/homepage/HomePageEntrepreneur";
import MessagesEntrepreneur from "./pages/messages/MessagesEntrepreneurNew";
import SubmittedBids from "./pages/submissions/SubmittedBids";
import AddPropertyPage from "./pages/profile/AddPropertyPage";
import ProfilePageEntrepreneur from "./pages/profile/ProfilePageEntrepreneur";
import EntrepreneurJobs from "./pages/works/EntrepreneurJobs";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import SupplierList from './pages/supplier/SupplierList'
import SupplierProfile from './pages/supplier/SupplierProfile'
import SupplierHomepage from './pages/supplier/SupplierHomepage'
import HomePageResident from "./pages/homepage/HomePageResident";
import MessagesResident from "./pages/messages/MessagesResident";
import MembersResident from "./pages/members/MembersResident";
import ProfilePageResident from "./pages/profile/ProfilePageResident";
import MessagesSupplier from "./pages/messages/MessagesSupplier";

// Components
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#00a5a9',
              secondary: '#fff',
            },
          },
        }}
      />
      <div className="main-app">
        <Routes>
          {/* ===== PUBLIC ROUTES ===== */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* ===== PROTECTED ROUTES ===== */}
          <Route
            path="/*"
            element={<ProtectedRoutes />}
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
      <Route
        path="/supplier"
        element={<ProtectedRoute element={<SupplierList />} />}
      />

      {/* Supplier protected routes */}
      <Route
        path="/homepage/supplier"
        element={<ProtectedRoute element={<SupplierHomepage />} />}
      />
      <Route
        path="/messages/supplier"
        element={<ProtectedRoute element={<MessagesSupplier />} />}
      />
      <Route
        path="/profile/supplier"
        element={<ProtectedRoute element={<SupplierProfile />} />}
      />
            {/* Resident protected routes */}
      <Route
        path="/homepage/resident"
        element={<ProtectedRoute element={<HomePageResident />} />}
      />
      <Route
        path="/messages/resident"
        element={<ProtectedRoute element={<MessagesResident />} />}
      />
      <Route
        path="/members/resident"
        element={<ProtectedRoute element={<MembersResident />} />}
      />
      <Route
        path="/profile/resident"
        element={<ProtectedRoute element={<ProfilePageResident />} />}
      />
    </Routes>
  );
}

export default App;
