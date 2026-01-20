import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Building2, Home, Users, CheckCircle, Search, Car, Heart as HeartIcon, Sparkles, ChevronLeft, ChevronRight, Monitor, Hammer, Sofa, Wrench } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PropertyCard from "@/components/PropertyCard";
import ServiceCard from "@/components/ServiceCard";
import VendorCard from "@/components/VendorCard";
import { useCurrency } from "@/contexts/CurrencyContext";
import { supabase } from "@/integrations/supabase/client";
import heroImage from "@/assets/hero-property.jpg";
import property1br from "@/assets/property-1br.jpg";
import propertyApartment from "@/assets/property-apartment.jpg";
import property3br from "@/assets/property-3br.jpg";
import propertyCommercial from "@/assets/property-commercial.jpg";

// Sample properties for display
const featuredRentals = [
  {
    id: 1,
    image: property1br,
    title: "Modern 1 Bedroom Apartment",
    price: 1200,
    beds: 1,
    baths: 1,
    sqft: 650,
    location: "Downtown District",
    type: "rent" as const,
    features: {
      descriptions: ["Newly Renovated", "Move-in Ready", "Pet Friendly", "High Ceilings"],
      amenities: ["Air Conditioning", "Balcony/Terrace", "Parking Space", "Laundry Room"],
      facilities: ["24/7 Security", "Gym/Fitness Center", "Elevator", "Package Room"],
    },
  },
  {
    id: 2,
    image: propertyApartment,
    title: "Luxury Studio Apartment",
    price: 1500,
    beds: 1,
    baths: 1,
    sqft: 800,
    location: "City Center",
    type: "rent" as const,
    features: {
      descriptions: ["Furnished", "Open Floor Plan", "Natural Light"],
      amenities: ["Swimming Pool", "Air Conditioning", "Heating", "Security System"],
      facilities: ["Concierge Service", "Rooftop Deck", "Business Center"],
    },
  },
  {
    id: 3,
    image: property3br,
    title: "Spacious 2 Bedroom House",
    price: 2200,
    beds: 2,
    baths: 2,
    sqft: 1400,
    location: "Suburban Area",
    type: "rent" as const,
    features: {
      descriptions: ["Pet Friendly", "Garden/Yard", "Corner Unit"],
      amenities: ["Parking Space", "Storage Unit", "Garden/Yard", "Air Conditioning"],
      facilities: ["Playground", "BBQ Area", "Guest Parking"],
    },
  },
];

const featuredSales = [
  {
    id: 1,
    image: property3br,
    title: "Luxury Family Home",
    price: 450000,
    beds: 4,
    baths: 3,
    sqft: 2800,
    location: "Suburban Heights",
    type: "sale" as const,
    features: {
      descriptions: ["Newly Renovated", "Move-in Ready", "Hardwood Floors", "High Ceilings"],
      amenities: ["Swimming Pool", "Gym/Fitness Center", "Parking Space", "Garden/Yard", "Security System"],
      facilities: ["24/7 Security", "Playground", "BBQ Area", "Guest Parking"],
    },
  },
  {
    id: 2,
    image: property3br,
    title: "Modern Townhouse",
    price: 320000,
    beds: 3,
    baths: 2.5,
    sqft: 1900,
    location: "Downtown Area",
    type: "sale" as const,
    features: {
      descriptions: ["Open Floor Plan", "Natural Light", "Corner Unit"],
      amenities: ["Air Conditioning", "Balcony/Terrace", "Parking Space", "Storage Unit"],
      facilities: ["Elevator", "Bike Storage", "Package Room"],
    },
  },
  {
    id: 3,
    image: propertyCommercial,
    title: "Commercial Office Space",
    price: 850000,
    sqft: 5000,
    location: "Business District",
    type: "sale" as const,
    features: {
      descriptions: ["Move-in Ready", "Open Floor Plan", "High Ceilings"],
      amenities: ["Elevator", "Parking Space", "Air Conditioning", "Wheelchair Accessible"],
      facilities: ["24/7 Security", "Business Center", "EV Charging"],
    },
  },
];

