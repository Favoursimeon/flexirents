import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  History, 
  Download, 
  RotateCcw, 
  Upload, 
  Trash2, 
  FileText,
  Loader2,
  Clock
} from "lucide-react";

interface DocumentVersionHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: {
    id: string;
    file_name: string;
    file_url: string;
    file_size: number | null;
  } | null;
}

interface DocumentVersion {
  id: string;
  document_id: string;
  version_number: number;
  file_url: string;
  file_name: string;
  file_size: number | null;
  created_by: string;
  created_at: string;
  notes: string | null;
  is_current: boolean;
}

export const DocumentVersionHistory = ({
  open,
  onOpenChange,
  document,
}: DocumentVersionHistoryProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [versionNotes, setVersionNotes] = useState("");

  // Fetch versions for this document
  const { data: versions = [], isLoading } = useQuery({
    queryKey: ["document-versions", document?.id],
    queryFn: async () => {
      if (!document?.id) return [];
      const { data, error } = await supabase
        .from("document_versions")
        .select("*")
        .eq("document_id", document.id)
        .order("version_number", { ascending: false });

      if (error) throw error;
      return data as DocumentVersion[];
    },
    enabled: !!document?.id && open,
  });

  // Upload new version mutation
  const uploadVersionMutation = useMutation({
    mutationFn: async ({ file, notes }: { file: File; notes: string }) => {
      if (!user || !document?.id) throw new Error("Not authenticated");

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}-v${(versions.length || 0) + 1}.${fileExt}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Mark all existing versions as not current
      if (versions.length > 0) {
        await supabase
          .from("document_versions")
          .update({ is_current: false })
          .eq("document_id", document.id);
      }

      // If this is the first version, save the current file as version 1
      if (versions.length === 0) {
        await supabase.from("document_versions").insert({
          document_id: document.id,
          version_number: 1,
          file_url: document.file_url,
          file_name: document.file_name,
          file_size: document.file_size,
          created_by: user.id,
          notes: "Original version",
          is_current: false,
        });
      }

      // Create new version record
      const newVersionNumber = (versions.length || 0) + (versions.length === 0 ? 2 : 1);
      const { error: versionError } = await supabase.from("document_versions").insert({
        document_id: document.id,
        version_number: newVersionNumber,
        file_url: fileName,
        file_name: file.name,
        file_size: file.size,
        created_by: user.id,
        notes: notes || null,
        is_current: true,
      });

      if (versionError) throw versionError;

      // Update the main document with new file
      const { error: updateError } = await supabase
        .from("documents")
        .update({
          file_url: fileName,
          file_name: file.name,
          file_size: file.size,
        })
        .eq("id", document.id);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-versions", document?.id] });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("New version uploaded successfully");
      setSelectedFile(null);
      setVersionNotes("");
    },
    onError: (error) => {
      console.error("Error uploading version:", error);
      toast.error("Failed to upload new version");
    },
  });

  // Restore version mutation
  const restoreVersionMutation = useMutation({
    mutationFn: async (version: DocumentVersion) => {
      if (!user || !document?.id) throw new Error("Not authenticated");

      // Mark all versions as not current
      await supabase
        .from("document_versions")
        .update({ is_current: false })
        .eq("document_id", document.id);

      // Create a new version that's a copy of the restored version
      const newVersionNumber = (versions[0]?.version_number || 0) + 1;
      await supabase.from("document_versions").insert({
        document_id: document.id,
        version_number: newVersionNumber,
        file_url: version.file_url,
        file_name: version.file_name,
        file_size: version.file_size,
        created_by: user.id,
        notes: `Restored from version ${version.version_number}`,
        is_current: true,
      });

      // Update main document
      const { error: updateError } = await supabase
        .from("documents")
        .update({
          file_url: version.file_url,
          file_name: version.file_name,
          file_size: version.file_size,
        })
        .eq("id", document.id);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-versions", document?.id] });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Version restored successfully");
    },
    onError: (error) => {
      console.error("Error restoring version:", error);
      toast.error("Failed to restore version");
    },
  });

  // Delete version mutation
  const deleteVersionMutation = useMutation({
    mutationFn: async (version: DocumentVersion) => {
      if (version.is_current) {
        throw new Error("Cannot delete current version");
      }

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("documents")
        .remove([version.file_url]);

      if (storageError) console.warn("Storage delete error:", storageError);

      // Delete version record
      const { error } = await supabase
        .from("document_versions")
        .delete()
        .eq("id", version.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-versions", document?.id] });
      toast.success("Version deleted");
    },
    onError: (error) => {
      console.error("Error deleting version:", error);
      toast.error("Failed to delete version");
    },
  });

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file");
      return;
    }
    setUploading(true);
    await uploadVersionMutation.mutateAsync({ file: selectedFile, notes: versionNotes });
    setUploading(false);
  };

  const handleDownloadVersion = async (version: DocumentVersion) => {
    const { data, error } = await supabase.storage
      .from("documents")
      .download(version.file_url);

    if (error) {
      toast.error("Failed to download version");
      return;
    }

    const url = URL.createObjectURL(data);
    const a = window.document.createElement("a");
    a.href = url;
    a.download = version.file_name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "Unknown";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Version History
          </DialogTitle>
          <DialogDescription>
            View and manage versions of "{document?.file_name}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Upload new version */}
          <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload New Version
            </h4>
            <div className="space-y-3">
              <div>
                <Input
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="cursor-pointer"
                />
              </div>
              <div>
                <Label htmlFor="version-notes" className="text-xs text-muted-foreground">
                  Version notes (optional)
                </Label>
                <Input
                  id="version-notes"
                  placeholder="What changed in this version?"
                  value={versionNotes}
                  onChange={(e) => setVersionNotes(e.target.value)}
                />
              </div>
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                size="sm"
                className="w-full"
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {uploading ? "Uploading..." : "Upload New Version"}
              </Button>
            </div>
          </div>

          <Separator />

          {/* Version list */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Version History</h4>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : versions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No version history yet</p>
                <p className="text-xs">Upload a new version to start tracking changes</p>
              </div>
            ) : (
              <ScrollArea className="h-[250px]">
                <div className="space-y-2 pr-4">
                  {versions.map((version) => (
                    <div
                      key={version.id}
                      className={`p-3 rounded-lg border ${
                        version.is_current ? "bg-primary/5 border-primary/30" : "bg-card"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">
                              Version {version.version_number}
                            </span>
                            {version.is_current && (
                              <Badge variant="default" className="text-xs">
                                Current
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {version.file_name}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {format(new Date(version.created_at), "MMM d, yyyy 'at' h:mm a")}
                            <span>•</span>
                            <span>{formatFileSize(version.file_size)}</span>
                          </div>
                          {version.notes && (
                            <p className="text-xs text-muted-foreground mt-1 italic">
                              "{version.notes}"
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleDownloadVersion(version)}
                            title="Download this version"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                          
                          {!version.is_current && (
                            <>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    title="Restore this version"
                                  >
                                    <RotateCcw className="h-3.5 w-3.5" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Restore Version</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will restore version {version.version_number} as the current version.
                                      A new version entry will be created.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => restoreVersionMutation.mutate(version)}
                                    >
                                      Restore
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>

                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-destructive hover:text-destructive"
                                    title="Delete this version"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Version</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete version {version.version_number}?
                                      This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteVersionMutation.mutate(version)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
