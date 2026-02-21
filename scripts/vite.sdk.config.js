import path from 'path';
import { fileURLToPath } from 'url';
import { svelte } from '@sveltejs/vite-plugin-svelte';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  root: 'widget',
  build: {
    lib: {
      entry: path.resolve(__dirname, '..', 'widget', 'sdk.js'),
      name: 'cusdis',
    },
    outDir: path.resolve(__dirname, '..', 'widget', 'dist'),
  },
  plugins: [
    svelte({
      emitCss: false,
    }),
  ],
};
