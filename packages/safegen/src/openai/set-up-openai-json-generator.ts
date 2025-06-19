import type { Json } from "atom.io/json"
import type OpenAI from "openai"
import type * as OpenAIResources from "openai/resources"

import { calculateInferencePrice } from "./openai-pricing-facts"

export type GetUnknownJsonFromOpenAi = (
	body: OpenAIResources.ChatCompletionCreateParamsNonStreaming,
	options?: OpenAI.RequestOptions,
) => Promise<{
	data: Json.Object
	usage: OpenAI.Completions.CompletionUsage
	usdPrice: number
}>

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
			const usdPrice = calculateInferencePrice(usage, body.model)
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
