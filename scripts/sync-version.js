/**
 * Reads the version from tauri.conf.json (single source of truth) and writes
 * it to src/constants/app.ts and package.json so all three stay in sync.
 *
 * Usage: node scripts/sync-version.js
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const tauriConf = JSON.parse(readFileSync(resolve(root, "src-tauri/tauri.conf.json"), "utf-8"));
const version = tauriConf.version;

if (!/^\d+\.\d+\.\d+/.test(version)) {
  console.error(`Invalid version in tauri.conf.json: "${version}"`);
  process.exit(1);
}

// Update package.json
const pkgPath = resolve(root, "package.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
if (pkg.version !== version) {
  pkg.version = version;
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf-8");
  console.log(`package.json → ${version}`);
}

// Update Cargo.toml
const cargoPath = resolve(root, "src-tauri/Cargo.toml");
const cargo = readFileSync(cargoPath, "utf-8");
const updatedCargo = cargo.replace(/^version\s*=\s*"[^"]+"/m, `version = "${version}"`);
if (cargo !== updatedCargo) {
  writeFileSync(cargoPath, updatedCargo, "utf-8");
  console.log(`Cargo.toml → ${version}`);
}

// Update src/constants/app.ts
const appTsPath = resolve(root, "src/constants/app.ts");
const appTs = `export const APP_VERSION = "${version}";\n`;
const current = readFileSync(appTsPath, "utf-8");
if (current !== appTs) {
  writeFileSync(appTsPath, appTs, "utf-8");
  console.log(`src/constants/app.ts → ${version}`);
}

console.log(`All files synced to v${version}`);
