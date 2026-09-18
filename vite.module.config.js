import { defineConfig } from 'vite';
import { resolve } from 'node:path';
export default defineConfig({
  build: { outDir:'module-dist', lib: { entry: resolve(import.meta.dirname, 'src/module-entry.js'), name: 'PlanGraphModule', fileName: format=>`plan-graph-module.${format==='es'?'js':'umd.cjs'}`, formats: ['es', 'umd'] }, rollupOptions: { external: [] } }
});
