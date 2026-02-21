import path from 'path';
import { fileURLToPath } from 'url';
import { svelte } from '@sveltejs/vite-plugin-svelte';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  root: path.resolve(__dirname, '../widget'),
  build: {
    outDir: path.resolve(__dirname, '../public/js'),
    emptyOutDir: false,
    lib: {
      entry: path.resolve(__dirname, '../widget/index.js'),
      name: 'cusdis',
      formats: ['umd'],
      fileName: () => 'iframe.umd.js'
    }
  },
  plugins: [
    svelte({
      emitCss: false,
    }),
  ],
};
