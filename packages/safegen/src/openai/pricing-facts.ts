// 13 October 2023
// https://openai.com/pricing

import type { ChatModel } from "openai/resources/index"

export const OPEN_AI_PRICING_FACTS = {
	"gpt-4o": {
		promptPricePerToken: 0.0025 / 1000,
		promptPricePerTokenCached: 0.00125 / 1000,
		completionPricePerToken: 0.01 / 1000,
	},
	"gpt-4o-mini": {
		promptPricePerToken: 0.00015 / 1000,
		promptPricePerTokenCached: 0.000075 / 1000,
		completionPricePerToken: 0.0006 / 1000,
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
