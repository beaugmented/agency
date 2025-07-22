import type {
	GenerateContentParameters,
	GenerateContentResponseUsageMetadata,
	GoogleGenAI,
} from "@google/genai"
import type { Json } from "atom.io/json"

import {
	calculateInferencePrice,
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
	logger?: Pick<Console, `error` | `info` | `warn`>,
): GetUnknownJsonFromGoogle {
	return async function getUnknownJsonFromGoogle(params) {
		let data: Json.Object
		let usage: GenerateContentResponseUsageMetadata | undefined
		let usdPrice = 0
		try {
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
			const { text, usageMetadata } = completion
			usage = usageMetadata
			usdPrice = calculateInferencePrice(usage, params.model)
			if (!text) {
				throw new Error(`No text message found in completion`)
			}
			data = JSON.parse(text)
		} catch (thrown) {
			logger?.error(thrown)
		}
		data ??= {}
		usage ??= {}
		return { data, usage, usdPrice }
	}
}
