import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { CheckCircle, XCircle } from "lucide-react";

interface ServiceProvider {
  id: string;
  provider_name: string;
  service_category: string;
  email: string;
  phone: string;
  status: string;
  years_experience: number;
  created_at: string;
}

export default function ServiceProvidersManagement() {
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProviders = async () => {
    try {
      const { data, error } = await supabase
        .from("service_provider_registrations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProviders(data || []);
    } catch (error) {
      console.error("Error fetching providers:", error);
      toast({
        title: "Error",
        description: "Failed to load service providers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const updateProviderStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from("service_provider_registrations")
        .update({ status })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Provider ${status}`,
      });

      fetchProviders();
    } catch (error) {
      console.error("Error updating provider:", error);
      toast({
        title: "Error",
        description: "Failed to update provider status",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Service Providers Management</h2>
        <p className="text-muted-foreground mt-2">Manage service provider registrations</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Service Providers ({providers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Experience</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {providers.map((provider) => (
                  <TableRow key={provider.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{provider.provider_name}</div>
                        <div className="text-sm text-muted-foreground">{provider.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{provider.service_category}</Badge>
                    </TableCell>
                    <TableCell>{provider.years_experience} years</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          provider.status === "approved" ? "default" :
                          provider.status === "pending" ? "secondary" : "destructive"
                        }
                      >
                        {provider.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(provider.created_at), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {provider.status !== "approved" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => updateProviderStatus(provider.id, "approved")}
                          >
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          </Button>
                        )}
                        {provider.status !== "rejected" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => updateProviderStatus(provider.id, "rejected")}
                          >
                            <XCircle className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
