import type Anthropic from "@anthropic-ai/sdk"
import type * as AnthropicResources from "@anthropic-ai/sdk/resources/index"
import type { Json } from "atom.io/json"

import {
	ANTHROPIC_PRICING_FACTS,
	calculateInferencePrice,
	isAnthropicModelSupported,
} from "./anthropic-pricing-facts"

export type GetUnknownJsonFromAnthropic = (
	body: AnthropicResources.MessageCreateParamsNonStreaming,
	options?: Anthropic.RequestOptions,
) => Promise<{
	data: Json.Object
	usage: Anthropic.Messages.Usage
	usdPrice: number
}>

export function setUpAnthropicJsonGenerator(
	client?: Anthropic,
	logger?: Pick<Console, `error` | `info` | `warn`>,
): GetUnknownJsonFromAnthropic {
	return async function getUnknownJsonFromAnthropic(body, options) {
		let data: Json.Object
		let usage: Anthropic.Messages.Usage | undefined
		let usdPrice = 0
		try {
			if (!client) {
				throw new Error(
					`This is a bug in safegen. Anthropic client not available to the json generator.`,
				)
			}
			const { model } = body
			const modelIsSupported = isAnthropicModelSupported(model)
			if (!modelIsSupported) {
				throw new Error(
					`Model ${body.model} is not supported. Supported models are [${Object.keys(ANTHROPIC_PRICING_FACTS).join(`, `)}]`,
				)
			}
			const completion = await client.messages.create(
				{
					...body,
					messages: [
						...body.messages,
						{
							role: `assistant`,
							content: `{`,
						},
					],
					stream: false,
				},
				options,
			)
			const { content } = completion
			usage = completion.usage
			usdPrice = calculateInferencePrice(usage, body.model)

			const textMessage = content.find((message) => message.type === `text`)
			if (!textMessage) {
				throw new Error(`No text message found in completion`)
			}
			const stringifiedData = `{${textMessage.text}`
			data = JSON.parse(stringifiedData)
		} catch (thrown) {
			logger?.error(thrown)
		}
		data ??= {}
		usage ??= {
			cache_creation_input_tokens: 0,
			cache_read_input_tokens: 0,
			input_tokens: 0,
			output_tokens: 0,
			server_tool_use: { web_search_requests: 0 },
			service_tier: `standard`,
		}

		return { data, usage, usdPrice }
	}
}
