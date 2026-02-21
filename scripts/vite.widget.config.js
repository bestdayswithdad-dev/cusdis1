export default {
  root: path.resolve(__dirname, '../widget'),
  build: {
    outDir: path.resolve(__dirname, '../public/js'),
    emptyOutDir: false,
    lib: {
      entry: path.resolve(__dirname, '../widget/index.js'),
      name: 'cusdis',
      /* CHANGE: Use 'es' (ECMAScript Module) format for .mjs */
      formats: ['es'], 
      /* CHANGE: Output as the file your blog is already fetching */
      fileName: () => 'cusdis.es.mjs' 
    }
  },
  plugins: [
    svelte({
      emitCss: true,
    }),
  ],
};
