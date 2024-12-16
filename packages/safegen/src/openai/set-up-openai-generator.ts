import type { Json } from "atom.io/json"
import type OpenAI from "openai"
import type * as OpenAICore from "openai/core"
import type OpenAIResources from "openai/resources/index"

import { OPEN_AI_PRICING_FACTS } from "./openai-pricing-facts"

export type GetUnknownJsonFromOpenAi = (
	body: OpenAIResources.ChatCompletionCreateParamsNonStreaming,
	options?: OpenAICore.RequestOptions,
) => Promise<{ data: Json.Object; usdPrice: number }>

export function setUpOpenAiJsonGenerator(
	client: OpenAI,
): GetUnknownJsonFromOpenAi {
	return async function getUnknownJsonFromOpenAi(body, options) {
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
			const usdPrice =
				promptTokensTotal *
					OPEN_AI_PRICING_FACTS[body.model].promptPricePerToken +
				promptTokensFresh *
					OPEN_AI_PRICING_FACTS[body.model].promptPricePerTokenCached +
				outputTokens * OPEN_AI_PRICING_FACTS[body.model].completionPricePerToken
			const data = JSON.parse(content)
			return { data, usdPrice }
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
