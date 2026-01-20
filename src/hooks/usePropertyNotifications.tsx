import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RealtimeChannel } from "@supabase/supabase-js";

interface PropertyPayload {
  new: {
    id: string;
    title: string;
    property_type: string;
    listing_type: string;
    region: string;
    price: number;
    bedrooms: number | null;
    bathrooms: number | null;
    location: string;
  };
}

interface UserPreferences {
  is_enabled: boolean;
  property_types: string[];
  listing_types: string[];
  regions: string[];
  min_price: number | null;
  max_price: number | null;
  min_bedrooms: number | null;
  max_bedrooms: number | null;
  min_bathrooms: number | null;
  max_bathrooms: number | null;
}

export const usePropertyNotifications = () => {
  const { user } = useAuth();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const preferencesRef = useRef<UserPreferences | null>(null);

  useEffect(() => {
    if (!user) return;

    // Fetch user preferences
    const fetchPreferences = async () => {
      const { data } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        preferencesRef.current = data;
      }
    };

    fetchPreferences();

    // Set up realtime subscription
    channelRef.current = supabase
      .channel("property-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "properties",
        },
        (payload: PropertyPayload) => {
          const property = payload.new;
          const preferences = preferencesRef.current;

          // Don't show notifications if disabled or no preferences set
          if (!preferences || !preferences.is_enabled) return;

          // Check if property matches user preferences
          const matchesPropertyType =
            preferences.property_types.length === 0 ||
            preferences.property_types.includes(property.property_type);

          const matchesListingType =
            preferences.listing_types.length === 0 ||
            preferences.listing_types.includes(property.listing_type);

          const matchesRegion =
            preferences.regions.length === 0 ||
            preferences.regions.includes(property.region);

          const matchesPrice =
            (!preferences.min_price || property.price >= preferences.min_price) &&
            (!preferences.max_price || property.price <= preferences.max_price);

          const matchesBedrooms =
            (!preferences.min_bedrooms || (property.bedrooms && property.bedrooms >= preferences.min_bedrooms)) &&
            (!preferences.max_bedrooms || (property.bedrooms && property.bedrooms <= preferences.max_bedrooms));

          const matchesBathrooms =
            (!preferences.min_bathrooms || (property.bathrooms && property.bathrooms >= preferences.min_bathrooms)) &&
            (!preferences.max_bathrooms || (property.bathrooms && property.bathrooms <= preferences.max_bathrooms));

          // Show notification if all criteria match
          if (
            matchesPropertyType &&
            matchesListingType &&
            matchesRegion &&
            matchesPrice &&
            matchesBedrooms &&
            matchesBathrooms
          ) {
            toast.success(
              `New ${property.listing_type === "rent" ? "Rental" : "Sale"} Property!`,
              {
                description: `${property.title} in ${property.location}, ${property.region} - GHS ${property.price.toLocaleString()}`,
                action: {
                  label: "View",
                  onClick: () => window.location.href = `/property/${property.id}`,
                },
                duration: 10000,
              }
            );
          }
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [user]);
};
