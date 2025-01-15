import { atom, atomFamily, selectorFamily } from "atom.io"
import type { Loadable } from "atom.io/data"
import { type Canonical, toEntries } from "atom.io/json"
import { z } from "zod"

import type { EntityTypeName } from "./acts"
import { ENTITIES } from "./acts"
import { ollamaGen } from "./ollama"
import { coordinatesSchema } from "./zones"

export const themeAtom = atom<string>({
	key: `theme`,
	default: `galactic breadmakers`,
})

export const typeAtoms = atomFamily<EntityTypeName, Canonical>({
	key: `type`,
	default: (key) => {
		if (coordinatesSchema.safeParse(key).success) {
			return `zone`
		}
		if (typeof key === `string`) {
			const typeTag = key.split(`::`)[0]
			if (typeTag in ENTITIES === false) {
				console.warn(`Unknown entity type: ${typeTag}`)
			}
			return typeTag as EntityTypeName
		}
		return `unknown` as EntityTypeName
	},
})

export const QUALITATIVE_ADVERBS = {
	0: `the extreme opposite of`,
	1: `the opposite of`,
	2: `not at all`,
	3: `not very`,
	4: `mildly`,
	5: `moderately`,
	6: `somewhat`,
	7: `rather`,
	8: `very`,
	9: `extraordinarily`,
}

export const TRAITS = [`hot`, `sharp`, `hard`, `cool`, `weird`] as const
export const traitSchemas = [
	z.literal(`hot`),
	z.literal(`sharp`),
	z.literal(`hard`),
	z.literal(`cool`),
	z.literal(`weird`),
] as const
export type Trait = (typeof TRAITS)[number]
export type TraitScores = Record<Trait, number>
export const traitScoresSchema = z.record(
	z.union(traitSchemas),
	z.number().min(0).max(9),
)

export const qualitativeJudgmentAtoms = atomFamily<
	Loadable<string>,
	[quality: string, score: number]
>({
	key: `qualitativeJudgment`,
	default: async ([quality, score]) => {
		const { term } = await ollamaGen.from({
			schema: z.object({ term: z.string() }),
			fallback: { term: `Unremarkable` },
		})(
			`Adjective for something that is ${QUALITATIVE_ADVERBS[score]} ${quality}?`,
		)
		return term
	},
})

export const d = (n: number) => Math.floor(Math.random() * n) + 1
export const traitScoresAtoms = atomFamily<TraitScores, Canonical>({
	key: `traits`,
	default: () => ({
		cool: d(10) - 1,
		hot: d(10) - 1,
		weird: d(10) - 1,
		sharp: d(10) - 1,
		hard: d(10) - 1,
	}),
})
export const traitsRenderedSelectors = selectorFamily<
	Loadable<string>,
	Canonical
>({
	key: `traitsRendered`,
	get:
		(key) =>
		async ({ get }) => {
			const traitScores = get(traitScoresAtoms, key)
			const judgmentsLoadable = toEntries(traitScores).map(
				async ([trait, score]) => [
					trait,
					await get(qualitativeJudgmentAtoms, [trait, score]),
				],
			)
			const judgments = await Promise.all(judgmentsLoadable)
			return judgments
				.map(([trait, judgment]) => `\n\t- ${trait}: ${judgment}`)
				.join()
		},
})

export const nameSchema = z.object({ name: z.string() })
export const nameSelectors = selectorFamily<Loadable<string>, Canonical>({
	key: `name`,
	get:
		(key) =>
		async ({ get }) => {
			const theme = get(themeAtom)
			const typeName = get(typeAtoms, key)
			const traitScoresLoadable = get(traitsRenderedSelectors, key)
			const traitScores = await traitScoresLoadable
			let { name } = await ollamaGen.from({
				schema: nameSchema,
				fallback: { name: key },
			})(
				`--\nThe theme is ${theme}.\n--\n I need the name for a ${typeName}. It has the following traits: ${traitScores}`,
			)
			if (typeof name !== `string`) {
				name = String(name)
			}
			return name
		},
})
