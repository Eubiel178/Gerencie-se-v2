import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Gerencie-se",
    short_name: "Gerencie-se",
    description:
      "Produtividade, organização, foco e disciplina em um só lugar.",
    start_url: "/home",
    display: "standalone",
    background_color: "#14151f",
    theme_color: "#1f2233",
    icons: [
      {
        src: "/icon.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
