import { createHash } from "node:crypto"

import type { Json } from "atom.io/json"
import OpenAI from "openai"
import type * as OpenAICore from "openai/core"
import type OpenAIResources from "openai/resources/index"

import { OPEN_AI_PRICING_FACTS } from "./pricing-facts"

export const clientCache = new Map<string, OpenAI>()

export type GetUnknownJsonFromOpenAi = (
	body: OpenAIResources.ChatCompletionCreateParamsNonStreaming,
	options?: OpenAICore.RequestOptions,
	logger?: Pick<Console, `error` | `info` | `warn`>,
) => Promise<{ data: Json.Object; usdPrice?: number }>

export function setUpOpenAiJsonGenerator(
	apiKey = `NO_API_KEY_PROVIDED`,
	logger?: Pick<Console, `error` | `info` | `warn`>,
): GetUnknownJsonFromOpenAi {
	const keyHash = createHash(`sha256`).update(apiKey).digest(`hex`)
	return async function getUnknownJsonFromOpenAi(body, options) {
		let client = clientCache.get(keyHash)
		if (!client) {
			client = new OpenAI({
				apiKey,
				dangerouslyAllowBrowser: process.env.NODE_ENV === `test`,
			})
			clientCache.set(keyHash, client)
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
		if (content && !OPEN_AI_PRICING_FACTS[body.model]) {
			logger?.warn(`No pricing facts found for model ${body.model}`)
			return { data: JSON.parse(content) }
		}
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
