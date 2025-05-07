import type {
	GenerateContentParameters,
	GenerateContentResponseUsageMetadata,
	GoogleGenAI,
} from "@google/genai"
import type { Json } from "atom.io/json"

import {
	getModelPrices,
	GOOGLE_PRICING_FACTS,
	isGoogleModelSupported,
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
				`Model ${params.model} is not supported. Supported models are [${Object.keys(GOOGLE_PRICING_FACTS).join(`, `)}]`,
			)
		}
		const completion = await client.models.generateContent(params)
		const { text, usageMetadata: usage } = completion
		const promptTokensTotal = usage?.promptTokenCount ?? 0
		const outputTokens = usage?.candidatesTokenCount ?? 0
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
