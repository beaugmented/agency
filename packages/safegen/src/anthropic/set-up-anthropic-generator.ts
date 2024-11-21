import { createHash } from "node:crypto"

import Anthropic from "@anthropic-ai/sdk"
import type * as AnthropicCore from "@anthropic-ai/sdk/core"
import type * as AnthropicResources from "@anthropic-ai/sdk/resources/index"
import type { Json } from "atom.io/json"

import {
	ANTHROPIC_PRICING_FACTS,
	isAnthropicModelSupported,
	SAFEGEN_ANTHROPIC_SUPPORTED_MODELS,
} from "./pricing-facts"

export const clientCache = new Map<string, Anthropic>()

export type GetUnknownJsonFromAnthropic = (
	body: AnthropicResources.MessageCreateParamsNonStreaming,
	options?: AnthropicCore.RequestOptions,
) => Promise<{ data: Json.Object; usdPrice: number }>

export function setUpAnthropicJsonGenerator(
	apiKey = `NO_API_KEY_PROVIDED`,
): GetUnknownJsonFromAnthropic {
	const keyHash = createHash(`sha256`).update(apiKey).digest(`hex`)
	return async function getUnknownJsonFromAnthropic(body, options) {
		let client = clientCache.get(keyHash)
		if (!client) {
			client = new Anthropic({
				apiKey,
				dangerouslyAllowBrowser: process.env.NODE_ENV === `test`,
			})
			clientCache.set(keyHash, client)
		}
		const { model } = body
		const modelIsSupported = isAnthropicModelSupported(model)
		if (!modelIsSupported) {
			throw new Error(
				`Model ${body.model} is not supported. Supported models are [${SAFEGEN_ANTHROPIC_SUPPORTED_MODELS.join(`, `)}]`,
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
		const usdPrice =
			promptTokensTotal *
				ANTHROPIC_PRICING_FACTS[model].promptUsdPricePerToken +
			outputTokens * ANTHROPIC_PRICING_FACTS[model].completionUsdPricePerToken
		console.log(content)
		let data: Json.Object
		try {
			const textMessage = content.find((message) => message.type === `text`)
			if (!textMessage) {
				throw new Error(`No text message found in completion`)
			}
			const stringifiedData = `{${textMessage.text}`
			data = JSON.parse(stringifiedData)
			console.log({ data, stringifiedData })
		} catch (error) {
			data = {}
		}
		return { data, usdPrice }
	}
}
