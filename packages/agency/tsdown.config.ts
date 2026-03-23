import type { InlineConfig } from "tsdown"
import { defineConfig } from "tsdown"

const config = defineConfig({
	clean: true,
	dts: true,
	deps: {
		skipNodeModulesBundle: true,
	},
	entry: [`src/index.ts`],
	fixedExtension: false,
	format: [`esm`],
	outDir: `dist`,
	platform: `node`,
	sourcemap: true,
	treeshake: true,
	tsconfig: `tsconfig.json`,
} satisfies InlineConfig)

export default config
