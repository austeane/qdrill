import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:3000",
    supportFile: "cypress/support/e2e.js",
  },

  component: {
    supportFile: "cypress/support/component.js",
    devServer: {
      framework: "svelte",
      bundler: "vite",
    },
  },
});
