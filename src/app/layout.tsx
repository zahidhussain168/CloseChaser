import type { Metadata } from "next";
import "./globals.css";

const DESCRIPTION =
  "RuledOff automatically collects the documents, receipts, and answers blocking your month-end close, and chases your client until every item is ruled off. No logins, no portals for your client.";

export const metadata: Metadata = {
  metadataBase: new URL("https://ruledoff.vercel.app"),
  title: "RuledOff: stop chasing clients, close the month faster",
  description: DESCRIPTION,
  applicationName: "RuledOff",
  openGraph: {
    type: "website",
    siteName: "RuledOff",
    title: "RuledOff: stop chasing clients, close the month faster",
    description: DESCRIPTION,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "RuledOff: stop chasing clients, close the month faster",
    description: DESCRIPTION,
  },
};

// Apply the saved theme before paint so there is no light/dark flash.
const themeScript = `(function(){try{var t=localStorage.getItem('ruledoff-theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="font-sans antialiased text-text">{children}</body>
    </html>
  );
}
