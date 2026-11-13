
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const backendDirectory =
  process.env.BUILD_TARGET === "demo"
    ? "../POS_demo-backend"
    : "../POS_and_ecom-backend";

export default defineConfig({
  // React assets are served through Django static files.
  base: "/static/pos/",

  plugins: [react()],

  build: {
    outDir: path.resolve(
      __dirname,
      backendDirectory,
      "pos_dist",
      "pos"
    ),
    emptyOutDir: true,
    manifest: true,
  },
});
