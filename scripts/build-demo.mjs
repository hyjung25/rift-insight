/** Build the same dashboard as a credential-free GitHub Pages site.
 * Use an explicit source allowlist: never copy .env files or server API modules.
 * The normal Next.js server app and its .next build are left intact.
 */
import { cp, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
const root = fileURLToPath(new URL("../", import.meta.url));
const dest = join(root, ".demo-build");
const basePath = "/rift-insight";
await rm(dest, { recursive: true, force: true });
await mkdir(join(dest, "app"), { recursive: true });
await mkdir(join(dest, "lib"), { recursive: true });
for (const file of [
  "package.json",
  "tsconfig.json",
  "postcss.config.mjs",
  "components",
  "public",
]) {
  await cp(join(root, file), join(dest, file), { recursive: true });
}
for (const file of [
  "demo.ts",
  "types.ts",
  "validation.ts",
  "metrics.ts",
  "insights.ts",
]) {
  await cp(join(root, "lib", file), join(dest, "lib", file));
}
for (const file of ["layout.tsx", "icon.svg"])
  await cp(join(root, "app", file), join(dest, "app", file));
const css = await readFile(join(root, "app/globals.css"), "utf8");
await writeFile(
  join(dest, "app/globals.css"),
  css.replaceAll(
    "/assets/ahri-splash.jpg",
    `${basePath}/assets/ahri-splash.jpg`,
  ),
);
await writeFile(
  join(dest, "app/page.tsx"),
  `import Dashboard from '@/components/dashboard';
import { demoAnalysis } from '@/lib/demo';
export default function Page() { return <Dashboard initial={demoAnalysis()} liveAvailable={false} publicDemo />; }
`,
);
await writeFile(
  join(dest, "next.config.mjs"),
  `export default ${JSON.stringify({ output: "export", basePath, trailingSlash: true, poweredByHeader: false, env: { NEXT_PUBLIC_BASE_PATH: basePath } })};\n`,
);
await symlink(join(root, "node_modules"), join(dest, "node_modules"), "dir");
// Drop the server secret even if the invoking shell happens to have one set.
const env = { ...process.env, NEXT_TELEMETRY_DISABLED: "1" };
delete env.RIOT_API_KEY;
const result = spawnSync(
  process.execPath,
  [join(root, "node_modules/next/dist/bin/next"), "build", "--webpack"],
  { cwd: dest, env, stdio: "inherit" },
);
if (result.status !== 0) process.exit(result.status ?? 1);
await writeFile(join(dest, "out/.nojekyll"), "");
console.log(
  "Public demo ready: .demo-build/out (no API route or credentials).",
);
