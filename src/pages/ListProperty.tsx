import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, ChevronDown, Upload, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ghanaRegions } from "@/data/ghanaLocations";

const propertyDescriptions = [
  "Newly Renovated",
  "Move-in Ready",
  "Pet Friendly",
  "Furnished",
  "Unfurnished",
  "Corner Unit",
  "High Ceilings",
  "Natural Light",
  "Open Floor Plan",
  "Hardwood Floors",
];

const propertyAmenities = [
  "Swimming Pool",
  "Gym/Fitness Center",
  "Parking Space",
  "Balcony/Terrace",
  "Air Conditioning",
  "Heating",
  "Laundry Room",
  "Storage Unit",
  "Garden/Yard",
  "Security System",
  "Elevator",
  "Wheelchair Accessible",
];

const propertyFacilities = [
  "24/7 Security",
  "Concierge Service",
  "Playground",
  "BBQ Area",
  "Community Center",
  "Business Center",
  "Guest Parking",
  "Bike Storage",
  "Pet Spa",
  "Rooftop Deck",
  "Package Room",
  "EV Charging",
];

interface PropertyFeaturesSectionProps {
  formData: any;
  setFormData: (data: any) => void;
}

const PropertyFeaturesSection = ({ formData, setFormData }: PropertyFeaturesSectionProps) => {
  const [openSections, setOpenSections] = useState({
    descriptions: false,
    amenities: false,
    facilities: false,
  });

  const handleFeatureToggle = (category: "descriptions" | "amenities" | "facilities", feature: string) => {
    const currentFeatures = formData.features[category];
    const newFeatures = currentFeatures.includes(feature)
      ? currentFeatures.filter((f: string) => f !== feature)
      : [...currentFeatures, feature];
    
    setFormData({
      ...formData,
      features: {
        ...formData.features,
        [category]: newFeatures,
      },
    });
  };

  return (
    <div className="space-y-4">
      {/* Descriptions */}
      <Collapsible
        open={openSections.descriptions}
        onOpenChange={(open) => setOpenSections({ ...openSections, descriptions: open })}
      >
        <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors">
          <span className="font-semibold">Property Descriptions</span>
          <ChevronDown className={`h-5 w-5 transition-transform ${openSections.descriptions ? "rotate-180" : ""}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4 pl-4">
          <div className="grid grid-cols-2 gap-3">
            {propertyDescriptions.map((desc) => (
              <div key={desc} className="flex items-center space-x-2">
                <Checkbox
                  id={`desc-${desc}`}
                  checked={formData.features.descriptions.includes(desc)}
                  onCheckedChange={() => handleFeatureToggle("descriptions", desc)}
                />
                <label
                  htmlFor={`desc-${desc}`}
                  className="text-sm cursor-pointer select-none"
                >
                  {desc}
                </label>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Amenities */}
      <Collapsible
        open={openSections.amenities}
        onOpenChange={(open) => setOpenSections({ ...openSections, amenities: open })}
      >
        <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors">
          <span className="font-semibold">Amenities</span>
          <ChevronDown className={`h-5 w-5 transition-transform ${openSections.amenities ? "rotate-180" : ""}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4 pl-4">
          <div className="grid grid-cols-2 gap-3">
            {propertyAmenities.map((amenity) => (
              <div key={amenity} className="flex items-center space-x-2">
                <Checkbox
                  id={`amenity-${amenity}`}
                  checked={formData.features.amenities.includes(amenity)}
                  onCheckedChange={() => handleFeatureToggle("amenities", amenity)}
                />
                <label
                  htmlFor={`amenity-${amenity}`}
                  className="text-sm cursor-pointer select-none"
                >
                  {amenity}
                </label>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Facilities */}
      <Collapsible
        open={openSections.facilities}
        onOpenChange={(open) => setOpenSections({ ...openSections, facilities: open })}
      >
        <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors">
          <span className="font-semibold">Facilities</span>
          <ChevronDown className={`h-5 w-5 transition-transform ${openSections.facilities ? "rotate-180" : ""}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4 pl-4">
          <div className="grid grid-cols-2 gap-3">
            {propertyFacilities.map((facility) => (
              <div key={facility} className="flex items-center space-x-2">
                <Checkbox
                  id={`facility-${facility}`}
                  checked={formData.features.facilities.includes(facility)}
                  onCheckedChange={() => handleFeatureToggle("facilities", facility)}
                />
                <label
                  htmlFor={`facility-${facility}`}
                  className="text-sm cursor-pointer select-none"
                >
                  {facility}
                </label>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

const ListProperty = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    propertyType: "",
    listingType: "",
    region: "",
    location: "",
    majorCity: "",
    closestLandmark: "",
    price: "",
    bedrooms: "",
    bathrooms: "",
    sqft: "",
    description: "",
    features: {
      descriptions: [] as string[],
      amenities: [] as string[],
      facilities: [] as string[],
    },
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + selectedImages.length > 10) {
      toast({
        title: "Too many images",
        description: "Maximum 10 images allowed",
        variant: "destructive",
      });
      return;
    }

    setSelectedImages([...selectedImages, ...files]);
    
    // Create previews
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to list a property",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    setSubmitting(true);
    try {
      // Upload images to storage
      const imageUrls: string[] = [];
      for (const image of selectedImages) {
        const fileExt = image.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random()}.${fileExt}`;
        
        const { error: uploadError, data } = await supabase.storage
          .from('property-images')
          .upload(fileName, image);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('property-images')
          .getPublicUrl(fileName);
        
        imageUrls.push(publicUrl);
      }

      // Insert property into database
      const { error: insertError } = await supabase
        .from('properties')
        .insert({
          owner_id: user.id,
          title: formData.title,
          property_type: formData.propertyType,
          listing_type: formData.listingType,
          region: formData.region,
          location: formData.location,
          price: parseFloat(formData.price),
          bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
          bathrooms: formData.bathrooms ? parseFloat(formData.bathrooms) : null,
          sqft: formData.sqft ? parseInt(formData.sqft) : null,
          description: formData.description,
          images: imageUrls,
          features: formData.features,
          status: 'pending', // Pending admin approval
        });

      if (insertError) throw insertError;

      toast({
        title: "Property Submitted!",
        description: "Your property has been submitted for admin approval. You'll be notified once it's reviewed.",
      });

      // Reset form
      setFormData({
        title: "",
        propertyType: "",
        listingType: "",
        region: "",
        location: "",
        majorCity: "",
        closestLandmark: "",
        price: "",
        bedrooms: "",
        bathrooms: "",
        sqft: "",
        description: "",
        features: {
          descriptions: [],
          amenities: [],
          facilities: [],
        },
      });
      setSelectedImages([]);
      setImagePreviews([]);
    } catch (error) {
      console.error("Error submitting property:", error);
      toast({
        title: "Error",
        description: "Failed to submit property. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">List Your Property</h1>
            <p className="text-muted-foreground text-lg">
              Submit your property for admin review and approval. Once approved, it will be visible to potential buyers or renters.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Property Information</CardTitle>
              <CardDescription>
                Please provide accurate details about your property
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Property Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Modern 3BR Apartment in Accra"
                    required
                  />
                </div>

                {/* Property Type */}
                <div className="space-y-2">
                  <Label htmlFor="propertyType">Property Type</Label>
                  <Select
                    value={formData.propertyType}
                    onValueChange={(value) => setFormData({ ...formData, propertyType: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select property type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="apartment">Apartment</SelectItem>
                      <SelectItem value="house">House</SelectItem>
                      <SelectItem value="condo">Condo</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="land">Land</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Listing Type */}
                <div className="space-y-2">
                  <Label htmlFor="listingType">Listing Type</Label>
                  <Select
                    value={formData.listingType}
                    onValueChange={(value) => setFormData({ ...formData, listingType: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select listing type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rent">For Rent</SelectItem>
                      <SelectItem value="sale">For Sale</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Region */}
                <div className="space-y-2">
                  <Label htmlFor="region">Region</Label>
                  <Select
                    value={formData.region}
                    onValueChange={(value) => setFormData({ ...formData, region: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      {ghanaRegions.map((region) => (
                        <SelectItem key={region.name} value={region.name}>
                          {region.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <Label htmlFor="location">Specific Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., East Legon, Cantonments"
                    required
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {/* Major City */}
                  <div className="space-y-2">
                    <Label htmlFor="majorCity">Major City</Label>
                    <Input
                      id="majorCity"
                      value={formData.majorCity}
                      onChange={(e) => setFormData({ ...formData, majorCity: e.target.value })}
                      placeholder="e.g., Accra, Kumasi"
                    />
                  </div>

                  {/* Closest Landmark */}
                  <div className="space-y-2">
                    <Label htmlFor="closestLandmark">Closest Landmark</Label>
                    <Input
                      id="closestLandmark"
                      value={formData.closestLandmark}
                      onChange={(e) => setFormData({ ...formData, closestLandmark: e.target.value })}
                      placeholder="e.g., Accra Mall, Airport"
                    />
                  </div>
                </div>

                {/* Price */}
                <div className="space-y-2">
                  <Label htmlFor="price">
                    Price (USD) {formData.listingType === "rent" ? "(per month)" : ""}
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="Enter price in USD"
                    required
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  {/* Bedrooms */}
                  <div className="space-y-2">
                    <Label htmlFor="bedrooms">Bedrooms</Label>
                    <Input
                      id="bedrooms"
                      type="number"
                      value={formData.bedrooms}
                      onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                      placeholder="0"
                    />
                  </div>

                  {/* Bathrooms */}
                  <div className="space-y-2">
                    <Label htmlFor="bathrooms">Bathrooms</Label>
                    <Input
                      id="bathrooms"
                      type="number"
                      step="0.5"
                      value={formData.bathrooms}
                      onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                      placeholder="0"
                    />
                  </div>

                  {/* Square Feet */}
                  <div className="space-y-2">
                    <Label htmlFor="sqft">Square Feet</Label>
                    <Input
                      id="sqft"
                      type="number"
                      value={formData.sqft}
                      onChange={(e) => setFormData({ ...formData, sqft: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Property Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe your property's features and amenities"
                    rows={4}
                    required
                  />
                </div>

                {/* Images Upload (Optional) */}
                <div className="space-y-2">
                  <Label>Property Images (Optional - Max 10)</Label>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground mb-4">
                      Upload images of your property (optional)
                    </p>
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageSelect}
                      className="max-w-xs mx-auto"
                    />
                  </div>

                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeImage(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Property Features */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">Property Features</h3>
                  
                  <PropertyFeaturesSection
                    formData={formData}
                    setFormData={setFormData}
                  />
                </div>

                <div className="bg-secondary/30 p-4 rounded-lg flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold mb-1">Admin Review Process</p>
                    <p className="text-muted-foreground">
                      Your property will be reviewed by our admin team before being published. This ensures quality and accuracy of listings on our platform.
                    </p>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  variant="hero" 
                  size="lg" 
                  className="w-full"
                  disabled={submitting}
                >
                  {submitting ? "Submitting..." : "Submit Property for Approval"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ListProperty;
