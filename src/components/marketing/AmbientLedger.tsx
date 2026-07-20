"use client";

import { useEffect, useRef } from "react";

/**
 * Ambient hero background: slowly drifting ledger rule lines plus a few brass
 * reconciliation ticks floating up. One canvas, paused when offscreen, static
 * under prefers-reduced-motion. The only always-on motion on the page.
 */
export function AmbientLedger() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const parent = canvas?.parentElement;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !parent || !ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let w = 0;
    let h = 0;

    function resize() {
      const r = parent!.getBoundingClientRect();
      w = r.width;
      h = r.height;
      canvas!.width = Math.floor(w * dpr);
      canvas!.height = Math.floor(h * dpr);
      canvas!.style.width = `${w}px`;
      canvas!.style.height = `${h}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(parent);

    const ticks = Array.from({ length: 16 }, (_, i) => ({
      x: ((i * 61) % 100) / 100,
      y: ((i * 37) % 100) / 100,
      s: 0.4 + ((i * 13) % 10) / 12,
    }));

    let raf = 0;
    let t = 0;
    let visible = true;

    function draw(phase: number) {
      ctx!.clearRect(0, 0, w, h);
      const gap = 34;
      const off = (phase * 6) % gap;
      ctx!.strokeStyle = "rgba(174, 191, 170, 0.3)";
      ctx!.lineWidth = 1;
      for (let y = -gap + off; y < h + gap; y += gap) {
        ctx!.beginPath();
        ctx!.moveTo(0, Math.round(y) + 0.5);
        ctx!.lineTo(w, Math.round(y) + 0.5);
        ctx!.stroke();
      }
      ctx!.fillStyle = "rgba(168, 139, 76, 0.55)";
      for (const p of ticks) {
        const py = (((p.y - phase * p.s * 0.012) % 1) + 1) % 1;
        ctx!.fillRect(Math.round(p.x * w), Math.round(py * h), 2, 2);
      }
    }

    function loop() {
      if (!visible || reduce) return;
      t += 1;
      draw(t);
      raf = requestAnimationFrame(loop);
    }

    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
        if (visible && !reduce) loop();
        else cancelAnimationFrame(raf);
      },
      { threshold: 0 },
    );
    io.observe(canvas);

    if (reduce) draw(0);
    else loop();

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
    />
  );
}
