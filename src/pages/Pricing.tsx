import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SubscriptionPricing } from "@/components/SubscriptionPricing";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wrench, Store } from "lucide-react";

const Pricing = () => {
  const [activeTab, setActiveTab] = useState<'service_provider' | 'vendor'>('service_provider');

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Subscription Plans</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Unlock premium features to boost your visibility and grow your business on FlexiRents
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="max-w-5xl mx-auto">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="service_provider" className="flex items-center gap-2">
              <Wrench className="w-4 h-4" />
              Service Providers
            </TabsTrigger>
            <TabsTrigger value="vendor" className="flex items-center gap-2">
              <Store className="w-4 h-4" />
              Vendors
            </TabsTrigger>
          </TabsList>

          <TabsContent value="service_provider">
            <SubscriptionPricing 
              userType="service_provider"
            />
          </TabsContent>

          <TabsContent value="vendor">
            <SubscriptionPricing 
              userType="vendor"
            />
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default Pricing;
