import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";

interface VendorCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  vendorCount: number;
  onExplore: () => void;
}

const VendorCard = ({ icon, title, description, vendorCount, onExplore }: VendorCardProps) => {
  return (
    <Card className="group hover:shadow-[var(--shadow-card-hover)] transition-all duration-300 border-border/50 hover:border-primary/30 bg-card">
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 text-primary group-hover:from-primary/20 group-hover:to-accent/20 transition-all">
            {icon}
          </div>
          <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            Verified
          </Badge>
        </div>
        <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
          {title}
        </h3>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4 leading-relaxed">
          {description}
        </p>
        <p className="text-sm font-medium text-foreground">
          {vendorCount}+ verified vendors available
        </p>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={onExplore} 
          className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all"
          variant="outline"
        >
          Explore Vendors
        </Button>
      </CardFooter>
    </Card>
  );
};

export default VendorCard;