const featuredServices = [
  {
    id: 1,
    icon: <Car className="h-7 w-7" />,
    title: "Professional Driver",
    description: "Experienced and reliable drivers for your daily commute or special occasions.",
    rate: "$25",
  },
  {
    id: 2,
    icon: <HeartIcon className="h-7 w-7" />,
    title: "Elderly Caregiver",
    description: "Compassionate caregivers providing quality care for your loved ones.",
    rate: "$20",
  },
  {
    id: 3,
    icon: <Sparkles className="h-7 w-7" />,
    title: "Housekeeper",
    description: "Professional housekeeping services to keep your home spotless.",
    rate: "$18",
  },
];

const vendorCategories = [
  {
    id: 1,
    icon: <Monitor className="h-8 w-8" />,
    title: "Electronics & Appliances",
    description: "Browse top-rated vendors for TVs, phones, laptops, and home appliances with verified quality and competitive prices.",
    vendorCount: 45,
  },
  {
    id: 2,
    icon: <Hammer className="h-8 w-8" />,
    title: "Construction Materials",
    description: "Connect with trusted suppliers of cement, steel, lumber, and all building materials for your projects.",
    vendorCount: 38,
  },
  {
    id: 3,
    icon: <Sofa className="h-8 w-8" />,
    title: "Furniture & Home Decor",
    description: "Discover quality furniture vendors offering modern and traditional pieces to complete your space.",
    vendorCount: 52,
  },
  {
    id: 4,
    icon: <Wrench className="h-8 w-8" />,
    title: "Tools & Equipment",
    description: "Find reliable vendors for professional tools, machinery, and equipment for any job or project.",
    vendorCount: 29,
  },
];

