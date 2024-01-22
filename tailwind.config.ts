import { withTV } from "tailwind-variants/dist/transformer.js";
import type { Config } from "tailwindcss";

const config: Config = withTV({
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      screens: {},

      colors: {
        // primary: "#0c66e4",
        // primaryContrast: "#FFFFFF",
        // secundary: "#F5F5F5",
        // secundaryContrast: "black",
        // tertitary: "#fff",
        // tertitaryContrast: "black",
        // quaternary: "#EFEFEF",
        // quaternaryContrast: "black",
      },
    },
  },
});

export default config;
