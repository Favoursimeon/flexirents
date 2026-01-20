import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Facebook, Instagram, Youtube, MessageCircle, Linkedin } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { scrollToTop } from "@/components/ScrollToTop";
import logo from "@/assets/logo-footer.png";

const newsletterSchema = z.object({
  email: z.string().trim().email({ message: "Please enter a valid email address" }).max(255, { message: "Email must be less than 255 characters" }),
});

const Footer = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate email
      newsletterSchema.parse({ email });
      
      setIsSubmitting(true);
      
      const { error } = await supabase
        .from("newsletter_subscriptions")
        .insert([{ email: email.toLowerCase().trim() }]);
      
      if (error) {
        if (error.code === "23505") { // Unique constraint violation
          toast({
            title: "Already Subscribed",
            description: "This email is already subscribed to our newsletter.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Successfully Subscribed!",
          description: "Thank you for subscribing to our newsletter.",
        });
        setEmail("");
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Invalid Email",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to subscribe. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="bg-primary text-primary-foreground dark:bg-[hsl(220,50%,15%)] dark:text-[hsl(220,20%,90%)] mt-0">
      <div className="container mx-auto px-4 pt-5 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <img src={logo} alt="FlexiRents" className="h-14 w-auto object-contain mb-4" />
            <ul className="space-y-2 text-base opacity-80">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>admin@flexirents.com</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>+233 53 881 0844</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>Accra, Ghana</span>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div className="pt-5">
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-base opacity-80">
              <li>
                <Link to="/about" className="hover:text-accent transition-colors" onClick={scrollToTop}>
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-accent transition-colors" onClick={scrollToTop}>
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-accent transition-colors" onClick={scrollToTop}>
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/faqs" className="hover:text-accent transition-colors" onClick={scrollToTop}>
                  FAQs
                </Link>
              </li>
              <li>
                <Link to="/refer" className="hover:text-accent transition-colors" onClick={scrollToTop}>
                  Refer To Earn
                </Link>
              </li>
              <li>
                <Link to="/career" className="hover:text-accent transition-colors" onClick={scrollToTop}>
                  Career
                </Link>
              </li>
              <li>
                <Link to="/blog" className="hover:text-accent transition-colors" onClick={scrollToTop}>
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div className="pt-5">
            <h3 className="text-lg font-semibold mb-4">Services</h3>
            <ul className="space-y-2 text-base opacity-80">
              <li>
                <Link to="/rentals" className="hover:text-accent transition-colors" onClick={scrollToTop}>
                  Property Rentals
                </Link>
              </li>
              <li>
                <Link to="/sales" className="hover:text-accent transition-colors" onClick={scrollToTop}>
                  Property Sales
                </Link>
              </li>
              <li>
                <Link to="/flexi-assist" className="hover:text-accent transition-colors" onClick={scrollToTop}>
                  Flexi-Assist Services
                </Link>
              </li>
              <li>
                <Link to="/project-management" className="hover:text-accent transition-colors" onClick={scrollToTop}>
                  Project Management
                </Link>
              </li>
              <li>
                <Link to="/marketplace" className="hover:text-accent transition-colors" onClick={scrollToTop}>
                  Market Place
                </Link>
              </li>
              <li>
                <Link to="/projects" className="hover:text-accent transition-colors" onClick={scrollToTop}>
                  Projects
                </Link>
              </li>
            </ul>
          </div>

          {/* Social Media & Newsletter */}
          <div className="pt-5">
            <h3 className="text-lg font-semibold mb-4">Connect With Us</h3>
            <div className="flex gap-4 mb-6">
              <a href="https://wa.me/" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">
                <MessageCircle className="h-6 w-6" />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">
                <Facebook className="h-6 w-6" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">
                <Instagram className="h-6 w-6" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">
                <Linkedin className="h-6 w-6" />
              </a>
              <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">
                <Youtube className="h-6 w-6" />
              </a>
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
                  className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50 dark:bg-[hsl(220,40%,20%)] dark:border-[hsl(220,40%,30%)] dark:text-[hsl(220,20%,90%)] dark:placeholder:text-[hsl(220,20%,60%)]"
                  maxLength={255}
                  required
                />
                <Button 
                  type="submit" 
                  variant="secondary"
                  disabled={isSubmitting}
                  className="whitespace-nowrap dark:bg-[hsl(200,70%,50%)] dark:text-white dark:hover:bg-[hsl(200,70%,45%)]"
                >
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
