// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const vercelNitro = {
  preset: "vercel",
  // Root server.js is a legacy SQLite API; TanStack Start serves the app routes.
  serverEntry: false,
};

export default defineConfig({
  nitro: vercelNitro,
  vite: {
    // TanStack Store imports this CommonJS shim by its ESM named export.
    // Pre-bundling it lets Vite expose the named export to the browser.
    optimizeDeps: {
      include: ["use-sync-external-store/shim/with-selector"],
    },
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
