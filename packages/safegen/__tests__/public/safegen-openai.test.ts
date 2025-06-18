import { type } from "arktype"
import { describe, expect, test } from "vitest"
import { z } from "zod/v4"

import { arktypeToJsonSchema } from "../../src/arktype"
import { OpenAiSafeGenerator } from "../../src/openai"
import {
	getModelPrices,
	OPEN_AI_PRICING_FACTS,
} from "../../src/openai/openai-pricing-facts"
import type { DataSpec } from "../../src/safegen"

beforeAll(() => {
	vitest.spyOn(console, `warn`)
})

afterAll(() => {})

describe(`model pricing retrieval`, () => {
	test(`getModelPrices should return the correct pricing for a model`, () => {
		expect(getModelPrices(`gpt-4o-mini`)).toEqual(
			OPEN_AI_PRICING_FACTS[`gpt-4o-mini`],
		)
		expect(getModelPrices(`gpt-4o-mini-2024-07-18`)).toEqual(
			OPEN_AI_PRICING_FACTS[`gpt-4o-mini`],
		)
		expect(getModelPrices(`o1`)).toEqual(OPEN_AI_PRICING_FACTS[`o1`])
		expect(getModelPrices(`o1-2024-07-18`)).toEqual(OPEN_AI_PRICING_FACTS[`o1`])
		expect(getModelPrices(`gpt-4-32k`)).toEqual(
			OPEN_AI_PRICING_FACTS[`gpt-4-32k`],
		)
		expect(getModelPrices(`gpt-4`)).toEqual(OPEN_AI_PRICING_FACTS[`gpt-4`])
	})
})

describe(`with zod`, () => {
	const gpt4oMini = new OpenAiSafeGenerator({
		usdBudget: 0.01,
		usdMinimum: 0.00_01,
		model: `gpt-4o-mini`,
		apiKey: import.meta.env.VITE_OPENAI_API_KEY,
		cachingMode: process.env.CI
			? `read`
			: process.env.NODE_ENV === `production`
				? `off`
				: `read-write`,
		logger: console,
	})
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
		expect(gpt4oMini.usdBudget).toBeGreaterThan(0.0099)
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

		const todoListGenerator = gpt4oMini.from(todoListSpec)

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

		const prioritizationGenerator = gpt4oMini.from(prioritizationSpec)

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
	}, 40000)
})

describe(`with arktype`, () => {
	const gpt4oMini = new OpenAiSafeGenerator({
		usdBudget: 0.01,
		usdMinimum: 0.00_01,
		model: `gpt-4o-mini`,
		apiKey: import.meta.env.VITE_OPENAI_API_KEY,
		cachingMode: process.env.CI
			? `read`
			: process.env.NODE_ENV === `production`
				? `off`
				: `read-write`,
		logger: console,
	})
	test(`safeGen should answer request in the form of data`, async () => {
		const counter = gpt4oMini.from({
			schema: type([
				{ countable: `false` },
				`|`,
				{ countable: `true`, count: `number` },
			]),
			toJsonSchema: arktypeToJsonSchema,
			fallback: { countable: false },
		})

		const countResult = await counter(
			`How many planets are in the solar system...?`,
		)
		assert(countResult.countable)
		expect(countResult.count).toBe(8)
		expect(gpt4oMini.usdBudget).toBeGreaterThan(0.0099)
	})
})

describe(`advanced data types`, () => {
	const gpt4oMini = new OpenAiSafeGenerator({
		usdBudget: 0.01,
		usdMinimum: 0.00_01,
		model: `gpt-4o-mini`,
		apiKey: import.meta.env.VITE_OPENAI_API_KEY,
		cachingMode: process.env.CI
			? `read`
			: process.env.NODE_ENV === `production`
				? `off`
				: `read-write`,
		logger: console,
	})
	test(`dates`, async () => {
		const dateGenerator = gpt4oMini.from({
			schema: z.object({ date: z.iso.date().brand(`date`) }),
			fallback: { date: `2023-01-01` as z.$brand<`date`> & string },
		})

		const parseDate = (dateString: z.$brand<`date`> & string): Date => {
			return new Date(dateString)
		}
		const currentDateString = await dateGenerator(`What is the date?`)
		const currentDate = parseDate(currentDateString.date)
		expect(currentDate).toBeInstanceOf(Date)
		expect(currentDate).toEqual(new Date(`2023-10-01`))
	})
})

describe(`primitive data types`, () => {
	test(`boolean generation`, async () => {
		const gpt4oMini = new OpenAiSafeGenerator({
			usdBudget: 0.01,
			usdMinimum: 0.00_01,
			model: `gpt-4o-mini`,
			apiKey: import.meta.env.VITE_OPENAI_API_KEY,
			cachingMode: process.env.CI
				? `read`
				: process.env.NODE_ENV === `production`
					? `off`
					: `read-write`,
			logger: console,
		})
		const answer = await gpt4oMini.boolean(`Is the sky blue?`)
		expect(answer).toBe(true)
	})
	test(`number generation`, async () => {
		const gpt4oMini = new OpenAiSafeGenerator({
			usdBudget: 0.01,
			usdMinimum: 0.00_01,
			model: `gpt-4o-mini`,
			apiKey: import.meta.env.VITE_OPENAI_API_KEY,
			cachingMode: process.env.CI
				? `read`
				: process.env.NODE_ENV === `production`
					? `off`
					: `read-write`,
			logger: console,
		})
		const answer = await gpt4oMini.number(
			`What is the answer to the ultimate question of life, the universe, and everything?`,
			0,
			100,
		)
		expect(answer).toBe(42)
	})
	test(`choose generation`, async () => {
		const gpt4oMini = new OpenAiSafeGenerator({
			usdBudget: 0.01,
			usdMinimum: 0.00_01,
			model: `gpt-4o-mini`,
			apiKey: import.meta.env.VITE_OPENAI_API_KEY,
			cachingMode: process.env.CI
				? `read`
				: process.env.NODE_ENV === `production`
					? `off`
					: `read-write`,
			logger: console,
		})
		const answer = await gpt4oMini.choose(
			`Which of the following animals are mammals?`,
			[`dog`, `cat`, `eagle`, `lion`, `tuna`],
			0,
			3,
		)

		expect(answer).toEqual([`dog`, `cat`, `lion`])
	})
	test(`choose generation (single choice)`, async () => {
		const gpt4oMini = new OpenAiSafeGenerator({
			usdBudget: 0.01,
			usdMinimum: 0.00_01,
			model: `gpt-4o-mini`,
			apiKey: import.meta.env.VITE_OPENAI_API_KEY,
			cachingMode: process.env.CI
				? `read`
				: process.env.NODE_ENV === `production`
					? `off`
					: `read-write`,
			logger: console,
		})
		const answer = await gpt4oMini.choose(
			`Which dish is considered most gourmet?`,
			[`mcdonald's`, `sushi`, `hot pocket`, `hot dog`],
		)
		expect(answer).toEqual(`sushi`)
	})
})
