/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.googleusercontent.com",
      },
    ],
  },
  // O service worker (public/sw.js) nunca deve ficar em cache do próprio
  // navegador HTTP — senão uma atualização dele (novo CACHE_NAME) demora
  // a chegar pros usuários. O conteúdo em si já é versionado via
  // CACHE_NAME dentro do arquivo.
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }],
      },
    ];
  },
};

module.exports = nextConfig;
