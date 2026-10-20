import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "./" keeps asset URLs relative so the static bundle can be mounted
// under a sub-path such as /playground (spec section 12, BD-4).
export default defineConfig({
  base: "./",
  plugins: [react()],
});
