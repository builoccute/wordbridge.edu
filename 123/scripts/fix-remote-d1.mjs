import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const migDir = path.resolve("database/migrations");
const files = fs.readdirSync(migDir).filter((f) => f.endsWith(".sql")).sort();
const wranglerBin = path.resolve("node_modules/wrangler/bin/wrangler.js");

console.log(`Applying ${files.length} idempotent SQL files to remote Cloudflare D1 "word"...`);
for (const file of files) {
  const fullPath = path.join("database/migrations", file);
  console.log(`-> ${file}`);
  execFileSync(
    process.execPath,
    [wranglerBin, "d1", "execute", "word", "--remote", "--file", fullPath, "--yes"],
    { stdio: "inherit" }
  );
}
console.log("Done! Remote D1 schema and views (0001-0015) are now in sync.");
