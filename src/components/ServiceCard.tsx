import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Heart } from "lucide-react";
import { useWishlist } from "@/contexts/WishlistContext";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/contexts/CurrencyContext";

interface ServiceCardProps {
  id: number;
  icon: React.ReactNode;
  title: string;
  description: string;
  rate: string;
  onSelect?: () => void;
}

const ServiceCard = ({ id, icon, title, description, rate, onSelect }: ServiceCardProps) => {
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { toast } = useToast();
  const { formatPrice } = useCurrency();
  const inWishlist = isInWishlist(id);
  
  const rateValue = parseFloat(rate.replace(/[^0-9.-]+/g, ""));

  const handleWishlistToggle = () => {
    if (inWishlist) {
      removeFromWishlist(id);
      toast({
        title: "Removed from wishlist",
        description: `${title} has been removed from your wishlist.`,
      });
    } else {
      addToWishlist({
        id,
        type: "service",
        title,
        rate,
      });
      toast({
        title: "Added to wishlist",
        description: `${title} has been added to your wishlist.`,
      });
    }
  };

  return (
    <Card className="hover:shadow-[var(--shadow-card-hover)] transition-all duration-300 relative">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 z-10"
        onClick={handleWishlistToggle}
      >
        <Heart
          className="h-4 w-4"
          fill={inWishlist ? "currentColor" : "none"}
        />
      </Button>
      <CardContent className="pt-6">
        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-accent/10 text-accent mb-4">
          {icon}
        </div>
        <h3 className="font-semibold text-lg mb-2">{title}</h3>
        <p className="text-muted-foreground text-sm mb-4">{description}</p>
        <div className="flex items-center gap-2 text-primary font-semibold">
          <Clock className="h-4 w-4" />
          <span>{formatPrice(rateValue)}/hr</span>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full" variant="outline" onClick={onSelect}>
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ServiceCard;
