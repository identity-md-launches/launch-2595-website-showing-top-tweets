import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
const require = createRequire(import.meta.url);
const vite = await import(pathToFileURL(require.resolve("vite")).href);
const command = process.argv[2];
if (command === "build") await vite.build({ configLoader: "native" });
else if (command === "preview") {
  const server = await vite.preview({
    configLoader: "native",
    preview: { host: "0.0.0.0", port: 4173 },
  });
  server.printUrls();
} else {
  const server = await vite.createServer({ configLoader: "native", server: { host: "0.0.0.0" } });
  await server.listen();
  server.printUrls();
}