const Index = () => {
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPropertyIndex, setCurrentPropertyIndex] = useState(0);
  const [recentProperties, setRecentProperties] = useState<any[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [rentalProperties, setRentalProperties] = useState<any[]>([]);
  const [saleProperties, setSaleProperties] = useState<any[]>([]);
  const [loadingRentals, setLoadingRentals] = useState(true);
  const [loadingSales, setLoadingSales] = useState(true);
  const [services, setServices] = useState<any[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [vendorCategories, setVendorCategories] = useState<any[]>([]);
  const [loadingVendors, setLoadingVendors] = useState(true);

  // Fetch recent properties from database
  useEffect(() => {
    const fetchRecentProperties = async () => {
      try {
        const { data, error } = await supabase
          .from('properties')
          .select('*')
          .eq('status', 'available')
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) throw error;
        
        if (data && data.length > 0) {
          setRecentProperties(data);
        } else {
          // Fallback to sample data if no properties in database
          setRecentProperties([...featuredRentals, ...featuredSales.slice(0, 2)]);
        }
      } catch (error) {
        console.error('Error fetching recent properties:', error);
        // Fallback to sample data on error
        setRecentProperties([...featuredRentals, ...featuredSales.slice(0, 2)]);
      } finally {
        setLoadingProperties(false);
      }
    };

    fetchRecentProperties();
  }, []);

  // Fetch rental properties
  useEffect(() => {
    const fetchRentals = async () => {
      try {
        const { data, error } = await supabase
          .from('properties')
          .select('*')
          .eq('status', 'available')
          .eq('listing_type', 'rent')
          .order('created_at', { ascending: false })
          .limit(3);

        if (error) throw error;
        
        if (data && data.length > 0) {
          setRentalProperties(data);
        } else {
          setRentalProperties(featuredRentals);
        }
      } catch (error) {
        console.error('Error fetching rental properties:', error);
        setRentalProperties(featuredRentals);
      } finally {
        setLoadingRentals(false);
      }
    };

    fetchRentals();
  }, []);

  // Fetch sale properties
  useEffect(() => {
    const fetchSales = async () => {
      try {
        const { data, error } = await supabase
          .from('properties')
          .select('*')
          .eq('status', 'available')
          .eq('listing_type', 'sale')
          .order('created_at', { ascending: false })
          .limit(3);

        if (error) throw error;
        
        if (data && data.length > 0) {
          setSaleProperties(data);
        } else {
          setSaleProperties(featuredSales);
        }
      } catch (error) {
        console.error('Error fetching sale properties:', error);
        setSaleProperties(featuredSales);
      } finally {
        setLoadingSales(false);
      }
    };

    fetchSales();
  }, []);

  // Fetch service providers
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const { data, error } = await supabase
          .from('service_provider_registrations')
          .select('*')
          .eq('status', 'approved')
          .order('created_at', { ascending: false })
          .limit(3);

        if (error) throw error;
        
        if (data && data.length > 0) {
          setServices(data);
        } else {
          setServices(featuredServices);
        }
      } catch (error) {
        console.error('Error fetching services:', error);
        setServices(featuredServices);
      } finally {
        setLoadingServices(false);
      }
    };

    fetchServices();
  }, []);

  // Fetch vendor categories with counts
  useEffect(() => {
    const fetchVendorCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('vendor_registrations')
          .select('business_category')
          .eq('status', 'approved');

        if (error) throw error;
        
        if (data && data.length > 0) {
          // Group by category and count
          const categoryCounts = data.reduce((acc: any, vendor: any) => {
            const category = vendor.business_category;
            if (!acc[category]) {
              acc[category] = { count: 0, category };
            }
            acc[category].count += 1;
            return acc;
          }, {});

          // Convert to array and get top 4 categories
          const categories = Object.entries(categoryCounts)
            .map(([category, data]: [string, any]) => ({
              id: category,
              title: category,
              description: `Browse verified vendors in ${category} with quality products and competitive prices.`,
              vendorCount: data.count,
            }))
            .slice(0, 4);

          setVendorCategories(categories);
        } else {
          setVendorCategories(vendorCategories);
        }
      } catch (error) {
        console.error('Error fetching vendor categories:', error);
        setVendorCategories(vendorCategories);
      } finally {
        setLoadingVendors(false);
      }
    };

    fetchVendorCategories();
  }, []);

  const allNewProperties = recentProperties;

  // Auto-rotate properties every 4 seconds
  useEffect(() => {
    if (allNewProperties.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentPropertyIndex((prev) => (prev + 1) % allNewProperties.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [allNewProperties.length]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/rentals?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const nextProperty = () => {
    setCurrentPropertyIndex((prev) => (prev + 1) % allNewProperties.length);
  };

  const prevProperty = () => {
    setCurrentPropertyIndex((prev) => (prev - 1 + allNewProperties.length) % allNewProperties.length);
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-16 min-h-[600px] flex items-center">
        <div className="absolute inset-0 z-0">
          <img
            src={heroImage}
            alt="Modern luxury property"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/70" />
        </div>
        
        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="max-w-2xl text-primary-foreground">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Find Your Perfect Space with FlexiRents
            </h1>
            <p className="text-xl mb-8 opacity-90">
              Your trusted partner for property rentals, sales, and personalized assistance services.
            </p>
            
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="mb-8 max-w-2xl">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search by location, property type, or features..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-14 text-lg bg-background/95 backdrop-blur-sm border-2 border-primary-foreground/20 focus:border-primary-foreground/40"
                  />
                </div>
                <Button 
                  type="submit" 
                  size="lg" 
                  className="h-14 px-8 bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  <Search className="h-5 w-5" />
                </Button>
              </div>
            </form>

            {/* Newly Listed Property Carousel */}
            {loadingProperties ? (
              <div className="bg-background/95 backdrop-blur-sm rounded-xl p-6 max-w-2xl">
                <div className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground">Loading properties...</p>
                </div>
              </div>
            ) : allNewProperties.length > 0 ? (
              <div className="bg-background/95 backdrop-blur-sm rounded-xl p-6 max-w-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-accent" />
                    Newly Listed
                  </h3>
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      onClick={prevProperty}
                      className="h-9 w-9 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <Button
                      size="icon"
                      onClick={nextProperty}
                      className="h-9 w-9 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
                
                <div className="relative overflow-hidden">
                  <div 
                    className="flex transition-transform duration-500 ease-in-out"
                    style={{ transform: `translateX(-${currentPropertyIndex * 100}%)` }}
                  >
                    {allNewProperties.map((property, index) => {
                      const propertyImage = property.images?.[0] || property.image || propertyApartment;
                      const propertyType = property.listing_type || property.type;
                      
                      return (
                        <div key={property.id || index} className="min-w-full">
                          <div className="flex items-center gap-4">
                            <img
                              src={propertyImage}
                              alt={property.title}
                              className="w-24 h-24 object-cover rounded-lg"
                            />
                            <div className="flex-1">
                               <h4 className="font-semibold text-foreground mb-1">{property.title}</h4>
                              <p className="text-sm text-muted-foreground mb-2">{property.location}</p>
                              <div className="flex items-center justify-between">
                                <span className="text-lg font-bold text-accent">
                                  {formatPrice(property.price)}{propertyType === "rent" ? "/month" : ""}
                                </span>
                                <Button 
                                  size="sm" 
                                  variant="secondary"
                                  onClick={() => navigate(propertyType === "rent" ? "/rentals" : "/sales")}
                                >
                                  View Details
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>


      {/* Rental Properties Section */}
      <section className="py-10 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Property Rentals</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              From cozy 1-bedrooms to spacious family apartments. Find your ideal rental property.
            </p>
          </div>

          {loadingRentals ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Loading rentals...</p>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-3 gap-8 mb-8">
                {rentalProperties.map((property) => {
                  const propertyImage = property.images?.[0] || property.image || propertyApartment;
                  return (
                    <PropertyCard
                      key={property.id}
                      id={property.id}
                      image={propertyImage}
                      title={property.title}
                      price={property.price}
                      beds={property.bedrooms}
                      baths={property.bathrooms}
                      sqft={property.sqft}
                      location={property.location}
                      type="rent"
                      features={property.features}
                      onSelect={() => navigate("/rentals")}
                    />
                  );
                })}
              </div>

              <div className="text-center">
                <Button variant="default" size="lg" asChild>
                  <Link to="/rentals">
                    Explore All Rentals <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Sales Properties Section */}
      <section className="py-10 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Properties for Sale</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Invest in homes, commercial properties, or land. Build your real estate portfolio.
            </p>
          </div>

          {loadingSales ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Loading properties...</p>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-3 gap-8 mb-8">
                {saleProperties.map((property) => {
                  const propertyImage = property.images?.[0] || property.image || property3br;
                  return (
                    <PropertyCard
                      key={property.id}
                      id={property.id}
                      image={propertyImage}
                      title={property.title}
                      price={property.price}
                      beds={property.bedrooms}
                      baths={property.bathrooms}
                      sqft={property.sqft}
                      location={property.location}
                      type="sale"
                      features={property.features}
                      onSelect={() => navigate("/sales")}
                    />
                  );
                })}
              </div>

              <div className="text-center">
                <Button variant="default" size="lg" asChild>
                  <Link to="/sales">
                    View All Properties <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Flexi-Assist Services Section */}
      <section className="py-10 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Flexi-Assist Services</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Personal assistance from drivers to caregivers. Get help when you need it.
            </p>
          </div>

          {loadingServices ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Loading services...</p>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-3 gap-8 mb-8">
                {services.map((service) => (
                  <ServiceCard
                    key={service.id}
                    id={service.id}
                    title={service.provider_name || service.title}
                    description={service.description}
                    rate={service.hourly_rate || service.rate}
                    icon={service.icon || <Sparkles className="h-7 w-7" />}
                    onSelect={() => navigate("/flexi-assist")}
                  />
                ))}
              </div>

              <div className="text-center">
                <Button variant="default" size="lg" asChild>
                  <Link to="/flexi-assist">
                    Book Services <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Marketplace Section */}
      <section className="py-10 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Marketplace</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Connect with verified vendors for electronics, construction materials, and more. Quality products from trusted suppliers.
            </p>
          </div>

          {loadingVendors ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Loading vendors...</p>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {vendorCategories.map((category, index) => (
                  <VendorCard
                    key={category.id || index}
                    title={category.title}
                    description={category.description}
                    vendorCount={category.vendorCount}
                    icon={category.icon || <Monitor className="h-8 w-8" />}
                    onExplore={() => navigate("/marketplace")}
                  />
                ))}
              </div>

              <div className="text-center">
                <Button variant="default" size="lg" asChild>
                  <Link to="/marketplace">
                    Browse All Vendors <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-10 bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center bg-card p-8 rounded-xl shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-all">
              <div className="text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-3">15,000+</div>
              <p className="text-foreground font-semibold text-lg">Happy Customers</p>
            </div>
            <div className="text-center bg-card p-8 rounded-xl shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-all">
              <div className="text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-3">98.5%</div>
              <p className="text-foreground font-semibold text-lg">Satisfaction Rate</p>
            </div>
            <div className="text-center bg-card p-8 rounded-xl shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-all">
              <div className="text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-3">2,500+</div>
              <p className="text-foreground font-semibold text-lg">Partner Property Owners</p>
            </div>
          </div>
        </div>
      </section>

      {/* Success Stories Section */}
      <section className="py-10 bg-gradient-to-b from-muted/30 to-muted/60">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Success Stories</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              See what our satisfied customers have to say about their FlexiRents experience.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-card p-8 rounded-xl shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-all border border-border/50">
              <div className="flex items-center gap-1 mb-6 text-accent">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                ))}
              </div>
              <p className="text-foreground mb-6 leading-relaxed">
                "Finding my dream apartment was so easy with FlexiRents. The flexible payment plan made it affordable, and the team was incredibly supportive throughout."
              </p>
              <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center font-bold text-accent text-lg">
                  SA
                </div>
                <div>
                  <p className="font-semibold text-foreground">Sarah Anderson</p>
                  <p className="text-sm text-muted-foreground">Apartment Renter</p>
                </div>
              </div>
            </div>

            <div className="bg-card p-8 rounded-xl shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-all border border-border/50">
              <div className="flex items-center gap-1 mb-6 text-accent">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                ))}
              </div>
              <p className="text-foreground mb-6 leading-relaxed">
                "Purchased my first commercial property through FlexiRents. The process was transparent, and their guidance helped me make the right investment decision."
              </p>
              <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center font-bold text-accent text-lg">
                  MO
                </div>
                <div>
                  <p className="font-semibold text-foreground">Michael Okonkwo</p>
                  <p className="text-sm text-muted-foreground">Property Investor</p>
                </div>
              </div>
            </div>

            <div className="bg-card p-8 rounded-xl shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-all border border-border/50">
              <div className="flex items-center gap-1 mb-6 text-accent">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                ))}
              </div>
              <p className="text-foreground mb-6 leading-relaxed">
                "The Flexi-Assist service is a lifesaver! Having a reliable driver and caregiver on demand has made managing my busy schedule so much easier."
              </p>
              <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center font-bold text-accent text-lg">
                  EA
                </div>
                <div>
                  <p className="font-semibold text-foreground">Emeka Afolabi</p>
                  <p className="text-sm text-muted-foreground">Flexi-Assist Client</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-4 bg-card border-y border-border/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-8">Trust & Transparency</h2>
            <div className="grid md:grid-cols-2 gap-6 text-left">
              <div className="flex gap-3">
                <CheckCircle className="h-6 w-6 text-accent flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold mb-1">Verified Properties</h4>
                  <p className="text-muted-foreground text-sm">
                    All properties undergo thorough verification before listing.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <CheckCircle className="h-6 w-6 text-accent flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold mb-1">Transparent Pricing</h4>
                  <p className="text-muted-foreground text-sm">
                    Clear pricing with no hidden fees. What you see is what you pay.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <CheckCircle className="h-6 w-6 text-accent flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold mb-1">Vetted Service Providers</h4>
                  <p className="text-muted-foreground text-sm">
                    All Flexi-Assist professionals are background-checked and rated.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <CheckCircle className="h-6 w-6 text-accent flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold mb-1">24/7 Support</h4>
                  <p className="text-muted-foreground text-sm">
                    Our team is always available to assist with your needs.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-6" style={{ background: 'var(--gradient-hero)' }}>
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4 text-white">Ready to Get Started?</h2>
          <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
            Whether you're looking for a property or need assistance services, FlexiRents has you covered.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
