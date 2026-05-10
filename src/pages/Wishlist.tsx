import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useWishlist } from "@/contexts/WishlistContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Wishlist = () => {
  const { wishlist, removeFromWishlist } = useWishlist();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();

  const handleCheckout = (item: any) => {
    if (item.type === "service") {
      navigate("/checkout", { state: { type: "service", service: item } });
    } else if (item.type === "rental") {
      navigate("/checkout", { state: { type: "rental", property: item } });
    } else if (item.type === "sale") {
      navigate("/checkout", { state: { type: "sale", property: item } });
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">My Wishlist</h1>
            <p className="text-muted-foreground text-lg">
              {wishlist.length} {wishlist.length === 1 ? "item" : "items"} saved
            </p>
          </div>

          {wishlist.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-24 h-24 rounded-full bg-secondary/30 mx-auto mb-6 flex items-center justify-center">
                <ShoppingCart className="h-12 w-12 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">Your wishlist is empty</h2>
              <p className="text-muted-foreground mb-6">
                Start adding properties and services you love!
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Button variant="hero" onClick={() => navigate("/rentals")}>
                  Browse Rentals
                </Button>
                <Button variant="outline" onClick={() => navigate("/sales")}>
                  Browse Sales
                </Button>
                <Button variant="outline" onClick={() => navigate("/flexi-assist")}>
                  Browse Services
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {wishlist.map((item) => (
                <Card key={item.id} className="overflow-hidden hover:shadow-[var(--shadow-card-hover)] transition-all">
                  <div className="relative">
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-48 object-cover"
                      />
                    )}
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => removeFromWishlist(item.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                    {item.location && (
                      <p className="text-muted-foreground text-sm mb-2">{item.location}</p>
                    )}
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-accent font-bold text-xl">
                        {item.price && typeof item.price === 'string' && item.price.match(/^\d+$/) 
                          ? formatPrice(parseInt(item.price))
                          : item.price || (item.rate && typeof item.rate === 'string' && item.rate.match(/^\d+$/) 
                            ? formatPrice(parseInt(item.rate)) 
                            : item.rate)
                        }
                      </span>
                      <span className="text-xs bg-secondary px-2 py-1 rounded">
                        {item.type}
                      </span>
                    </div>
                    <Button className="w-full" onClick={() => handleCheckout(item)}>
                      Proceed to Checkout
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Wishlist;
