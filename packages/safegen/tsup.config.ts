import type { Options } from "tsup"
import { defineConfig } from "tsup"

export const OPTIONS = {
	esbuildOptions: (options) => {
		options.chunkNames = `[name]-[hash]`
		options.assetNames = `[name]-[hash]`
	},
	sourcemap: true,
	treeshake: true,
	tsconfig: `tsconfig.json`,
	dts: true,
	format: [`esm`],
	entry: [`src/index.ts`, `src/openai/index.ts`],
	metafile: false,
	outDir: `dist`,
	external: [`*`],
} satisfies Options

export default defineConfig(OPTIONS)
