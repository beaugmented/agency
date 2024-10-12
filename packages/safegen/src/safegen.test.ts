import { describe, expect, test } from "vitest"
import { z } from "zod"

import { openaiSafeGenCached } from "./openai/open-ai-safegen-cached"

describe(`safeGen`, () => {
	test(`safeGen should answer request in the form of data`, async () => {
		const openAiGpt4 = openaiSafeGenCached(
			`gpt-4o`,
			import.meta.env.VITE_OPENAI_API_KEY,
		)

		const counter = openAiGpt4(z.object({ count: z.number() }), { count: 0 })

		const { count: numberOfPlanetsInTheSolarSystem } = await counter(
			`How many planets are in the solar system?`,
		)
		expect(numberOfPlanetsInTheSolarSystem).toBe(8)
	})
})
