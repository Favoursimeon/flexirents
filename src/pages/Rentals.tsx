import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PropertyCard from "@/components/PropertyCard";
import PropertyFilters from "@/components/PropertyFilters";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePropertyFilters } from "@/hooks/usePropertyFilters";

const Rentals = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [rentals, setRentals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { filters, setFilters, filteredProperties } = usePropertyFilters(rentals, searchQuery);

  // Fetch rentals from database
  useEffect(() => {
    const fetchRentals = async () => {
      try {
        const { data, error } = await supabase
          .from("properties")
          .select("*")
          .eq("listing_type", "rent")
          .eq("status", "available")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setRentals(data || []);
      } catch (error: any) {
        toast({
          title: "Error",
          description: "Failed to load rental properties",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRentals();
  }, [toast]);

  // Load search query from URL on mount
  useEffect(() => {
    const urlSearch = searchParams.get("search");
    if (urlSearch) {
      setSearchQuery(urlSearch);
    }
  }, [searchParams]);

  const handleSelectProperty = (propertyId: string) => {
    navigate(`/property/${propertyId}?type=rent`);
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Properties for Rent</h1>
            <p className="text-muted-foreground text-lg mb-6">
              Find your perfect rental home from our curated selection of properties.
            </p>
            
            <div className="max-w-md relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by property name or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <PropertyFilters
            filters={filters}
            onFiltersChange={setFilters}
            listingType="rent"
          />

          <div className="mb-4">
            <p className="text-muted-foreground">
              Showing {filteredProperties.length} of {rentals.length} properties
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">Loading properties...</p>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredProperties.map((property) => (
                  <PropertyCard
                    key={property.id}
                    id={property.id}
                    image={property.images?.[0] || ""}
                    title={property.title}
                    price={property.price}
                    beds={property.bedrooms}
                    baths={property.bathrooms}
                    sqft={property.sqft}
                    location={property.location}
                    type="rent"
                    features={property.features || { descriptions: [], amenities: [], facilities: [] }}
                    onSelect={() => handleSelectProperty(property.id)}
                  />
                ))}
              </div>

              {filteredProperties.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground text-lg">No properties match your filters. Try adjusting your criteria.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Rentals;
