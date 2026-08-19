import SmoothScroll from "@/components/chrome/SmoothScroll";
import CustomCursor from "@/components/chrome/CustomCursor";
import Navigation from "@/components/chrome/Navigation";
import Hero from "@/components/sections/Hero";
import Manifesto from "@/components/sections/Manifesto";
import ProductExperience from "@/components/sections/ProductExperience";
import NetworkNarrative from "@/components/sections/NetworkNarrative";
import ConsumerApp from "@/components/sections/ConsumerApp";
import SecurityArchitecture from "@/components/sections/SecurityArchitecture";
import GlobalCorridors from "@/components/sections/GlobalCorridors";
import Metrics from "@/components/sections/Metrics";
import UseCases from "@/components/sections/UseCases";
import Thesis from "@/components/sections/Thesis";
import FinalCTA from "@/components/sections/FinalCTA";
import Footer from "@/components/chrome/Footer";

export default function Home() {
  return (
    <SmoothScroll>
      <CustomCursor />
      <Navigation />
      <main>
        <Hero />
        <Manifesto />
        <ProductExperience />
        <NetworkNarrative />
        <ConsumerApp />
        <SecurityArchitecture />
        <GlobalCorridors />
        <Metrics />
        <UseCases />
        <Thesis />
        <FinalCTA />
      </main>
      <Footer />
    </SmoothScroll>
  );
}
