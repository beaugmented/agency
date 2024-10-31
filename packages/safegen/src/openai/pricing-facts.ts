// 30 October 2023
// https://openai.com/pricing

import type { ChatModel } from "openai/resources/index"

export const OPEN_AI_PRICING_FACTS = {
	"gpt-4o": {
		promptPricePerToken: 0.0025 / 1000,
		promptPricePerTokenCached: 0.00125 / 1000,
		completionPricePerToken: 0.01 / 1000,
	},
	"gpt-4o-2024-08-06": {
		promptPricePerToken: 0.0025 / 1000,
		promptPricePerTokenCached: 0.00125 / 1000,
		completionPricePerToken: 0.01 / 1000,
	},
	"gpt-4o-2024-05-13": {
		promptPricePerToken: 0.005 / 1000,
		promptPricePerTokenCached: 0.005 / 1000,
		completionPricePerToken: 0.015 / 1000,
	},
	"gpt-4o-mini": {
		promptPricePerToken: 0.00015 / 1000,
		promptPricePerTokenCached: 0.000075 / 1000,
		completionPricePerToken: 0.0006 / 1000,
	},
	"gpt-4o-mini-2024-07-18": {
		promptPricePerToken: 0.00015 / 1000,
		promptPricePerTokenCached: 0.000075 / 1000,
		completionPricePerToken: 0.0006 / 1000,
	},
	"o1-preview": {
		promptPricePerToken: 0.015 / 1000,
		promptPricePerTokenCached: 0.0075 / 1000,
		completionPricePerToken: 0.06 / 1000,
	},
	"o1-preview-2024-09-12": {
		promptPricePerToken: 0.015 / 1000,
		promptPricePerTokenCached: 0.0075 / 1000,
		completionPricePerToken: 0.06 / 1000,
	},
} satisfies Partial<
	Record<
		ChatModel,
		{
			promptPricePerToken: number
			promptPricePerTokenCached: number
			completionPricePerToken: number
		}
	>
>
