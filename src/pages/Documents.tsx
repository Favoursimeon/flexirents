import { DocumentManagement } from "@/components/DocumentManagement";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Documents = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 pt-24">
        <DocumentManagement />
      </main>
      <Footer />
    </div>
  );
};

export default Documents;
