import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MyPropertyEditDialog } from "./MyPropertyEditDialog";
import api from "@/lib/api";

interface Property {
  id: string;
  title: string;
  listing_type: string;
  property_type: string;
  price: number;
  location: string;
  status: string;
  created_at: string;
}

export function MyProperties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchProperties = async () => {
    if (!user) return;
    try {
      const { data } = await api.get('/api/properties/mine');
      setProperties(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load properties.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [user]);

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/api/properties/${id}`);
      setProperties((prev) => prev.filter((p) => p.id !== id));
      toast({
        title: "Property deleted",
        description: "Your property has been deleted.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete property.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (id: string) => {
    setEditingPropertyId(id);
    setEditDialogOpen(true);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Properties</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>My Properties</CardTitle>
        </CardHeader>
        <CardContent>
          {properties.length === 0 ? (
            <p className="text-muted-foreground text-sm">You have no properties listed yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {properties.map((property) => (
                  <TableRow key={property.id}>
                    <TableCell>{property.title}</TableCell>
                    <TableCell>{property.listing_type}</TableCell>
                    <TableCell>₵{property.price?.toLocaleString()}</TableCell>
                    <TableCell>{property.location}</TableCell>
                    <TableCell>
                      <Badge variant={property.status === "active" ? "default" : "secondary"}>
                        {property.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{format(new Date(property.created_at), "MMM d, yyyy")}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => navigate(`/property/${property.id}`)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(property.id)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(property.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      {editingPropertyId && (
        <MyPropertyEditDialog
          propertyId={editingPropertyId}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSuccess={fetchProperties}
        />
      )}
    </>
  );
}