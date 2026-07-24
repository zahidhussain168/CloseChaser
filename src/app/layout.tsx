import type { Metadata } from "next";
import { Fraunces, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

// Display: Fraunces, a characterful high-contrast serif with optical sizing.
// Body: Inter. Numerals/data: IBM Plex Mono. Loaded via next/font so there is
// no render-blocking link and no layout shift; each exposes a CSS variable that
// feeds the existing --font-* tokens in globals.css.
const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fraunces",
  style: ["normal", "italic"],
});
const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter-next" });
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-plex-next",
});

const DESCRIPTION =
  "RuledOff automatically collects the documents, receipts, and answers blocking your month-end close, and chases your client until every item is ruled off. No logins, no portals for your client.";

const TITLE = "RuledOff: stop chasing clients, close the month faster";

export const metadata: Metadata = {
  metadataBase: new URL("https://ruledoff.vercel.app"),
  title: {
    default: TITLE,
    // Per-page titles read "Pricing · RuledOff", the home title stays as-is.
    template: "%s · RuledOff",
  },
  description: DESCRIPTION,
  applicationName: "RuledOff",
  keywords: [
    "bookkeeping software",
    "month-end close",
    "client document collection",
    "chase clients for documents",
    "QuickBooks close checklist",
    "bookkeeper client portal no login",
    "1099 collection",
    "solo bookkeeper tools",
  ],
  authors: [{ name: "RuledOff" }],
  creator: "RuledOff",
  publisher: "RuledOff",
  category: "Business Software",
  alternates: { canonical: "/" },
  formatDetection: { telephone: false, address: false, email: false },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    siteName: "RuledOff",
    title: TITLE,
    description: DESCRIPTION,
    url: "/",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
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
    <html
      lang="en"
      suppressHydrationWarning
      className={`${fraunces.variable} ${inter.variable} ${plexMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="font-sans antialiased text-text">{children}</body>
    </html>
  );
}
