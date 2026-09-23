import nextConfig from "eslint-config-next/core-web-vitals";

const config = [
  ...nextConfig,
  {
    rules: {
      "react/display-name": "off",
      "import/order": [
        "warn",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
          ],
          pathGroups: [
            {
              pattern: "react",
              group: "external",
              position: "before",
            },
            {
              pattern: "react-*",
              group: "external",
              position: "before",
            },
            {
              pattern: "next",
              group: "external",
              position: "before",
            },
            {
              pattern: "next-*",
              group: "external",
              position: "before",
            },
            {
              pattern: "@/**",
              group: "internal",
              position: "after",
            },
            {
              pattern: "*.css",
              group: "index",
              position: "after",
            },
          ],
          pathGroupsExcludedImportTypes: ["react", "react-*", "next", "next-*"],
          "newlines-between": "always",
          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },
        },
      ],
      "import/first": "warn",
      "import/no-duplicates": "warn",
    },
  },
];

export default config;
