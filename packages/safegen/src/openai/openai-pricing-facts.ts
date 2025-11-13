// 13 Nov 2025
// https://platform.openai.com/docs/pricing

import type { ChatModel, CompletionUsage } from "openai/resources"

import type { PricingFacts } from "../safegen"

const MILLION = 10 ** 6
export const OPEN_AI_PRICING_FACTS: Record<
	NonPreviewNonSnapshottedTextModel,
	PricingFacts
> = {
	"gpt-5.1": {
		promptPricePerToken: 1.25 / MILLION,
		promptPricePerTokenCached: 0.125 / MILLION,
		completionPricePerToken: 10 / MILLION,
	},
	"gpt-5.1-codex": {
		promptPricePerToken: 1.25 / MILLION,
		promptPricePerTokenCached: 0.125 / MILLION,
		completionPricePerToken: 10 / MILLION,
	},
	"gpt-5.1-mini": { // ❗ not in the pricing page -- using figures for 5.1 codex mini
		promptPricePerToken: 0.25 / MILLION,
		promptPricePerTokenCached: 0.025 / MILLION,
		completionPricePerToken: 2 / MILLION,
	},

	"gpt-5": {
		promptPricePerToken: 1.25 / MILLION,
		promptPricePerTokenCached: 0.125 / MILLION,
		completionPricePerToken: 10 / MILLION,
	},
	"gpt-5-mini": {
		promptPricePerToken: 0.25 / MILLION,
		promptPricePerTokenCached: 0.025 / MILLION,
		completionPricePerToken: 2 / MILLION,
	},
	"gpt-5-nano": {
		promptPricePerToken: 0.05 / MILLION,
		promptPricePerTokenCached: 0.005 / MILLION,
		completionPricePerToken: 0.4 / MILLION,
	},

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
		promptPricePerToken: 2 / MILLION,
		promptPricePerTokenCached: .5 / MILLION,
		completionPricePerToken: 8 / MILLION,
	},
	"o3-mini": {
		promptPricePerToken: 1.1 / MILLION,
		promptPricePerTokenCached: 0.55 / MILLION,
		completionPricePerToken: 4.4 / MILLION,
	},
	"o4-mini": {
		promptPricePerToken: 4 / MILLION,
		promptPricePerTokenCached: 1 / MILLION,
		completionPricePerToken: 16 / MILLION,
	},
	"codex-mini-latest": {
		promptPricePerToken: 1.5 / MILLION,
		promptPricePerTokenCached: 0.375 / MILLION,
		completionPricePerToken: 6 / MILLION,
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
		.filter((key) => model.startsWith(key))
		.sort((a, b) => b.length - a.length)[0]

	if (!maybeFacts) {
		return undefined
	}
	return OPEN_AI_PRICING_FACTS[maybeFacts]
}

export function calculateInferencePrice(
	usage: CompletionUsage,
	model: string,
): number {
	const promptTokensTotal = usage.prompt_tokens
	const promptTokensCached = usage.prompt_tokens_details?.cached_tokens ?? 0
	const promptTokensFresh = promptTokensTotal - promptTokensCached
	const outputTokens = usage.completion_tokens
	const prices = getModelPrices(model)
	let usdPrice = 0
	if (prices) {
		usdPrice =
			promptTokensTotal * prices.promptPricePerToken +
			promptTokensFresh * (prices.promptPricePerTokenCached ?? 0) +
			outputTokens * prices.completionPricePerToken
	} else {
		console.warn(
			`No pricing facts found for model ${model}. Giving a price of 0.`,
		)
	}
	return usdPrice
}

export type SimpleSnapshottedChatModel = `${ChatModel}-${number}`
export type DatedSnapshottedChatModel =
	`${ChatModel}-${number}-${number}-${number}`
export type SnapshottedChatModel =
	| DatedSnapshottedChatModel
	| SimpleSnapshottedChatModel
export type AudioChatModel = `${string}-${`audio`}${string}`
export type PreviewChatModel = `${string}-${`preview`}${string}`
export type LatestChatModel = `${ChatModel}-chat-${`latest`}`
export type NonPreviewTextModel = Exclude<ChatModel, PreviewChatModel>

export type NonPreviewNonSnapshottedTextModel = Exclude<
	NonPreviewTextModel,
	LatestChatModel | SnapshottedChatModel
>
