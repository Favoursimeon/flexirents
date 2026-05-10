import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const referralSchema = z.object({
  referrerName: z.string().trim().min(2, "Please enter your full name").max(100),
  referrerEmail: z.string().trim().email("Enter a valid email").max(255),
  referrerPhone: z
    .string()
    .trim()
    .min(7, "Enter a valid phone number")
    .max(20)
    .regex(/^[+0-9 ()-]+$/, "Only numbers and + ( ) - allowed"),
  ownerName: z.string().trim().min(2, "Owner name is required").max(100),
  ownerEmail: z.string().trim().email("Enter a valid email").max(255).optional().or(z.literal("")),
  ownerPhone: z
    .string()
    .trim()
    .min(7, "Enter a valid phone number")
    .max(20)
    .regex(/^[+0-9 ()-]+$/, "Only numbers and + ( ) - allowed"),
  propertyType: z.string().trim().min(2, "Property type is required").max(100),
  listingType: z.enum(["rent", "sale"], { required_error: "Select listing type" }),
  location: z.string().trim().min(2, "Location is required").max(200),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

const Refer = () => {
  const { toast } = useToast();
  const [form, setForm] = useState({
    referrerName: "",
    referrerEmail: "",
    referrerPhone: "",
    ownerName: "",
    ownerEmail: "",
    ownerPhone: "",
    propertyType: "",
    listingType: "rent" as "rent" | "sale",
    location: "",
    notes: "",
  });

  // Basic SEO tags
  useEffect(() => {
    const title = "Refer To Earn | FlexiRents";
    const description = "Refer property owners to FlexiRents and earn a 5% commission when a deal closes.";
    document.title = title;

    const ensureMeta = (name: string, content: string) => {
      let tag = document.querySelector(`meta[name="${name}"]`);
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute("name", name);
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", content);
    };

    ensureMeta("description", description);

    let canonical = document.querySelector("link[rel=canonical]") as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = window.location.href;
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setForm((f) => ({ ...f, [id]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = referralSchema.safeParse(form);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      toast({ title: "Invalid input", description: first.message, variant: "destructive" });
      return;
    }

    // Build a safe mailto for now (no backend yet)
    const to = "info@flexirents.com";
    const subject = `Referral: ${form.ownerName} - ${form.propertyType} (${form.listingType})`;
    const lines = [
      "Referral Details",
      "",
      `Referrer: ${form.referrerName}`,
      `Referrer Email: ${form.referrerEmail}`,
      `Referrer Phone: ${form.referrerPhone}`,
      "",
      `Owner: ${form.ownerName}`,
      form.ownerEmail ? `Owner Email: ${form.ownerEmail}` : undefined,
      `Owner Phone: ${form.ownerPhone}`,
      "",
      `Property Type: ${form.propertyType}`,
      `Listing Type: ${form.listingType === "rent" ? "For Rent" : "For Sale"}`,
      `Location: ${form.location}`,
      form.notes ? "" : undefined,
      form.notes ? `Notes: ${form.notes}` : undefined,
      "",
      "Commission Note: Referrer to earn 5% when deal is closed (successful rent/sale).",
    ].filter(Boolean);

    const body = encodeURIComponent(lines.join("\n"));
    const mailto = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${body}`;

    toast({ title: "Almost done", description: "We opened your email client with the referral details." });
    window.location.href = mailto;
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <header className="pt-24 pb-6 bg-gradient-to-b from-background to-background">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-bold">Refer To Earn</h1>
          <p className="text-muted-foreground mt-3 text-lg">
            Refer property owners to FlexiRents and earn a 5% commission when a deal successfully closes.
          </p>
        </div>
      </header>

      <main>
        <section className="py-8">
          <div className="container mx-auto px-4 max-w-4xl grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Submit a Referral</CardTitle>
                <CardDescription>Provide the owner and property details</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="referrerName">Your Full Name</Label>
                      <Input id="referrerName" value={form.referrerName} onChange={handleChange} placeholder="Jane Doe" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="referrerEmail">Your Email</Label>
                      <Input id="referrerEmail" type="email" value={form.referrerEmail} onChange={handleChange} placeholder="jane@example.com" required />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="referrerPhone">Your Phone</Label>
                    <Input id="referrerPhone" type="tel" value={form.referrerPhone} onChange={handleChange} placeholder="+233 24 123 4567" required />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ownerName">Owner Full Name</Label>
                      <Input id="ownerName" value={form.ownerName} onChange={handleChange} placeholder="Kwame Mensah" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ownerEmail">Owner Email (optional)</Label>
                      <Input id="ownerEmail" type="email" value={form.ownerEmail} onChange={handleChange} placeholder="owner@example.com" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ownerPhone">Owner Phone</Label>
                    <Input id="ownerPhone" type="tel" value={form.ownerPhone} onChange={handleChange} placeholder="+233 20 765 4321" required />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="propertyType">Property Type</Label>
                      <Input id="propertyType" value={form.propertyType} onChange={handleChange} placeholder="2BR Apartment" required />
                    </div>
                    <div className="space-y-2">
                      <Label>Listing Type</Label>
                      <Select value={form.listingType} onValueChange={(v: "rent" | "sale") => setForm((f) => ({ ...f, listingType: v }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="rent">For Rent</SelectItem>
                          <SelectItem value="sale">For Sale</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Property Location</Label>
                    <Input id="location" value={form.location} onChange={handleChange} placeholder="East Legon, Accra" required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Additional Notes (optional)</Label>
                    <Textarea id="notes" value={form.notes} onChange={handleChange} rows={4} placeholder="Any extra context about the property or owner" />
                  </div>

                  <Button type="submit" variant="hero" className="w-full">Send Referral</Button>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>How it works</CardTitle>
                  <CardDescription>Simple steps to earn</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <ol className="list-decimal pl-5 space-y-2">
                    <li>Submit owner and property details using the form.</li>
                    <li>We verify ownership, inspect, and list the property.</li>
                    <li>When the property is successfully rented or sold, you earn 5%.</li>
                  </ol>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Terms</CardTitle>
                  <CardDescription>Key conditions</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                  <p>Commission is paid within 7 business days after a successful deal is closed.</p>
                  <p>Duplicate referrals are resolved by first-come submission time.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Refer;
