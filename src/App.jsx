import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,     // Data stays fresh for 5 minutes
      gcTime: 10 * 60 * 1000,       // Cache kept for 10 minutes
      refetchOnWindowFocus: true,    // Refetch when user returns to tab
      retry: 1,                      // Retry failed requests once
    },
  },
});

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
// SUPPLIER TEMPORARILY DISABLED — uncomment to re-enable
// import SupplierList from './pages/supplier/SupplierList'
// import SupplierProfile from './pages/supplier/SupplierProfile'
// import SupplierHomepage from './pages/supplier/SupplierHomepage'
import HomePageResident from "./pages/homepage/HomePageResident";
import MessagesResident from "./pages/messages/MessagesResident";
import MembersResident from "./pages/members/MembersResident";
import ProfilePageResident from "./pages/profile/ProfilePageResident";
// SUPPLIER TEMPORARILY DISABLED — uncomment to re-enable
// import MessagesSupplier from "./pages/messages/MessagesSupplier";
import CustomerService from "./pages/customerservice/CustomerService";
import LegalPage from "./pages/legal/LegalPage";

// Admin imports
import { AdminAuthProvider } from "./admin/context/AdminAuthContext";
import AdminLogin from "./admin/pages/AdminLogin";
import AdminLayout from "./admin/components/AdminLayout";
import Dashboard from "./admin/pages/Dashboard";
import Users from "./admin/pages/Users";
import Jobs from "./admin/pages/Jobs";
import Bids from "./admin/pages/Bids";
import Properties from "./admin/pages/Properties";
import Payments from "./admin/pages/Payments";
import Subscriptions from "./admin/pages/Subscriptions";
import PromoCodes from "./admin/pages/PromoCodes";
import Reports from "./admin/pages/Reports";
import Disputes from "./admin/pages/Disputes";

// Components
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
    <Router>
      <Toaster
        position="top-right"
        containerStyle={{
          zIndex: 99999,
          isolation: 'isolate',
        }}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
            zIndex: 99999,
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
          <Route path="/legal" element={<LegalPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* ===== ADMIN ROUTES ===== */}
          <Route
            path="/admin/*"
            element={
              <AdminAuthProvider>
                <AdminRoutes />
              </AdminAuthProvider>
            }
          />

          {/* ===== PROTECTED ROUTES ===== */}
          <Route
            path="/*"
            element={<ProtectedRoutes />}
          />
        </Routes>
      </div>
    </Router>
    <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

function AdminRoutes() {
  return (
    <Routes>
      {/* Admin Login (public) */}
      <Route path="/login" element={<AdminLogin />} />

      {/* Admin Protected Routes */}
      <Route element={<AdminLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/users" element={<Users />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/bids" element={<Bids />} />
        <Route path="/properties" element={<Properties />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/subscriptions" element={<Subscriptions />} />
        <Route path="/promo-codes" element={<PromoCodes />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/disputes" element={<Disputes />} />
        {/* <Route path="/audit-logs" element={<AuditLogs />} /> */}
      </Route>

      {/* Redirect /admin to /admin/dashboard */}
      <Route path="/" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
      </Route>
    </Routes>
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
      {/* SUPPLIER TEMPORARILY DISABLED — uncomment to re-enable */}
      {/* <Route
        path="/supplier"
        element={<ProtectedRoute element={<SupplierList />} />}
      /> */}

      {/* Supplier protected routes — TEMPORARILY DISABLED */}
      {/* <Route
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
      /> */}
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

      {/* Customer Service - accessible to all user types */}
      <Route
        path="/customer-service"
        element={<ProtectedRoute element={<CustomerService />} />}
      />
    </Routes>
  );
}

export default App;
