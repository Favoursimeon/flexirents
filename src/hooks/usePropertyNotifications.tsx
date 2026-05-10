import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import api from "@/lib/api";

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

  useEffect(() => {
    if (!user) return;

    const checkNewProperties = async () => {
      try {
        const { data: preferences } = await api.get('/api/users/property-preferences');
        if (!preferences?.is_enabled) return;

        const { data: properties } = await api.get('/api/properties/new-matches', {
          params: preferences,
        });

        if (properties && properties.length > 0) {
          properties.forEach((property: any) => {
            toast(`New property match: ${property.title}`, {
              description: `${property.location} - ₵${property.price?.toLocaleString()}`,
              action: {
                label: "View",
                onClick: () => window.location.href = `/property/${property.id}`,
              },
            });
          });
        }
      } catch (error) {
        // Silently fail
      }
    };

    checkNewProperties();
    const interval = setInterval(checkNewProperties, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);
};