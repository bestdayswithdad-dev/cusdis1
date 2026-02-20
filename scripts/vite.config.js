import svelte from "rollup-plugin-svelte";

export default {
  root: "widget",
  server: {
    hmr: {
      host: 'localhost'
    },
    port: 3001,
  },
  plugins: [
    svelte({
      emitCss: false
    }),
  ],
};
