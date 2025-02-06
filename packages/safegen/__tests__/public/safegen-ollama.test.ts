import { describe, expect, test } from "vitest"
import { z } from "zod"

import { OllamaSafeGenerator } from "../../src/ollama"
import type { DataSpec } from "../../src/safegen"

beforeAll(() => {
	vitest.spyOn(console, `warn`)
})

const gpt4oMini = new OllamaSafeGenerator({
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

		const counter = gpt4oMini.from(countSpec)

		const { count: numberOfPlanetsInTheSolarSystem } = await counter(
			`How many planets are in the solar system?`,
		)
		expect(numberOfPlanetsInTheSolarSystem).toBe(8)
		expect(gpt4oMini.usdBudget).toBe(0.01)
	})
})
