import type {
	GenerateContentParameters,
	GenerateContentResponseUsageMetadata,
	GoogleGenAI,
} from "@google/genai"
import type { Json } from "atom.io/json"

import {
	GOOGLE_PRICING_FACTS,
	isGoogleModelSupported,
	SAFEGEN_GOOGLE_SUPPORTED_MODELS,
} from "./google-pricing-facts"

export type GetUnknownJsonFromGoogle = (
	params: GenerateContentParameters,
) => Promise<{
	data: Json.Object
	usage: GenerateContentResponseUsageMetadata | undefined
	usdPrice: number
}>

export function setUpGoogleJsonGenerator(
	client?: GoogleGenAI,
): GetUnknownJsonFromGoogle {
	return async function getUnknownJsonFromGoogle(params) {
		if (!client) {
			throw new Error(
				`This is a bug in safegen. Google client not available to the json generator.`,
			)
		}
		const { model } = params
		const modelIsSupported = isGoogleModelSupported(model)
		if (!modelIsSupported) {
			throw new Error(
				`Model ${params.model} is not supported. Supported models are [${SAFEGEN_GOOGLE_SUPPORTED_MODELS.join(`, `)}]`,
			)
		}
		const completion = await client.models.generateContent(params)
		const { text, usageMetadata: usage } = completion
		const promptTokensTotal = usage?.promptTokenCount ?? 0
		const outputTokens = usage?.candidatesTokenCount ?? 0
		const usdPrice =
			promptTokensTotal * GOOGLE_PRICING_FACTS[model].promptUsdPricePerToken +
			outputTokens * GOOGLE_PRICING_FACTS[model].completionUsdPricePerToken
		let data: Json.Object
		try {
			if (!text) {
				throw new Error(`No text message found in completion`)
			}
			data = JSON.parse(text)
		} catch (error) {
			data = {}
		}
		return { data, usage, usdPrice }
	}
}
