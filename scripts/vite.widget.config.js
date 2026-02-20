import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import svelte from 'rollup-plugin-svelte';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = {
  root: 'widget',
  build: {
    lib: {
      entry: path.resolve(__dirname, '..', 'widget', 'index.js'),
      name: 'cusdis',
      fileName: 'cusdis',
      formats: ['umd']
    },
    outDir: path.resolve(__dirname, '..', 'public', 'js'),
    emptyOutDir: false
  },
  plugins: [
    svelte({
      emitCss: false,
    }),
  ],
};

export default defineConfig(() => config);
