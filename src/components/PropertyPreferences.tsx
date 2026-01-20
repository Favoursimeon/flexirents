import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Bell, BellOff, X } from "lucide-react";
import { ghanaRegions } from "@/data/ghanaLocations";

interface Preferences {
  is_enabled: boolean;
  property_types: string[];
  listing_types: string[];
  regions: string[];
  locations: string[];
  min_price: number | null;
  max_price: number | null;
  min_bedrooms: number | null;
  max_bedrooms: number | null;
  min_bathrooms: number | null;
  max_bathrooms: number | null;
}

const propertyTypes = [
  { id: "apartment", label: "Apartment" },
  { id: "house", label: "House" },
  { id: "commercial", label: "Commercial" },
  { id: "land", label: "Land" },
  { id: "townhouse", label: "Townhouse" },
];

const listingTypes = [
  { id: "rent", label: "For Rent" },
  { id: "sale", label: "For Sale" },
];

export default function PropertyPreferences() {
  const { user } = useAuth();
  const { currency } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [matchingCount, setMatchingCount] = useState<number>(0);
  const [countLoading, setCountLoading] = useState(false);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [preferences, setPreferences] = useState<Preferences>({
    is_enabled: true,
    property_types: [],
    listing_types: [],
    regions: [],
    locations: [],
    min_price: null,
    max_price: null,
    min_bedrooms: null,
    max_bedrooms: null,
    min_bathrooms: null,
    max_bathrooms: null,
  });

  useEffect(() => {
    if (user) {
      fetchPreferences();
    }
  }, [user]);

  useEffect(() => {
    // Update available cities when regions change
    const cities: string[] = [];
    preferences.regions.forEach(regionName => {
      const region = ghanaRegions.find(r => r.name === regionName);
      if (region) {
        cities.push(...region.cities);
      }
    });
    setAvailableCities(cities);
  }, [preferences.regions]);

  useEffect(() => {
    if (!loading) {
      fetchMatchingCount();
    }
  }, [preferences, loading]);

  const fetchPreferences = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setPreferences({
          is_enabled: data.is_enabled ?? true,
          property_types: data.property_types || [],
          listing_types: data.listing_types || [],
          regions: data.regions || [],
          locations: data.locations || [],
          min_price: data.min_price,
          max_price: data.max_price,
          min_bedrooms: data.min_bedrooms,
          max_bedrooms: data.max_bedrooms,
          min_bathrooms: data.min_bathrooms,
          max_bathrooms: data.max_bathrooms,
        });
      }
    } catch (error) {
      console.error("Error fetching preferences:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMatchingCount = async () => {
    setCountLoading(true);
    try {
      let query = supabase
        .from("properties")
        .select("id", { count: "exact", head: true })
        .eq("status", "available");

      // Apply filters based on preferences
      if (preferences.property_types.length > 0) {
        query = query.in("property_type", preferences.property_types);
      }

      if (preferences.listing_types.length > 0) {
        query = query.in("listing_type", preferences.listing_types);
      }

      if (preferences.regions.length > 0) {
        query = query.in("region", preferences.regions);
      }

      if (preferences.min_price !== null) {
        query = query.gte("price", preferences.min_price);
      }

      if (preferences.max_price !== null) {
        query = query.lte("price", preferences.max_price);
      }

      if (preferences.min_bedrooms !== null) {
        query = query.gte("bedrooms", preferences.min_bedrooms);
      }

      if (preferences.max_bedrooms !== null) {
        query = query.lte("bedrooms", preferences.max_bedrooms);
      }

      if (preferences.min_bathrooms !== null) {
        query = query.gte("bathrooms", preferences.min_bathrooms);
      }

      if (preferences.max_bathrooms !== null) {
        query = query.lte("bathrooms", preferences.max_bathrooms);
      }

      const { count, error } = await query;

      if (error) throw error;
      setMatchingCount(count || 0);
    } catch (error) {
      console.error("Error fetching matching count:", error);
      setMatchingCount(0);
    } finally {
      setCountLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("user_preferences")
        .upsert({
          user_id: user.id,
          ...preferences,
        });

      if (error) throw error;

      toast.success(
        preferences.is_enabled
          ? "Preferences saved! You'll receive notifications for matching properties."
          : "Preferences saved. Notifications are paused."
      );
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast.error("Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  const toggleArrayValue = (array: string[], value: string): string[] => {
    if (array.includes(value)) {
      return array.filter((item) => item !== value);
    }
    return [...array, value];
  };

  const removeItem = (array: string[], value: string): string[] => {
    return array.filter((item) => item !== value);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {preferences.is_enabled ? (
              <Bell className="h-5 w-5 text-primary" />
            ) : (
              <BellOff className="h-5 w-5 text-muted-foreground" />
            )}
            <CardTitle>Property Notification Preferences</CardTitle>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <CardDescription>
            Get notified when properties matching your preferences are listed
          </CardDescription>
          <div className="flex items-center gap-2 text-sm">
            {countLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <>
                <span className="font-semibold text-primary text-lg">{matchingCount}</span>
                <span className="text-muted-foreground">
                  {matchingCount === 1 ? "property matches" : "properties match"}
                </span>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
          <div className="space-y-0.5">
            <Label className="text-base font-semibold">
              {preferences.is_enabled ? "Notifications Enabled" : "Notifications Paused"}
            </Label>
            <p className="text-sm text-muted-foreground">
              {preferences.is_enabled
                ? "You'll receive alerts for matching properties"
                : "Notifications are paused. Your preferences are saved."}
            </p>
          </div>
          <Switch
            checked={preferences.is_enabled}
            onCheckedChange={(checked) =>
              setPreferences({ ...preferences, is_enabled: checked })
            }
          />
        </div>
        {/* Property Types */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Property Types</Label>
          <Select
            onValueChange={(value) => {
              if (!preferences.property_types.includes(value)) {
                setPreferences({
                  ...preferences,
                  property_types: [...preferences.property_types, value],
                });
              }
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select property types" />
            </SelectTrigger>
            <SelectContent className="z-50 bg-background">
              {propertyTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex flex-wrap gap-2 mt-2">
            {preferences.property_types.map((type) => {
              const label = propertyTypes.find((t) => t.id === type)?.label || type;
              return (
                <Badge key={type} variant="secondary" className="flex items-center gap-1">
                  {label}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={() =>
                      setPreferences({
                        ...preferences,
                        property_types: removeItem(preferences.property_types, type),
                      })
                    }
                  />
                </Badge>
              );
            })}
          </div>
        </div>

        {/* Listing Types */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Listing Types</Label>
          <Select
            onValueChange={(value) => {
              if (!preferences.listing_types.includes(value)) {
                setPreferences({
                  ...preferences,
                  listing_types: [...preferences.listing_types, value],
                });
              }
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select listing types" />
            </SelectTrigger>
            <SelectContent className="z-50 bg-background">
              {listingTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex flex-wrap gap-2 mt-2">
            {preferences.listing_types.map((type) => {
              const label = listingTypes.find((t) => t.id === type)?.label || type;
              return (
                <Badge key={type} variant="secondary" className="flex items-center gap-1">
                  {label}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={() =>
                      setPreferences({
                        ...preferences,
                        listing_types: removeItem(preferences.listing_types, type),
                      })
                    }
                  />
                </Badge>
              );
            })}
          </div>
        </div>

        {/* Regions and Cities */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <Label className="text-base font-semibold">Preferred Regions</Label>
            <Select
              onValueChange={(value) => {
                if (!preferences.regions.includes(value)) {
                  setPreferences({
                    ...preferences,
                    regions: [...preferences.regions, value],
                  });
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select regions" />
              </SelectTrigger>
              <SelectContent className="z-50 bg-background max-h-60">
                {ghanaRegions.map((region) => (
                  <SelectItem key={region.name} value={region.name}>
                    {region.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex flex-wrap gap-2 mt-2">
              {preferences.regions.map((region) => (
                <Badge key={region} variant="secondary" className="flex items-center gap-1">
                  {region}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={() =>
                      setPreferences({
                        ...preferences,
                        regions: removeItem(preferences.regions, region),
                      })
                    }
                  />
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-base font-semibold">Sub-Cities/Locations</Label>
            <Select
              disabled={availableCities.length === 0}
              onValueChange={(value) => {
                if (!preferences.locations.includes(value)) {
                  setPreferences({
                    ...preferences,
                    locations: [...preferences.locations, value],
                  });
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={availableCities.length === 0 ? "Select regions first" : "Select cities"} />
              </SelectTrigger>
              <SelectContent className="z-50 bg-background max-h-60">
                {availableCities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex flex-wrap gap-2 mt-2">
              {preferences.locations.map((location) => (
                <Badge key={location} variant="secondary" className="flex items-center gap-1">
                  {location}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={() =>
                      setPreferences({
                        ...preferences,
                        locations: removeItem(preferences.locations, location),
                      })
                    }
                  />
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Price Range */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Price Range ({currency})</Label>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="min_price">Minimum</Label>
              <Input
                id="min_price"
                type="number"
                value={preferences.min_price || ""}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    min_price: e.target.value ? Number(e.target.value) : null,
                  })
                }
                placeholder="Min price"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_price">Maximum</Label>
              <Input
                id="max_price"
                type="number"
                value={preferences.max_price || ""}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    max_price: e.target.value ? Number(e.target.value) : null,
                  })
                }
                placeholder="Max price"
              />
            </div>
          </div>
        </div>

        {/* Bedrooms */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Bedrooms</Label>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="min_bedrooms">Minimum</Label>
              <Input
                id="min_bedrooms"
                type="number"
                value={preferences.min_bedrooms || ""}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    min_bedrooms: e.target.value ? Number(e.target.value) : null,
                  })
                }
                placeholder="Min bedrooms"
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_bedrooms">Maximum</Label>
              <Input
                id="max_bedrooms"
                type="number"
                value={preferences.max_bedrooms || ""}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    max_bedrooms: e.target.value ? Number(e.target.value) : null,
                  })
                }
                placeholder="Max bedrooms"
                min="0"
              />
            </div>
          </div>
        </div>

        {/* Bathrooms */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Bathrooms</Label>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="min_bathrooms">Minimum</Label>
              <Input
                id="min_bathrooms"
                type="number"
                step="0.5"
                value={preferences.min_bathrooms || ""}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    min_bathrooms: e.target.value ? Number(e.target.value) : null,
                  })
                }
                placeholder="Min bathrooms"
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_bathrooms">Maximum</Label>
              <Input
                id="max_bathrooms"
                type="number"
                step="0.5"
                value={preferences.max_bathrooms || ""}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    max_bathrooms: e.target.value ? Number(e.target.value) : null,
                  })
                }
                placeholder="Max bathrooms"
                min="0"
              />
            </div>
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Saving...
            </>
          ) : (
            <>
              <Bell className="h-4 w-4 mr-2" />
              Save Preferences
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
