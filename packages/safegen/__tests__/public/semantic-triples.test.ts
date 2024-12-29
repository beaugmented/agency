import { getState } from "atom.io"
import { editRelations, findRelations, join } from "atom.io/data"
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
	test(`create a basic graph`, () => {
		type UserKey = `user:${string}`
		const isUserKey = (key: string): key is UserKey => key.startsWith(`user:`)
		const friends = join({
			key: `friends`,
			cardinality: `n:n`,
			between: [`friendA`, `friendB`],
			isAType: isUserKey,
			isBType: isUserKey,
		})

		editRelations(friends, (relations) => {
			relations.set(`user:Elaine`, `user:Jerry`)
		})

		const elaineFriends = getState(
			findRelations(friends, `user:Elaine`).friendBKeysOfFriendA,
		)

		console.log({ elaineFriends })

		const jerryFriends = getState(
			findRelations(friends, `user:Jerry`).friendAKeysOfFriendB,
		)
		console.log({ jerryFriends })
	})
})
