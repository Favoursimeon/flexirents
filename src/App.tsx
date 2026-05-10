import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import Index from "./pages/Index";
import Rentals from "./pages/Rentals";
import Sales from "./pages/Sales";
import ListProperty from "./pages/ListProperty";
import Checkout from "./pages/Checkout";
import Wishlist from "./pages/Wishlist";
import Refer from "./pages/Refer";
import Career from "./pages/Career";
import Marketplace from "./pages/Marketplace";
import VendorRegistration from "./pages/VendorRegistration";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import VendorDashboard from "./pages/VendorDashboard";
import ClientProfile from "./pages/ClientProfile";
import SecuritySettings from "./pages/SecuritySettings";
import VendorProfile from "./pages/VendorProfile";
import PropertyDetails from "./pages/PropertyDetails";
import Documents from "./pages/Documents";
import Install from "./pages/Install";
import SharedDocument from "./pages/SharedDocument";
import Pricing from "./pages/Pricing";
import Projects from "./pages/Projects";
import ClientProjectsPage from "./pages/ClientProjectsPage";
import NotFound from "./pages/NotFound";
import { AdminLayout } from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import UsersManagement from "./pages/admin/UsersManagement";
import PropertiesManagement from "./pages/admin/PropertiesManagement";
import VendorsManagement from "./pages/admin/VendorsManagement";
import BookingsManagement from "./pages/admin/BookingsManagement";
import ReviewsManagement from "./pages/admin/ReviewsManagement";
import AnalyticsPage from "./pages/admin/AnalyticsPage";
import VerificationManagement from "./pages/admin/VerificationManagement";
import CurrencyManagement from "./pages/admin/CurrencyManagement";
import FinancialReportsPage from "./pages/admin/FinancialReportsPage";
import AdminProjectsDashboardPage from "./pages/admin/AdminProjectsDashboard";
import PaymentApprovalManagement from "./pages/admin/PaymentApprovalManagement";
import { ScrollToTop } from "./components/ScrollToTop";
import { ScrollProgressIndicator } from "./components/ScrollProgressIndicator";
import { BackToTop } from "./components/BackToTop";
import { VisitorTracker } from "./components/VisitorTracker";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <CurrencyProvider>
          <WishlistProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
              <ScrollProgressIndicator />
              <ScrollToTop />
              <BackToTop />
              <VisitorTracker />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/rentals" element={<Rentals />} />
                <Route path="/sales" element={<Sales />} />
                <Route path="/list-property" element={<ListProperty />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/wishlist" element={<Wishlist />} />
                <Route path="/refer" element={<Refer />} />
                <Route path="/career" element={<Career />} />
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/vendor-registration" element={<VendorRegistration />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/vendor-dashboard" element={<VendorDashboard />} />
                <Route path="/profile" element={<ClientProfile />} />
                <Route path="/security-settings" element={<SecuritySettings />} />
                <Route path="/vendor/:id" element={<VendorProfile />} />
                <Route path="/property/:id" element={<PropertyDetails />} />
                <Route path="/documents" element={<Documents />} />
                <Route path="/install" element={<Install />} />
                <Route path="/shared/:shareToken" element={<SharedDocument />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/account/projects" element={<ClientProjectsPage />} />
                
                {/* Admin Routes */}
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="users" element={<UsersManagement />} />
                  <Route path="verification" element={<VerificationManagement />} />
                  <Route path="properties" element={<PropertiesManagement />} />
                  <Route path="vendors" element={<VendorsManagement />} />
                  <Route path="bookings" element={<BookingsManagement />} />
                  <Route path="payment-approval" element={<PaymentApprovalManagement />} />
                  <Route path="financial-reports" element={<FinancialReportsPage />} />
                  <Route path="reviews" element={<ReviewsManagement />} />
                  <Route path="analytics" element={<AnalyticsPage />} />
                  <Route path="currency-rates" element={<CurrencyManagement />} />
                  <Route path="projects" element={<AdminProjectsDashboardPage />} />
                </Route>
                
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </WishlistProvider>
      </CurrencyProvider>
    </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
