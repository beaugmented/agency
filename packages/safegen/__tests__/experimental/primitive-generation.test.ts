import { describe, expect, test } from "vitest"

import { OpenAiSafeGenerator } from "../../src/openai"

describe(`primitive data types`, () => {
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

	test(`boolean generation`, async () => {
		const answer = await gpt4oMini.boolean(`Is the sky blue?`)
		expect(answer).toBe(true)
	})
	test(`number generation`, async () => {
		const answer = await gpt4oMini.number(
			`What is the answer to the ultimate question of life, the universe, and everything?`,
			0,
			100,
		)
		expect(answer).toBe(42)
	})

	describe(`choose generation`, () => {
		describe(`single choice required`, () => {
			test(`single choice`, async () => {
				const answer = await gpt4oMini.choose(
					`Which dish is considered most gourmet?`,
					[`mcdonald's`, `sushi`, `hot pocket`, `hot dog`] as const,
				)
				expect(answer).toEqual(`sushi`)
			})
		})

		describe(`single choice with none`, () => {
			test(`no good options`, async () => {
				const answer = await gpt4oMini.choose(
					`Which animal belongs to the same family as the human?`,
					[`worm`, `insect`, `dinosaur`] as const,
					0,
					1,
				)
				expect(answer).toEqual([])
			})
		})

		test(`multiple choice`, async () => {
			const answer = await gpt4oMini.choose(
				`Which dishes are considered more gourmet?`,
				[`mcdonald's`, `sushi`, `hot pocket`, `hot dog`, `risotto`] as const,
				2,
			)
			expect(answer).toEqual([`sushi`, `risotto`])
		})

		describe(`min max choices`, () => {
			test(`choose 1`, async () => {
				const answer = await gpt4oMini.choose(
					`Which of the following animals are mammals?`,
					[`python`, `mayfly`, `eagle`, `lion`, `tuna`],
					0,
					3,
				)
				expect(answer).toEqual([`lion`])
			})

			test(`choose 2`, async () => {
				const answer = await gpt4oMini.choose(
					`Which of the following animals are mammals?`,
					[`python`, `cat`, `eagle`, `lion`, `tuna`],
					0,
					3,
				)
				expect(answer).toEqual([`cat`, `lion`])
			})

			test(`choose 3 (max)`, async () => {
				const answer = await gpt4oMini.choose(
					`Which of the following animals are mammals?`,
					[`dog`, `cat`, `eagle`, `lion`, `tuna`],
					0,
					3,
				)
				expect(answer).toEqual([`dog`, `cat`, `lion`])
			})

			test(`choose 0 (min)`, async () => {
				const answer = await gpt4oMini.choose(
					`Which of the following animals are mammals?`,
					[`python`, `mayfly`, `eagle`, `centipede`, `tuna`],
					0,
					3,
				)
				expect(answer).toEqual([])
			})
		})
	})
})
