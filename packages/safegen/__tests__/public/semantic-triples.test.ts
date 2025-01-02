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
				`Jerry, George, Elaine, and Kramer are each friends with one another.`,
			].join(`\n`),
		)
		console.log(res)
		type UserKey = `user:${string}`
		const isUserKey = (key: string): key is UserKey => key.startsWith(`user:`)
		const relationships = join(
			{
				key: `friends`,
				cardinality: `n:n`,
				between: [`friendA`, `friendB`],
				isAType: isUserKey,
				isBType: isUserKey,
			},
			{
				relationship: `acquaintance` as string,
			},
		)

		// editRelations(friends, (relations) => {
		// 	relations.set(`user:Elaine`, `user:Jerry`)
		// })
		editRelations(relationships, (relations) => {
			for (const fact of res.facts) {
				relations.set(
					{
						friendA: `user:${fact.subject}`,
						friendB: `user:${fact.object}`,
					},
					{
						relationship: fact.predicate,
					},
				)
			}
		})

		const elaineFriends = getState(
			findRelations(relationships, `user:Elaine`).friendBEntriesOfFriendA,
		)

		console.log(`elaineFriends`, elaineFriends)

		const jerryFriends = getState(
			findRelations(relationships, `user:Jerry`).friendAEntriesOfFriendB,
		)
		console.log(`jerryFriends`, jerryFriends)
	}, 20000)
})
