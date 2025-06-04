import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import React from "react";
import { AuthProvider } from "./hooks/useAuth";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import CategoryPage from "./pages/CategoryPage";
import AdDetailPage from "./pages/AdDetailPage";
import AccountPage from "./pages/AccountPage";
import PostAdPage from "./pages/PostAdPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLoginPage from "./pages/AdminLoginPage";
import MyAdsPage from "./pages/MyAdsPage";
import FavoritesPage from "./pages/FavoritesPage";
import ErrorBoundary from "@/components/ErrorBoundary";

// Create a QueryClient outside of the component to ensure it doesn't get recreated on every render
const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/category/:categoryId" element={<CategoryPage />} />
              <Route path="/ad/:adId" element={<AdDetailPage />} />
              <Route path="/account" element={<AccountPage />} />
              <Route path="/post-ad" element={<PostAdPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/admin" element={
                <ErrorBoundary>
                  <AdminDashboard />
                </ErrorBoundary>
              } />
              <Route path="/admin-login" element={<AdminLoginPage />} />
              <Route path="/my-ads" element={<MyAdsPage />} />
              <Route path="/favorites" element={<FavoritesPage />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
