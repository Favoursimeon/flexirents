import { useState, useMemo } from "react";
import { PropertyFiltersState } from "@/components/PropertyFilters";

export const initialFiltersState: PropertyFiltersState = {
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
};

interface Property {
  id: string;
  title: string;
  location: string;
  region: string;
  price: number;
  property_type: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
  sqft?: number | null;
  features?: { amenities?: string[]; descriptions?: string[]; facilities?: string[] } | null;
  created_at: string;
  images?: string[] | null;
  [key: string]: unknown;
}

export const usePropertyFilters = (properties: Property[], searchQuery: string) => {
  const [filters, setFilters] = useState<PropertyFiltersState>(initialFiltersState);

  const filteredAndSortedProperties = useMemo(() => {
    let result = properties.filter((property) => {
      // Search filter
      const matchesSearch =
        property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.location.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      // Price filter
      const priceNum = Number(property.price);
      const min = filters.minPrice ? parseInt(filters.minPrice) : 0;
      const max = filters.maxPrice ? parseInt(filters.maxPrice) : Infinity;
      if (priceNum < min || priceNum > max) return false;

      // Property type filter
      if (filters.propertyType !== "all" && property.property_type !== filters.propertyType) return false;

      // Bedroom filter
      if (filters.bedroomFilter !== "all" && property.bedrooms) {
        const beds = property.bedrooms;
        if (filters.bedroomFilter === "5+" && beds < 5) return false;
        if (filters.bedroomFilter !== "5+" && beds !== parseInt(filters.bedroomFilter)) return false;
      }

      // Bathroom filter
      if (filters.bathroomFilter !== "all" && property.bathrooms) {
        const baths = property.bathrooms;
        if (filters.bathroomFilter === "4+" && baths < 4) return false;
        if (filters.bathroomFilter !== "4+" && baths !== parseInt(filters.bathroomFilter)) return false;
      }

      // Square footage filter
      if (property.sqft) {
        const sqft = property.sqft;
        const minSqft = filters.minSqft ? parseInt(filters.minSqft) : 0;
        const maxSqft = filters.maxSqft ? parseInt(filters.maxSqft) : Infinity;
        if (sqft < minSqft || sqft > maxSqft) return false;
      }

      // Region filter
      if (filters.selectedRegion !== "all" && property.region !== filters.selectedRegion) return false;

      // City filter
      if (
        filters.selectedCity !== "all" &&
        !property.location.toLowerCase().includes(filters.selectedCity.toLowerCase())
      ) {
        return false;
      }

      // Amenities filter
      if (filters.amenities.length > 0) {
        const propertyAmenities = property.features?.amenities || [];
        const hasAllAmenities = filters.amenities.every((amenity) =>
          propertyAmenities.some((pa) => pa.toLowerCase().includes(amenity.toLowerCase()))
        );
        if (!hasAllAmenities) return false;
      }

      return true;
    });

    // Sorting
    result.sort((a, b) => {
      switch (filters.sortBy) {
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "price-low":
          return Number(a.price) - Number(b.price);
        case "price-high":
          return Number(b.price) - Number(a.price);
        case "sqft-high":
          return (b.sqft || 0) - (a.sqft || 0);
        case "sqft-low":
          return (a.sqft || 0) - (b.sqft || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [properties, searchQuery, filters]);

  return {
    filters,
    setFilters,
    filteredProperties: filteredAndSortedProperties,
  };
};
