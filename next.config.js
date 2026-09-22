/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.googleusercontent.com",
      },
    ],
    // O avatar (`/api/profile/avatar/[userId]`) é servido com um `?v=`
    // de cache-busting (timestamp do upload) - sem essa entrada, o
    // Next 16 bloqueia por padrão qualquer imagem LOCAL com query string
    // (proteção contra enumeração via `next/image`, ver changelog da
    // v16). Sem `search` fixo aqui de propósito: o `?v=` muda a cada
    // upload, e o `pathname` já restringe isso à nossa própria rota
    // (não é uma URL arbitrária vinda de terceiro).
    localPatterns: [
      {
        pathname: "/api/profile/avatar/**",
      },
      // Avatares redondos do mascote (arquivo estático em `public/`, sem
      // query string nem geração dinâmica) - usados no cabeçalho e nas
      // mensagens do Widget do Assistant (`mascotAvatarUrl`). Uma vez que
      // `localPatterns` é configurado, o Next passa a exigir QUALQUER
      // caminho local seja listado explicitamente - sem esta entrada,
      // `next/image` rejeitava com "Invalid src prop... does not match
      // images.localPatterns" (erro real encontrado ao converter de
      // `<img>` pra `<Image>`).
      {
        pathname: "/mascot/avatars/**",
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
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
