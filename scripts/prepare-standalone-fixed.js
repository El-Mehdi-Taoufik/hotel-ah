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
  if (!fs.existsSync(src)) throw new Error(`[prepare-standalone] required path is missing: ${src}`);
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
copyDir(prismaEngineSrc, path.join(standaloneDest, "node_modules", ".prisma", "client"));
copyDir(prismaClientSrc, path.join(standaloneDest, "node_modules", "@prisma", "client"));

const databaseUrl = `file:${tempDb.replace(/\\/g, "/")}`;
const prismaCli = require.resolve("prisma/build/index.js");
const tsxCli = require.resolve("tsx/dist/cli.mjs");
run(process.execPath, [prismaCli, "migrate", "deploy"], { DATABASE_URL: databaseUrl });
run(process.execPath, [tsxCli, path.join(root, "prisma", "seed.ts")], { DATABASE_URL: databaseUrl });

if (!fs.existsSync(tempDb)) {
  throw new Error(`[prepare-standalone] seed completed but database was not created: ${tempDb}`);
}

fs.mkdirSync(path.dirname(templateDb), { recursive: true });
fs.copyFileSync(tempDb, templateDb);
fs.rmSync(tempDb, { force: true });

fs.mkdirSync(path.dirname(nodeDest), { recursive: true });
fs.copyFileSync(process.execPath, nodeDest);

console.log(`[prepare-standalone] bundled Node runtime: ${nodeDest}`);
console.log(`[prepare-standalone] production DB template: ${templateDb}`);
console.log("[prepare-standalone] resources ready at src-tauri/resources/");
