// Run after `next build`. Copies the standalone server output and the
// Prisma schema/migrations into src-tauri/resources so tauri.conf.json's
// bundle.resources can pick them up.
//
// Requires next.config.ts to set: output: "standalone"

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const standaloneSrc = path.join(root, ".next", "standalone");
const staticSrc = path.join(root, ".next", "static");
const publicSrc = path.join(root, "public");
const prismaSrc = path.join(root, "prisma");

const destRoot = path.join(root, "src-tauri", "resources");
const standaloneDest = path.join(destRoot, "standalone");
const prismaDest = path.join(destRoot, "prisma");

function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    console.warn(`[prepare-standalone] skipping missing: ${src}`);
    return;
  }
  fs.mkdirSync(dest, { recursive: true });
  fs.cpSync(src, dest, { recursive: true });
}

fs.rmSync(destRoot, { recursive: true, force: true });

copyDir(standaloneSrc, standaloneDest);
// Next's standalone output does not include .next/static or public/ —
// they have to be copied in manually alongside server.js.
copyDir(staticSrc, path.join(standaloneDest, ".next", "static"));
copyDir(publicSrc, path.join(standaloneDest, "public"));
copyDir(prismaSrc, prismaDest);

console.log("[prepare-standalone] resources ready at src-tauri/resources/");
