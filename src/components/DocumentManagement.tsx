import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { FileText, Upload, Trash2, Download, Eye, Loader2, File, FileImage, FileArchive, FolderPlus, Folder, FolderOpen, MoreVertical, Pencil, Search, X, CheckSquare, Square, FolderInput, Share2, History } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ShareDocumentDialog } from "./ShareDocumentDialog";
import { DocumentVersionHistory } from "./DocumentVersionHistory";

interface Document {
  id: string;
  owner_id: string;
  property_id: string | null;
  lease_id: string | null;
  document_type: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  description: string | null;
  uploaded_by: string;
  folder: string | null;
  created_at: string;
  updated_at: string;
}

interface DocumentFolder {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon: string;
  created_at: string;
  updated_at: string;
}

const DOCUMENT_TYPES = [
  { value: "lease_agreement", label: "Lease Agreement" },
  { value: "contract", label: "Contract" },
  { value: "tenant_id", label: "Tenant ID" },
  { value: "proof_of_income", label: "Proof of Income" },
  { value: "utility_bill", label: "Utility Bill" },
  { value: "insurance", label: "Insurance Document" },
  { value: "other", label: "Other" },
];

const FOLDER_COLORS = [
  { value: "#6366f1", label: "Indigo" },
  { value: "#8b5cf6", label: "Violet" },
  { value: "#ec4899", label: "Pink" },
  { value: "#f43f5e", label: "Rose" },
  { value: "#f97316", label: "Orange" },
  { value: "#eab308", label: "Yellow" },
  { value: "#22c55e", label: "Green" },
  { value: "#14b8a6", label: "Teal" },
  { value: "#0ea5e9", label: "Sky" },
  { value: "#6b7280", label: "Gray" },
];

const getFileIcon = (fileName: string) => {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext || "")) return FileImage;
  if (["zip", "rar", "7z"].includes(ext || "")) return FileArchive;
  return File;
};

