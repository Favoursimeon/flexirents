import { useEffect, useState, useMemo } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Eye, Ban, CheckCircle, Pencil, Trash2, Search, ChevronLeft, ChevronRight, X, Download } from "lucide-react";
import { PropertyEditDialog } from "@/components/admin/PropertyEditDialog";

const exportToCSV = (properties: Property[]) => {
  const headers = ["Title", "Location", "Owner", "Type", "Property Type", "Duration", "Price", "Status", "Listed Date"];
  const rows = properties.map((p) => [
    `"${p.title.replace(/"/g, '""')}"`,
    `"${p.location.replace(/"/g, '""')}"`,
    `"${p.profiles?.full_name || "Unknown"}"`,
    p.listing_type,
    p.property_type,
    p.listing_type === "rent" ? formatLeaseDuration(p.lease_duration_months) : "-",
    p.price,
    p.status,
    format(new Date(p.created_at), "yyyy-MM-dd"),
  ]);
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `properties-export-${format(new Date(), "yyyy-MM-dd")}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

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
  lease_duration_months?: number[];
  profiles?: {
    full_name: string;
  };
}

const formatLeaseDuration = (months: number[] | undefined | null): string => {
  if (!months || months.length === 0) return "-";
  const duration = months[0];
  if (duration === 6) return "6 Months";
  if (duration === 12) return "1 Year";
  if (duration === 24) return "2 Years";
  return `${duration} Months`;
};

const ITEMS_PER_PAGE = 10;

export default function PropertiesManagement() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkUpdating, setBulkUpdating] = useState(false);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  
  const { toast } = useToast();

  const fetchProperties = async () => {
    try {
      const response = await api.get("/api/admin/properties", {
        params: {
          orderBy: "created_at",
          orderDirection: "desc",
        },
      });

      const propertiesData: Property[] = response.data || [];
      const ownerIds = Array.from(new Set(propertiesData.map((property) => property.owner_id)));

      const profilesResponse = await api.get("/api/admin/profiles", {
        params: { ids: ownerIds.join(",") },
      });

      const profiles: { id: string; full_name: string }[] = profilesResponse.data || [];
      const profilesMap = new Map(profiles.map((profile) => [profile.id, profile.full_name]));

      const enrichedProperties = propertiesData.map((property) => ({
        ...property,
        profiles: { full_name: profilesMap.get(property.owner_id) || "Unknown" },
      }));

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

  // Filter and search properties
  const filteredProperties = useMemo(() => {
    return properties.filter((property) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = searchQuery === "" ||
        property.title.toLowerCase().includes(searchLower) ||
        property.location.toLowerCase().includes(searchLower) ||
        (property.profiles?.full_name?.toLowerCase().includes(searchLower) ?? false);

      // Status filter
      const matchesStatus = statusFilter === "all" || property.status === statusFilter;

      // Type filter
      const matchesType = typeFilter === "all" || property.listing_type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [properties, searchQuery, statusFilter, typeFilter]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredProperties.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedProperties = filteredProperties.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, typeFilter]);

  // Clear selection when filters change
  useEffect(() => {
    setSelectedIds(new Set());
  }, [searchQuery, statusFilter, typeFilter, currentPage]);

  const updatePropertyStatus = async (id: string, status: string) => {
    try {
      await api.put(`/api/admin/properties/${id}`, { status });

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

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedProperties.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedProperties.map((p) => p.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const bulkUpdateStatus = async (status: string) => {
    if (selectedIds.size === 0) return;
    
    setBulkUpdating(true);
    try {
      await api.put("/api/admin/properties/bulk-status", {
        ids: Array.from(selectedIds),
        status,
      });

      toast({
        title: "Success",
        description: `${selectedIds.size} properties updated to ${status}`,
      });

      setSelectedIds(new Set());
      fetchProperties();
    } catch (error) {
      console.error("Error bulk updating properties:", error);
      toast({
        title: "Error",
        description: "Failed to update properties",
        variant: "destructive",
      });
    } finally {
      setBulkUpdating(false);
    }
  };

  const bulkDelete = async () => {
    if (selectedIds.size === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} properties? This cannot be undone.`)) {
      return;
    }

    setBulkUpdating(true);
    try {
      await api.delete("/api/admin/properties", {
        data: {
          ids: Array.from(selectedIds),
        },
      });

      toast({
        title: "Success",
        description: `${selectedIds.size} properties deleted`,
      });

      setSelectedIds(new Set());
      fetchProperties();
    } catch (error) {
      console.error("Error deleting properties:", error);
      toast({
        title: "Error",
        description: "Failed to delete properties",
        variant: "destructive",
      });
    } finally {
      setBulkUpdating(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setTypeFilter("all");
  };

  const hasActiveFilters = searchQuery !== "" || statusFilter !== "all" || typeFilter !== "all";

  const isAllSelected = paginatedProperties.length > 0 && selectedIds.size === paginatedProperties.length;
  const isSomeSelected = selectedIds.size > 0 && selectedIds.size < paginatedProperties.length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Properties Management</h2>
        <p className="text-muted-foreground mt-2">Manage all property listings</p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title, location, or owner..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rented">Rented</SelectItem>
                <SelectItem value="sold">Sold</SelectItem>
                <SelectItem value="unavailable">Unavailable</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="rent">For Rent</SelectItem>
                <SelectItem value="sale">For Sale</SelectItem>
              </SelectContent>
            </Select>
            {hasActiveFilters && (
              <Button variant="ghost" size="icon" onClick={clearFilters} title="Clear filters">
                <X className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => exportToCSV(filteredProperties)}
              disabled={filteredProperties.length === 0}
              title="Export filtered properties as CSV"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
          {hasActiveFilters && (
            <p className="text-sm text-muted-foreground mt-3">
              Showing {filteredProperties.length} of {properties.length} properties
            </p>
          )}
        </CardContent>
      </Card>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="py-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <span className="text-sm font-medium">
                {selectedIds.size} {selectedIds.size === 1 ? "property" : "properties"} selected
              </span>
              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => bulkUpdateStatus("available")}
                  disabled={bulkUpdating}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Approve All
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => bulkUpdateStatus("pending")}
                  disabled={bulkUpdating}
                >
                  Set Pending
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => bulkUpdateStatus("unavailable")}
                  disabled={bulkUpdating}
                >
                  <Ban className="h-4 w-4 mr-1" />
                  Mark Unavailable
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={bulkDelete}
                  disabled={bulkUpdating}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedIds(new Set())}
                  disabled={bulkUpdating}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Properties ({filteredProperties.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : paginatedProperties.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {hasActiveFilters ? (
                <>
                  <p>No properties match your filters.</p>
                  <Button variant="link" onClick={clearFilters} className="mt-2">
                    Clear filters
                  </Button>
                </>
              ) : (
                <p>No properties found.</p>
              )}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={isAllSelected}
                        ref={(ref) => {
                          if (ref) {
                            (ref as unknown as HTMLInputElement).indeterminate = isSomeSelected;
                          }
                        }}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Listed</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedProperties.map((property) => (
                    <TableRow 
                      key={property.id}
                      className={selectedIds.has(property.id) ? "bg-muted/50" : ""}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(property.id)}
                          onCheckedChange={() => toggleSelect(property.id)}
                          aria-label={`Select ${property.title}`}
                        />
                      </TableCell>
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
                      <TableCell className="text-muted-foreground">
                        {property.listing_type === "rent" 
                          ? formatLeaseDuration(property.lease_duration_months)
                          : "-"}
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Showing {startIndex + 1}-{Math.min(endIndex, filteredProperties.length)} of {filteredProperties.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((page) => {
                          // Show first, last, current, and adjacent pages
                          return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;
                        })
                        .map((page, index, array) => (
                          <span key={page} className="flex items-center">
                            {index > 0 && array[index - 1] !== page - 1 && (
                              <span className="px-2 text-muted-foreground">...</span>
                            )}
                            <Button
                              variant={currentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(page)}
                              className="min-w-[36px]"
                            >
                              {page}
                            </Button>
                          </span>
                        ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
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
