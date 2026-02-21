import path from 'path';
import { fileURLToPath } from 'url';
import { svelte } from '@sveltejs/vite-plugin-svelte';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  root: 'widget',
  build: {
    lib: {
      entry: path.resolve(__dirname, '..', 'widget', 'count.js'),
      name: 'CUSDIS_COUNT',
      fileName: 'cusdis-count',
      formats: ['umd'],
    },
    outDir: path.resolve(__dirname, '..', 'public', 'js'),
  },
  plugins: [
    svelte({
      emitCss: false,
    }),
  ],
};
