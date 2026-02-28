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
        // This ensures that even if there's a minor path error, 
        // the browser knows how to handle the cross-origin request
        source: "/(.*)",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS" },
          { key: "Cross-Origin-Resource-Policy", value: "cross-origin" }
        ],
      },
    ];
  },
}
