import type { PricingFacts } from "../safegen"

/**
 * Google doesn't expose a type for the names of their models, so we hard-code them here.
 *
 * @jeremybanka May 7 2025
 */
export type ModelName =
	| `gemini-2.0-flash-001`
	| `gemini-2.0-flash-lite-001`
	| `gemini-2.0-flash-lite`
	| `gemini-2.0-flash-live-preview-04-09`
	| `gemini-2.0-flash-live`
	| `gemini-2.0-flash-thinking-exp-01-21`
	| `gemini-2.0-flash-thinking`
	| `gemini-2.0-flash`
	| `gemini-2.5-flash-preview-04-17`
	| `gemini-2.5-flash`
	| `gemini-2.5-pro-preview-03-25`
	| `gemini-2.5-pro`

export const MILLION = 10 ** 6
/**
 * Pricing facts from https://cloud.google.com/vertex-ai/generative-ai/pricing
 *
 * @jeremybanka May 7 2025
 */
export const GOOGLE_PRICING_FACTS = {
	"gemini-2.0-flash": {
		promptPricePerToken: 0.15 / MILLION,
		completionPricePerToken: 0.6 / MILLION,
	},

	"gemini-2.0-flash-live": {
		promptPricePerToken: 0.5 / MILLION,
		completionPricePerToken: 2 / MILLION,
	},

	"gemini-2.0-flash-lite": {
		promptPricePerToken: 0.075 / MILLION,
		completionPricePerToken: 0.3 / MILLION,
	},

	"gemini-2.5-pro": {
		promptPricePerToken: 1.25 / MILLION,
		completionPricePerToken: 10 / MILLION,
	},

	"gemini-2.5-flash": {
		promptPricePerToken: 0.15 / MILLION,
		completionPricePerToken: 0.6 / MILLION,
	},
} satisfies Record<SupportedModelName, PricingFacts>

export type StripModel<T extends string> =
	T extends `gemini-2.0-flash-thinking${string}`
		? never
		: T extends `${infer U}-0${number}`
			? U
			: T extends `${infer U}-preview-${number}-${number}`
				? U
				: T extends `${infer U}-exp-${number}-${number}`
					? U
					: T

export type SupportedModelName = StripModel<ModelName>

export function isGoogleModelSupported(
	model: ModelName | (string & {}),
): model is SupportedModelName {
	for (const supportedModelName of Object.keys(GOOGLE_PRICING_FACTS)) {
		if (model.startsWith(supportedModelName)) {
			return true
		}
	}
	return false
}

export function getModelPrices(
	model: ModelName | (string & {}),
): PricingFacts | undefined {
	const pricingFactsKeys = Object.keys(GOOGLE_PRICING_FACTS)
	const maybeFacts = pricingFactsKeys
		.filter((key) => model.startsWith(key))
		.sort((a, b) => b.length - a.length)[0]

	if (!maybeFacts) {
		return undefined
	}
	return GOOGLE_PRICING_FACTS[maybeFacts]
}
