import { describe, expect, test } from "vitest"
import { z } from "zod/v4"

import { OllamaSafeGenerator } from "../../src/ollama"

beforeAll(() => {
	vitest.spyOn(console, `warn`)
})

const llama = new OllamaSafeGenerator({
	usdBudget: 0.01,
	usdMinimum: 0.00_01,
	model: `llama3.2`,
	cachingMode: process.env.CI
		? `read`
		: process.env.NODE_ENV === `production`
			? `off`
			: `read-write`,
	logger: console,
})

afterAll(() => {})

describe(`safeGen`, () => {
	test(`safeGen should answer request in the form of data`, async () => {
		const countSpec = {
			schema: z.object({ count: z.number() }),
			fallback: { count: 0 },
		}

		const counter = llama.from(countSpec)

		const { count: numberOfPlanetsInTheSolarSystem } = await counter(
			`How many planets are in the solar system?`,
		)
		expect(numberOfPlanetsInTheSolarSystem).toBe(8)
		expect(llama.usdBudget).toBe(0.01)
	})
})
