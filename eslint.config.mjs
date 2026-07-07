import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: [
      "dist",
      "dist-electron",
      "release",
      "node_modules",
      "vite.config.ts",
      "vitest.config.ts",
    ],
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.json", "./tsconfig.electron.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
);
