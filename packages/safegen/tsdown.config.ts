import type { Options, UserConfig, UserConfigFn } from "tsdown"
import { defineConfig } from "tsdown"

export const config: UserConfig | UserConfigFn = defineConfig({
	clean: true,
	dts: true,
	entry: [
		`src/index.ts`,
		`src/anthropic/index.ts`,
		`src/arktype/index.ts`,
		`src/google/index.ts`,
		`src/ollama/index.ts`,
		`src/openai/index.ts`,
	],
	format: [`esm`],
	outDir: `dist`,
	sourcemap: true,
	treeshake: true,
	tsconfig: `tsconfig.json`,
} satisfies Options)

export default config
