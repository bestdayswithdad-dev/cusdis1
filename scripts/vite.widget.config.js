import path from 'path';
import { fileURLToPath } from 'url';
import svelte from 'rollup-plugin-svelte';

// Re-creating __dirname for Node 20 ESM scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  root: 'widget',
  build: {
    lib: {
      entry: path.resolve(__dirname, '..', 'widget', 'index.js'),
      name: 'cusdis',
    },
    outDir: path.resolve(__dirname, '..', 'public', 'js'),
  },
  plugins: [
    svelte({
      emitCss: false,
    }),
  ],
};
