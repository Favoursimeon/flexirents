import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bed, Bath, Square, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useWishlist } from "@/contexts/WishlistContext";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/contexts/CurrencyContext";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PropertyFeatures {
  descriptions?: string[];
  amenities?: string[];
  facilities?: string[];
}

interface PropertyCardProps {
  id: string | number;
  image: string;
  title: string;
  price: string | number;
  beds?: number;
  baths?: number;
  sqft?: number;
  location: string;
  type: "rent" | "sale";
  features?: PropertyFeatures;
  onSelect?: () => void;
}

const PropertyCard = ({
  id,
  image,
  title,
  price,
  beds,
  baths,
  sqft,
  location,
  type,
  features,
  onSelect,
}: PropertyCardProps) => {
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { toast } = useToast();
  const { formatPrice, getAllCurrencyPrices } = useCurrency();
  const navigate = useNavigate();
  const inWishlist = isInWishlist(id);
  
  const priceValue = typeof price === 'number' ? price : parseFloat(price.replace(/[^0-9.-]+/g, ""));
  const priceString = typeof price === 'string' ? price : formatPrice(price);

  const handleWishlistToggle = async () => {
    if (inWishlist) {
      await removeFromWishlist(id);
      toast({
        title: "Removed from wishlist",
        description: `${title} has been removed from your wishlist.`,
      });
    } else {
      await addToWishlist({
        id,
        type: type === "rent" ? "rental" : "sale",
        title,
        price: priceString,
        location,
        image,
      });
      toast({
        title: "Added to wishlist",
        description: `${title} has been added to your wishlist.`,
      });
    }
  };

  const handleNavigateToDetails = () => {
    navigate(`/property/${id}?type=${type}`);
  };

  return (
    <Card className="overflow-hidden hover:shadow-[var(--shadow-card-hover)] transition-all duration-300">
      <div 
        className="relative h-48 overflow-hidden cursor-pointer"
        onClick={handleNavigateToDetails}
      >
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-4 right-4 bg-accent text-accent-foreground px-3 py-1 rounded-full text-sm font-semibold">
          {type === "rent" ? "For Rent" : "For Sale"}
        </div>
        <Button
          variant="secondary"
          size="icon"
          className="absolute top-4 left-4 z-10"
          onClick={(e) => {
            e.stopPropagation();
            handleWishlistToggle();
          }}
        >
          <Heart
            className="h-4 w-4"
            fill={inWishlist ? "currentColor" : "none"}
          />
        </Button>
        
        {/* Price overlay at bottom-left */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg cursor-help">
                <span className="text-2xl font-bold text-primary">
                  {formatPrice(priceValue)}
                </span>
                {type === "rent" && (
                  <span className="text-muted-foreground text-sm ml-1">/month</span>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent className="bg-background border-border">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground mb-2">Price in all currencies:</p>
                {getAllCurrencyPrices(priceValue).map(({ currency, formatted }) => (
                  <p key={currency} className="text-sm">
                    <span className="font-medium">{currency}:</span> {formatted}
                    {type === "rent" && <span className="text-muted-foreground text-xs ml-1">/month</span>}
                  </p>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <CardContent className="pt-4">
        <h3 
          className="font-semibold text-lg mb-2 cursor-pointer hover:text-primary transition-colors"
          onClick={handleNavigateToDetails}
        >
          {title}
        </h3>
        <p className="text-muted-foreground text-sm mb-3">{location}</p>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {beds && (
            <div className="flex items-center gap-1">
              <Bed className="h-4 w-4" />
              <span>{beds} beds</span>
            </div>
          )}
          {baths && (
            <div className="flex items-center gap-1">
              <Bath className="h-4 w-4" />
              <span>{baths} baths</span>
            </div>
          )}
          {sqft && (
            <div className="flex items-center gap-1">
              <Square className="h-4 w-4" />
              <span>{sqft} sqft</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
      </CardFooter>
    </Card>
  );
};

export default PropertyCard;
