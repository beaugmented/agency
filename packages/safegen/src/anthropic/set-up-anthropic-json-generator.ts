import type Anthropic from "@anthropic-ai/sdk"
import type * as AnthropicCore from "@anthropic-ai/sdk/core"
import type * as AnthropicResources from "@anthropic-ai/sdk/resources/index"
import type { Json } from "atom.io/json"

import {
	ANTHROPIC_PRICING_FACTS,
	getModelPrices,
	isAnthropicModelSupported,
} from "./anthropic-pricing-facts"

export type GetUnknownJsonFromAnthropic = (
	body: AnthropicResources.MessageCreateParamsNonStreaming,
	options?: AnthropicCore.RequestOptions,
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
		const promptTokensTotal = usage.input_tokens
		const outputTokens = usage.output_tokens
		const prices = getModelPrices(model)
		let usdPrice = 0
		if (prices) {
			usdPrice =
				promptTokensTotal * prices.promptPricePerToken +
				outputTokens * prices.completionPricePerToken
		} else {
			console.warn(
				`No pricing facts found for model ${model}. Giving a price of 0.`,
			)
		}
		let data: Json.Object
		try {
			const textMessage = content.find((message) => message.type === `text`)
			if (!textMessage) {
				throw new Error(`No text message found in completion`)
			}
			const stringifiedData = `{${textMessage.text}`
			data = JSON.parse(stringifiedData)
		} catch (error) {
			data = {}
		}
		return { data, usage, usdPrice }
	}
}
