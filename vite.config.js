import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

export default {
  base: "./",
  cacheDir: ".cache/vite",
  resolve: {
    alias: [
      {
        find: "react-dom/client",
        replacement: require.resolve("react-dom/client"),
      },
      {
        find: "react/jsx-runtime",
        replacement: require.resolve("react/jsx-runtime"),
      },
      {
        find: "react/jsx-dev-runtime",
        replacement: require.resolve("react/jsx-dev-runtime"),
      },
      { find: "react", replacement: require.resolve("react") },
    ],
  },
  build: { outDir: "dist", emptyOutDir: true },
};
