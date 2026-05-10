import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Facebook, Instagram, Youtube, MessageCircle, Linkedin } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { scrollToTop } from "@/components/ScrollToTop";
import logo from "@/assets/logo-footer.png";
import api from "@/lib/api";

const newsletterSchema = z.object({
  email: z.string().trim().email({ message: "Please enter a valid email address" }).max(255),
});

const Footer = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      newsletterSchema.parse({ email });
      setIsSubmitting(true);
      await api.post('/api/newsletter/subscribe', { email: email.toLowerCase().trim() });
      toast({ title: "Successfully Subscribed!", description: "Thank you for subscribing to our newsletter." });
      setEmail("");
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({ title: "Invalid Email", description: error.errors[0].message, variant: "destructive" });
      } else {
        toast({ title: "Error", description: "Failed to subscribe. Please try again.", variant: "destructive" });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="bg-primary text-primary-foreground dark:bg-[hsl(220,50%,15%)] dark:text-[hsl(220,20%,90%)] mt-0">
      <div className="container mx-auto px-4 pt-5 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <img src={logo} alt="FlexiRents" className="h-14 w-auto object-contain mb-4" />
            <ul className="space-y-2 text-base opacity-80">
              <li className="flex items-center gap-2"><Mail className="h-4 w-4" /><span>admin@flexirents.com</span></li>
              <li className="flex items-center gap-2"><Phone className="h-4 w-4" /><span>+233 53 881 0844</span></li>
              <li className="flex items-center gap-2"><MapPin className="h-4 w-4" /><span>Accra, Ghana</span></li>
            </ul>
          </div>
          <div className="pt-5">
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-base opacity-80">
              <li><Link to="/about" className="hover:text-accent transition-colors" onClick={scrollToTop}>About Us</Link></li>
              <li><Link to="/terms" className="hover:text-accent transition-colors" onClick={scrollToTop}>Terms of Service</Link></li>
              <li><Link to="/privacy" className="hover:text-accent transition-colors" onClick={scrollToTop}>Privacy Policy</Link></li>
              <li><Link to="/faqs" className="hover:text-accent transition-colors" onClick={scrollToTop}>FAQs</Link></li>
              <li><Link to="/refer" className="hover:text-accent transition-colors" onClick={scrollToTop}>Refer To Earn</Link></li>
              <li><Link to="/career" className="hover:text-accent transition-colors" onClick={scrollToTop}>Career</Link></li>
              <li><Link to="/blog" className="hover:text-accent transition-colors" onClick={scrollToTop}>Blog</Link></li>
            </ul>
          </div>
          <div className="pt-5">
            <h3 className="text-lg font-semibold mb-4">Resources</h3>
            <ul className="space-y-2 text-base opacity-80">
              <li><Link to="/rentals" className="hover:text-accent transition-colors" onClick={scrollToTop}>Property Rentals</Link></li>
              <li><Link to="/sales" className="hover:text-accent transition-colors" onClick={scrollToTop}>Property Sales</Link></li>
              <li><Link to="/marketplace" className="hover:text-accent transition-colors" onClick={scrollToTop}>Market Place</Link></li>
              <li><Link to="/projects" className="hover:text-accent transition-colors" onClick={scrollToTop}>Projects</Link></li>
            </ul>
          </div>
          <div className="pt-5">
            <h3 className="text-lg font-semibold mb-4">Connect With Us</h3>
            <div className="flex gap-4 mb-6">
              <a href="https://wa.me/" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors"><MessageCircle className="h-6 w-6" /></a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors"><Facebook className="h-6 w-6" /></a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors"><Instagram className="h-6 w-6" /></a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors"><Linkedin className="h-6 w-6" /></a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors"><Youtube className="h-6 w-6" /></a>
            </div>
            <div className="mt-6">
              <h4 className="text-lg font-semibold mb-3">Newsletter</h4>
              <p className="text-base opacity-80 mb-3">Stay updated with our latest properties and offers</p>
              <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50"
                  maxLength={255}
                  required
                />
                <Button type="submit" variant="secondary" disabled={isSubmitting} className="whitespace-nowrap">
                  {isSubmitting ? "..." : "Subscribe"}
                </Button>
              </form>
            </div>
          </div>
        </div>
        <div className="border-t border-primary-foreground/20 mt-8 pt-8 text-center text-base opacity-80">
          <p>&copy; {new Date().getFullYear()} FlexiRents. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;