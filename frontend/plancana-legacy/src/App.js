// src/App.js
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Auth Components
import LoginForm from "./components/auth/LoginForm";
import RegisterForm from "./components/auth/RegisterForm";
import ProtectedRoute from "./components/common/ProtectedRoute";

// Dashboard Components
import FarmerDashboard from "./components/dashboard/FarmerDashboard";
import ProcessorDashboard from "./components/dashboard/ProcessorDashboard";
import AdminDashboard from "./components/dashboard/ProcessorDashboard";
import PublicVerification from "./components/verification/PublicVerification";
import QRVerificationPage from "./components/verification/QRVerificationPage"; // Add this import
import BatchRegistration from "./components/batch/BatchRegistration";
import ProfileManagement from "./components/profile/ProfileManagement";
import ForgotPasswordForm from './components/auth/ForgotPasswordForm';
import ResetPasswordForm from './components/auth/ResetPasswordForm';

// Layout Components
import Layout from "./components/layout/Layout";

function AppRoutes() {
  const { isAuthenticated, user } = useAuth();

  return (
    
    <Routes>
      {/* Public Routes - No authentication required */}
      <Route
        path="/login"
        element={
          !isAuthenticated ? (
            <LoginForm />
          ) : (
            <Navigate to={`/${user?.role?.toLowerCase()}/dashboard`} />
          )
        }
      />
      <Route
        path="/register"
        element={
          !isAuthenticated ? (
            <RegisterForm />
          ) : (
            <Navigate to={`/${user?.role?.toLowerCase()}/dashboard`} />
          )
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfileManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/farmer/profile"
        element={
          <Layout>
            <ProfileManagement />
          </Layout>
        }
      />

      <Route
        path="/processor/profile"
        element={
          <Layout>
            <ProfileManagement />
          </Layout>
        }
      />

      <Route
        path="/admin/profile"
        element={
          <Layout>
            <ProfileManagement />
          </Layout>
        }
      />

      {/* QR Verification Routes - Public access for external users */}
      <Route path="/forgot-password" element={<ForgotPasswordForm />} />
      <Route path="/reset-password" element={<ResetPasswordForm />} />
      <Route path="/verify/:batchId" element={<QRVerificationPage />} />
      <Route path="/scan/:batchId" element={<QRVerificationPage />} />
      <Route path="/product/:batchId" element={<QRVerificationPage />} />
      <Route path="/public/verify" element={<PublicVerification />} />

      {/* Batch Registration - Should be protected */}
      <Route
        path="/farmer/batch-registration"
        element={
          <ProtectedRoute roles={["FARMER"]}>
            <Layout>
              <BatchRegistration />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/farmer/create-batch"
        element={
          <ProtectedRoute roles={["FARMER"]}>
            <Layout>
              <BatchRegistration />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Protected Routes */}
      <Route
        path="/farmer/*"
        element={
          <ProtectedRoute roles={["FARMER"]}>
            <Layout>
              <Routes>
                <Route path="dashboard" element={<FarmerDashboard />} />
                <Route path="*" element={<Navigate to="dashboard" />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/processor/*"
        element={
          <ProtectedRoute roles={["PROCESSOR"]}>
            <Layout>
              <Routes>
                <Route path="dashboard" element={<ProcessorDashboard />} />
                <Route path="*" element={<Navigate to="dashboard" />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/*"
        element={
          <ProtectedRoute roles={["ADMIN"]}>
            <Layout>
              <Routes>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="*" element={<Navigate to="dashboard" />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Default Routes */}
      <Route
        path="/"
        element={
          isAuthenticated && user ? (
            <Navigate to={`/${user.role.toLowerCase()}/dashboard`} />
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "#363636",
                color: "#fff",
              },
              success: {
                duration: 3000,
                theme: {
                  primary: "green",
                  secondary: "black",
                },
              },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

function CSSTest() {
  return (
    <div className="p-8 bg-green-100">
      <h1 className="text-3xl font-bold text-green-800 mb-4">
        Tailwind CSS Test
      </h1>
      <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md">
        Test Button
      </button>
      <div className="mt-4 p-4 bg-white rounded-lg shadow-md">
        <p className="text-gray-700">
          If you can see styling here, Tailwind is working!
        </p>
      </div>
    </div>
  );
}

export default App;
