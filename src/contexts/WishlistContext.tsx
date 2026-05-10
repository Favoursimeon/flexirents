import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

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

  useEffect(() => {
    const loadWishlist = async () => {
      if (!user) {
        setWishlist([]);
        setIsLoading(false);
        return;
      }
      try {
        const { data } = await api.get('/api/properties/wishlist');
        setWishlist(Array.isArray(data) ? data : []);
      } catch (error) {
        setWishlist([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadWishlist();
  }, [user]);

  const addToWishlist = async (item: WishlistItem) => {
    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to save items to your wishlist.",
        variant: "destructive",
      });
      return;
    }
    try {
      await api.post(`/api/properties/wishlist/${item.id}`);
      setWishlist((prev) => [...prev, item]);
      toast({
        title: "Added to wishlist",
        description: `${item.title} has been added to your wishlist.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add to wishlist.",
        variant: "destructive",
      });
    }
  };

  const removeFromWishlist = async (id: number | string) => {
    try {
      await api.delete(`/api/properties/wishlist/${id}`);
      setWishlist((prev) => prev.filter((item) => item.id !== id));
      toast({
        title: "Removed from wishlist",
        description: "Item has been removed from your wishlist.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove from wishlist.",
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
  if (!context) throw new Error("useWishlist must be used within WishlistProvider");
  return context;
};

export default WishlistContext;