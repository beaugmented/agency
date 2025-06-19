// 6 May 2025
// https://docs.anthropic.com/en/docs/about-claude/models/all-models#model-pricing

import type Anthropic from "@anthropic-ai/sdk"
import type { Model } from "@anthropic-ai/sdk/resources/index"

import type { PricingFacts } from "../safegen"

export const MILLION: number = 10 ** 6

export const ANTHROPIC_PRICING_FACTS: Record<SupportedModelName, PricingFacts> =
	{
		"claude-3-7-sonnet": {
			promptPricePerToken: 3 / MILLION,
			completionPricePerToken: 15 / MILLION,
		},
		"claude-3-5-haiku": {
			promptPricePerToken: 0.8 / MILLION,
			completionPricePerToken: 4 / MILLION,
		},
		"claude-3-5-sonnet": {
			promptPricePerToken: 3 / MILLION,
			completionPricePerToken: 15 / MILLION,
		},
		"claude-3-haiku": {
			promptPricePerToken: 0.25 / MILLION,
			completionPricePerToken: 1.25 / MILLION,
		},
		"claude-3-opus": {
			promptPricePerToken: 15 / MILLION,
			completionPricePerToken: 75 / MILLION,
		},
	}

export type StripModel<T extends string> = T extends `${infer U}-latest`
	? U
	: T extends `claude-2.${number}`
		? never
		: T extends `claude-3-haiku-${number}`
			? `claude-3-haiku`
			: never

export type SupportedModelName = StripModel<Model>
export type SupportedModel = Exclude<Model, `claude-2.${number}`>

export function isAnthropicModelSupported(
	model: Model,
): model is SupportedModel {
	for (const supportedModelName of Object.keys(ANTHROPIC_PRICING_FACTS)) {
		if (model.startsWith(supportedModelName)) {
			return true
		}
	}
	return false
}

export function getModelPrices(
	model: Model | (string & {}),
): PricingFacts | undefined {
	const pricingFactsKeys = Object.keys(ANTHROPIC_PRICING_FACTS)
	const maybeFacts = pricingFactsKeys
		.filter((key) => model.startsWith(key))
		.sort((a, b) => b.length - a.length)[0]

	if (!maybeFacts) {
		return undefined
	}
	return ANTHROPIC_PRICING_FACTS[maybeFacts]
}

export function calculateInferencePrice(
	usage: Anthropic.Messages.Usage,
	model: string,
): number {
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
	return usdPrice
}
