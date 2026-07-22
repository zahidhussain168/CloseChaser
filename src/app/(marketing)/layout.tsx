import dynamic from "next/dynamic";
import { MotionProvider } from "@/components/site/MotionProvider";

// The page-wide WebGL background is client-only and lazy: never runs during SSR.
const SceneBackground = dynamic(
  () => import("@/components/site/SceneBackground").then((m) => m.SceneBackground),
  { ssr: false },
);

/**
 * Marketing site theme wrapper. A single fixed WebGL "liquid ledger" surface
 * sits behind every section; content floats above it, and sections that keep an
 * opaque background simply cover it, so the flow shows through the translucent
 * ones for one continuous living backdrop across the whole page.
 */
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dark min-h-dvh bg-[#080e1c] font-sans text-slate-100 antialiased">
      <div aria-hidden="true" className="fixed inset-0 z-0">
        <SceneBackground />
      </div>
      <div className="relative z-10">
        <MotionProvider>{children}</MotionProvider>
      </div>
    </div>
  );
}
