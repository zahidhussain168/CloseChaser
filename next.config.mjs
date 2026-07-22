/** @type {import('next').NextConfig} */

// Security headers applied to every route. Kept deliberately conservative so
// they harden without breaking Next's inline hydration scripts or the Paddle.js
// overlay: no script-src CSP (would need nonces), but clickjacking, MIME
// sniffing, referrer leakage, and transport downgrade are all closed off.
// nosniff also blunts the stored-file content-type risk on signed URLs.
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
];

const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
