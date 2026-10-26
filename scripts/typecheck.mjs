import { createRequire } from "node:module";
import { dirname, join } from "node:path";
const require = createRequire(import.meta.url);
const ts = require("typescript");
const config = ts.readConfigFile("tsconfig.json", ts.sys.readFile);
const parsed = ts.parseJsonConfigFileContent(
  config.config,
  ts.sys,
  process.cwd(),
);
// Resolve both normal local installs and externally installed worker tooling.
parsed.options.paths = {
  react: [
    join(dirname(require.resolve("@types/react/package.json")), "index.d.ts"),
  ],
  "react/jsx-runtime": [
    join(
      dirname(require.resolve("@types/react/package.json")),
      "jsx-runtime.d.ts",
    ),
  ],
  "react-dom/client": [
    join(
      dirname(require.resolve("@types/react-dom/package.json")),
      "client.d.ts",
    ),
  ],
};
const program = ts.createProgram(parsed.fileNames, parsed.options);
const errors = [...parsed.errors, ...ts.getPreEmitDiagnostics(program)];
if (errors.length) {
  console.error(
    ts.formatDiagnosticsWithColorAndContext(errors, {
      getCanonicalFileName: (p) => p,
      getCurrentDirectory: () => process.cwd(),
      getNewLine: () => "\n",
    }),
  );
  process.exitCode = 1;
} else console.log("Typecheck passed.");
