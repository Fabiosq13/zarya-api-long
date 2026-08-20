import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    // Permite que imports com extensão .js (exigidos pelo NodeNext em runtime)
    // sejam resolvidos para os arquivos .ts durante os testes.
    extensionAlias: {
      ".js": [".ts", ".js"],
    },
  },
});
