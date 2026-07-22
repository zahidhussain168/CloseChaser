"use client";

import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * Scroll-scrubbed parallax drift, powered by GSAP ScrollTrigger. The element
 * eases from +travel to -travel as it crosses the viewport, so it sits at its
 * natural position when centered and drifts gently at the edges, giving depth
 * without motion-sickness. `scrub` softens the follow so it feels calm, not
 * twitchy. Fully disabled under prefers-reduced-motion via gsap.matchMedia.
 */
export function Parallax({
  children,
  travel = 40,
  className,
}: {
  children: ReactNode;
  /** Total drift in px across the full scroll-through (higher = more depth). */
  travel?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        ref.current,
        { y: travel / 2 },
        {
          y: -travel / 2,
          ease: "none",
          scrollTrigger: {
            trigger: ref.current,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.4,
          },
        },
      );
      ScrollTrigger.refresh();
    },
    { scope: ref, dependencies: [travel] },
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
