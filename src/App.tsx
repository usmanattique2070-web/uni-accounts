import { Routes, Route, Navigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import AuthLayout from "@/components/AuthLayout";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import AddStudent from "./pages/AddStudent";
import Students from "./pages/Students";
import Programs from "./pages/Programs";
import Staff from "./pages/Staff";
import SettingsPage from "./pages/SettingsPage";
import PublicRegistration from "./pages/PublicRegistration";
import StaffRegistration from "./pages/StaffRegistration";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth({ redirectOnUnauthenticated: true });
  if (isLoading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <AuthLayout>{children}</AuthLayout>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated } = useAuth({ redirectOnUnauthenticated: true });
  if (isLoading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== "admin") return <Navigate to="/" replace />;
  return <AuthLayout>{children}</AuthLayout>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<PublicRegistration />} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/add-student" element={<ProtectedRoute><AddStudent /></ProtectedRoute>} />
      <Route path="/students" element={<ProtectedRoute><Students /></ProtectedRoute>} />
      <Route path="/staff-register" element={<ProtectedRoute><StaffRegistration /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      <Route path="/programs" element={<AdminRoute><Programs /></AdminRoute>} />
      <Route path="/staff" element={<AdminRoute><Staff /></AdminRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
