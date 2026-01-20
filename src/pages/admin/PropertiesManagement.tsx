import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Eye, Ban, CheckCircle, Pencil } from "lucide-react";
import { PropertyEditDialog } from "@/components/admin/PropertyEditDialog";

interface Property {
  id: string;
  title: string;
  listing_type: string;
  property_type: string;
  price: number;
  location: string;
  status: string;
  created_at: string;
  owner_id: string;
  profiles?: {
    full_name: string;
  };
}

export default function PropertiesManagement() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchProperties = async () => {
    try {
      const { data: propertiesData, error } = await supabase
        .from("properties")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch owner profiles
      const enrichedProperties = await Promise.all(
        (propertiesData || []).map(async (property) => {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", property.owner_id)
            .maybeSingle();

          return {
            ...property,
            profiles: profileData || undefined,
          };
        })
      );

      setProperties(enrichedProperties);
    } catch (error) {
      console.error("Error fetching properties:", error);
      toast({
        title: "Error",
        description: "Failed to load properties",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const updatePropertyStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from("properties")
        .update({ status })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Property ${status}`,
      });

      fetchProperties();
    } catch (error) {
      console.error("Error updating property:", error);
      toast({
        title: "Error",
        description: "Failed to update property status",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Properties Management</h2>
        <p className="text-muted-foreground mt-2">Manage all property listings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Properties ({properties.length})</CardTitle>
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
                  <TableHead>Property</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Listed</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {properties.map((property) => (
                  <TableRow key={property.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{property.title}</div>
                        <div className="text-sm text-muted-foreground">{property.location}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {property.profiles?.full_name || "Unknown"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{property.listing_type}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">${property.price.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          property.status === "available" ? "default" :
                          property.status === "pending" ? "secondary" : "destructive"
                        }
                      >
                        {property.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(property.created_at), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(`/property/${property.id}`, "_blank")}
                          title="View Property"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingPropertyId(property.id);
                            setEditDialogOpen(true);
                          }}
                          title="Edit Property"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {property.status !== "available" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => updatePropertyStatus(property.id, "available")}
                            title="Approve Property"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        {property.status === "available" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => updatePropertyStatus(property.id, property.listing_type === "rent" ? "rented" : "sold")}
                            title="Mark Unavailable"
                          >
                            <Ban className="h-4 w-4" />
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

      <PropertyEditDialog
        propertyId={editingPropertyId}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={fetchProperties}
      />
    </div>
  );
}
