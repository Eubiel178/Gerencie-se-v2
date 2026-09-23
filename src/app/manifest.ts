import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Gerencie-se",
    short_name: "Gerencie-se",
    description:
      "Organize tarefas, rotina, hábitos e foco num só lugar. Um companheiro virtual acompanha sua execução.",
    start_url: "/home",
    display: "standalone",
    background_color: "#14151f",
    theme_color: "#1f2233",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
