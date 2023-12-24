import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      screens: {
        mobile: { max: "480px" },
        tablet: { max: "768px" },
        computer: { max: "992px" },
        desktop: { max: "1200px" },
        widescreen: { max: "1920px" },
      },

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
  plugins: [],
};
export default config;
