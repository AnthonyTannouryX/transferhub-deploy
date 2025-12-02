import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PublicRoute } from "@/components/PublicRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import 'leaflet/dist/leaflet.css';

// User Pages
import UserDashboard from "./pages/user/Dashboard";
import NewTransfer from "./pages/user/NewTransfer";
import Tracking from "./pages/user/Tracking";
import TransactionHistory from "./pages/user/TransactionHistory";
import Beneficiaries from "./pages/user/Beneficiaries";
import AgentMap from "./pages/user/AgentMap";
import Wallet from "./pages/user/Wallet";
import Subscription from "./pages/user/Subscription";
import Support from "./pages/Support";
import Settings from "./pages/Settings";

// Agent Pages
import AgentDashboard from "./pages/agent/Dashboard";
import CashOperations from "./pages/agent/CashOperations";
import Transactions from "./pages/agent/Transactions";
import DailySummary from "./pages/agent/DailySummary";

// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import ManageUsers from "./pages/admin/ManageUsers";
import ManageAgents from "./pages/admin/ManageAgents";
import ManageTransactions from "./pages/admin/ManageTransactions";
import AdminWallet from "./pages/admin/Wallet";

// ✅ Import the test component
import TestAuth from "./pages/TestAuth";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={
            <PublicRoute>
              <Auth />
            </PublicRoute>
          } />
          <Route path="/verify-email" element={
            <PublicRoute>
              <VerifyEmail />
            </PublicRoute>
          } />
          <Route path="/forgot-password" element={
            <PublicRoute>
              <ForgotPassword />
            </PublicRoute>
          } />
          <Route path="/reset-password" element={
            <PublicRoute>
              <ResetPassword />
            </PublicRoute>
          } />
          
          {/* User Routes - Protected */}
          <Route path="/user/dashboard" element={
            <ProtectedRoute requiredRole="user">
              <UserDashboard />
            </ProtectedRoute>
          } />
          <Route path="/user/wallet" element={
            <ProtectedRoute requiredRole="user">
              <Wallet />
            </ProtectedRoute>
          } />
          <Route path="/user/new-transfer" element={
            <ProtectedRoute requiredRole="user">
              <NewTransfer />
            </ProtectedRoute>
          } />
          <Route path="/user/tracking" element={
            <ProtectedRoute requiredRole="user">
              <Tracking />
            </ProtectedRoute>
          } />
          <Route path="/user/history" element={
            <ProtectedRoute requiredRole="user">
              <TransactionHistory />
            </ProtectedRoute>
          } />
          <Route path="/user/beneficiaries" element={
            <ProtectedRoute requiredRole="user">
              <Beneficiaries />
            </ProtectedRoute>
          } />
          <Route path="/user/agents" element={
            <ProtectedRoute requiredRole="user">
              <AgentMap />
            </ProtectedRoute>
          } />
          <Route path="/user/subscription" element={
            <ProtectedRoute requiredRole="user">
              <Subscription />
            </ProtectedRoute>
          } />
          <Route path="/support" element={
            <ProtectedRoute>
              <Support />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />
          
          {/* Agent Routes - Protected */}
          <Route path="/agent/dashboard" element={
            <ProtectedRoute requiredRole="agent">
              <AgentDashboard />
            </ProtectedRoute>
          } />
          <Route path="/agent/cash" element={
            <ProtectedRoute requiredRole="agent">
              <CashOperations />
            </ProtectedRoute>
          } />
          <Route path="/agent/transactions" element={
            <ProtectedRoute requiredRole="agent">
              <Transactions />
            </ProtectedRoute>
          } />
          <Route path="/agent/daily-summary" element={
            <ProtectedRoute requiredRole="agent">
              <DailySummary />
            </ProtectedRoute>
          } />
          
          {/* Admin Routes - Protected */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute requiredRole="admin">
              <ManageUsers />
            </ProtectedRoute>
          } />
          <Route path="/admin/agents" element={
            <ProtectedRoute requiredRole="admin">
              <ManageAgents />
            </ProtectedRoute>
          } />
          <Route path="/admin/transactions" element={
            <ProtectedRoute requiredRole="admin">
              <ManageTransactions />
            </ProtectedRoute>
          } />
          <Route path="/admin/wallet" element={
            <ProtectedRoute requiredRole="admin">
              <AdminWallet />
            </ProtectedRoute>
          } />

          {/* ✅ Test Route for backend connection */}
          <Route path="/test-auth" element={<TestAuth />} />

          {/* Catch-all 404 route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
