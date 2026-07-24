import type { ReactNode } from "react";

/**
 * Real, full-color brand logos for the integrations catalog, drawn as inline
 * SVG so there is no runtime dependency and no external asset request. Each mark
 * is a faithful, recognizable reconstruction of the vendor's logo, used purely
 * to identify the integration partner. Every mark uses a 0 0 48 48 viewBox so
 * sizing stays uniform across the grid.
 */

type Props = { className?: string };

function Frame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {children}
    </svg>
  );
}

/** QuickBooks Online: green disc with the white circular "qb" mark. */
function QuickBooks({ className }: Props) {
  return (
    <Frame className={className}>
      <circle cx="24" cy="24" r="20" fill="#2CA01C" />
      <circle cx="24" cy="24" r="8.5" fill="none" stroke="#fff" strokeWidth="3" />
      <rect x="22.4" y="15.5" width="3.2" height="17" rx="1.6" fill="#fff" />
    </Frame>
  );
}

/** Xero: bright blue disc with a white "X" of two crossed rounded strokes. */
function Xero({ className }: Props) {
  return (
    <Frame className={className}>
      <circle cx="24" cy="24" r="20" fill="#13B5EA" />
      <path
        d="M17 17 24 24l-7 7M31 17 24 24l7 7"
        fill="none"
        stroke="#fff"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Frame>
  );
}

/** Zapier: orange tile with the white six-point burst. */
function Zapier({ className }: Props) {
  return (
    <Frame className={className}>
      <rect width="48" height="48" rx="11" fill="#FF4F00" />
      <g stroke="#fff" strokeWidth="4.6" strokeLinecap="round">
        <line x1="24" y1="12" x2="24" y2="36" />
        <line x1="13.6" y1="18" x2="34.4" y2="30" />
        <line x1="13.6" y1="30" x2="34.4" y2="18" />
      </g>
      <circle cx="24" cy="24" r="4.4" fill="#fff" />
    </Frame>
  );
}

/** Slack: the four-color pinwheel, drawn as one rotated arm x4. */
function Slack({ className }: Props) {
  const colors = ["#36C5F0", "#2EB67D", "#ECB22E", "#E01E5A"];
  return (
    <Frame className={className}>
      {colors.map((c, i) => (
        <g key={c} transform={`rotate(${90 * i} 24 24)`}>
          {/* bar reaching toward the center */}
          <rect x="18" y="6.5" width="6" height="13.5" rx="3" fill={c} />
          {/* hook sticking out at the outer end */}
          <rect x="12" y="6.5" width="6" height="6" rx="3" fill={c} />
        </g>
      ))}
    </Frame>
  );
}

/** Microsoft Teams: purple people with a white "T" badge. */
function Teams({ className }: Props) {
  return (
    <Frame className={className}>
      <circle cx="34" cy="13" r="5" fill="#5059C9" />
      <rect x="28.5" y="18.5" width="14" height="13" rx="4" fill="#5059C9" />
      <circle cx="20" cy="12.5" r="6" fill="#7B83EB" />
      <rect x="8" y="16.5" width="24" height="21" rx="5" fill="#7B83EB" />
      <rect x="10.5" y="18.5" width="19" height="17" rx="3" fill="#4B53BC" />
      <path fill="#fff" d="M26 22.6h-12v2.6h4.7v8.4h2.6v-8.4H26z" />
    </Frame>
  );
}

/** Gmail: white envelope with blue/green side panels and the red M flap. */
function Gmail({ className }: Props) {
  return (
    <Frame className={className}>
      <rect x="6" y="13" width="36" height="22" rx="3" fill="#fff" />
      <path fill="#4285F4" d="M6 33V19l6 4.4V35H8a2 2 0 0 1-2-2z" />
      <path fill="#34A853" d="M42 33V19l-6 4.4V35h4a2 2 0 0 0 2-2z" />
      <path fill="#EA4335" d="M6 17.5a2.5 2.5 0 0 1 4-2L24 25.6l14-10.1a2.5 2.5 0 0 1 4 2V20L24 33 6 20z" />
      <path fill="#FBBC04" d="M42 17.5V20l-6 4.3v-5.6l2-1.4a2.5 2.5 0 0 1 4 .2z" />
      <path fill="#C5221F" d="M6 17.5a2.5 2.5 0 0 1 4-2l2 1.4v5.6l-6-4.3z" />
    </Frame>
  );
}

