import { context } from "esbuild";

const isDev = process.argv.includes("--development");

const ctx = await context({
  entryPoints: ["./src/index.ts"],
  outfile: "./dist/index.js",
  bundle: true,
  minify: !isDev,
  sourcemap: true,
  platform: "browser",
  target: "esnext",
  format: "esm"
});

if (isDev) {
  await ctx.watch();
  console.log("Watching...");
} else {
  await ctx.rebuild();
  await ctx.dispose();
}
