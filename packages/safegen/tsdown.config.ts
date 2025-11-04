import type { InlineConfig, UserConfig } from "tsdown"
import { defineConfig } from "tsdown"

export const config: UserConfig = defineConfig({
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
	fixedExtension: false,
	format: `esm`,
	outDir: `dist`,
	platform: `node`,
	sourcemap: true,
	treeshake: true,
	tsconfig: `tsconfig.json`,
} satisfies InlineConfig)

export default config
