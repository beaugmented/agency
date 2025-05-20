import { describe, expect, test } from "vitest"
import { z } from "zod/v4"

import { GoogleSafeGenerator } from "../../src/google"
import {
	getModelPrices,
	GOOGLE_PRICING_FACTS,
} from "../../src/google/google-pricing-facts"
import type { DataSpec } from "../../src/safegen"

beforeAll(() => {
	vitest.spyOn(console, `warn`)
})

const gemini2Flash = new GoogleSafeGenerator({
	usdBudget: 0.01,
	usdMinimum: 0.00_01,
	model: `gemini-2.0-flash-001`,
	apiKey: import.meta.env.VITE_GOOGLEAI_API_KEY,
	cachingMode: process.env.CI
		? `read`
		: process.env.NODE_ENV === `production`
			? `off`
			: `read-write`,
	logger: console,
})

afterAll(() => {})

describe(`model pricing retrieval`, () => {
	test(`getModelPrices should return the correct pricing for a model`, () => {
		expect(getModelPrices(`gemini-2.0-flash`)).toEqual(
			GOOGLE_PRICING_FACTS[`gemini-2.0-flash`],
		)
		expect(getModelPrices(`gemini-2.0-flash-001`)).toEqual(
			GOOGLE_PRICING_FACTS[`gemini-2.0-flash`],
		)
		expect(getModelPrices(`gemini-2.0-flash-lite-001`)).toEqual(
			GOOGLE_PRICING_FACTS[`gemini-2.0-flash-lite`],
		)
		expect(getModelPrices(`gemini-2.0-flash-live-preview-04-09`)).toEqual(
			GOOGLE_PRICING_FACTS[`gemini-2.0-flash-live`],
		)
	})
})

describe(`safeGen`, () => {
	test(`safeGen should answer request in the form of data`, async () => {
		const countSpec = {
			schema: z.object({ count: z.number() }),
			fallback: { count: 0 },
		}

		const counter = gemini2Flash.from(countSpec)

		const { count: numberOfPlanetsInTheSolarSystem } = await counter(
			`How many planets are in the solar system?`,
		)
		expect(numberOfPlanetsInTheSolarSystem).toBe(8)
		expect(gemini2Flash.usdBudget).toBeGreaterThan(0.0094)
	})
	test(`safeGen should answer request in the form of data`, async () => {
		const todoListSpec = {
			schema: z.object({
				items: z.array(
					z.object({
						id: z.number(),
						title: z.string(),
						completed: z.boolean(),
					}),
				),
			}),
			fallback: {
				items: [],
			},
		} satisfies DataSpec<{
			items: { id: number; title: string; completed: boolean }[]
		}>

		const todoListGenerator = gemini2Flash.from(todoListSpec)

		const todoList = await todoListGenerator(
			[
				`Please create a list of todo items for me, at varying levels of difficulty and importance.`,
			].join(`\n`),
		)

		const prioritizationSpec = {
			schema: z.object({
				items: z.array(
					z.object({
						id: z.number(),
						rationale: z.string(),
						priority: z.number(),
					}),
				),
			}),
			fallback: {
				items: [],
			},
		}

		const prioritizationGenerator = gemini2Flash.from(prioritizationSpec)

		const prioritization = await prioritizationGenerator(
			[
				`Prioritize this list in order of importance, giving each item a priority number between 1 and 100.`,
				`Consider the fact that family harmony is important to me.`,
				JSON.stringify(todoList, null, 2),
			].join(`\n`),
		)

		console.log(prioritization)
		console.log(
			todoList.items.toSorted((a, b) => {
				const priorityA = prioritization.items.find(
					(item) => item.id === a.id,
				)?.priority
				const priorityB = prioritization.items.find(
					(item) => item.id === b.id,
				)?.priority
				if (priorityA && priorityB) {
					return priorityB - priorityA
				}
				return 0
			}),
		)
	}, 60000)
})
