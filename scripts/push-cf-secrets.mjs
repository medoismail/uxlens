// Push server-side secrets from .env.local to the Cloudflare Worker.
//
// Reads .env.local, drops NEXT_PUBLIC_* (those are inlined at build time, not
// runtime secrets), and bulk-uploads the rest via `wrangler secret bulk`.
//
// Prereqs: `npx wrangler login` (or CLOUDFLARE_API_TOKEN set) and the Worker
// must already be deployed once (secrets attach to an existing Worker).
//
// Usage: node scripts/push-cf-secrets.mjs
//
// This file contains no secrets; values are read from .env.local at runtime.

import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const ENV_FILE = ".env.local";
const WORKER_NAME = "uxlens";

let raw;
try {
  raw = readFileSync(ENV_FILE, "utf8");
} catch {
  console.error(`Cannot read ${ENV_FILE}. Run this from the project root.`);
  process.exit(1);
}

const secrets = {};
for (const line of raw.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
  if (!match) continue;
  const [, key, rawValue] = match;
  if (key.startsWith("NEXT_PUBLIC_")) continue; // build-time public, not a secret
  let value = rawValue.trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  secrets[key] = value;
}

const names = Object.keys(secrets);
if (names.length === 0) {
  console.error(`No server-side secrets found in ${ENV_FILE}.`);
  process.exit(1);
}

console.log(`Pushing ${names.length} secrets to Worker "${WORKER_NAME}":`);
for (const name of names) console.log(`  - ${name}`);

const result = spawnSync(
  "npx",
  ["wrangler", "secret", "bulk", "--name", WORKER_NAME],
  { input: JSON.stringify(secrets), stdio: ["pipe", "inherit", "inherit"] }
);

process.exit(result.status ?? 1);