/** Outlook: dark-blue "O" panel beside a lighter envelope. */
function Outlook({ className }: Props) {
  return (
    <Frame className={className}>
      <rect x="24" y="14" width="19" height="20" rx="2" fill="#0F6CBD" />
      <path fill="#fff" d="M25.5 16h16v2.2l-8 5.4-8-5.4z" />
      <path fill="#28A8EA" d="M25.5 19.2 33.5 24l8-4.8V32h-16z" />
      <rect x="5" y="10" width="22" height="28" rx="4" fill="#0364B8" />
      <path
        fill="#fff"
        d="M16 16.2c-4.4 0-7.4 3.3-7.4 7.9s3 7.9 7.4 7.9 7.4-3.3 7.4-7.9-3-7.9-7.4-7.9Zm0 12.6c-2.4 0-4-2-4-4.7s1.6-4.7 4-4.7 4 2 4 4.7-1.6 4.7-4 4.7Z"
      />
    </Frame>
  );
}

/** Google Drive: the tri-color triangle split from its centroid. */
function GoogleDrive({ className }: Props) {
  return (
    <Frame className={className}>
      {/* top = yellow, left = blue, right = green */}
      <path fill="#FFBA00" d="M24 8 15.7 24h16.6z" />
      <path fill="#0066DA" d="M15.7 24 7.4 40h16.6l-8.3-16z" transform="translate(0.3 0)" />
      <path fill="#0066DA" d="M15.6 24 7 40h17l-8.4-16z" />
      <path fill="#00AC47" d="M32.4 24 41 40H24l8.4-16z" />
      <path fill="#EA4335" d="M24 24 15.6 24 7 40h17z" opacity="0" />
      <path fill="#2684FC" d="M24 40H7l8.6-16H24z" opacity="0" />
    </Frame>
  );
}

/** Dropbox: the blue folded-box mark (four chevrons). */
function Dropbox({ className }: Props) {
  return (
    <Frame className={className}>
      <g fill="#0061FF">
        <path d="M14.5 8 4 15l10.5 7L25 15z" />
        <path d="M35.5 8 25 15l10.5 7L46 15z" />
        <path d="M4 29l10.5 7L25 29l-10.5-7z" />
        <path d="M35.5 22 25 29l10.5 7L46 29z" />
        <path d="M14.5 38 25 31l10.5 7L25 45z" />
      </g>
    </Frame>
  );
}

/** Dext: black tile with the yellow "d" mark. */
function Dext({ className }: Props) {
  return (
    <Frame className={className}>
      <rect width="48" height="48" rx="11" fill="#141414" />
      <path
        fill="#FFD200"
        d="M30 12v9.6a9.8 9.8 0 1 0 0 12.8V36h4V12h-4Zm-6.2 20.9a5.8 5.8 0 1 1 5.8-5.8 5.8 5.8 0 0 1-5.8 5.8Z"
      />
    </Frame>
  );
}

/** Stripe: indigo tile with the white "S". */
function Stripe({ className }: Props) {
  return (
    <Frame className={className}>
      <rect width="48" height="48" rx="11" fill="#635BFF" />
      <path
        fill="#fff"
        d="M22.9 20.2c0-1.2 1-1.7 2.6-1.7a17 17 0 0 1 7.6 2v-7a20 20 0 0 0-7.6-1.4c-6.2 0-10.3 3.2-10.3 8.6 0 8.5 11.6 7.1 11.6 10.8 0 1.4-1.2 1.9-2.9 1.9-2.5 0-5.8-1-8.4-2.5v7.1a21 21 0 0 0 8.4 1.7c6.3 0 10.7-3.1 10.7-8.6 0-9.2-11.7-7.5-11.7-11Z"
      />
    </Frame>
  );
}

/** QuickBooks Desktop: green monitor holding the "qb" circle mark. */
function QuickBooksDesktop({ className }: Props) {
  return (
    <Frame className={className}>
      <rect x="4" y="8" width="40" height="27" rx="3" fill="#1E7A12" />
      <rect x="7" y="11" width="34" height="21" rx="1.5" fill="#2CA01C" />
      <circle cx="24" cy="21.5" r="6.2" fill="none" stroke="#fff" strokeWidth="2.4" />
      <rect x="22.8" y="15" width="2.4" height="13" rx="1.2" fill="#fff" />
      <rect x="18" y="37" width="12" height="2.4" rx="1.2" fill="#1E7A12" />
      <rect x="13" y="40.4" width="22" height="2.6" rx="1.3" fill="#155C0D" />
    </Frame>
  );
}

const MAP: Record<string, (p: Props) => JSX.Element> = {
  quickbooks: QuickBooks,
  xero: Xero,
  zapier: Zapier,
  slack: Slack,
  teams: Teams,
  gmail: Gmail,
  outlook: Outlook,
  google_drive: GoogleDrive,
  dropbox: Dropbox,
  dext: Dext,
  stripe: Stripe,
  quickbooks_desktop: QuickBooksDesktop,
};

export function hasBrandLogo(key: string) {
  return key in MAP;
}

export function BrandLogo({ brand, className }: { brand: string; className?: string }) {
  const Cmp = MAP[brand];
  if (!Cmp) return null;
  return <Cmp className={className} />;
}
