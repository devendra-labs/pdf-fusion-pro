import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/hero/Hero";
import ToolGrid from "@/components/tools/ToolGrid";
import Features from "@/components/common/Features";
import Footer from "@/components/layout/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <ToolGrid />
      <Features />
      <Footer />
    </main>
  );
}