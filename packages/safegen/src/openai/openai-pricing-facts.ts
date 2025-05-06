// 5 May 2025
// https://platform.openai.com/docs/pricing

import type { ChatModel } from "openai/resources/index"

export type PricingFacts = {
	promptPricePerToken: number
	promptPricePerTokenCached: number
	completionPricePerToken: number
}

const MILLION = 10 ** 6
export const OPEN_AI_PRICING_FACTS: Record<
	NonPreviewNonSnapshottedTextModel,
	PricingFacts
> = {
	"gpt-4.1": {
		promptPricePerToken: 2 / MILLION,
		promptPricePerTokenCached: 0.5 / MILLION,
		completionPricePerToken: 8 / MILLION,
	},
	"gpt-4.1-mini": {
		promptPricePerToken: 0.4 / MILLION,
		promptPricePerTokenCached: 0.1 / MILLION,
		completionPricePerToken: 1.6 / MILLION,
	},
	"gpt-4.1-nano": {
		promptPricePerToken: 0.1 / MILLION,
		promptPricePerTokenCached: 0.025 / MILLION,
		completionPricePerToken: 0.4 / MILLION,
	},
	"gpt-4o": {
		promptPricePerToken: 2.5 / MILLION,
		promptPricePerTokenCached: 1.25 / MILLION,
		completionPricePerToken: 10 / MILLION,
	},
	"gpt-4o-mini": {
		promptPricePerToken: 0.15 / MILLION,
		promptPricePerTokenCached: 0.075 / MILLION,
		completionPricePerToken: 0.6 / MILLION,
	},
	o1: {
		promptPricePerToken: 15 / MILLION,
		promptPricePerTokenCached: 7.5 / MILLION,
		completionPricePerToken: 60 / MILLION,
	},
	"o1-mini": {
		promptPricePerToken: 1.1 / MILLION,
		promptPricePerTokenCached: 0.55 / MILLION,
		completionPricePerToken: 4.4 / MILLION,
	},
	o3: {
		promptPricePerToken: 10 / MILLION,
		promptPricePerTokenCached: 2.5 / MILLION,
		completionPricePerToken: 40 / MILLION,
	},
	"o3-mini": {
		promptPricePerToken: 1.1 / MILLION,
		promptPricePerTokenCached: 0.55 / MILLION,
		completionPricePerToken: 4.4 / MILLION,
	},
	"o4-mini": {
		promptPricePerToken: 1.1 / MILLION,
		promptPricePerTokenCached: 0.275 / MILLION,
		completionPricePerToken: 4.4 / MILLION,
	},

	// "OTHER MODELS -- bottom of the page"
	"chatgpt-4o-latest": {
		promptPricePerToken: 5 / MILLION,
		promptPricePerTokenCached: 5 / MILLION,
		completionPricePerToken: 15 / MILLION,
	},
	"gpt-4": {
		promptPricePerToken: 30 / MILLION,
		promptPricePerTokenCached: 30 / MILLION,
		completionPricePerToken: 60 / MILLION,
	},
	"gpt-4-turbo": {
		promptPricePerToken: 10 / MILLION,
		promptPricePerTokenCached: 10 / MILLION,
		completionPricePerToken: 30 / MILLION,
	},
	"gpt-3.5-turbo": {
		promptPricePerToken: 0.5 / MILLION,
		promptPricePerTokenCached: 0.5 / MILLION,
		completionPricePerToken: 1.5 / MILLION,
	},
	"gpt-4-32k": {
		promptPricePerToken: 60 / MILLION,
		promptPricePerTokenCached: 60 / MILLION,
		completionPricePerToken: 120 / MILLION,
	},
	"gpt-3.5-turbo-16k": {
		promptPricePerToken: 3 / MILLION,
		promptPricePerTokenCached: 3 / MILLION,
		completionPricePerToken: 4 / MILLION,
	},
}

export function getModelPrices(
	model: ChatModel | (string & {}),
): PricingFacts | undefined {
	const pricingFactsKeys = Object.keys(OPEN_AI_PRICING_FACTS)
	const maybeFacts = pricingFactsKeys
		.filter((key) => key.startsWith(model))
		.sort((a, b) => b.length - a.length)[0]

	if (!maybeFacts) {
		return undefined
	}
	return OPEN_AI_PRICING_FACTS[maybeFacts]
}

const A = `0125` satisfies `${number}`

export type SimpleSnapshottedChatModel = `${ChatModel}-${number}`
export type DatedSnapshottedChatModel =
	`${ChatModel}-${number}-${number}-${number}`
export type SnapshottedChatModel =
	| DatedSnapshottedChatModel
	| SimpleSnapshottedChatModel
export type AudioChatModel = `${string}-${`audio`}${string}`
export type PreviewChatModel = `${string}-${`preview`}${string}`
export type NonPreviewTextModel = Exclude<ChatModel, PreviewChatModel>

export type NonPreviewNonSnapshottedTextModel = Exclude<
	NonPreviewTextModel,
	SnapshottedChatModel
>
