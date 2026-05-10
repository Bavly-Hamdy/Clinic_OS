import { Suspense, lazy } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/providers/AuthProvider';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { LanguageProvider } from '@/providers/LanguageProvider';
import { QUERY_STALE_TIME, QUERY_RETRY_COUNT } from '@/lib/constants';
import { TitleBar } from '@/components/TitleBar';

// ── Layouts (eagerly loaded — small, always needed) ───────────────────────────
import DashboardLayout from '@/layouts/DashboardLayout';
import AdminLayout from '@/layouts/AdminLayout';

// ── Page-level code splitting via React.lazy ──────────────────────────────────
// Each route chunk is only downloaded when the user navigates to that route.
const LoginPage                 = lazy(() => import('@/pages/LoginPage'));
const LandingPage               = lazy(() => import('@/pages/LandingPage'));
const TrackQueuePage            = lazy(() => import('@/pages/TrackQueuePage'));
const RegistrationPage          = lazy(() => import('@/pages/RegistrationPage'));
const SubscriptionExpiredPage   = lazy(() => import('@/pages/SubscriptionExpiredPage'));
const SetupAdminPage            = lazy(() => import('@/pages/SetupAdminPage'));

const DashboardHome             = lazy(() => import('@/pages/DashboardHome'));
const ProfilePage               = lazy(() => import('@/pages/shared/ProfilePage'));
const PatientDetailPage         = lazy(() => import('@/pages/shared/PatientDetailPage'));
const PatientsPage              = lazy(() => import('@/pages/shared/PatientsPage'));

const DoctorWorkspacePage       = lazy(() => import('@/pages/doctor/WorkspacePage'));
const AnalyticsPage             = lazy(() => import('@/pages/doctor/AnalyticsPage'));
const ClinicSettingsPage        = lazy(() => import('@/pages/doctor/SettingsPage'));

const ReceptionistQueuePage     = lazy(() => import('@/pages/receptionist/QueuePage'));
const ShiftClosePage            = lazy(() => import('@/pages/receptionist/ShiftClosePage'));

const AdminDashboardPage        = lazy(() => import('@/pages/admin/AdminDashboardPage'));
const DoctorManagementPage      = lazy(() => import('@/pages/admin/DoctorManagementPage'));
const SubscriptionManagementPage = lazy(() => import('@/pages/admin/SubscriptionManagementPage'));
const PricingManagementPage     = lazy(() => import('@/pages/admin/PricingManagementPage'));
const AdminSettingsPage         = lazy(() => import('@/pages/admin/AdminSettingsPage'));

const NotFound                  = lazy(() => import('@/pages/NotFound'));

// ── Loading fallback ──────────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

// ── React Query client ────────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: QUERY_RETRY_COUNT,
      staleTime: QUERY_STALE_TIME,
      refetchOnWindowFocus: false,
    },
    mutations: {
      onError: (error) => {
        console.error('[QueryClient] Mutation error:', error);
      },
    },
  },
});

// ── App ───────────────────────────────────────────────────────────────────────
const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" storageKey="clinic-os-theme">
      <LanguageProvider>
        <TitleBar />
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AuthProvider>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* ── Public routes ─────────────────────────────────── */}
                  <Route path="/"                     element={<LandingPage />} />
                  <Route path="/login"                element={<LoginPage />} />
                  <Route path="/track"                element={<TrackQueuePage />} />
                  <Route path="/subscribe"            element={<RegistrationPage />} />
                  <Route path="/subscription-expired" element={<SubscriptionExpiredPage />} />
                  <Route path="/setup-admin"          element={<SetupAdminPage />} />

                  {/* ── Admin routes ──────────────────────────────────── */}
                  <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                    <Route element={<AdminLayout />}>
                      <Route path="/admin/dashboard"     element={<AdminDashboardPage />} />
                      <Route path="/admin/doctors"       element={<DoctorManagementPage />} />
                      <Route path="/admin/subscriptions" element={<SubscriptionManagementPage />} />
                      <Route path="/admin/pricing"       element={<PricingManagementPage />} />
                      <Route path="/admin/settings"      element={<AdminSettingsPage />} />
                    </Route>
                  </Route>

                  {/* ── Protected — any authenticated user ────────────── */}
                  <Route element={<ProtectedRoute />}>
                    <Route element={<DashboardLayout />}>
                      <Route path="/dashboard" element={<DashboardHome />} />
                      <Route path="/profile"   element={<ProfilePage />} />

                      {/* Doctor-only: patient detail page (privacy) */}
                      <Route element={<ProtectedRoute allowedRoles={['DOCTOR']} />}>
                        <Route path="/patients/:id" element={<PatientDetailPage />} />
                      </Route>

                      {/* Receptionist routes */}
                      <Route element={<ProtectedRoute allowedRoles={['RECEPTIONIST']} />}>
                        <Route path="/receptionist/queue"        element={<ReceptionistQueuePage />} />
                        <Route path="/receptionist/book"         element={<ReceptionistQueuePage />} />
                        <Route path="/receptionist/shift-close"  element={<ShiftClosePage />} />
                      </Route>

                      {/* Doctor routes */}
                      <Route element={<ProtectedRoute allowedRoles={['DOCTOR']} />}>
                        <Route path="/doctor/workspace" element={<DoctorWorkspacePage />} />
                        <Route path="/doctor/patients"  element={<PatientsPage />} />
                        <Route path="/doctor/analytics" element={<AnalyticsPage />} />
                        <Route path="/doctor/settings"  element={<ClinicSettingsPage />} />
                      </Route>
                    </Route>
                  </Route>

                  {/* ── 404 ───────────────────────────────────────────── */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </AuthProvider>
          </HashRouter>
        </TooltipProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
</HelmetProvider>
);

export default App;
