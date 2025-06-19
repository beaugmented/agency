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
): GetUnknownJsonFromAnthropic {
	return async function getUnknownJsonFromAnthropic(body, options) {
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
		const { content, usage } = completion

		const usdPrice = calculateInferencePrice(usage, body.model)
		let data: Json.Object
		try {
			const textMessage = content.find((message) => message.type === `text`)
			if (!textMessage) {
				throw new Error(`No text message found in completion`)
			}
			const stringifiedData = `{${textMessage.text}`
			data = JSON.parse(stringifiedData)
		} catch (_) {
			data = {}
		}
		return { data, usage, usdPrice }
	}
}
