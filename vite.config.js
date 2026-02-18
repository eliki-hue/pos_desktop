import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  // React assets must load from Django static
  base: "/static/pos/",

  plugins: [react()],

  build: {
    // Output directly into Django backend static source
    outDir: path.resolve(
      __dirname,
      "../POS_and_ecom-backend/pos_dist/pos"
    ),

    emptyOutDir: true,
    manifest: true,
  },
});
