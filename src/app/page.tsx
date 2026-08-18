import SmoothScroll from "@/components/chrome/SmoothScroll";
import CustomCursor from "@/components/chrome/CustomCursor";
import Navigation from "@/components/chrome/Navigation";
import Hero from "@/components/sections/Hero";
import Manifesto from "@/components/sections/Manifesto";
import ProductExperience from "@/components/sections/ProductExperience";

export default function Home() {
  return (
    <SmoothScroll>
      <CustomCursor />
      <Navigation />
      <main>
        <Hero />
        <Manifesto />
        <ProductExperience />
      </main>
    </SmoothScroll>
  );
}
