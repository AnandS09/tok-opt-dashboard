// Builds src/charts/dev/runCheck.ts for node with Vite and runs it. From mock/:
//
//   node src/charts/dev/runCheck.mjs
//
// It needs nothing outside the repo's own dependencies and starts no server.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../../..");
const { build } = await import(pathToFileURL(path.join(root, "node_modules/vite/dist/node/index.js")).href);
const out = fs.mkdtempSync(path.join(os.tmpdir(), "render-check-"));
try {
  await build({
    root,
    configFile: false,
    logLevel: "warn",
    build: {
      ssr: path.join(here, "runCheck.ts"),
      outDir: out,
      emptyOutDir: true,
      minify: false,
      target: "node22",
      rollupOptions: { output: { entryFileNames: "runCheck.mjs", format: "es" } },
    },
    ssr: { noExternal: true },
  });
  const run = spawnSync(process.execPath, [path.join(out, "runCheck.mjs")], {
    cwd: root,
    env: { ...process.env, MOCK_ROOT: root },
    stdio: "inherit",
  });
  process.exitCode = run.status ?? 1;
} finally {
  fs.rmSync(out, { recursive: true, force: true });
}
