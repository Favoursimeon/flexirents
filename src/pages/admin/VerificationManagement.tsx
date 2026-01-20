import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle, FileText, Image as ImageIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface VerificationSubmission {
  id: string;
  user_id: string;
  id_type: string | null;
  id_number: string | null;
  id_front_url: string | null;
  id_back_url: string | null;
  birth_region: string | null;
  birth_city: string | null;
  birth_street: string | null;
  personal_picture_url: string | null;
  employment_status: string | null;
  employer_name: string | null;
  proof_of_work_url: string | null;
  status: string;
  created_at: string;
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export default function VerificationManagement() {
  const [submissions, setSubmissions] = useState<VerificationSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<VerificationSubmission | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from("user_verification")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch profiles separately
      const userIds = data?.map(d => d.user_id) || [];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
      
      const enrichedData = data?.map(submission => ({
        ...submission,
        profiles: profilesMap.get(submission.user_id) || null,
      })) || [];

      setSubmissions(enrichedData as any);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      toast({
        title: "Error",
        description: "Failed to load verification submissions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (submissionId: string) => {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from("user_verification")
        .update({ status: "verified" })
        .eq("id", submissionId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Verification approved successfully",
      });
      
      fetchSubmissions();
      setSelectedSubmission(null);
    } catch (error) {
      console.error("Error approving verification:", error);
      toast({
        title: "Error",
        description: "Failed to approve verification",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (submissionId: string) => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for rejection",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      const { error } = await supabase
        .from("user_verification")
        .update({ 
          status: "rejected",
        })
        .eq("id", submissionId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Verification rejected",
      });
      
      fetchSubmissions();
      setSelectedSubmission(null);
      setRejectionReason("");
    } catch (error) {
      console.error("Error rejecting verification:", error);
      toast({
        title: "Error",
        description: "Failed to reject verification",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      verified: "default",
      rejected: "destructive",
      not_verified: "outline",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Verification Management</h2>
        <p className="text-muted-foreground mt-2">
          Review and manage user verification submissions
        </p>
      </div>

      <div className="grid gap-4">
        {submissions.map((submission) => (
          <Card key={submission.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <CardTitle className="text-lg">
                      {submission.profiles?.full_name || "Unknown User"}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Submitted: {new Date(submission.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {getStatusBadge(submission.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">ID Type</p>
                  <p className="text-sm text-foreground">{submission.id_type || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">ID Number</p>
                  <p className="text-sm text-foreground">{submission.id_number || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Employment</p>
                  <p className="text-sm text-foreground">{submission.employment_status || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Employer</p>
                  <p className="text-sm text-foreground">{submission.employer_name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Birth Location</p>
                  <p className="text-sm text-foreground">
                    {[submission.birth_region, submission.birth_city, submission.birth_street]
                      .filter(Boolean)
                      .join(", ") || "N/A"}
                  </p>
                </div>
              </div>

              {submission.status === "pending" && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => setSelectedSubmission(submission)}
                    variant="outline"
                    size="sm"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Review Details
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Verification Submission</DialogTitle>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">ID Documents</h3>
                  <div className="space-y-2">
                    {selectedSubmission.id_front_url && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Front</p>
                        <img
                          src={selectedSubmission.id_front_url}
                          alt="ID Front"
                          className="w-full h-40 object-cover rounded-lg border cursor-pointer hover:opacity-80"
                          onClick={() => setImagePreview(selectedSubmission.id_front_url)}
                        />
                      </div>
                    )}
                    {selectedSubmission.id_back_url && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Back</p>
                        <img
                          src={selectedSubmission.id_back_url}
                          alt="ID Back"
                          className="w-full h-40 object-cover rounded-lg border cursor-pointer hover:opacity-80"
                          onClick={() => setImagePreview(selectedSubmission.id_back_url)}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  {selectedSubmission.personal_picture_url && (
                    <div>
                      <h3 className="font-semibold mb-2">Personal Picture</h3>
                      <img
                        src={selectedSubmission.personal_picture_url}
                        alt="Personal"
                        className="w-full h-40 object-cover rounded-lg border cursor-pointer hover:opacity-80"
                        onClick={() => setImagePreview(selectedSubmission.personal_picture_url)}
                      />
                    </div>
                  )}

                  {selectedSubmission.proof_of_work_url && (
                    <div>
                      <h3 className="font-semibold mb-2">Proof of Work</h3>
                      <a
                        href={selectedSubmission.proof_of_work_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-primary hover:underline"
                      >
                        <FileText className="h-4 w-4" />
                        View Document
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Rejection Reason (if rejecting)
                </label>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Provide a reason for rejection..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  onClick={() => handleReject(selectedSubmission.id)}
                  variant="destructive"
                  disabled={processing}
                >
                  {processing ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  Reject
                </Button>
                <Button
                  onClick={() => handleApprove(selectedSubmission.id)}
                  disabled={processing}
                >
                  {processing ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Approve
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!imagePreview} onOpenChange={() => setImagePreview(null)}>
        <DialogContent className="max-w-4xl">
          <img src={imagePreview || ""} alt="Preview" className="w-full h-auto" />
        </DialogContent>
      </Dialog>
    </div>
  );
}
