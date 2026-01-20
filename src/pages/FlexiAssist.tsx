import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Search, UserPlus, MapPin, Star, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import RatingStars from "@/components/RatingStars";
import { useCurrency } from "@/contexts/CurrencyContext";

const FlexiAssist = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { formatPrice } = useCurrency();
  const [searchQuery, setSearchQuery] = useState("");
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const { data, error } = await supabase
        .from("approved_service_providers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch ratings for each provider
      const providersWithRatings = await Promise.all(
        (data || []).map(async (provider) => {
          const { data: ratingData } = await supabase.rpc("get_average_rating", {
            p_target_type: "service_provider",
            p_target_id: provider.id,
          });

          const { data: countData } = await supabase.rpc("get_review_count", {
            p_target_type: "service_provider",
            p_target_id: provider.id,
          });

          return {
            ...provider,
            averageRating: ratingData || 0,
            reviewCount: countData || 0,
          };
        })
      );

      setProviders(providersWithRatings);
    } catch (error) {
      console.error("Error fetching providers:", error);
      toast({
        title: "Error",
        description: "Could not load service providers.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredProviders = providers.filter(
    (provider) =>
      provider.provider_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      provider.service_category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      provider.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="mb-12">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-6">
              <div className="flex-1">
                <h1 className="text-4xl md:text-5xl font-bold mb-4">Flexi-Assist Services</h1>
                <p className="text-muted-foreground text-lg">
                  Professional assistance services on-demand. Book vetted professionals for any task.
                </p>
              </div>
              <Button 
                onClick={() => navigate("/service-provider-registration")}
                className="md:self-start"
                size="lg"
              >
                <UserPlus className="mr-2 h-5 w-5" />
                Become a Service Provider
              </Button>
            </div>
            
            <div className="max-w-md relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading service providers...</p>
            </div>
          ) : filteredProviders.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProviders.map((provider) => (
                <Card 
                  key={provider.id} 
                  className="hover:shadow-[var(--shadow-card-hover)] transition-all duration-300 cursor-pointer"
                  onClick={() => navigate(`/service-provider/${provider.id}`)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="relative flex-shrink-0">
                        {provider.profile_image_url ? (
                          <img
                            src={provider.profile_image_url}
                            alt={provider.provider_name}
                            className="w-16 h-16 rounded-full object-cover border-2 border-border"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-border flex items-center justify-center">
                            <User className="h-8 w-8 text-primary/60" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg mb-1">{provider.provider_name}</h3>
                        <p className="text-sm text-primary font-medium">{provider.service_category}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-3">
                      <RatingStars rating={provider.averageRating} size={14} />
                      <span className="text-xs text-muted-foreground">
                        ({provider.reviewCount})
                      </span>
                    </div>

                    <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                      {provider.description}
                    </p>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      <MapPin className="h-4 w-4" />
                      <span>{provider.location}, {provider.region}</span>
                    </div>

                    <div className="text-primary font-semibold">
                      {formatPrice(parseFloat((provider.hourly_rate || "").replace(/[^0-9.-]+/g, "")))}/hour
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/service-provider/${provider.id}`);
                      }}
                    >
                      View Profile
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground text-lg mb-4">
                {searchQuery 
                  ? "No service providers found matching your search." 
                  : "No service providers available yet."}
              </p>
              {searchQuery && (
                <Button variant="outline" onClick={() => setSearchQuery("")}>
                  Clear Search
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default FlexiAssist;