// 21 November 2023
// https://www.anthropic.com/pricing#anthropic-api

export const SAFEGEN_GOOGLE_SUPPORTED_MODELS = [`gemini-2.0-flash-001`] as const
export type SafegenGoogleSupportedModel =
	(typeof SAFEGEN_GOOGLE_SUPPORTED_MODELS)[number]

export function isGoogleModelSupported(
	model: string,
): model is SafegenGoogleSupportedModel {
	return SAFEGEN_GOOGLE_SUPPORTED_MODELS.includes(
		model as SafegenGoogleSupportedModel,
	)
}

export const MILLION = 10 ** 6
export const GOOGLE_PRICING_FACTS = {
	"gemini-2.0-flash-001": {
		promptUsdPricePerToken: 0.1 / MILLION,
		completionUsdPricePerToken: 0.4 / MILLION,
	},
} satisfies Record<
	SafegenGoogleSupportedModel,
	{
		promptUsdPricePerToken: number
		completionUsdPricePerToken: number
	}
>
