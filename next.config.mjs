/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,PUT,DELETE,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization, X-Requested-With, Accept, X-Paystack-Signature" },
        ],
      },
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { 
            key: "Content-Security-Policy", 
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.paystack.co https://*.paystack.co https://*.paystack.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.paystack.co https://*.paystack.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: blob: https: http:",
              "connect-src 'self' https://api.paystack.co https://*.paystack.co https://*.paystack.com https://*.supabase.co wss://*.supabase.co",
              "frame-src 'self' https://js.paystack.co https://*.paystack.co https://*.paystack.com https://checkout.paystack.com",
              "child-src 'self' https://js.paystack.co https://*.paystack.co https://*.paystack.com https://checkout.paystack.com blob:",
              "worker-src 'self' blob:",
              "form-action 'self' https://*.paystack.co https://*.paystack.com",
            ].join("; ")
          },
        ],
      },
    ]
  },
}

export default nextConfig
