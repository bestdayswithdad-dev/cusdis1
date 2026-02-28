export default {
  async rewrites() {
    return [
      {
        source: '/doc',
        destination: '/doc/index.html'
      }
    ]
  },
  async headers() {
    return [
      {
        // Target your script files to prevent ORB blocking
        source: "/:path*.(js|mjs)",
        headers: [
          {
            key: "Content-Type",
            value: "application/javascript",
          },
          {
            key: "Access-Control-Allow-Origin",
            value: "*", // Allows your blog to fetch the script from this Vercel domain
          },
          {
            key: "Cross-Origin-Resource-Policy",
            value: "cross-origin", // Explicitly tells ORB this is a shared resource
          }
        ],
      },
    ];
  },
}
