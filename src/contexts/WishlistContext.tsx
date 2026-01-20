import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";
import { useToast } from "@/hooks/use-toast";

interface WishlistItem {
  id: number | string;
  type: "rental" | "sale" | "service";
  title: string;
  price?: string;
  rate?: string;
  location?: string;
  image?: string;
}

interface WishlistContextType {
  wishlist: WishlistItem[];
  addToWishlist: (item: WishlistItem) => Promise<void>;
  removeFromWishlist: (id: number | string) => Promise<void>;
  isInWishlist: (id: number | string) => boolean;
  isLoading: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Load wishlist from database when user logs in
  useEffect(() => {
    const loadWishlist = async () => {
      if (!user) {
        setWishlist([]);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('wishlist')
          .select('*')
          .eq('user_id', user.id);

        if (error) throw error;

        const items: WishlistItem[] = (data || []).map((item) => ({
          id: item.property_id,
          type: item.property_type as "rental" | "sale" | "service",
          title: item.property_title,
          price: item.property_price || undefined,
          location: item.property_location || undefined,
          image: item.property_image || undefined,
        }));

        setWishlist(items);
      } catch (error) {
        console.error('Error loading wishlist:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadWishlist();
  }, [user]);

  const addToWishlist = async (item: WishlistItem) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to add items to your wishlist.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('wishlist')
        .insert({
          user_id: user.id,
          property_id: String(item.id),
          property_type: item.type,
          property_title: item.title,
          property_price: item.price || item.rate,
          property_location: item.location,
          property_image: item.image,
        });

      if (error) {
        // If duplicate, just show a message
        if (error.code === '23505') {
          return;
        }
        throw error;
      }

      setWishlist((prev) => [...prev, item]);
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      toast({
        title: "Error",
        description: "Failed to add item to wishlist.",
        variant: "destructive",
      });
    }
  };

  const removeFromWishlist = async (id: number | string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('wishlist')
        .delete()
        .eq('user_id', user.id)
        .eq('property_id', String(id));

      if (error) throw error;

      setWishlist((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      toast({
        title: "Error",
        description: "Failed to remove item from wishlist.",
        variant: "destructive",
      });
    }
  };

  const isInWishlist = (id: number | string) => {
    return wishlist.some((item) => item.id === id);
  };

  return (
    <WishlistContext.Provider value={{ wishlist, addToWishlist, removeFromWishlist, isInWishlist, isLoading }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within WishlistProvider");
  }
  return context;
};
