import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { FileText, Upload, Trash2, Download, Eye, FolderPlus, Folder, Search, MoreVertical, Share2, History, CheckSquare, Move } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DocumentVersionHistory } from "./DocumentVersionHistory";
import { ShareDocumentDialog } from "./ShareDocumentDialog";
import api from "@/lib/api";

interface Document {
  id: string;
  user_id: string;
  file_name: string;
  file_url: string;
  document_type: string;
  description: string | null;
  folder: string;
  file_size: number | null;
  mime_type: string | null;
  created_at: string;
  updated_at: string;
}

interface DocumentFolder {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

const DOCUMENT_TYPES = [
  "ID Document", "Proof of Income", "Employment Letter", "Bank Statement",
  "Rental Agreement", "Reference Letter", "Utility Bill", "Other"
];

export const DocumentManagement = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
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
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);

  const { data: documents, isLoading } = useQuery({
    queryKey: ["documents", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await api.get('/api/documents');
      return data as Document[];
    },
    enabled: !!user,
  });

  const { data: folders } = useQuery({
    queryKey: ["document-folders", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await api.get('/api/documents/folders');
      return data as DocumentFolder[];
    },
    enabled: !!user,
  });

  const createFolderMutation = useMutation({
    mutationFn: async ({ name, color }: { name: string; color: string }) => {
      await api.post('/api/documents/folders', { name, color });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-folders"] });
      toast.success("Folder created successfully");
      setIsFolderDialogOpen(false);
      setNewFolderName("");
      setNewFolderColor("#6366f1");
    },
    onError: () => toast.error("Failed to create folder"),
  });

  const updateFolderMutation = useMutation({
    mutationFn: async ({ id, name, color }: { id: string; name: string; color: string }) => {
      await api.put(`/api/documents/folders/${id}`, { name, color });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-folders"] });
      toast.success("Folder updated");
      setEditingFolder(null);
    },
    onError: () => toast.error("Failed to update folder"),
  });

  const deleteFolderMutation = useMutation({
    mutationFn: async (folderId: string) => {
      await api.delete(`/api/documents/folders/${folderId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-folders"] });
      toast.success("Folder deleted");
      if (activeFolder) setActiveFolder(null);
    },
    onError: () => toast.error("Failed to delete folder"),
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ file, documentType, description, folder }: { file: File; documentType: string; description: string; folder: string }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('document_type', documentType);
      formData.append('description', description);
      formData.append('folder', folder);
      await api.post('/api/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Document uploaded successfully");
      setIsUploadOpen(false);
      setSelectedFile(null);
      setDocumentType("");
      setDescription("");
    },
    onError: () => toast.error("Failed to upload document"),
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: async (document: Document) => {
      await api.delete(`/api/documents/${document.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Document deleted");
    },
    onError: () => toast.error("Failed to delete document"),
  });

  const moveDocumentMutation = useMutation({
    mutationFn: async ({ documentId, folder }: { documentId: string; folder: string }) => {
      await api.patch(`/api/documents/${documentId}/folder`, { folder });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Document moved");
    },
    onError: () => toast.error("Failed to move document"),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (documentIds: string[]) => {
      await api.post('/api/documents/bulk-delete', { ids: documentIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Documents deleted");
      setSelectedDocuments(new Set());
    },
    onError: () => toast.error("Failed to delete documents"),
  });

  const bulkMoveMutation = useMutation({
    mutationFn: async ({ documentIds, folder }: { documentIds: string[]; folder: string }) => {
      await api.post('/api/documents/bulk-move', { ids: documentIds, folder });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Documents moved");
      setSelectedDocuments(new Set());
      setIsBulkMoveOpen(false);
    },
    onError: () => toast.error("Failed to move documents"),
  });

  const handleUpload = async () => {
    if (!selectedFile || !documentType) {
      toast.error("Please select a file and document type");
      return;
    }
    await uploadMutation.mutateAsync({ file: selectedFile, documentType, description, folder: selectedFolder });
  };

  const handleDownload = async (document: Document) => {
    try {
      const response = await api.get(`/api/documents/${document.id}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = window.document.createElement('a');
      link.href = url;
      link.setAttribute('download', document.file_name);
      window.document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      toast.error("Failed to download document");
    }
  };

  const handlePreview = async (document: Document) => {
    try {
      const { data } = await api.get(`/api/documents/${document.id}/preview-url`);
      if (data?.url) window.open(data.url, '_blank');
    } catch {
      toast.error("Failed to preview document");
    }
  };

  const toggleDocumentSelection = (id: string) => {
    setSelectedDocuments((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const filteredDocuments = (documents || []).filter((doc) => {
    const matchesType = filterType === "all" || doc.document_type === filterType;
    const matchesFolder = !activeFolder || doc.folder === activeFolder;
    const matchesSearch = !searchQuery || doc.file_name.toLowerCase().includes(searchQuery.toLowerCase()) || doc.document_type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesFolder && matchesSearch;
  });

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "Unknown size";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const allFolders = ["General", ...(folders || []).map((f) => f.name)];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Documents</h2>
          <p className="text-muted-foreground">Manage your rental documents</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isFolderDialogOpen} onOpenChange={setIsFolderDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm"><FolderPlus className="h-4 w-4 mr-1" />New Folder</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Folder</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div>
                  <Label>Folder Name</Label>
                  <Input value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="My Documents" />
                </div>
                <div>
                  <Label>Color</Label>
                  <Input type="color" value={newFolderColor} onChange={(e) => setNewFolderColor(e.target.value)} className="h-10 w-full" />
                </div>
              </div>
              <Button onClick={() => createFolderMutation.mutate({ name: newFolderName, color: newFolderColor })} disabled={!newFolderName}>
                Create Folder
              </Button>
            </DialogContent>
          </Dialog>
          <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Upload className="h-4 w-4 mr-1" />Upload</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Document</DialogTitle>
                <DialogDescription>Upload a document to your account</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div>
                  <Label>File</Label>
                  <Input type="file" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                </div>
                <div>
                  <Label>Document Type</Label>
                  <Select value={documentType} onValueChange={setDocumentType}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {DOCUMENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Folder</Label>
                  <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {allFolders.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Description (optional)</Label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description..." />
                </div>
              </div>
              <Button onClick={handleUpload} disabled={uploadMutation.isPending}>
                {uploadMutation.isPending ? "Uploading..." : "Upload Document"}
              </Button>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="w-48 space-y-1">
          <button onClick={() => setActiveFolder(null)} className={`w-full text-left px-3 py-2 rounded text-sm flex items-center gap-2 ${!activeFolder ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
            <Folder className="h-4 w-4" /> All Documents
          </button>
          {(folders || []).map((folder) => (
            <div key={folder.id} className="flex items-center gap-1">
              <button onClick={() => setActiveFolder(folder.name)} className={`flex-1 text-left px-3 py-2 rounded text-sm flex items-center gap-2 ${activeFolder === folder.name ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
                <Folder className="h-4 w-4" style={{ color: folder.color }} /> {folder.name}
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><MoreVertical className="h-3 w-3" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setEditingFolder(folder)}>Rename</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive" onClick={() => deleteFolderMutation.mutate(folder.id)}>Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>

        <div className="flex-1 space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search documents..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Filter by type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {DOCUMENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {selectedDocuments.size > 0 && (
            <div className="flex items-center gap-2 p-2 bg-muted rounded">
              <span className="text-sm">{selectedDocuments.size} selected</span>
              <Button size="sm" variant="outline" onClick={() => setIsBulkMoveOpen(true)}><Move className="h-4 w-4 mr-1" />Move</Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="destructive"><Trash2 className="h-4 w-4 mr-1" />Delete</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete selected documents?</AlertDialogTitle>
                    <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => bulkDeleteMutation.mutate(Array.from(selectedDocuments))}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}

          {isLoading ? (
            <p className="text-muted-foreground text-sm">Loading documents...</p>
          ) : filteredDocuments.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                <FileText className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p>No documents found.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredDocuments.map((doc) => (
                <Card key={doc.id}>
                  <CardContent className="py-3 flex items-center gap-3">
                    <Checkbox checked={selectedDocuments.has(doc.id)} onCheckedChange={() => toggleDocumentSelection(doc.id)} />
                    <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{doc.file_name}</p>
                      <p className="text-xs text-muted-foreground">{doc.document_type} • {formatFileSize(doc.file_size)} • {format(new Date(doc.created_at), "MMM d, yyyy")}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">{doc.folder}</Badge>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => handlePreview(doc)}><Eye className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDownload(doc)}><Download className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => setShareDocument(doc)}><Share2 className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => setVersionHistoryDocument(doc)}><History className="h-4 w-4" /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="ghost"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete document?</AlertDialogTitle>
                            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteDocumentMutation.mutate(doc)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {shareDocument && (
        <ShareDocumentDialog document={shareDocument} open={!!shareDocument} onOpenChange={(open) => !open && setShareDocument(null)} />
      )}
      {versionHistoryDocument && (
        <DocumentVersionHistory document={versionHistoryDocument} open={!!versionHistoryDocument} onOpenChange={(open) => !open && setVersionHistoryDocument(null)} />
      )}
    </div>
  );
};