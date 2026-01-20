import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import FlexiBot from "@/components/FlexiBot";
import Index from "./pages/Index";
import Rentals from "./pages/Rentals";
import Sales from "./pages/Sales";
import FlexiAssist from "./pages/FlexiAssist";
import ListProperty from "./pages/ListProperty";
import Checkout from "./pages/Checkout";
import Wishlist from "./pages/Wishlist";
import Refer from "./pages/Refer";
import Career from "./pages/Career";
import Marketplace from "./pages/Marketplace";
import VendorRegistration from "./pages/VendorRegistration";
import ServiceProviderRegistration from "./pages/ServiceProviderRegistration";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import ServiceProviderProfile from "./pages/ServiceProviderProfile";
import ServiceProviderDashboard from "./pages/ServiceProviderDashboard";
import VendorDashboard from "./pages/VendorDashboard";
import MyBookings from "./pages/MyBookings";
import ClientProfile from "./pages/ClientProfile";
import SecuritySettings from "./pages/SecuritySettings";
import VendorProfile from "./pages/VendorProfile";
import PropertyDetails from "./pages/PropertyDetails";
import Documents from "./pages/Documents";
import Install from "./pages/Install";
import SharedDocument from "./pages/SharedDocument";
import NotFound from "./pages/NotFound";
import { AdminLayout } from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import UsersManagement from "./pages/admin/UsersManagement";
import PropertiesManagement from "./pages/admin/PropertiesManagement";
import ServiceProvidersManagement from "./pages/admin/ServiceProvidersManagement";
import VendorsManagement from "./pages/admin/VendorsManagement";
import BookingsManagement from "./pages/admin/BookingsManagement";
import ReviewsManagement from "./pages/admin/ReviewsManagement";
import AnalyticsPage from "./pages/admin/AnalyticsPage";
import VerificationManagement from "./pages/admin/VerificationManagement";
import CurrencyManagement from "./pages/admin/CurrencyManagement";
import FinancialReportsPage from "./pages/admin/FinancialReportsPage";
import PaymentApprovalManagement from "./pages/admin/PaymentApprovalManagement";
import ViewingSchedulesManagement from "./pages/admin/ViewingSchedulesManagement";
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
          <Route path="/flexi-assist" element={<FlexiAssist />} />
          <Route path="/service-provider/:id" element={<ServiceProviderProfile />} />
                <Route path="/list-property" element={<ListProperty />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/wishlist" element={<Wishlist />} />
                <Route path="/refer" element={<Refer />} />
                <Route path="/career" element={<Career />} />
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/vendor-registration" element={<VendorRegistration />} />
                <Route path="/service-provider-registration" element={<ServiceProviderRegistration />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/service-provider/:id" element={<ServiceProviderProfile />} />
                <Route path="/service-provider-dashboard" element={<ServiceProviderDashboard />} />
                <Route path="/vendor-dashboard" element={<VendorDashboard />} />
                <Route path="/my-bookings" element={<MyBookings />} />
                <Route path="/profile" element={<ClientProfile />} />
                <Route path="/security-settings" element={<SecuritySettings />} />
                <Route path="/vendor/:id" element={<VendorProfile />} />
                <Route path="/property/:id" element={<PropertyDetails />} />
                <Route path="/documents" element={<Documents />} />
                <Route path="/install" element={<Install />} />
                <Route path="/shared/:shareToken" element={<SharedDocument />} />
                
                {/* Admin Routes */}
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="users" element={<UsersManagement />} />
                  <Route path="verification" element={<VerificationManagement />} />
                  <Route path="properties" element={<PropertiesManagement />} />
                  <Route path="service-providers" element={<ServiceProvidersManagement />} />
                  <Route path="vendors" element={<VendorsManagement />} />
                  <Route path="bookings" element={<BookingsManagement />} />
                  <Route path="viewing-schedules" element={<ViewingSchedulesManagement />} />
                  <Route path="payment-approval" element={<PaymentApprovalManagement />} />
                  <Route path="financial-reports" element={<FinancialReportsPage />} />
                  <Route path="reviews" element={<ReviewsManagement />} />
                  <Route path="analytics" element={<AnalyticsPage />} />
                  <Route path="currency-rates" element={<CurrencyManagement />} />
                </Route>
                
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              <FlexiBot />
            </BrowserRouter>
          </TooltipProvider>
        </WishlistProvider>
      </CurrencyProvider>
    </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
