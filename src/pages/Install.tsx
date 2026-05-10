import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Smartphone, Monitor, CheckCircle, Wifi, Bell, Zap } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Listen for successful install
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const features = [
    {
      icon: Wifi,
      title: "Works Offline",
      description: "Access your saved properties and documents even without internet",
    },
    {
      icon: Zap,
      title: "Fast & Responsive",
      description: "Native app-like experience with instant loading",
    },
    {
      icon: Bell,
      title: "Push Notifications",
      description: "Get notified about new properties matching your preferences",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12 mt-16">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Install FlexiRents App
          </h1>
          <p className="text-lg text-muted-foreground">
            Get the full mobile app experience - install FlexiRents on your device for quick access and offline features.
          </p>
        </div>

        <div className="max-w-md mx-auto mb-12">
          <Card className="border-2 border-primary/20">
            <CardHeader className="text-center">
              <div className="mx-auto w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                <Smartphone className="w-10 h-10 text-primary" />
              </div>
              <CardTitle className="text-2xl">FlexiRents</CardTitle>
              <CardDescription>Premium Property Rentals & Services</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isInstalled ? (
                <div className="flex items-center justify-center gap-2 text-green-600 py-4">
                  <CheckCircle className="w-6 h-6" />
                  <span className="font-medium">App is installed!</span>
                </div>
              ) : isIOS ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground text-center">
                    To install on iOS:
                  </p>
                  <ol className="text-sm text-left space-y-2 bg-muted/50 p-4 rounded-lg">
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-primary">1.</span>
                      <span>Tap the Share button in Safari</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-primary">2.</span>
                      <span>Scroll down and tap "Add to Home Screen"</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-primary">3.</span>
                      <span>Tap "Add" to confirm</span>
                    </li>
                  </ol>
                </div>
              ) : deferredPrompt ? (
                <Button onClick={handleInstall} className="w-full" size="lg">
                  <Download className="w-5 h-5 mr-2" />
                  Install App
                </Button>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    Open this page in Chrome or Edge to install the app, or use your browser's menu.
                  </p>
                  <div className="flex justify-center gap-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Monitor className="w-5 h-5" />
                      <span className="text-sm">Desktop</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Smartphone className="w-5 h-5" />
                      <span className="text-sm">Mobile</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-semibold text-center mb-8">Why Install?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="text-center">
                <CardContent className="pt-6">
                  <div className="mx-auto w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-accent-foreground" />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Install;
