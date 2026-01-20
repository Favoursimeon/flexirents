import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Upload, CheckCircle2, XCircle, Loader2 } from "lucide-react";

interface VerificationData {
  status: string;
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
}

export default function VerificationForm() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [verification, setVerification] = useState<VerificationData>({
    status: "not_verified",
    id_type: null,
    id_number: null,
    id_front_url: null,
    id_back_url: null,
    birth_region: null,
    birth_city: null,
    birth_street: null,
    personal_picture_url: null,
    employment_status: null,
    employer_name: null,
    proof_of_work_url: null,
  });

  const [uploading, setUploading] = useState({
    id_front: false,
    id_back: false,
    personal_picture: false,
    proof_of_work: false,
  });

  useEffect(() => {
    if (user) {
      fetchVerification();
    }
  }, [user]);

  const fetchVerification = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("user_verification")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setVerification(data);
      }
    } catch (error) {
      console.error("Error fetching verification:", error);
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (file: File, path: string) => {
    if (!user) return null;

    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/${path}_${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from("verification-documents")
      .upload(fileName, file);

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from("verification-documents")
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof typeof uploading,
    urlField: keyof VerificationData
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create preview URL immediately
    const previewUrl = URL.createObjectURL(file);
    setVerification({ ...verification, [urlField]: previewUrl });

    setUploading({ ...uploading, [field]: true });

    try {
      const url = await uploadFile(file, field);
      if (url) {
        setVerification({ ...verification, [urlField]: url });
        toast.success("File uploaded successfully");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload file");
      setVerification({ ...verification, [urlField]: null });
    } finally {
      setUploading({ ...uploading, [field]: false });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from("user_verification")
        .upsert({
          user_id: user.id,
          ...verification,
          status: "pending",
        });

      if (error) throw error;

      toast.success("Verification submitted successfully");
      fetchVerification();
    } catch (error) {
      console.error("Error submitting verification:", error);
      toast.error("Failed to submit verification");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Verification Status</CardTitle>
            <CardDescription>Complete your profile verification</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {verification.status === "not_verified" && (
              <>
                <XCircle className="h-5 w-5 text-destructive" />
                <span className="text-sm font-medium text-destructive">Not Verified</span>
              </>
            )}
            {verification.status === "pending" && (
              <>
                <Loader2 className="h-5 w-5 animate-spin text-warning" />
                <span className="text-sm font-medium text-warning">Pending Review</span>
              </>
            )}
            {verification.status === "verified" && (
              <>
                <CheckCircle2 className="h-5 w-5 text-success" />
                <span className="text-sm font-medium text-success">Verified</span>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ID Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">ID Information</h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="id_type">ID Type</Label>
                <Select
                  value={verification.id_type || ""}
                  onValueChange={(value) => setVerification({ ...verification, id_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select ID type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ghana_card">Ghana Card</SelectItem>
                    <SelectItem value="passport">Passport</SelectItem>
                    <SelectItem value="drivers_license">Driver's License</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="id_number">ID Number</Label>
                <Input
                  id="id_number"
                  value={verification.id_number || ""}
                  onChange={(e) => {
                    let value = e.target.value.toUpperCase();
                    
                    // Only apply Ghana Card formatting when Ghana Card is selected
                    if (verification.id_type === "ghana_card") {
                      // Remove any non-alphanumeric characters except hyphens
                      value = value.replace(/[^A-Z0-9-]/g, "");
                      
                      // Auto-format as GHA-XXXXXXXXX-X
                      if (!value.startsWith("GHA-") && value.length > 0) {
                        if (value.startsWith("GHA")) {
                          value = "GHA-" + value.slice(3);
                        } else {
                          value = "GHA-" + value;
                        }
                      }
                      
                      // Ensure proper hyphen placement
                      const parts = value.split("-");
                      if (parts.length >= 2) {
                        const middlePart = parts[1]?.replace(/-/g, "").slice(0, 9) || "";
                        const lastPart = parts[2]?.slice(0, 1) || "";
                        
                        if (middlePart.length === 9 && parts.length < 3) {
                          value = `GHA-${middlePart}-`;
                        } else if (middlePart.length >= 9) {
                          value = `GHA-${middlePart.slice(0, 9)}-${lastPart}`;
                        } else {
                          value = `GHA-${middlePart}`;
                        }
                      }
                      
                      // Limit total length to GHA-XXXXXXXXX-X (15 characters)
                      value = value.slice(0, 15);
                    }
                    
                    setVerification({ ...verification, id_number: value });
                  }}
                  placeholder={verification.id_type === "ghana_card" ? "GHA-XXXXXXXXX-X" : "Enter your ID number"}
                  maxLength={verification.id_type === "ghana_card" ? 15 : undefined}
                />
                {verification.id_type === "ghana_card" && (
                  <p className="text-xs text-muted-foreground">Format: GHA-XXXXXXXXX-X</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Upload ID Card (Front)</Label>
                <div className="flex flex-col gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, "id_front", "id_front_url")}
                    disabled={uploading.id_front}
                  />
                  {uploading.id_front && <Loader2 className="h-4 w-4 animate-spin" />}
                  {verification.id_front_url && (
                    <div className="mt-2">
                      <img
                        src={verification.id_front_url}
                        alt="ID Front Preview"
                        className="w-full h-40 object-cover rounded-lg border"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Upload ID Card (Back)</Label>
                <div className="flex flex-col gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, "id_back", "id_back_url")}
                    disabled={uploading.id_back}
                  />
                  {uploading.id_back && <Loader2 className="h-4 w-4 animate-spin" />}
                  {verification.id_back_url && (
                    <div className="mt-2">
                      <img
                        src={verification.id_back_url}
                        alt="ID Back Preview"
                        className="w-full h-40 object-cover rounded-lg border"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Place of Birth */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Place of Birth</h3>
            
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="birth_region">Region</Label>
                <Input
                  id="birth_region"
                  value={verification.birth_region || ""}
                  onChange={(e) => setVerification({ ...verification, birth_region: e.target.value })}
                  placeholder="Enter region"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="birth_city">City</Label>
                <Input
                  id="birth_city"
                  value={verification.birth_city || ""}
                  onChange={(e) => setVerification({ ...verification, birth_city: e.target.value })}
                  placeholder="Enter city"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="birth_street">Street</Label>
                <Input
                  id="birth_street"
                  value={verification.birth_street || ""}
                  onChange={(e) => setVerification({ ...verification, birth_street: e.target.value })}
                  placeholder="Enter street"
                />
              </div>
            </div>
          </div>

          {/* Personal Picture */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Personal Picture</h3>
            
            <div className="space-y-2">
              <Label>Upload Personal Picture</Label>
              <div className="flex flex-col gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, "personal_picture", "personal_picture_url")}
                  disabled={uploading.personal_picture}
                />
                <p className="text-sm text-muted-foreground">Upload a clear portrait picture of yourself</p>
                {uploading.personal_picture && <Loader2 className="h-4 w-4 animate-spin" />}
                {verification.personal_picture_url && (
                  <div className="mt-2">
                    <img
                      src={verification.personal_picture_url}
                      alt="Personal Picture Preview"
                      className="w-full h-40 object-cover rounded-lg border"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Employment Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Employment Information</h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="employment_status">Employment Status</Label>
                <Select
                  value={verification.employment_status || ""}
                  onValueChange={(value) => setVerification({ ...verification, employment_status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select employment status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employed">Employed</SelectItem>
                    <SelectItem value="self_employed">Self Employed</SelectItem>
                    <SelectItem value="unemployed">Unemployed</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="retired">Retired</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="employer_name">Employer Name</Label>
                <Input
                  id="employer_name"
                  value={verification.employer_name || ""}
                  onChange={(e) => setVerification({ ...verification, employer_name: e.target.value })}
                  placeholder="e.g. Company or John Doe"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Proof of Work</Label>
              <div className="flex flex-col gap-2">
                <Input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileUpload(e, "proof_of_work", "proof_of_work_url")}
                  disabled={uploading.proof_of_work}
                />
                <p className="text-sm text-muted-foreground">
                  Upload appointment document, payment slip, or company ID
                </p>
                {uploading.proof_of_work && <Loader2 className="h-4 w-4 animate-spin" />}
                {verification.proof_of_work_url && (
                  <div className="mt-2">
                    {verification.proof_of_work_url.endsWith('.pdf') ? (
                      <a
                        href={verification.proof_of_work_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        View Document
                      </a>
                    ) : (
                      <img
                        src={verification.proof_of_work_url}
                        alt="Proof of Work Preview"
                        className="w-full h-40 object-cover rounded-lg border"
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <Button type="submit" disabled={submitting || verification.status === "verified"} className="w-full">
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : verification.status === "verified" ? (
              "Verified"
            ) : (
              "Submit for Verification"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
