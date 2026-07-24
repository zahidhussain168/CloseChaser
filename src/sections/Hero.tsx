"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Check, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/site/Button";
import { SiteNav } from "@/components/site/SiteNav";
import { Aurora } from "@/components/site/Aurora";
import { PhoneDemo } from "@/sections/PhoneDemo";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const EASE = [0.22, 1, 0.36, 1] as const;

export function Hero() {
  const scope = useRef<HTMLElement>(null);

  // GSAP ScrollTrigger: as the hero scrolls away, its layers drift at different
  // rates for depth, the card lifting toward the viewer while the copy trails
  // and the glow floats. Scrubbed and eased "none" so it tracks the scrollbar,
  // softened by scrub: 0.5 so it feels calm. matchMedia disables it entirely
  // under prefers-reduced-motion; useGSAP reverts everything on unmount.
  useGSAP(
    () => {
      const st = () => ({
        trigger: scope.current,
        start: "top top",
        end: "bottom top",
        scrub: 0.4,
      });
      // The card lifts and recedes (scale) as you scroll, the copy trails a
      // little, and the glow floats the other way, for clear layered depth.
      gsap.to("[data-hero='visual']", { y: -150, scale: 0.88, ease: "none", scrollTrigger: st() });
      gsap.to("[data-hero='copy']", { y: -40, ease: "none", scrollTrigger: st() });
      gsap.to("[data-hero='glow']", { y: 140, scale: 1.4, ease: "none", scrollTrigger: st() });
      ScrollTrigger.refresh();
    },
    { scope },
  );

  return (
    <section ref={scope} className="brand-wash relative overflow-hidden">
      <Aurora variant="brand" />
      <SiteNav />
      <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-8 px-5 sm:px-8 pb-12 pt-6 sm:gap-14 sm:pb-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:pb-28 lg:pt-16">
        <div data-hero="copy">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
          >
          <span className="pill pill-brand mb-5">
            <Sparkles size={13} /> Built for solo bookkeepers
          </span>
          <h1 className="t-display font-display text-text">
            Close the month without{" "}
            <span className="bg-gradient-to-r from-brand to-success bg-clip-text text-transparent">
              chasing clients
            </span>
            .
          </h1>
          <p className="t-body-lg mt-5 max-w-xl text-muted">
            RuledOff collects every document, receipt, and answer blocking your close, then
            chases your client automatically until each item is ruled off. Your client just taps
            a link. No login, no portal, no app.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button href="/signup" size="lg">
              Start free for 14 days <ArrowRight size={18} />
            </Button>
            <Button href="#how" variant="secondary" size="lg">
              See how it works
            </Button>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-muted">
            <span className="flex items-center gap-1.5"><Check size={15} className="text-success" /> No card required</span>
            <span className="flex items-center gap-1.5"><Check size={15} className="text-success" /> Unlimited clients</span>
            <span className="flex items-center gap-1.5"><Check size={15} className="text-success" /> QuickBooks sync, rolling out</span>
          </div>
          </motion.div>
        </div>

        <div data-hero="visual" className="relative flex justify-center lg:justify-end">
          <div
            data-hero="glow"
            className="absolute right-6 -top-10 hidden h-44 w-44 rounded-full bg-brand/10 blur-3xl lg:block"
          />
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.15 }}
          >
            <PhoneDemo />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
