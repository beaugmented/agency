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
	logger?: Pick<Console, `error` | `info` | `warn`>,
): GetUnknownJsonFromOpenAi {
	return async function getUnknownJsonFromOpenAi(body, options) {
		let data: Json.Object
		let usage: OpenAI.Completions.CompletionUsage | undefined
		let usdPrice = 0
		try {
			const completion = await client.chat.completions.create(
				{
					...body,
					stream: false,
					response_format: { type: `json_object` },
				},
				options,
			)
			const { content, refusal } = completion.choices[0].message
			usage = completion.usage
			if (content && usage) {
				usdPrice = calculateInferencePrice(usage, body.model)
				data = JSON.parse(content)
			}
			if (!content) {
				throw new Error(
					`No content${usage ? `` : ` or usage`} was given in the completion from OpenAI.${refusal ? ` Instead, OpenAI gave the following refusal: "${refusal}"` : ``}`,
				)
			}
		} catch (thrown) {
			logger?.error(thrown)
		}
		usage ??= {
			completion_tokens: 0,
			prompt_tokens: 0,
			total_tokens: 0,
		}
		data ??= {}
		return { data, usage, usdPrice }
	}
}
