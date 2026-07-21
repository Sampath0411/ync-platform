import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AnimatePresence } from 'framer-motion';
import { useSocket, usePushNotifications } from '@/hooks/usePWA';

// Landing & Auth
import LandingPage from './pages/landing/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPassword from './pages/auth/ForgotPassword';

// Event (public)
import EventDetailPage from './pages/events/EventDetailPage';
import AllEventsPage from './pages/events/AllEventsPage';
import CategoryPage from './pages/events/CategoryPage';
import CalendarPage from './pages/events/CalendarPage';

// Layouts
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import DashboardLayout from './components/dashboard/DashboardLayout';
import AdminLayout from './components/admin/AdminLayout';

// User Dashboard
import DashboardHome from './pages/user/Dashboard';
import UserEvents from './pages/user/Events';
import UserMyEvents from './pages/user/MyEvents';
import MyBookings from './pages/user/MyBookings';
import TicketView from './pages/user/Ticket';
import UserMembership from './pages/user/MembershipPage';
import UserNotifications from './pages/user/NotificationsPage';
import UserAnnouncements from './pages/user/AnnouncementsPage';
import UserProfile from './pages/user/ProfilePage';
import UserSettings from './pages/user/Settings';
import MyTickets from './pages/user/MyTickets';
import FavoritesPage from './pages/user/FavoritesPage';
import WaitlistPage from './pages/user/WaitlistPage';
import UserReviews from './pages/user/UserReviews';

// Admin Pages
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import UsersManagement from './pages/admin/UsersManagement';
import MembershipRequests from './pages/admin/MembershipRequests';
import EventsManagement from './pages/admin/EventsManagement';
import BookingsManagement from './pages/admin/BookingsManagement';
import TicketScanner from './pages/admin/TicketScanner';
import AdminGallery from './pages/admin/AdminGallery';
import AdminAnnouncements from './pages/admin/AdminAnnouncements';
import AdminNotifications from './pages/admin/AdminNotifications';
import ContactMessages from './pages/admin/ContactMessages';
import AdminSettings from './pages/admin/AdminSettings';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import FeedbackForms from './pages/admin/FeedbackForms';

function ProtectedRoute({ children, requireAdmin = false }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
          <p className="text-gray-400 font-display text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={requireAdmin ? '/admin/login' : '/login'} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function App() {
  const { isAuthenticated } = useAuth();

  // PWA + Socket.io
  useSocket();
  usePushNotifications();

  return (
    <div className="min-h-screen flex flex-col">
      <AnimatePresence mode="wait">
        <Routes>
          {/* ========== LANDING ========== */}
          <Route
            path="/"
            element={
              <>
                <Navbar />
                <main className="flex-1"><LandingPage /></main>
                <Footer />
              </>
            }
          />

          {/* ========== AUTH ========== */}
          <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
          <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* ========== PUBLIC EVENTS ========== */}
          <Route path="/events/:id" element={
            <>
              <Navbar />
              <main className="flex-1"><EventDetailPage /></main>
              <Footer />
            </>
          } />
          <Route path="/events" element={<AllEventsPage />} />
          <Route path="/events/category/:category" element={<CategoryPage />} />
          <Route path="/events/calendar" element={<CalendarPage />} />

          {/* ========== USER DASHBOARD ========== */}
          <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout><DashboardHome /></DashboardLayout></ProtectedRoute>} />
          <Route path="/dashboard/events" element={<ProtectedRoute><DashboardLayout><UserEvents /></DashboardLayout></ProtectedRoute>} />
          <Route path="/dashboard/my-events" element={<ProtectedRoute><DashboardLayout><UserMyEvents /></DashboardLayout></ProtectedRoute>} />
          <Route path="/dashboard/bookings" element={<ProtectedRoute><DashboardLayout><MyBookings /></DashboardLayout></ProtectedRoute>} />
          <Route path="/dashboard/bookings/:id/ticket" element={<ProtectedRoute><DashboardLayout><TicketView /></DashboardLayout></ProtectedRoute>} />
          <Route path="/dashboard/tickets" element={<ProtectedRoute><DashboardLayout><MyTickets /></DashboardLayout></ProtectedRoute>} />
          <Route path="/dashboard/membership" element={<ProtectedRoute><DashboardLayout><UserMembership /></DashboardLayout></ProtectedRoute>} />
          <Route path="/dashboard/notifications" element={<ProtectedRoute><DashboardLayout><UserNotifications /></DashboardLayout></ProtectedRoute>} />
          <Route path="/dashboard/announcements" element={<ProtectedRoute><DashboardLayout><UserAnnouncements /></DashboardLayout></ProtectedRoute>} />
          <Route path="/dashboard/profile" element={<ProtectedRoute><DashboardLayout><UserProfile /></DashboardLayout></ProtectedRoute>} />
          <Route path="/dashboard/settings" element={<ProtectedRoute><DashboardLayout><UserSettings /></DashboardLayout></ProtectedRoute>} />
          <Route path="/dashboard/favorites" element={<ProtectedRoute><DashboardLayout><FavoritesPage /></DashboardLayout></ProtectedRoute>} />
          <Route path="/dashboard/waitlist" element={<ProtectedRoute><DashboardLayout><WaitlistPage /></DashboardLayout></ProtectedRoute>} />
          <Route path="/dashboard/reviews" element={<ProtectedRoute><DashboardLayout><UserReviews /></DashboardLayout></ProtectedRoute>} />

          {/* ========== ADMIN ========== */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminLayout><AdminDashboard /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute requireAdmin><AdminLayout><UsersManagement /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/members" element={<ProtectedRoute requireAdmin><AdminLayout><MembershipRequests /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/events" element={<ProtectedRoute requireAdmin><AdminLayout><EventsManagement /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/bookings" element={<ProtectedRoute requireAdmin><AdminLayout><BookingsManagement /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/scanner" element={<ProtectedRoute requireAdmin><AdminLayout><TicketScanner /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/gallery" element={<ProtectedRoute requireAdmin><AdminLayout><AdminGallery /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/announcements" element={<ProtectedRoute requireAdmin><AdminLayout><AdminAnnouncements /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/notifications" element={<ProtectedRoute requireAdmin><AdminLayout><AdminNotifications /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/contacts" element={<ProtectedRoute requireAdmin><AdminLayout><ContactMessages /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute requireAdmin><AdminLayout><AdminSettings /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/analytics" element={<ProtectedRoute requireAdmin><AdminLayout><AdminAnalytics /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/feedback" element={<ProtectedRoute requireAdmin><AdminLayout><FeedbackForms /></AdminLayout></ProtectedRoute>} />

          {/* ========== SECTION PLACEHOLDERS ========== */}
          <Route path="/about" element={<Navigate to="/#about" replace />} />
          <Route path="/membership" element={<Navigate to="/#membership" replace />} />
          <Route path="/gallery" element={<Navigate to="/#gallery" replace />} />
          <Route path="/contact" element={<Navigate to="/#contact" replace />} />

          {/* ========== 404 ========== */}
          <Route path="*" element={
            <div className="min-h-screen flex items-center justify-center bg-black">
              <div className="text-center">
                <h1 className="text-8xl font-display font-bold gradient-text mb-4">404</h1>
                <p className="text-gray-400 text-lg mb-8">Page not found</p>
                <a href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-orange-500/25">Go Home</a>
              </div>
            </div>
          } />
        </Routes>
      </AnimatePresence>
    </div>
  );
}

export default App;
