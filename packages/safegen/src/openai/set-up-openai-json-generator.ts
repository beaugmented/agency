import type { Json } from "atom.io/json"
import type OpenAI from "openai"
import type * as OpenAICore from "openai/core"
import type OpenAIResources from "openai/resources/index"

import { getModelPrices } from "./openai-pricing-facts"

export type GetUnknownJsonFromOpenAi = (
	body: OpenAIResources.ChatCompletionCreateParamsNonStreaming,
	options?: OpenAICore.RequestOptions,
) => Promise<{
	data: Json.Object
	usage: OpenAI.Completions.CompletionUsage
	usdPrice: number
}>

export function setUpOpenAiJsonGenerator(
	client?: OpenAI,
): GetUnknownJsonFromOpenAi {
	return async function getUnknownJsonFromOpenAi(body, options) {
		if (!client) {
			throw new Error(
				`This is a bug in safegen. OpenAI client not available to the json generator.`,
			)
		}
		const completion = await client.chat.completions.create(
			{
				...body,
				stream: false,
				response_format: { type: `json_object` },
			},
			options,
		)
		const content = completion.choices[0].message?.content
		const { usage } = completion
		if (content && usage) {
			const promptTokensTotal = usage.prompt_tokens
			const promptTokensCached = usage.prompt_tokens_details?.cached_tokens ?? 0
			const promptTokensFresh = promptTokensTotal - promptTokensCached
			const outputTokens = usage.completion_tokens
			const prices = getModelPrices(body.model)
			let usdPrice = 0
			if (prices) {
				usdPrice =
					promptTokensTotal * prices.promptPricePerToken +
					promptTokensFresh * prices.promptPricePerTokenCached +
					outputTokens * prices.completionPricePerToken
			} else {
				console.warn(
					`No pricing facts found for model ${body.model}. Giving a price of 0.`,
				)
			}
			const data = JSON.parse(content)
			return { data, usage, usdPrice }
		}
		if (!content && !usage) {
			throw new Error(`No content or usage found in completion`)
		}
		if (!content) {
			throw new Error(`No content found in completion`)
		}
		throw new Error(`No usage found in completion`)
	}
}
