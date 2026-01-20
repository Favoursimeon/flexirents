import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, Heart, User } from "lucide-react";
import { useState } from "react";
import { useWishlist } from "@/contexts/WishlistContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminRole } from "@/hooks/useAdminRole";
import { useUserRole } from "@/hooks/useUserRole";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NotificationPanel } from "@/components/NotificationPanel";
import { ThemeToggle } from "@/components/ThemeToggle";
import { scrollToTop } from "@/components/ScrollToTop";
import logo from "@/assets/logo-main.png";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { wishlist } = useWishlist();
  const { currency, setCurrency } = useCurrency();
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdminRole();
  const { isServiceProvider, isVendor } = useUserRole();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center" onClick={scrollToTop}>
            <img src={logo} alt="FlexiRents - Rent, Stress-Free!" className="h-14 w-auto object-contain" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/rentals" className="text-foreground hover:text-accent transition-colors" onClick={scrollToTop}>
              Rentals
            </Link>
            <Link to="/sales" className="text-foreground hover:text-accent transition-colors" onClick={scrollToTop}>
              For Sale
            </Link>
            <Link to="/flexi-assist" className="text-foreground hover:text-accent transition-colors" onClick={scrollToTop}>
              Flexi-Assist
            </Link>
            <Link to="/list-property" className="text-foreground hover:text-accent transition-colors" onClick={scrollToTop}>
              List Property
            </Link>
            {isAdmin && (
              <Link to="/admin" className="text-foreground hover:text-accent transition-colors font-semibold" onClick={scrollToTop}>
                Admin
              </Link>
            )}
            {isServiceProvider && (
              <Link to="/service-provider-dashboard" className="text-foreground hover:text-accent transition-colors font-semibold" onClick={scrollToTop}>
                Provider Panel
              </Link>
            )}
            {isVendor && (
              <Link to="/vendor-dashboard" className="text-foreground hover:text-accent transition-colors font-semibold" onClick={scrollToTop}>
                Vendor Panel
              </Link>
            )}
            <Select value={currency} onValueChange={(value: any) => setCurrency(value)}>
              <SelectTrigger className="w-[110px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="GHS">GHS (₵)</SelectItem>
                <SelectItem value="EUR">EUR (€)</SelectItem>
                <SelectItem value="GBP">GBP (£)</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Link to="/wishlist" className="relative text-foreground hover:text-accent transition-colors" onClick={scrollToTop}>
                <Heart className="h-5 w-5" fill={wishlist.length > 0 ? "currentColor" : "none"} />
                {wishlist.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                    {wishlist.length}
                  </span>
                )}
              </Link>
              {user && <NotificationPanel />}
              {user ? (
                <Link to="/profile" state={{ activePanel: "dashboard" }} onClick={scrollToTop}>
                  <Button variant="ghost" size="sm" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Profile
                  </Button>
                </Link>
              ) : (
                <Button variant="hero" asChild>
                  <Link to="/auth" onClick={scrollToTop}>Login</Link>
                </Button>
              )}
              <ThemeToggle />
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-foreground"
            onClick={() => setIsOpen(!isOpen)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-4">
              <Link
                to="/rentals"
                className="text-foreground hover:text-accent transition-colors"
                onClick={() => { setIsOpen(false); scrollToTop(); }}
              >
                Rentals
              </Link>
              <Link
                to="/sales"
                className="text-foreground hover:text-accent transition-colors"
                onClick={() => { setIsOpen(false); scrollToTop(); }}
              >
                For Sale
              </Link>
              <Link
                to="/flexi-assist"
                className="text-foreground hover:text-accent transition-colors"
                onClick={() => { setIsOpen(false); scrollToTop(); }}
              >
                Flexi-Assist
              </Link>
              <Link
                to="/list-property"
                className="text-foreground hover:text-accent transition-colors"
                onClick={() => { setIsOpen(false); scrollToTop(); }}
              >
                List Property
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  className="text-foreground hover:text-accent transition-colors font-semibold"
                  onClick={() => { setIsOpen(false); scrollToTop(); }}
                >
                  Admin
                </Link>
              )}
              {isServiceProvider && (
                <Link
                  to="/service-provider-dashboard"
                  className="text-foreground hover:text-accent transition-colors font-semibold"
                  onClick={() => { setIsOpen(false); scrollToTop(); }}
                >
                  Provider Panel
                </Link>
              )}
              {isVendor && (
                <Link
                  to="/vendor-dashboard"
                  className="text-foreground hover:text-accent transition-colors font-semibold"
                  onClick={() => { setIsOpen(false); scrollToTop(); }}
                >
                  Vendor Panel
                </Link>
              )}
              <div className="py-2">
                <Select value={currency} onValueChange={(value: any) => setCurrency(value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="GHS">GHS (₵)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="py-2 flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Theme:</span>
                <ThemeToggle />
              </div>
              <Link
                to="/wishlist"
                className="text-foreground hover:text-accent transition-colors flex items-center gap-2"
                onClick={() => { setIsOpen(false); scrollToTop(); }}
              >
                <Heart className="h-5 w-5" fill={wishlist.length > 0 ? "currentColor" : "none"} />
                Wishlist {wishlist.length > 0 && `(${wishlist.length})`}
              </Link>
              {user && (
                <div className="py-2">
                  <NotificationPanel />
                </div>
              )}
              {user ? (
                <Link to="/profile" state={{ activePanel: "dashboard" }} onClick={() => { setIsOpen(false); scrollToTop(); }}>
                  <Button variant="ghost" className="w-full justify-start">
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </Button>
                </Link>
              ) : (
                <Button variant="hero" asChild>
                  <Link to="/auth" onClick={() => { setIsOpen(false); scrollToTop(); }}>Login</Link>
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
