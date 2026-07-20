/**
 * Marketing site theme wrapper. Uses the warmer editorial palette (a bolder
 * cousin of the product app's ledger paper), scoped to marketing routes so the
 * authenticated app keeps its own tokens.
 */
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-site-bg font-sans text-site-ink antialiased">
      {children}
    </div>
  );
}
