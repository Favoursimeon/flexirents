import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Eye, Clock, AlertCircle, ArrowLeft } from "lucide-react";
import { format } from "date-fns";

const SharedDocument = () => {
  const { shareToken } = useParams<{ shareToken: string }>();
  const navigate = useNavigate();

  // Fetch share and document details
  const { data, isLoading, error } = useQuery({
    queryKey: ["shared-document", shareToken],
    queryFn: async () => {
      if (!shareToken) throw new Error("No share token provided");

      // First get the share record
      const { data: share, error: shareError } = await supabase
        .from("document_shares")
        .select("*")
        .eq("share_token", shareToken)
        .eq("is_active", true)
        .single();

      if (shareError || !share) {
        throw new Error("Share link not found or expired");
      }

      // Check expiry
      if (share.expires_at && new Date(share.expires_at) < new Date()) {
        throw new Error("This share link has expired");
      }

      // Get the document
      const { data: document, error: docError } = await supabase
        .from("documents")
        .select("*")
        .eq("id", share.document_id)
        .single();

      if (docError || !document) {
        throw new Error("Document not found");
      }

      return { share, document };
    },
    enabled: !!shareToken,
  });

  // Track access mutation
  const trackAccessMutation = useMutation({
    mutationFn: async (shareId: string) => {
      const { error } = await supabase
        .from("document_shares")
        .update({
          access_count: (data?.share.access_count || 0) + 1,
          accessed_at: new Date().toISOString(),
        })
        .eq("id", shareId);

      if (error) console.error("Error tracking access:", error);
    },
  });

  // Track access on mount
  useEffect(() => {
    if (data?.share?.id) {
      trackAccessMutation.mutate(data.share.id);
    }
  }, [data?.share?.id]);

  const handleDownload = () => {
    if (data?.document?.file_url) {
      window.open(data.document.file_url, "_blank");
    }
  };

  const handleView = () => {
    if (data?.document?.file_url) {
      window.open(data.document.file_url, "_blank");
    }
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    return <FileText className="h-12 w-12 text-primary" />;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "Unknown size";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Loading shared document...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 rounded-full bg-destructive/10">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle>Link Not Available</CardTitle>
            <CardDescription>
              {error instanceof Error ? error.message : "This share link is no longer valid"}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button variant="outline" onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { share, document } = data;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <Button 
          variant="ghost" 
          className="mb-6"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-start gap-4">
              {getFileIcon(document.file_name)}
              <div className="flex-1 min-w-0">
                <CardTitle className="break-all">{document.file_name}</CardTitle>
                <CardDescription className="mt-2 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary">{document.document_type}</Badge>
                    <span className="text-xs">{formatFileSize(document.file_size)}</span>
                  </div>
                  {document.description && (
                    <p className="text-sm">{document.description}</p>
                  )}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {share.expires_at ? (
                <span>Link expires {format(new Date(share.expires_at), "MMM d, yyyy")}</span>
              ) : (
                <span>This link never expires</span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button className="flex-1" onClick={handleView}>
                <Eye className="h-4 w-4 mr-2" />
                View Document
              </Button>
              
              {share.permission === "download" && (
                <Button variant="outline" className="flex-1" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              )}
            </div>

            <p className="text-xs text-center text-muted-foreground">
              Shared via Flexirent
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SharedDocument;