const formatFileSize = (bytes: number | null) => {
  if (!bytes) return "Unknown";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export function DocumentManagement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFolder, setSelectedFolder] = useState("General");
  const [filterType, setFilterType] = useState<string>("all");
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderColor, setNewFolderColor] = useState("#6366f1");
  const [editingFolder, setEditingFolder] = useState<DocumentFolder | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());
  const [isBulkMoveOpen, setIsBulkMoveOpen] = useState(false);
  const [shareDocument, setShareDocument] = useState<Document | null>(null);
  const [versionHistoryDocument, setVersionHistoryDocument] = useState<Document | null>(null);

  const { data: documents, isLoading } = useQuery({
    queryKey: ["documents", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Document[];
    },
    enabled: !!user,
  });

  const { data: folders } = useQuery({
    queryKey: ["document-folders", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("document_folders")
        .select("*")
        .order("name", { ascending: true });
      
      if (error) throw error;
      return data as DocumentFolder[];
    },
    enabled: !!user,
  });

  const createFolderMutation = useMutation({
    mutationFn: async ({ name, color }: { name: string; color: string }) => {
      if (!user) throw new Error("Not authenticated");
      
      const { error } = await supabase.from("document_folders").insert({
        user_id: user.id,
        name,
        color,
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-folders"] });
      toast.success("Folder created successfully");
      setIsFolderDialogOpen(false);
      setNewFolderName("");
      setNewFolderColor("#6366f1");
    },
    onError: (error) => {
      toast.error("Failed to create folder: " + error.message);
    },
  });

  const updateFolderMutation = useMutation({
    mutationFn: async ({ id, name, color }: { id: string; name: string; color: string }) => {
      const { error } = await supabase
        .from("document_folders")
        .update({ name, color })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-folders"] });
      toast.success("Folder updated successfully");
      setEditingFolder(null);
    },
    onError: (error) => {
      toast.error("Failed to update folder: " + error.message);
    },
  });

  const deleteFolderMutation = useMutation({
    mutationFn: async (folderId: string) => {
      const { error } = await supabase
        .from("document_folders")
        .delete()
        .eq("id", folderId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-folders"] });
      toast.success("Folder deleted successfully");
      if (activeFolder) setActiveFolder(null);
    },
    onError: (error) => {
      toast.error("Failed to delete folder: " + error.message);
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ file, documentType, description, folder }: { file: File; documentType: string; description: string; folder: string }) => {
      if (!user) throw new Error("Not authenticated");

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from("documents").insert({
        owner_id: user.id,
        uploaded_by: user.id,
        document_type: documentType,
        file_name: file.name,
        file_url: fileName,
        file_size: file.size,
        description: description || null,
        folder: folder,
      });

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Document uploaded successfully");
      setIsUploadOpen(false);
      setSelectedFile(null);
      setDocumentType("");
      setDescription("");
      setSelectedFolder("General");
    },
    onError: (error) => {
      toast.error("Failed to upload document: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (document: Document) => {
      const { error: storageError } = await supabase.storage
        .from("documents")
        .remove([document.file_url]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from("documents")
        .delete()
        .eq("id", document.id);

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Document deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete document: " + error.message);
    },
  });

  const moveDocumentMutation = useMutation({
    mutationFn: async ({ documentId, folder }: { documentId: string; folder: string }) => {
      const { error } = await supabase
        .from("documents")
        .update({ folder })
        .eq("id", documentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Document moved successfully");
    },
    onError: (error) => {
      toast.error("Failed to move document: " + error.message);
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (documentIds: string[]) => {
      const docsToDelete = documents?.filter(d => documentIds.includes(d.id)) || [];
      
      // Delete from storage
      const fileUrls = docsToDelete.map(d => d.file_url);
      if (fileUrls.length > 0) {
        const { error: storageError } = await supabase.storage
          .from("documents")
          .remove(fileUrls);
        if (storageError) throw storageError;
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from("documents")
        .delete()
        .in("id", documentIds);

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      setSelectedDocuments(new Set());
      toast.success("Documents deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete documents: " + error.message);
    },
  });

  const bulkMoveMutation = useMutation({
    mutationFn: async ({ documentIds, folder }: { documentIds: string[]; folder: string }) => {
      const { error } = await supabase
        .from("documents")
        .update({ folder })
        .in("id", documentIds);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      setSelectedDocuments(new Set());
      setIsBulkMoveOpen(false);
      toast.success("Documents moved successfully");
    },
    onError: (error) => {
      toast.error("Failed to move documents: " + error.message);
    },
  });

  const handleUpload = async () => {
    if (!selectedFile || !documentType) {
      toast.error("Please select a file and document type");
      return;
    }
    setUploading(true);
    await uploadMutation.mutateAsync({ file: selectedFile, documentType, description, folder: selectedFolder });
    setUploading(false);
  };

  const handleDownload = async (document: Document) => {
    const { data, error } = await supabase.storage
      .from("documents")
      .download(document.file_url);

    if (error) {
      toast.error("Failed to download document");
      return;
    }

    const url = URL.createObjectURL(data);
    const a = window.document.createElement("a");
    a.href = url;
    a.download = document.file_name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePreview = async (document: Document) => {
    const { data: signedData, error } = await supabase.storage
      .from("documents")
      .createSignedUrl(document.file_url, 3600);

    if (error) {
      toast.error("Failed to preview document");
      return;
    }

    window.open(signedData.signedUrl, "_blank");
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      toast.error("Please enter a folder name");
      return;
    }
    createFolderMutation.mutate({ name: newFolderName.trim(), color: newFolderColor });
  };

  const handleUpdateFolder = () => {
    if (!editingFolder || !newFolderName.trim()) return;
    updateFolderMutation.mutate({ id: editingFolder.id, name: newFolderName.trim(), color: newFolderColor });
  };

  const handleSelectDocument = (docId: string, checked: boolean) => {
    const newSelected = new Set(selectedDocuments);
    if (checked) {
      newSelected.add(docId);
    } else {
      newSelected.delete(docId);
    }
    setSelectedDocuments(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked && filteredDocuments) {
      setSelectedDocuments(new Set(filteredDocuments.map(d => d.id)));
    } else {
      setSelectedDocuments(new Set());
    }
  };

  // Get all unique folders from documents and custom folders
  const allFolders = [
    "General",
    ...(folders?.map(f => f.name) || []),
  ];

  const uniqueFolders = [...new Set(allFolders)];

  const filteredDocuments = documents?.filter(doc => {
    const matchesType = filterType === "all" || doc.document_type === filterType;
    const matchesFolder = activeFolder === null || doc.folder === activeFolder;
    const matchesSearch = searchQuery === "" || 
      doc.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.description && doc.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesType && matchesFolder && matchesSearch;
  });

  const isAllSelected = filteredDocuments && filteredDocuments.length > 0 && 
    filteredDocuments.every(d => selectedDocuments.has(d.id));

  const isSomeSelected = selectedDocuments.size > 0;

  const getDocumentTypeLabel = (type: string) => {
    return DOCUMENT_TYPES.find(t => t.value === type)?.label || type;
  };

  const getFolderColor = (folderName: string) => {
    const folder = folders?.find(f => f.name === folderName);
    return folder?.color || "#6b7280";
  };

  const getDocumentCountByFolder = (folderName: string) => {
    return documents?.filter(d => d.folder === folderName).length || 0;
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Please sign in to manage your documents.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Document Management</h2>
          <p className="text-muted-foreground">
            Securely store and manage your lease agreements, contracts, and important documents.
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isFolderDialogOpen} onOpenChange={setIsFolderDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <FolderPlus className="h-4 w-4 mr-2" />
                New Folder
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Folder</DialogTitle>
                <DialogDescription>
                  Create a folder to organize your documents.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="folderName">Folder Name</Label>
                  <Input
                    id="folderName"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="e.g., Property Contracts"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Folder Color</Label>
                  <div className="flex flex-wrap gap-2">
                    {FOLDER_COLORS.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => setNewFolderColor(color.value)}
                        className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                          newFolderColor === color.value ? "border-foreground scale-110" : "border-transparent"
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.label}
                      />
                    ))}
                  </div>
                </div>
                <Button onClick={handleCreateFolder} className="w-full" disabled={createFolderMutation.isPending}>
                  {createFolderMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <FolderPlus className="h-4 w-4 mr-2" />
                  )}
                  Create Folder
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload New Document</DialogTitle>
                <DialogDescription>
                  Upload a document to your secure storage.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="file">Select File</Label>
                  <Input
                    id="file"
                    type="file"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.zip"
                  />
                  {selectedFile && (
                    <p className="text-sm text-muted-foreground">
                      {selectedFile.name} ({formatFileSize(selectedFile.size)})
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Document Type</Label>
                  <Select value={documentType} onValueChange={setDocumentType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select document type" />
                    </SelectTrigger>
                    <SelectContent>
                      {DOCUMENT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="folder">Folder</Label>
                  <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select folder" />
                    </SelectTrigger>
                    <SelectContent>
                      {uniqueFolders.map((folder) => (
                        <SelectItem key={folder} value={folder}>
                          <div className="flex items-center gap-2">
                            <Folder className="h-4 w-4" style={{ color: getFolderColor(folder) }} />
                            {folder}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add a description for this document..."
                  />
                </div>
                <Button 
                  onClick={handleUpload} 
                  disabled={uploading || !selectedFile || !documentType}
                  className="w-full"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Document
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Folder Navigation */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={activeFolder === null ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveFolder(null)}
          className="gap-2"
        >
          <Folder className="h-4 w-4" />
          All Documents
          <Badge variant="secondary" className="ml-1">
            {documents?.length || 0}
          </Badge>
        </Button>
        {uniqueFolders.map((folderName) => {
          const isActive = activeFolder === folderName;
          const folder = folders?.find(f => f.name === folderName);
          const color = folder?.color || "#6b7280";
          const count = getDocumentCountByFolder(folderName);
          
          return (
            <div key={folderName} className="relative group">
              <Button
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFolder(folderName)}
                className="gap-2"
              >
                {isActive ? (
                  <FolderOpen className="h-4 w-4" style={{ color: isActive ? undefined : color }} />
                ) : (
                  <Folder className="h-4 w-4" style={{ color }} />
                )}
                {folderName}
                <Badge variant="secondary" className="ml-1">
                  {count}
                </Badge>
              </Button>
              {folder && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => {
                      setEditingFolder(folder);
                      setNewFolderName(folder.name);
                      setNewFolderColor(folder.color);
                    }}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit Folder
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => deleteFolderMutation.mutate(folder.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Folder
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          );
        })}
      </div>

      {/* Edit Folder Dialog */}
      <Dialog open={!!editingFolder} onOpenChange={(open) => !open && setEditingFolder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Folder</DialogTitle>
            <DialogDescription>
              Update the folder name or color.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="editFolderName">Folder Name</Label>
              <Input
                id="editFolderName"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Folder Color</Label>
              <div className="flex flex-wrap gap-2">
                {FOLDER_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setNewFolderColor(color.value)}
                    className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                      newFolderColor === color.value ? "border-foreground scale-110" : "border-transparent"
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.label}
                  />
                ))}
              </div>
            </div>
            <Button onClick={handleUpdateFolder} className="w-full" disabled={updateFolderMutation.isPending}>
              {updateFolderMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Pencil className="h-4 w-4 mr-2" />
              )}
              Update Folder
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Label className="whitespace-nowrap">Filter by type:</Label>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Documents</SelectItem>
              {DOCUMENT_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {isSomeSelected && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="flex items-center justify-between p-3">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={isAllSelected}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm font-medium">
                {selectedDocuments.size} document{selectedDocuments.size > 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Dialog open={isBulkMoveOpen} onOpenChange={setIsBulkMoveOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <FolderInput className="h-4 w-4 mr-2" />
                    Move to Folder
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Move Documents to Folder</DialogTitle>
                    <DialogDescription>
                      Select a folder to move {selectedDocuments.size} document{selectedDocuments.size > 1 ? 's' : ''} to.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-2 pt-4">
                    {uniqueFolders.map((folder) => (
                      <Button
                        key={folder}
                        variant="outline"
                        className="justify-start"
                        onClick={() => bulkMoveMutation.mutate({ 
                          documentIds: Array.from(selectedDocuments), 
                          folder 
                        })}
                        disabled={bulkMoveMutation.isPending}
                      >
                        <Folder className="h-4 w-4 mr-2" style={{ color: getFolderColor(folder) }} />
                        {folder}
                      </Button>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Selected
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Documents</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete {selectedDocuments.size} document{selectedDocuments.size > 1 ? 's' : ''}? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => bulkDeleteMutation.mutate(Array.from(selectedDocuments))}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setSelectedDocuments(new Set())}
              >
                Clear Selection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredDocuments?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No documents yet</h3>
            <p className="text-muted-foreground">
              Upload your first document using the button above to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {/* Select All Header when documents exist */}
          {filteredDocuments && filteredDocuments.length > 0 && (
            <div className="flex items-center gap-3 px-4 py-2 border-b">
              <Checkbox
                checked={isAllSelected}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm text-muted-foreground">
                Select all ({filteredDocuments.length})
              </span>
            </div>
          )}
          {filteredDocuments?.map((doc) => {
            const FileIcon = getFileIcon(doc.file_name);
            const isSelected = selectedDocuments.has(doc.id);
            return (
              <Card key={doc.id} className={isSelected ? "ring-2 ring-primary" : ""}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => handleSelectDocument(doc.id, checked as boolean)}
                    />
                    <div className="p-3 bg-muted rounded-lg">
                      <FileIcon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">{doc.file_name}</h4>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant="secondary">
                          {getDocumentTypeLabel(doc.document_type)}
                        </Badge>
                        {doc.folder && (
                          <Badge 
                            variant="outline" 
                            className="gap-1"
                            style={{ borderColor: getFolderColor(doc.folder) }}
                          >
                            <Folder className="h-3 w-3" style={{ color: getFolderColor(doc.folder) }} />
                            {doc.folder}
                          </Badge>
                        )}
                        <span className="text-sm text-muted-foreground">
                          {formatFileSize(doc.file_size)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          • {format(new Date(doc.created_at), "MMM d, yyyy")}
                        </span>
                      </div>
                      {doc.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {doc.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" title="Move to folder">
                          <Folder className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {uniqueFolders.map((folder) => (
                          <DropdownMenuItem
                            key={folder}
                            onClick={() => moveDocumentMutation.mutate({ documentId: doc.id, folder })}
                            disabled={doc.folder === folder}
                          >
                            <Folder className="h-4 w-4 mr-2" style={{ color: getFolderColor(folder) }} />
                            {folder}
                            {doc.folder === folder && " (current)"}
                          </DropdownMenuItem>
                        ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShareDocument(doc)}
                      title="Share"
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setVersionHistoryDocument(doc)}
                      title="Version History"
                    >
                      <History className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handlePreview(doc)}
                      title="Preview"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDownload(doc)}
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Document</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{doc.file_name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMutation.mutate(doc)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Share Document Dialog */}
      <ShareDocumentDialog
        open={!!shareDocument}
        onOpenChange={(open) => !open && setShareDocument(null)}
        document={shareDocument}
      />

      {/* Version History Dialog */}
      <DocumentVersionHistory
        open={!!versionHistoryDocument}
        onOpenChange={(open) => !open && setVersionHistoryDocument(null)}
        document={versionHistoryDocument}
      />
    </div>
  );
}