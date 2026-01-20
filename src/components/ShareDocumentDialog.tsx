import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, addDays } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Copy, Link2, Trash2, ExternalLink, Clock, Eye, Download } from "lucide-react";

interface ShareDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: {
    id: string;
    file_name: string;
    file_url: string;
  } | null;
}

interface DocumentShare {
  id: string;
  share_token: string;
  shared_with_email: string | null;
  share_type: string;
  permission: string;
  expires_at: string | null;
  is_active: boolean;
  access_count: number;
  created_at: string;
}

export const ShareDocumentDialog = ({
  open,
  onOpenChange,
  document,
}: ShareDocumentDialogProps) => {
  const queryClient = useQueryClient();
  const [permission, setPermission] = useState<"view" | "download">("view");
  const [expiresIn, setExpiresIn] = useState<string>("never");
  const [enableExpiry, setEnableExpiry] = useState(false);

  // Fetch existing shares for this document
  const { data: shares = [], isLoading: sharesLoading } = useQuery({
    queryKey: ["document-shares", document?.id],
    queryFn: async () => {
      if (!document?.id) return [];
      const { data, error } = await supabase
        .from("document_shares")
        .select("*")
        .eq("document_id", document.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as DocumentShare[];
    },
    enabled: !!document?.id && open,
  });

  // Create share mutation
  const createShareMutation = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user || !document?.id) throw new Error("Not authenticated");

      let expiresAt: string | null = null;
      if (enableExpiry && expiresIn !== "never") {
        const days = parseInt(expiresIn);
        expiresAt = addDays(new Date(), days).toISOString();
      }

      const { data, error } = await supabase
        .from("document_shares")
        .insert({
          document_id: document.id,
          shared_by: userData.user.id,
          permission,
          expires_at: expiresAt,
          share_type: "link",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["document-shares", document?.id] });
      const shareUrl = `${window.location.origin}/shared/${data.share_token}`;
      navigator.clipboard.writeText(shareUrl);
      toast.success("Share link created and copied to clipboard!");
    },
    onError: (error) => {
      console.error("Error creating share:", error);
      toast.error("Failed to create share link");
    },
  });

  // Delete share mutation
  const deleteShareMutation = useMutation({
    mutationFn: async (shareId: string) => {
      const { error } = await supabase
        .from("document_shares")
        .delete()
        .eq("id", shareId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-shares", document?.id] });
      toast.success("Share link revoked");
    },
    onError: (error) => {
      console.error("Error deleting share:", error);
      toast.error("Failed to revoke share link");
    },
  });

  // Toggle share active status
  const toggleShareMutation = useMutation({
    mutationFn: async ({ shareId, isActive }: { shareId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("document_shares")
        .update({ is_active: isActive })
        .eq("id", shareId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-shares", document?.id] });
      toast.success("Share link updated");
    },
    onError: (error) => {
      console.error("Error updating share:", error);
      toast.error("Failed to update share link");
    },
  });

  const copyShareLink = (shareToken: string) => {
    const shareUrl = `${window.location.origin}/shared/${shareToken}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success("Link copied to clipboard!");
  };

  const getExpiryText = (expiresAt: string | null) => {
    if (!expiresAt) return "Never expires";
    const expiry = new Date(expiresAt);
    if (expiry < new Date()) return "Expired";
    return `Expires ${format(expiry, "MMM d, yyyy")}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Share Document
          </DialogTitle>
          <DialogDescription>
            Create shareable links for "{document?.file_name}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Create new share */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Create New Share Link</h4>
            
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Permission</Label>
                <Select value={permission} onValueChange={(v) => setPermission(v as "view" | "download")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="view">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        View only
                      </div>
                    </SelectItem>
                    <SelectItem value="download">
                      <div className="flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        View & Download
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="enable-expiry">Set expiration</Label>
                <Switch
                  id="enable-expiry"
                  checked={enableExpiry}
                  onCheckedChange={setEnableExpiry}
                />
              </div>

              {enableExpiry && (
                <div className="space-y-2">
                  <Label>Expires in</Label>
                  <Select value={expiresIn} onValueChange={setExpiresIn}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 day</SelectItem>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button
                onClick={() => createShareMutation.mutate()}
                disabled={createShareMutation.isPending}
              >
                <Link2 className="h-4 w-4 mr-2" />
                {createShareMutation.isPending ? "Creating..." : "Create & Copy Link"}
              </Button>
            </div>
          </div>

          <Separator />

          {/* Existing shares */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Active Share Links</h4>
            
            {sharesLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : shares.length === 0 ? (
              <p className="text-sm text-muted-foreground">No share links created yet</p>
            ) : (
              <div className="space-y-3 max-h-[200px] overflow-y-auto">
                {shares.map((share) => (
                  <div
                    key={share.id}
                    className={`p-3 rounded-lg border ${
                      share.is_active ? "bg-card" : "bg-muted/50 opacity-60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={share.permission === "download" ? "default" : "secondary"}>
                            {share.permission === "download" ? (
                              <><Download className="h-3 w-3 mr-1" /> Download</>
                            ) : (
                              <><Eye className="h-3 w-3 mr-1" /> View</>
                            )}
                          </Badge>
                          {!share.is_active && (
                            <Badge variant="outline">Disabled</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {getExpiryText(share.expires_at)}
                          <span>•</span>
                          <span>{share.access_count} views</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => copyShareLink(share.share_token)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => window.open(`${window.location.origin}/shared/${share.share_token}`, "_blank")}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => deleteShareMutation.mutate(share.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
