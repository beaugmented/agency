// 21 November 2023
// https://www.anthropic.com/pricing#anthropic-api

import type { Model } from "@anthropic-ai/sdk/resources/index"

export const SAFEGEN_ANTHROPIC_SUPPORTED_MODELS = [
	`claude-3-haiku-latest`,
	`claude-3-5-haiku-latest`,
	`claude-3-5-sonnet-latest`,
	`claude-3-opus-latest`,
] as const satisfies Model[]
export type SafegenAnthropicSupportedModel =
	(typeof SAFEGEN_ANTHROPIC_SUPPORTED_MODELS)[number]
export const MILLION = 10 ** 6

export function isAnthropicModelSupported(
	model: string,
): model is SafegenAnthropicSupportedModel {
	return SAFEGEN_ANTHROPIC_SUPPORTED_MODELS.includes(
		model as SafegenAnthropicSupportedModel,
	)
}

export const ANTHROPIC_PRICING_FACTS = {
	"claude-3-haiku-latest": {
		promptUsdPricePerToken: 0.25 / MILLION,
		completionUsdPricePerToken: 1.25 / MILLION,
	},
	"claude-3-5-haiku-latest": {
		promptUsdPricePerToken: 1 / MILLION,
		completionUsdPricePerToken: 5 / MILLION,
	},
	"claude-3-5-sonnet-latest": {
		promptUsdPricePerToken: 3 / MILLION,
		completionUsdPricePerToken: 15 / MILLION,
	},
	"claude-3-opus-latest": {
		promptUsdPricePerToken: 15 / MILLION,
		completionUsdPricePerToken: 75 / MILLION,
	},
} satisfies Record<
	SafegenAnthropicSupportedModel,
	{
		promptUsdPricePerToken: number
		completionUsdPricePerToken: number
	}
>
