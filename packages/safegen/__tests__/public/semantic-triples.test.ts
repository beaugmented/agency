import { z } from "zod"

import { OllamaSafeGenerator } from "../../src/ollama"

const semanticTripleGenerator = new OllamaSafeGenerator({
	usdBudget: 0.01,
	usdMinimum: 0.0001,
	model: `llama3.2:1b`,
	cachingMode: process.env.CI
		? `read`
		: process.env.NODE_ENV === `production`
			? `off`
			: `read-write`,
	logger: console,
})

describe(`*`, () => {
	test(`can generate semantic triples`, async () => {
		const semanticTriple = await semanticTripleGenerator.from({
			schema: z.object({
				facts: z.array(
					z.object({
						subject: z.string(),
						predicate: z.string(),
						object: z.string(),
					}),
				),
			}),
			fallback: { facts: [] },
		})

		const res = await semanticTriple(
			[
				`dissolve the following sentence into a bunch of semantic triples:`,
				`Jerry, George, Elaine, and Kramer are each friends with each other.`,
			].join(`\n`),
		)
		console.log(res)
	}, 20000)
})
