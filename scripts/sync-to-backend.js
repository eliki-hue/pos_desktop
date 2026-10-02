import fs from "fs-extra";
import path from "path";

// Backend folders
const PRODUCTION_BACKEND = path.resolve("..", "POS_and_ecom-backend");
const DEMO_BACKEND = path.resolve("..", "POS_demo-backend");

// Where Vite outputs files
const DIST_DIR = path.resolve("dist");

// Where Django expects POS frontend files
const PRODUCTION_TARGET = path.join(
    PRODUCTION_BACKEND,
    "pos_dist",
    "pos"
);

const DEMO_TARGET = path.join(
    DEMO_BACKEND,
    "pos_dist",
    "pos"
);

console.log("📦 Syncing POS build...");
console.log("Source:", DIST_DIR);

if (!fs.existsSync(DIST_DIR)) {
    console.error("❌ Build directory does not exist:", DIST_DIR);
    console.error("Run the Vite build first.");
    process.exit(1);
}

// -----------------------------
// Production
// -----------------------------
console.log("");
console.log("🚀 Syncing production...");
console.log("To:", PRODUCTION_TARGET);

fs.removeSync(PRODUCTION_TARGET);
fs.ensureDirSync(PRODUCTION_TARGET);
fs.copySync(DIST_DIR, PRODUCTION_TARGET);

console.log("✅ Production build synced");

// -----------------------------
// Demo
// -----------------------------
console.log("");
console.log("🧪 Syncing demo...");
console.log("To:", DEMO_TARGET);

fs.removeSync(DEMO_TARGET);
fs.ensureDirSync(DEMO_TARGET);
fs.copySync(DIST_DIR, DEMO_TARGET);

console.log("✅ Demo build synced");

console.log("");
console.log("====================================");
console.log("✅ POS build synced to BOTH systems");
console.log("====================================");