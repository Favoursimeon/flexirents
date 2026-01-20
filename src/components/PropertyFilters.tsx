import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SlidersHorizontal, ChevronDown, ChevronUp, X, ArrowUpDown } from "lucide-react";
import { ghanaRegions } from "@/data/ghanaLocations";

export interface PropertyFiltersState {
  minPrice: string;
  maxPrice: string;
  propertyType: string;
  bedroomFilter: string;
  bathroomFilter: string;
  minSqft: string;
  maxSqft: string;
  selectedRegion: string;
  selectedCity: string;
  sortBy: string;
  amenities: string[];
}

interface PropertyFiltersProps {
  filters: PropertyFiltersState;
  onFiltersChange: (filters: PropertyFiltersState) => void;
  listingType: "rent" | "sale";
}

const AMENITIES_OPTIONS = [
  "Swimming Pool",
  "Gym",
  "Parking",
  "Security",
  "Garden",
  "Air Conditioning",
  "Furnished",
  "Balcony",
  "Elevator",
  "Pet Friendly",
];

const PropertyFilters = ({ filters, onFiltersChange, listingType }: PropertyFiltersProps) => {
  const [filtersOpen, setFiltersOpen] = useState(false);

  const updateFilter = <K extends keyof PropertyFiltersState>(key: K, value: PropertyFiltersState[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleAmenity = (amenity: string) => {
    const current = filters.amenities;
    const updated = current.includes(amenity)
      ? current.filter((a) => a !== amenity)
      : [...current, amenity];
    updateFilter("amenities", updated);
  };

  const clearAllFilters = () => {
    onFiltersChange({
      minPrice: "",
      maxPrice: "",
      propertyType: "all",
      bedroomFilter: "all",
      bathroomFilter: "all",
      minSqft: "",
      maxSqft: "",
      selectedRegion: "all",
      selectedCity: "all",
      sortBy: "newest",
      amenities: [],
    });
  };

  const activeFiltersCount = [
    filters.minPrice,
    filters.maxPrice,
    filters.propertyType !== "all" ? filters.propertyType : "",
    filters.bedroomFilter !== "all" ? filters.bedroomFilter : "",
    filters.bathroomFilter !== "all" ? filters.bathroomFilter : "",
    filters.minSqft,
    filters.maxSqft,
    filters.selectedRegion !== "all" ? filters.selectedRegion : "",
    filters.selectedCity !== "all" ? filters.selectedCity : "",
    ...filters.amenities,
  ].filter(Boolean).length;

  const availableCities =
    filters.selectedRegion === "all"
      ? []
      : ghanaRegions.find((r) => r.name === filters.selectedRegion)?.cities || [];

  const showBedroomBathroom =
    filters.propertyType === "all" ||
    filters.propertyType === "apartment" ||
    filters.propertyType === "villa" ||
    filters.propertyType === "airbnb";

  return (
    <div className="bg-card rounded-lg shadow-[var(--shadow-card)] mb-8">
      {/* Filter Header */}
      <button
        onClick={() => setFiltersOpen(!filtersOpen)}
        className="w-full flex items-center justify-between p-6 hover:bg-accent/5 transition-colors rounded-lg"
      >
        <div className="flex items-center gap-3">
          <SlidersHorizontal className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-semibold">Filter Properties</h2>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="rounded-full">
              {activeFiltersCount} active
            </Badge>
          )}
        </div>
        {filtersOpen ? (
          <ChevronUp className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        )}
      </button>

      {filtersOpen && (
        <div className="px-6 pb-6 pt-2 border-t space-y-6">
          {/* Sort & Clear Row */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
              <Select value={filters.sortBy} onValueChange={(v) => updateFilter("sortBy", v)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="sqft-high">Size: Largest First</SelectItem>
                  <SelectItem value="sqft-low">Size: Smallest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-destructive">
                <X className="h-4 w-4 mr-1" />
                Clear All Filters
              </Button>
            )}
          </div>

          {/* Price Range */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Price Range {listingType === "rent" ? "(per month)" : ""}
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Minimum</label>
                <Input
                  type="number"
                  placeholder="Min price"
                  value={filters.minPrice}
                  onChange={(e) => updateFilter("minPrice", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Maximum</label>
                <Input
                  type="number"
                  placeholder="Max price"
                  value={filters.maxPrice}
                  onChange={(e) => updateFilter("maxPrice", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Property Type & Bedrooms/Bathrooms */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Property Type</label>
              <Select value={filters.propertyType} onValueChange={(v) => updateFilter("propertyType", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="apartment">Apartment</SelectItem>
                  <SelectItem value="villa">Villa</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="airbnb">AirBnB</SelectItem>
                  <SelectItem value="land">Land</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {showBedroomBathroom && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Bedrooms</label>
                  <Select value={filters.bedroomFilter} onValueChange={(v) => updateFilter("bedroomFilter", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Bedrooms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Bedrooms</SelectItem>
                      <SelectItem value="1">1 Bedroom</SelectItem>
                      <SelectItem value="2">2 Bedrooms</SelectItem>
                      <SelectItem value="3">3 Bedrooms</SelectItem>
                      <SelectItem value="4">4 Bedrooms</SelectItem>
                      <SelectItem value="5+">5+ Bedrooms</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Bathrooms</label>
                  <Select value={filters.bathroomFilter} onValueChange={(v) => updateFilter("bathroomFilter", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Bathrooms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Bathrooms</SelectItem>
                      <SelectItem value="1">1 Bathroom</SelectItem>
                      <SelectItem value="2">2 Bathrooms</SelectItem>
                      <SelectItem value="3">3 Bathrooms</SelectItem>
                      <SelectItem value="4+">4+ Bathrooms</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>

          {/* Square Footage */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Square Footage</label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Minimum</label>
                <Input
                  type="number"
                  placeholder="Min sqft"
                  value={filters.minSqft}
                  onChange={(e) => updateFilter("minSqft", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Maximum</label>
                <Input
                  type="number"
                  placeholder="Max sqft"
                  value={filters.maxSqft}
                  onChange={(e) => updateFilter("maxSqft", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Region</label>
              <Select
                value={filters.selectedRegion}
                onValueChange={(value) => {
                  updateFilter("selectedRegion", value);
                  updateFilter("selectedCity", "all");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Regions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  {ghanaRegions.map((region) => (
                    <SelectItem key={region.name} value={region.name}>
                      {region.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {filters.selectedRegion !== "all" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">City</label>
                <Select value={filters.selectedCity} onValueChange={(v) => updateFilter("selectedCity", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Cities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cities</SelectItem>
                    {availableCities.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Amenities */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Amenities</label>
            <div className="flex flex-wrap gap-2">
              {AMENITIES_OPTIONS.map((amenity) => (
                <Badge
                  key={amenity}
                  variant={filters.amenities.includes(amenity) ? "default" : "outline"}
                  className="cursor-pointer transition-all hover:scale-105"
                  onClick={() => toggleAmenity(amenity)}
                >
                  {amenity}
                  {filters.amenities.includes(amenity) && <X className="h-3 w-3 ml-1" />}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyFilters;
