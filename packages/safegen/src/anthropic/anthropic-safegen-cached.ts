import type { Squirreled, SquirrelMode } from "varmint"
import { Squirrel } from "varmint"

import type { GenerateFromSchema } from "../safegen"
import { createSafeDataGenerator } from "../safegen"
import type { ANTHROPIC_PRICING_FACTS } from "./anthropic-pricing-facts"
import { buildAnthropicRequestParams } from "./build-anthropic-request-params"
import type { GetUnknownJsonFromAnthropic } from "./set-up-anthropic-generator"
import { setUpAnthropicJsonGenerator } from "./set-up-anthropic-generator"

export type AnthropicSafeGenOptions = {
	model: keyof typeof ANTHROPIC_PRICING_FACTS
	usdBudget: number
	usdMinimum: number
	apiKey: string
	cachingMode: SquirrelMode
	cacheKey?: string
	logger?: Pick<Console, `error` | `info` | `warn`>
}

export class AnthropicSafeGenerator {
	public usdFloor: number
	public usdBudget: number
	public getUnknownJsonFromAnthropic: GetUnknownJsonFromAnthropic
	public getUnknownJsonFromAnthropicSquirreled: Squirreled<GetUnknownJsonFromAnthropic>
	public squirrel: Squirrel

	public constructor({
		model,
		usdBudget,
		usdMinimum,
		apiKey,
		cachingMode,
		cacheKey = `anthropic-safegen`,
		logger,
	}: AnthropicSafeGenOptions) {
		this.usdBudget = usdBudget
		this.usdFloor = usdMinimum
		this.squirrel = new Squirrel(cachingMode)
		this.getUnknownJsonFromAnthropic = setUpAnthropicJsonGenerator(apiKey)
		this.getUnknownJsonFromAnthropicSquirreled = this.squirrel.add(
			cacheKey,
			this.getUnknownJsonFromAnthropic,
		)
		this.from = createSafeDataGenerator(async (...params) => {
			if (this.usdBudget < this.usdFloor) {
				logger?.warn(`SafeGen budget exhausted`)
				const fallback = params[1]
				return fallback
			}
			const anthropicParams = buildAnthropicRequestParams(model, ...params)
			const instruction = params[0]
			const previouslyFailedResponses = params[3]
			const response = await this.getUnknownJsonFromAnthropicSquirreled
				.for(
					`${instruction.replace(/[^a-zA-Z0-9-_. ]/g, `_`)}-${previouslyFailedResponses.length}`,
				)
				.get(anthropicParams)
			this.usdBudget -= response.usdPrice
			return response.data
		})
	}

	public from: GenerateFromSchema
}
