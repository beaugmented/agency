import { describe, expect, test } from "vitest"
import { z } from "zod"

import { OpenAiSafeGenerator } from "./openai"

beforeAll(() => {
	vitest.spyOn(console, `warn`)
})

describe(`safeGen`, () => {
	test(`safeGen should answer request in the form of data`, async () => {
		const gpt4oMini = new OpenAiSafeGenerator({
			usdBudget: 0.01,
			usdMinimum: 0.00_999,
			model: `gpt-4o-mini`,
			apiKey: import.meta.env.VITE_OPENAI_API_KEY,
			cachingMode: process.env.CI
				? `read`
				: process.env.NODE_ENV === `production`
					? `off`
					: `read-write`,
			logger: console,
		})

		const countSpec = {
			schema: z.object({ count: z.number() }),
			fallback: { count: 0 },
		}

		const counter = gpt4oMini.from(countSpec)

		const { count: numberOfPlanetsInTheSolarSystem } = await counter(
			`How many planets are in the solar system?`,
		)
		expect(numberOfPlanetsInTheSolarSystem).toBe(8)
		expect(gpt4oMini.usdBudget).toBeGreaterThan(0.0099)
		gpt4oMini.squirrel.flush()
	})
})
