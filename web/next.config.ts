import type { NextConfig } from "next";

// React's dev-mode debugging (callstack reconstruction) relies on eval(), so the
// CSP must relax script-src in development. Production keeps the strict policy.
const isDev = process.env.NODE_ENV === "development";
// When the app is pointed at a local Supabase clone (scan stack or another
// developer backend), the browser must be allowed to reach it too.
const supaOrigin = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(
  /\/rest.*$/,
  "",
);
const localSupa = supaOrigin.startsWith("http://127.0.0.1:") ? ` ${supaOrigin}` : "";

const scriptSrc = isDev ? "'self' 'unsafe-inline' 'unsafe-eval'" : "'self' 'unsafe-inline'";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  allowedDevOrigins: ["127.0.0.1", "localhost", "169.254.*.*", "192.168.*.*", "*.app.github.dev"],
  experimental: {
    // GitHub Codespaces forwards requests through *.app.github.dev,
    // which trips the Server Actions origin check.
    serverActions: {
      allowedOrigins: ["localhost:3000", "*.app.github.dev"],
    },
  },
  // Security headers (OWASP ZAP remediation, see Docs/Reports/Security_Assessment_Report.md §6.5)
  headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
          {
            key: "Content-Security-Policy",
            value:
              `default-src 'self'; script-src ${scriptSrc}; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://vmiytfciwvinulupobkm.supabase.co https://tiles.openfreemap.org https://s3.amazonaws.com; font-src 'self' data:; connect-src 'self'${localSupa} https://vmiytfciwvinulupobkm.supabase.co https://tiles.openfreemap.org https://s3.amazonaws.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'`,
          },
        ],
      },
    ];
  },
};

export default nextConfig;