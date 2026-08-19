import gsap from "gsap";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText, MotionPathPlugin);
  gsap.defaults({ ease: "expo.out", duration: 0.9 });
  if (process.env.NODE_ENV === "development") {
    (window as unknown as Record<string, unknown>).__ST = ScrollTrigger;
    (window as unknown as Record<string, unknown>).__gsap = gsap;
  }
}

export { gsap, ScrollTrigger, SplitText, MotionPathPlugin };
