import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/auth-context'
import './App.css'

// Shared Components
import Header from './components/Header'
import Footer from './components/Footer'

// Public Pages
import HomePage from './pages/HomePage'
import HowItWorksPage from './pages/HowItWorksPage'
import BookPage from './pages/BookPage'
import CheckoutPage from './pages/CheckoutPage'
import BookingConfirmationPage from './pages/BookingConfirmationPage'
import BookingPendingPage from './pages/BookingPendingPage'
import ForProsPage from './pages/ForProsPage'
import PricingPage from './pages/PricingPage'
import ServiceAreasPage from './pages/ServiceAreasPage'
import SafetyPage from './pages/SafetyPage'
import FAQPage from './pages/FAQPage'
import ContactPage from './pages/ContactPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import CustomerLoginPage from './pages/CustomerLoginPage'
import ProviderLoginPage from './pages/ProviderLoginPage'
import CustomerSignupPage from './pages/CustomerSignupPage'
import ProviderSignupPage from './pages/ProviderSignupPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import TermsPage from './pages/TermsPage'
import PrivacyPage from './pages/PrivacyPage'
import CancellationPage from './pages/CancellationPage'
import RefundPage from './pages/RefundPage'
import WeatherPage from './pages/WeatherPage'
import DisputePage from './pages/DisputePage'

// Customer Dashboard
import DashboardLayout from './layouts/DashboardLayout'
import CustomerDashboard from './pages/dashboard/Dashboard'
import MyServices from './pages/dashboard/MyServices'
import TrackService from './pages/dashboard/TrackService'
import AddCardPage from './pages/AddCardPage'
import PaymentMethods from './pages/dashboard/PaymentMethods'
import AccountSettings from './pages/dashboard/AccountSettings'

// Pro Dashboard
import ProLayout from './layouts/ProLayout'
import ProJobs from './pages/pro/ProJobs'
import ProSchedule from './pages/pro/ProSchedule'
import ProEarnings from './pages/pro/ProEarnings'
import ProArea from './pages/pro/ProArea'
import ProProfile from './pages/pro/ProProfile'

// Admin Dashboard
import AdminLayout from './layouts/AdminLayout'
import AdminUsers from './pages/admin/AdminUsers'
import AdminPros from './pages/admin/AdminPros'
import AdminBookings from './pages/admin/AdminBookings'
import AdminPayments from './pages/admin/AdminPayments'
import AdminDisputes from './pages/admin/AdminDisputes'
import AdminAnalytics from './pages/admin/AdminAnalytics'

// Protected Route Component
function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on role
    if (user.role === 'provider') return <Navigate to="/pro" replace />
    if (user.role === 'admin') return <Navigate to="/admin/users" replace />
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

// Route that redirects authenticated users
function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (user) {
    // Redirect to appropriate dashboard based on role
    if (user.role === 'provider') return <Navigate to="/pro" replace />
    if (user.role === 'admin') return <Navigate to="/admin/users" replace />
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Routes>
          {/* Public Pages */}
          <Route path="/" element={<><Header /><HomePage /><Footer /></>} />
          <Route path="/how-it-works" element={<><Header /><HowItWorksPage /><Footer /></>} />
          <Route path="/book" element={<><Header /><BookPage /><Footer /></>} />
          <Route path="/checkout" element={<><Header /><CheckoutPage /><Footer /></>} />
          <Route path="/booking-pending/:bookingId" element={<><Header /><BookingPendingPage /><Footer /></>} />
          <Route path="/booking-confirmation" element={<><Header /><BookingConfirmationPage /><Footer /></>} />
          <Route path="/for-pros" element={<><Header /><ForProsPage /><Footer /></>} />
          <Route path="/pricing" element={<><Header /><PricingPage /><Footer /></>} />
          <Route path="/service-areas" element={<><Header /><ServiceAreasPage /><Footer /></>} />
          <Route path="/safety" element={<><Header /><SafetyPage /><Footer /></>} />
          <Route path="/faq" element={<><Header /><FAQPage /><Footer /></>} />
          <Route path="/contact" element={<><Header /><ContactPage /><Footer /></>} />
          <Route path="/login" element={<><Header /><PublicOnlyRoute><LoginPage /></PublicOnlyRoute><Footer /></>} />
          <Route path="/login/customer" element={<><Header /><PublicOnlyRoute><CustomerLoginPage /></PublicOnlyRoute><Footer /></>} />
          <Route path="/login/pro" element={<><Header /><PublicOnlyRoute><ProviderLoginPage /></PublicOnlyRoute><Footer /></>} />
          <Route path="/signup" element={<><Header /><PublicOnlyRoute><SignupPage /></PublicOnlyRoute><Footer /></>} />
          <Route path="/signup/customer" element={<><Header /><PublicOnlyRoute><CustomerSignupPage /></PublicOnlyRoute><Footer /></>} />
          <Route path="/signup/pro" element={<><Header /><PublicOnlyRoute><ProviderSignupPage /></PublicOnlyRoute><Footer /></>} />
          <Route path="/forgot-password" element={<><Header /><ForgotPasswordPage /><Footer /></>} />
          <Route path="/reset-password" element={<><Header /><ResetPasswordPage /><Footer /></>} />

          {/* Policy Pages */}
          <Route path="/terms" element={<><Header /><TermsPage /><Footer /></>} />
          <Route path="/privacy" element={<><Header /><PrivacyPage /><Footer /></>} />
          <Route path="/cancellation" element={<><Header /><CancellationPage /><Footer /></>} />
          <Route path="/refund" element={<><Header /><RefundPage /><Footer /></>} />
          <Route path="/weather" element={<><Header /><WeatherPage /><Footer /></>} />
          <Route path="/dispute" element={<><Header /><DisputePage /><Footer /></>} />

          {/* Customer Dashboard */}
          <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['customer']}><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<CustomerDashboard />} />
            <Route path="services" element={<MyServices />} />
            <Route path="track" element={<TrackService />} />
            <Route path="payment" element={<PaymentMethods />} />
            <Route path="payment/add" element={<AddCardPage />} />
            <Route path="settings" element={<AccountSettings />} />
          </Route>

          {/* Pro Dashboard */}
          <Route path="/pro" element={<ProtectedRoute allowedRoles={['provider']}><ProLayout /></ProtectedRoute>}>
            <Route index element={<ProJobs />} />
            <Route path="available" element={<ProJobs />} />
            <Route path="schedule" element={<ProSchedule />} />
            <Route path="earnings" element={<ProEarnings />} />
            <Route path="area" element={<ProArea />} />
            <Route path="profile" element={<ProProfile />} />
          </Route>

          {/* Admin Dashboard */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout /></ProtectedRoute>}>
            <Route path="users" element={<AdminUsers />} />
            <Route path="pros" element={<AdminPros />} />
            <Route path="bookings" element={<AdminBookings />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="disputes" element={<AdminDisputes />} />
            <Route path="analytics" element={<AdminAnalytics />} />
          </Route>
        </Routes>
      </div>
    </Router>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App
