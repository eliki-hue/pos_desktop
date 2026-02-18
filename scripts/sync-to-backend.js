import fs from "fs-extra";
import path from "path";

// CHANGE THIS to match your backend folder
const BACKEND_ROOT = path.resolve("..", "POS_and_ecom-backend");

// Where Vite outputs files
const DIST_DIR = path.resolve("dist");

// Where Django expects POS static files
const TARGET_DIR = path.join(BACKEND_ROOT, "pos_dist", "pos");

console.log("📦 Syncing POS build to backend...");
console.log("From:", DIST_DIR);
console.log("To:", TARGET_DIR);

fs.removeSync(TARGET_DIR);
fs.ensureDirSync(TARGET_DIR);
fs.copySync(DIST_DIR, TARGET_DIR);

console.log("✅ POS build synced successfully");
