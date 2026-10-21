import path from "path";
import { defineConfig } from "vite";

// Ship only the static retirement notice. No API proxy or new PWA installs.
export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
