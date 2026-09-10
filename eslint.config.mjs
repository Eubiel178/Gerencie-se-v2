import nextConfig from "eslint-config-next/core-web-vitals";

const config = [
  ...nextConfig,
  {
    rules: {
      "react/display-name": "off",
    },
  },
];

export default config;
