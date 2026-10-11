import SmoothScroll from "@/components/chrome/SmoothScroll";
import CustomCursor from "@/components/chrome/CustomCursor";
import Navigation from "@/components/chrome/Navigation";
import TravellingDevice from "@/components/chrome/TravellingDevice";
import Hero from "@/components/sections/Hero";
import Manifesto from "@/components/sections/Manifesto";
import ProductExperience from "@/components/sections/ProductExperience";
import NetworkNarrative from "@/components/sections/NetworkNarrative";
import SecurityArchitecture from "@/components/sections/SecurityArchitecture";
import GlobalCorridors from "@/components/sections/GlobalCorridors";
import Metrics from "@/components/sections/Metrics";
import UseCases from "@/components/sections/UseCases";
import Thesis from "@/components/sections/Thesis";
import FinalCTA from "@/components/sections/FinalCTA";
import Contact from "@/components/sections/Contact";
import Footer from "@/components/chrome/Footer";

export default function Home() {
  return (
    <SmoothScroll>
      <CustomCursor />
      <Navigation />
      {/* Fixed to the viewport so it can ride out of the hero and into the
          manifesto — a device parked inside a section cannot leave it. */}
      <TravellingDevice />
      <main id="main" tabIndex={-1} className="outline-none">
        <Hero />
        <Manifesto />
        <ProductExperience />
        <NetworkNarrative />
        <SecurityArchitecture />
        <GlobalCorridors />
        <Metrics />
        <UseCases />
        <Thesis />
        <FinalCTA />
        <Contact />
      </main>
      <Footer />
    </SmoothScroll>
  );
}
