import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import api from "@/lib/api";
import { Users, Briefcase, Store } from "lucide-react";

export const RoleSelector = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isServiceProvider, isVendor } = useUserRole();
  const [loading, setLoading] = useState(false);

  const handleAddRole = async (role: 'service_provider' | 'vendor') => {
    if (!user) return;

    setLoading(true);
    try {
      await api.post("/api/user-roles", { user_id: user.id, role });

      toast({
        title: "Role Added",
        description: "Your account has been upgraded. Redirecting...",
      });

      // Redirect based on role
      if (role === 'service_provider') {
        navigate('/service-provider-registration');
      } else if (role === 'vendor') {
        navigate('/vendor-registration');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-8 w-8 text-primary" />
            <Badge variant="secondary">Active</Badge>
          </div>
          <CardTitle>Property Buyer/Renter</CardTitle>
          <CardDescription>
            Access to property listings, bookings, and marketplace services
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground mb-4">
            <li>✓ Browse and save properties</li>
            <li>✓ Browse marketplace products</li>
            <li>✓ Manage bookings and requests</li>
            <li>✓ Leave reviews</li>
          </ul>
          <Button disabled className="w-full">
            Current Role
          </Button>
        </CardContent>
      </Card>


      <Card className={isVendor ? "border-accent" : ""}>
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <Store className="h-8 w-8 text-accent" />
            <Badge variant={isVendor ? "secondary" : "outline"}>
              {isVendor ? "Active" : "Available"}
            </Badge>
          </div>
          <CardTitle>Marketplace Vendor</CardTitle>
          <CardDescription>
            List your business in the marketplace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground mb-4">
            <li>✓ Register your business</li>
            <li>✓ Manage vendor profile</li>
            <li>✓ Reach new customers</li>
            <li>✓ Build credibility</li>
          </ul>
          <Button 
            onClick={() => handleAddRole('vendor')}
            disabled={loading || isVendor}
            className="w-full"
          >
            {isVendor ? "Already Registered" : loading ? "Adding..." : "Become a Vendor"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
