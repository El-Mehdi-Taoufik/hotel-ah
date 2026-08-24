// Prepare the files used by the production Tauri application.
//
// After `next build`, Next.js produces a standalone server. We copy that
// server, static/public assets, Prisma migrations, a first-run SQLite
// database template, and the Node executable used for the build into
// src-tauri/resources. The installed desktop app therefore does NOT depend
// on Node/npm/npx being installed on the user's machine.

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const standaloneSrc = path.join(root, ".next", "standalone");
const staticSrc = path.join(root, ".next", "static");
const publicSrc = path.join(root, "public");
const prismaSrc = path.join(root, "prisma");
const prismaEngineSrc = path.join(root, "node_modules", ".prisma", "client");
const prismaClientSrc = path.join(root, "node_modules", "@prisma", "client");
const destRoot = path.join(root, "src-tauri", "resources");
const standaloneDest = path.join(destRoot, "standalone");
const prismaDest = path.join(destRoot, "prisma");
const nodeDest = path.join(destRoot, "node", process.platform === "win32" ? "node.exe" : "node");
const templateDb = path.join(prismaDest, "production.db");
const tempDb = path.join(root, ".tauri-production-template.db");

function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    throw new Error(`[prepare-standalone] required path is missing: ${src}`);
  }
  fs.mkdirSync(dest, { recursive: true });
  fs.cpSync(src, dest, { recursive: true });
}

function run(command, args, env = {}) {
  console.log(`[prepare-standalone] ${command} ${args.join(" ")}`);
  execFileSync(command, args, {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, ...env },
  });
}

fs.rmSync(destRoot, { recursive: true, force: true });
fs.rmSync(tempDb, { force: true });

copyDir(standaloneSrc, standaloneDest);
copyDir(staticSrc, path.join(standaloneDest, ".next", "static"));
copyDir(publicSrc, path.join(standaloneDest, "public"));
copyDir(prismaSrc, prismaDest);

// Next's file tracing normally includes Prisma, but the native SQLite query
// engine is critical for the desktop package. Copy the generated Prisma
// client and native engine explicitly so the standalone server is robust to
// tracing changes between Next.js versions.
copyDir(prismaEngineSrc, path.join(standaloneDest, "node_modules", ".prisma", "client"));
copyDir(prismaClientSrc, path.join(standaloneDest, "node_modules", "@prisma", "client"));

// Build a clean first-run database from the committed Prisma migration and
// seed. This happens on the developer/build machine only. The installed app
// simply copies this template to its writable per-user AppData directory.
const databaseUrl = `file:${tempDb.replace(/\\/g, "/")}`;
run(process.platform === "win32" ? "npx.cmd" : "npx", ["prisma", "migrate", "deploy"], {
  DATABASE_URL: databaseUrl,
});
run(process.platform === "win32" ? "npx.cmd" : "npx", ["prisma", "db", "seed"], {
  DATABASE_URL: databaseUrl,
});

fs.mkdirSync(path.dirname(templateDb), { recursive: true });
fs.copyFileSync(tempDb, templateDb);
fs.rmSync(tempDb, { force: true });

// Copy the exact Node executable used for this build. On Windows this is a
// self-contained node.exe, so the installed application does not need a
// system Node/npm/npx installation.
fs.mkdirSync(path.dirname(nodeDest), { recursive: true });
fs.copyFileSync(process.execPath, nodeDest);

console.log(`[prepare-standalone] bundled Node runtime: ${nodeDest}`);
console.log(`[prepare-standalone] production DB template: ${templateDb}`);
console.log("[prepare-standalone] resources ready at src-tauri/resources/");
