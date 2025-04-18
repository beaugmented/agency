import { type } from "arktype"
import { describe, expect, test } from "vitest"
import type { ZodBranded, ZodString } from "zod"
import { z } from "zod"

import { arktypeToJsonSchema } from "../../src/arktype"
import { OpenAiSafeGenerator } from "../../src/openai"
import type { DataSpec } from "../../src/safegen"

beforeAll(() => {
	vitest.spyOn(console, `warn`)
})

afterAll(() => {})

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
	}, 10000)
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
			schema: z.object({ date: z.string().date().brand(`date`) }),
			fallback: { date: `2023-01-01` as z.BRAND<`date`> & string },
		})

		const parseDate = (dateString: z.BRAND<`date`> & string): Date => {
			return new Date(dateString)
		}
		const currentDateString = await dateGenerator(`What is the date?`)
		const currentDate = parseDate(currentDateString.date)
		expect(currentDate).toBeInstanceOf(Date)
		expect(currentDate).toEqual(new Date(`2023-10-10`))
	})
})
