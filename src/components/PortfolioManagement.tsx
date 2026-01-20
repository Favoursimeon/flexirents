import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Upload, X, Star, CheckSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PortfolioImage {
  id: string;
  image_url: string;
  title?: string;
  description?: string;
  category?: string;
  is_featured?: boolean;
}

interface PortfolioManagementProps {
  providerId: string;
  images: PortfolioImage[];
  onUpdate: () => void;
}

const categories = [
  "Before & After",
  "Completed Project",
  "Work in Progress",
  "Client Testimonial",
  "Equipment & Tools",
  "Team",
  "Other"
];

export const PortfolioManagement = ({ providerId, images, onUpdate }: PortfolioManagementProps) => {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No image selected",
        description: "Please select an image to upload",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      // Upload to storage
      const fileName = `${providerId}-${Date.now()}-${selectedFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("portfolio-images")
        .upload(fileName, selectedFile, {
          contentType: selectedFile.type,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("portfolio-images")
        .getPublicUrl(uploadData.path);

      // Save to database
      const { error: dbError } = await supabase
        .from("portfolio_images")
        .insert({
          provider_id: providerId,
          image_url: urlData.publicUrl,
          title: formData.title || null,
          description: formData.description || null,
          category: formData.category || null,
        });

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "Portfolio image uploaded successfully",
      });

      resetForm();
      onUpdate();
    } catch (error: any) {
      console.error("Error uploading image:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Could not upload image",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const toggleImageSelection = (imageId: string) => {
    setSelectedImages(prev => 
      prev.includes(imageId) 
        ? prev.filter(id => id !== imageId)
        : [...prev, imageId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedImages.length === images.length) {
      setSelectedImages([]);
    } else {
      setSelectedImages(images.map(img => img.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedImages.length === 0) return;

    setIsProcessing(true);
    try {
      const imagesToDelete = images.filter(img => selectedImages.includes(img.id));
      
      // Delete from database
      const { error: dbError } = await supabase
        .from("portfolio_images")
        .delete()
        .in("id", selectedImages);

      if (dbError) throw dbError;

      // Delete from storage
      const fileNames = imagesToDelete
        .map(img => img.image_url.split("/").pop())
        .filter(Boolean) as string[];
      
      if (fileNames.length > 0) {
        await supabase.storage.from("portfolio-images").remove(fileNames);
      }

      toast({
        title: "Success",
        description: `${selectedImages.length} image(s) deleted successfully`,
      });

      setSelectedImages([]);
      onUpdate();
    } catch (error: any) {
      console.error("Error deleting images:", error);
      toast({
        title: "Delete failed",
        description: error.message || "Could not delete images",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkToggleFeatured = async (featured: boolean) => {
    if (selectedImages.length === 0) return;

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("portfolio_images")
        .update({ is_featured: featured })
        .in("id", selectedImages);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${selectedImages.length} image(s) ${featured ? "marked as featured" : "removed from featured"}`,
      });

      setSelectedImages([]);
      onUpdate();
    } catch (error: any) {
      console.error("Error updating featured status:", error);
      toast({
        title: "Update failed",
        description: error.message || "Could not update featured status",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleFeatured = async (imageId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("portfolio_images")
        .update({ is_featured: !currentStatus })
        .eq("id", imageId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Image ${!currentStatus ? "marked as featured" : "removed from featured"}`,
      });

      onUpdate();
    } catch (error: any) {
      console.error("Error updating featured status:", error);
      toast({
        title: "Update failed",
        description: error.message || "Could not update featured status",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!imageToDelete) return;

    try {
      const imageToRemove = images.find(img => img.id === imageToDelete);
      if (!imageToRemove) return;

      // Delete from database
      const { error: dbError } = await supabase
        .from("portfolio_images")
        .delete()
        .eq("id", imageToDelete);

      if (dbError) throw dbError;

      // Delete from storage
      const fileName = imageToRemove.image_url.split("/").pop();
      if (fileName) {
        await supabase.storage.from("portfolio-images").remove([fileName]);
      }

      toast({
        title: "Success",
        description: "Portfolio image deleted successfully",
      });

      onUpdate();
    } catch (error: any) {
      console.error("Error deleting image:", error);
      toast({
        title: "Delete failed",
        description: error.message || "Could not delete image",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setImageToDelete(null);
    }
  };

  const resetForm = () => {
    setFormData({ title: "", description: "", category: "" });
    setSelectedFile(null);
    setPreview(null);
    setDialogOpen(false);
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <p className="text-sm text-muted-foreground">
              Showcase your work with project photos ({images.length} images)
            </p>
            {selectedImages.length > 0 && (
              <Badge variant="secondary">
                {selectedImages.length} selected
              </Badge>
            )}
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Image
          </Button>
        </div>

        {selectedImages.length > 0 && (
          <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
            <CheckSquare className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">{selectedImages.length} image(s) selected</span>
            <div className="flex gap-2 ml-auto">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkToggleFeatured(true)}
                disabled={isProcessing}
              >
                <Star className="mr-2 h-4 w-4" />
                Mark Featured
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkToggleFeatured(false)}
                disabled={isProcessing}
              >
                <Star className="mr-2 h-4 w-4" />
                Remove Featured
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleBulkDelete}
                disabled={isProcessing}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedImages([])}
                disabled={isProcessing}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {images.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <Upload className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground mb-4">No portfolio images yet</p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Image
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-4">
              <Checkbox
                checked={selectedImages.length === images.length}
                onCheckedChange={toggleSelectAll}
                id="select-all"
              />
              <Label htmlFor="select-all" className="text-sm cursor-pointer">
                Select all
              </Label>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image) => (
                <Card key={image.id} className={`group relative overflow-hidden transition-all ${selectedImages.includes(image.id) ? 'ring-2 ring-primary' : ''}`}>
                  <CardContent className="p-0">
                    <div className="relative aspect-square">
                      <img
                        src={image.image_url}
                        alt={image.title || "Portfolio"}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2 z-10">
                        <Checkbox
                          checked={selectedImages.includes(image.id)}
                          onCheckedChange={() => toggleImageSelection(image.id)}
                          className="bg-background border-2"
                        />
                      </div>
                      <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="icon"
                          variant={image.is_featured ? "default" : "secondary"}
                          onClick={() => handleToggleFeatured(image.id, image.is_featured || false)}
                          title={image.is_featured ? "Remove from featured" : "Mark as featured"}
                        >
                          <Star className={`h-4 w-4 ${image.is_featured ? "fill-current" : ""}`} />
                        </Button>
                        <Button
                          size="icon"
                          variant="destructive"
                          onClick={() => {
                            setImageToDelete(image.id);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      {image.is_featured && (
                        <Badge className="absolute bottom-2 left-2 bg-primary">
                          <Star className="h-3 w-3 mr-1 fill-current" />
                          Featured
                        </Badge>
                      )}
                    </div>
                    {(image.title || image.category) && (
                      <div className="p-3 space-y-1">
                        {image.category && (
                          <Badge variant="secondary" className="text-xs">
                            {image.category}
                          </Badge>
                        )}
                        {image.title && (
                          <p className="text-sm font-medium line-clamp-2">{image.title}</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Portfolio Image</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="portfolio-upload">Image *</Label>
              <div className="flex flex-col gap-2">
                {preview ? (
                  <div className="relative">
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setSelectedFile(null);
                        setPreview(null);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label
                    htmlFor="portfolio-upload"
                    className="flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Click to upload image</p>
                    <p className="text-xs text-muted-foreground">Max 10MB</p>
                  </label>
                )}
                <input
                  id="portfolio-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title (Optional)</Label>
              <Input
                id="title"
                placeholder="e.g., Kitchen Renovation Project"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category (Optional)</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Describe the project or work shown..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetForm} disabled={uploading}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={uploading || !selectedFile}>
              {uploading ? "Uploading..." : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Portfolio Image</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this image? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setImageToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
