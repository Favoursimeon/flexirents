import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Package, Filter, MapPin, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import RatingStars from "@/components/RatingStars";

const categories = [
  "All Categories",
  "Electronics & Appliances",
  "Construction Materials",
  "Furniture & Home Decor",
  "Tools & Equipment",
  "Lighting & Electrical",
  "Paints & Finishes",
  "Plumbing & Sanitary",
  "Packaging & Supplies"
];

const Marketplace = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [showFilters, setShowFilters] = useState(false);
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const { data, error } = await supabase
        .from("approved_vendors")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch ratings for each vendor
      const vendorsWithRatings = await Promise.all(
        (data || []).map(async (vendor) => {
          const { data: ratingData } = await supabase.rpc("get_average_rating", {
            p_target_type: "vendor",
            p_target_id: vendor.id,
          });

          const { data: countData } = await supabase.rpc("get_review_count", {
            p_target_type: "vendor",
            p_target_id: vendor.id,
          });

          return {
            ...vendor,
            averageRating: ratingData || 0,
            reviewCount: countData || 0,
          };
        })
      );

      setVendors(vendorsWithRatings);
    } catch (error) {
      console.error("Error fetching vendors:", error);
      toast({
        title: "Error",
        description: "Could not load vendors.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredVendors = vendors.filter((vendor) => {
    const matchesSearch = 
      vendor.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = 
      selectedCategory === "All Categories" || vendor.business_category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleExploreVendor = (vendorId: string) => {
    navigate(`/vendor/${vendorId}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8 pt-24">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Marketplace
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
            Discover verified vendors for all your property and home needs
          </p>
          <Button 
            onClick={() => navigate("/vendor-registration")}
            size="lg"
            className="mb-4"
          >
            Become a Vendor
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search vendors by name, category, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
            <Button
              variant="outline"
              size="lg"
              onClick={() => setShowFilters(!showFilters)}
              className="h-12"
            >
              <Filter className="h-5 w-5 mr-2" />
              Filters
            </Button>
          </div>

          {/* Category Filters */}
          {showFilters && (
            <div className="p-6 border border-border rounded-lg bg-card">
              <h3 className="font-semibold text-foreground mb-4">Categories</h3>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <Badge
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    className="cursor-pointer px-4 py-2 text-sm hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{filteredVendors.length}</span> verified vendors
            {selectedCategory !== "All Categories" && (
              <span> in <span className="font-semibold text-foreground">{selectedCategory}</span></span>
            )}
          </p>
        </div>

        {/* Vendor Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading vendors...</p>
          </div>
        ) : filteredVendors.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {filteredVendors.map((vendor) => (
              <div
                key={vendor.id}
                className="group hover:shadow-[var(--shadow-card-hover)] transition-all duration-300 border border-border/50 hover:border-primary/30 bg-card rounded-lg p-6 cursor-pointer"
                onClick={() => handleExploreVendor(vendor.id)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="relative flex-shrink-0">
                    {vendor.profile_image_url ? (
                      <img
                        src={vendor.profile_image_url}
                        alt={vendor.business_name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-border"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 border-2 border-border flex items-center justify-center group-hover:from-primary/20 group-hover:to-accent/20 transition-all">
                        <Building2 className="h-8 w-8 text-primary/60" />
                      </div>
                    )}
                  </div>
                  <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/20">
                    Verified
                  </Badge>
                </div>
                
                <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors mb-2">
                  {vendor.business_name}
                </h3>
                
                <p className="text-sm text-primary mb-3">{vendor.business_category}</p>
                
                <p className="text-muted-foreground mb-4 leading-relaxed line-clamp-3">
                  {vendor.description}
                </p>
                
                <div className="flex items-center gap-2 mb-3">
                  <RatingStars rating={vendor.averageRating} size={14} />
                  <span className="text-xs text-muted-foreground">
                    ({vendor.reviewCount} reviews)
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <MapPin className="h-4 w-4" />
                  <span>{vendor.location}, {vendor.region}</span>
                </div>
                
                <Button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExploreVendor(vendor.id);
                  }} 
                  className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all"
                  variant="outline"
                >
                  View Profile
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg mb-4">
              {searchQuery || selectedCategory !== "All Categories"
                ? "No vendors found matching your criteria"
                : "No vendors available yet"}
            </p>
            {(searchQuery || selectedCategory !== "All Categories") && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All Categories");
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Marketplace;