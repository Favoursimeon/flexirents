import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, X, Image as ImageIcon, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PortfolioImage {
  id: string;
  image_url: string;
  title?: string;
  description?: string;
  category?: string;
  is_featured?: boolean;
}

interface PortfolioGalleryProps {
  images: PortfolioImage[];
}

export const PortfolioGallery = ({ images }: PortfolioGalleryProps) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (!images || images.length === 0) {
    return (
      <div className="text-center py-12 bg-muted/30 rounded-lg">
        <ImageIcon className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
        <p className="text-muted-foreground">No portfolio images yet</p>
      </div>
    );
  }

  // Sort images: featured first, then by created date
  const sortedImages = [...images].sort((a, b) => {
    if (a.is_featured && !b.is_featured) return -1;
    if (!a.is_featured && b.is_featured) return 1;
    return 0;
  });

  const handlePrevious = () => {
    if (selectedIndex === null) return;
    setSelectedIndex((selectedIndex - 1 + sortedImages.length) % sortedImages.length);
  };

  const handleNext = () => {
    if (selectedIndex === null) return;
    setSelectedIndex((selectedIndex + 1) % sortedImages.length);
  };

  const selectedImage = selectedIndex !== null ? sortedImages[selectedIndex] : null;
  const featuredImages = sortedImages.filter(img => img.is_featured);
  const regularImages = sortedImages.filter(img => !img.is_featured);

  return (
    <>
      {featuredImages.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Star className="h-5 w-5 text-primary fill-current" />
            <h3 className="text-lg font-semibold">Featured Work</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {featuredImages.map((image, index) => (
              <div
                key={image.id}
                className="group relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 border-primary shadow-lg hover:shadow-xl transition-all"
                onClick={() => setSelectedIndex(sortedImages.indexOf(image))}
              >
                <img
                  src={image.image_url}
                  alt={image.title || `Featured portfolio image ${index + 1}`}
                  className="w-full h-full object-cover transition-transform group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <Badge className="mb-1 bg-primary">
                      <Star className="h-3 w-3 mr-1 fill-current" />
                      Featured
                    </Badge>
                    {image.category && (
                      <Badge variant="secondary" className="mb-1 ml-1 text-xs">
                        {image.category}
                      </Badge>
                    )}
                    {image.title && (
                      <p className="text-white text-sm font-medium line-clamp-2 mt-1">
                        {image.title}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {regularImages.length > 0 && (
        <>
          {featuredImages.length > 0 && (
            <h3 className="text-lg font-semibold mb-4">All Work</h3>
          )}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {regularImages.map((image, index) => (
              <div
                key={image.id}
                className="group relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 border-border hover:border-primary transition-all"
                onClick={() => setSelectedIndex(sortedImages.indexOf(image))}
              >
                <img
                  src={image.image_url}
                  alt={image.title || `Portfolio image ${index + 1}`}
                  className="w-full h-full object-cover transition-transform group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    {image.category && (
                      <Badge variant="secondary" className="mb-1 text-xs">
                        {image.category}
                      </Badge>
                    )}
                    {image.title && (
                      <p className="text-white text-sm font-medium line-clamp-2">
                        {image.title}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <Dialog open={selectedIndex !== null} onOpenChange={() => setSelectedIndex(null)}>
        <DialogContent className="max-w-4xl p-0">
          {selectedImage && (
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 z-10 bg-black/50 hover:bg-black/70 text-white"
                onClick={() => setSelectedIndex(null)}
              >
                <X className="h-4 w-4" />
              </Button>

              {sortedImages.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white"
                    onClick={handlePrevious}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white"
                    onClick={handleNext}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                </>
              )}

              <img
                src={selectedImage.image_url}
                alt={selectedImage.title || "Portfolio image"}
                className="w-full max-h-[70vh] object-contain bg-black"
              />

              {(selectedImage.title || selectedImage.description || selectedImage.category) && (
                <div className="p-6 space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    {selectedImage.title && (
                      <h3 className="text-xl font-semibold">{selectedImage.title}</h3>
                    )}
                    {selectedImage.category && (
                      <Badge variant="secondary">{selectedImage.category}</Badge>
                    )}
                  </div>
                  {selectedImage.description && (
                    <p className="text-muted-foreground">{selectedImage.description}</p>
                  )}
                  {selectedImage.is_featured && (
                    <Badge className="bg-primary mb-2">
                      <Star className="h-3 w-3 mr-1 fill-current" />
                      Featured
                    </Badge>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Image {(selectedIndex || 0) + 1} of {sortedImages.length}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
