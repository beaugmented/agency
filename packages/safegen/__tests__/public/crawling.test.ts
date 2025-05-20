import { Squirrel } from "varmint"
import { describe, test } from "vitest"
import { z } from "zod/v4"

import { OpenAiSafeGenerator } from "../../src/openai"
import type { DataSpec } from "../../src/safegen"

beforeAll(() => {
	vitest.spyOn(console, `warn`)
})

const fetchText = async (url: string) => {
	const response = await fetch(url)
	return response.text()
}
const webSquirrel = new Squirrel(`read-write`)
const fetchCached = webSquirrel.add(`fetch-cached`, fetchText)

const initialUsdBudget = 0.05
const minimumUsdBudget = 0.00_01
const gpt4oMini = new OpenAiSafeGenerator({
	usdBudget: initialUsdBudget,
	usdMinimum: minimumUsdBudget,
	model: `gpt-4o-mini`,
	apiKey: import.meta.env.VITE_OPENAI_API_KEY,
	cachingMode: process.env.CI
		? `read`
		: process.env.NODE_ENV === `production`
			? `off`
			: `read-write`,
	cacheKey: `web-reader`,
	logger: console,
})

afterAll(() => {
	const usdSpent = gpt4oMini.usdBudget - initialUsdBudget
	// format to usd
	const remainingUsdBudgetFormatted = usdSpent.toLocaleString(`en`, {
		style: `currency`,
		currency: `USD`,
		minimumFractionDigits: 2,
		maximumFractionDigits: 6,
	})
	const initialBudgetFormatted = initialUsdBudget.toLocaleString(`en`, {
		style: `currency`,
		currency: `USD`,
		minimumFractionDigits: 2,
		maximumFractionDigits: 6,
	})
	const percentageSpent = Math.round((usdSpent / initialUsdBudget) * 100)
	console.info(
		`💸 spent ${remainingUsdBudgetFormatted}, ${percentageSpent}% of ${initialBudgetFormatted} budget`,
	)
})

function splitIntoChunks(text: string, chunkSize = 10000): string[] {
	const chunks: string[] = []
	let index = 0

	while (index < text.length) {
		chunks.push(text.slice(index, index + chunkSize))
		index += chunkSize
	}

	return chunks
}

describe(`safeGen web crawling`, () => {
	test(`can turn web pages into data`, async () => {
		const url = `https://monqui.com`
		const response = await fetchCached.for(url).get(url)

		// split the response into 10000-character chunks
		const chunks = splitIntoChunks(response)

		const isRelevantSpec = {
			schema: z.union([
				z.object({
					isRelevant: z.literal(false),
				}),
				z.object({
					isRelevant: z.literal(true),
					allRelevantTextIncludingURLs: z.string(),
				}),
			]),
			fallback: { isRelevant: false } as const,
		}

		const isRelevantGenerator = gpt4oMini.from(isRelevantSpec)

		const relevancyRatings = await Promise.all(
			chunks.map((chunk) =>
				isRelevantGenerator(
					`does the following text contain details relevant to any upcoming live music events?\n\n${chunk}`,
				),
			),
		)

		// console.log(relevancyRatings)

		const allDetails = relevancyRatings
			.filter((rating) => rating.isRelevant === true)
			.map((rating) => rating.allRelevantTextIncludingURLs)
			.join(`\n\n`)

		console.log(allDetails)

		const eventLinksSpec: DataSpec<{ eventUrls: string[] }> = {
			schema: z.object({
				eventUrls: z.array(z.string()),
			}),
			fallback: { eventUrls: [] },
		}

		const eventLinksGenerator = gpt4oMini.from(eventLinksSpec)

		const { eventUrls } = await eventLinksGenerator(
			`Please find all URLs in this text referring to a particular upcoming event:\n\n${allDetails}`,
		)

		console.log(eventUrls)

		// let i = 0
		// console.log(chunks.length)
		// for (const chunk of chunks) {
		// 	if (i > 10) break
		// 	await isRelevantGenerator(
		// 		`does the following text contain details relevant to any upcoming live music events?\n\n${chunk}`,
		// 	)
		// 	i++
		// }

		// const isRelevant = await isRelevantGenerator(
		// 	`Does the following text contain ${chunks.join(`\n`)}`,
		// )
	}, 100000)
})
