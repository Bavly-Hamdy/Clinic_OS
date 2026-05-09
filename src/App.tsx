import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/providers/AuthProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import DashboardLayout from "@/layouts/DashboardLayout";
import AdminLayout from "@/layouts/AdminLayout";
import LoginPage from "@/pages/LoginPage";
import DashboardHome from "@/pages/DashboardHome";
import ReceptionistQueuePage from "@/pages/receptionist/QueuePage";
import ShiftClosePage from "@/pages/receptionist/ShiftClosePage";
import PatientsPage from "@/pages/shared/PatientsPage";
import PatientDetailPage from "@/pages/shared/PatientDetailPage";
import ProfilePage from "@/pages/shared/ProfilePage";
import DoctorWorkspacePage from "@/pages/doctor/WorkspacePage";
import AnalyticsPage from "@/pages/doctor/AnalyticsPage";
import ClinicSettingsPage from "@/pages/doctor/SettingsPage";
import LandingPage from "@/pages/LandingPage";
import TrackQueuePage from "@/pages/TrackQueuePage";
import RegistrationPage from "@/pages/RegistrationPage";
import SubscriptionExpiredPage from "@/pages/SubscriptionExpiredPage";
import AdminDashboardPage from "@/pages/admin/AdminDashboardPage";
import DoctorManagementPage from "@/pages/admin/DoctorManagementPage";
import SubscriptionManagementPage from "@/pages/admin/SubscriptionManagementPage";
import PricingManagementPage from "@/pages/admin/PricingManagementPage";
import AdminSettingsPage from "@/pages/admin/AdminSettingsPage";
import SetupAdminPage from "@/pages/SetupAdminPage";
import NotFound from "@/pages/NotFound";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { LanguageProvider } from "@/providers/LanguageProvider";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

const App = () => (
<QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" storageKey="clinic-os-theme">
      <LanguageProvider>
        <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AuthProvider>
            <Routes>
              {/* Public */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/track" element={<TrackQueuePage />} />
              <Route path="/subscribe" element={<RegistrationPage />} />
              <Route path="/subscription-expired" element={<SubscriptionExpiredPage />} />
              <Route path="/setup-admin" element={<SetupAdminPage />} /> {/* REMOVE AFTER SETUP */}

              {/* Admin Routes */}
              <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                <Route element={<AdminLayout />}>
                  <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
                  <Route path="/admin/doctors" element={<DoctorManagementPage />} />
                  <Route path="/admin/subscriptions" element={<SubscriptionManagementPage />} />
                  <Route path="/admin/pricing" element={<PricingManagementPage />} />
                  <Route path="/admin/settings" element={<AdminSettingsPage />} />
                </Route>
              </Route>

              {/* Protected — any authenticated user */}
              <Route element={<ProtectedRoute />}>
                <Route element={<DashboardLayout />}>
                  <Route path="/dashboard" element={<DashboardHome />} />
                  <Route path="/profile" element={<ProfilePage />} />

                  {/* Shared patient routes — Restricted to Doctors (Privacy) */}
                  <Route element={<ProtectedRoute allowedRoles={['DOCTOR']} />}>
                    <Route path="/patients/:id" element={<PatientDetailPage />} />
                  </Route>

                  {/* Receptionist routes */}
                  <Route element={<ProtectedRoute allowedRoles={['RECEPTIONIST']} />}>
                    <Route path="/receptionist/queue" element={<ReceptionistQueuePage />} />
                    <Route path="/receptionist/book" element={<ReceptionistQueuePage />} />
                    <Route path="/receptionist/shift-close" element={<ShiftClosePage />} />
                  </Route>

                  {/* Doctor routes */}
                  <Route element={<ProtectedRoute allowedRoles={['DOCTOR']} />}>
                    <Route path="/doctor/workspace" element={<DoctorWorkspacePage />} />
                    <Route path="/doctor/patients" element={<PatientsPage />} />
                    <Route path="/doctor/analytics" element={<AnalyticsPage />} />
                    <Route path="/doctor/settings" element={<ClinicSettingsPage />} />
                  </Route>
                </Route>
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </ThemeProvider>
</QueryClientProvider>
);

export default App;
