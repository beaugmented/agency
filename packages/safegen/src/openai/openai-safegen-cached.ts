import type { Squirreled, SquirrelMode } from "varmint"
import { Squirrel } from "varmint"

import type { GenerateFromSchema, SafeGenerator } from "../safegen"
import { createSafeDataGenerator } from "../safegen"
import { buildOpenAiRequestParams } from "./build-openai-request-params"
import type { OPEN_AI_PRICING_FACTS } from "./openai-pricing-facts"
import type { GetUnknownJsonFromOpenAi } from "./set-up-openai-generator"
import { setUpOpenAiJsonGenerator } from "./set-up-openai-generator"

export type OpenAiSafeGenOptions = {
	model: keyof typeof OPEN_AI_PRICING_FACTS
	usdBudget: number
	usdMinimum: number
	apiKey: string
	cachingMode: SquirrelMode
	cacheKey?: string
	logger?: Pick<Console, `error` | `info` | `warn`>
}

export class OpenAiSafeGenerator implements SafeGenerator {
	public usdBudget: number
	public usdMinimum: number
	public getUnknownJsonFromOpenAi: GetUnknownJsonFromOpenAi
	public getUnknownJsonFromOpenAiSquirreled: Squirreled<GetUnknownJsonFromOpenAi>
	public squirrel: Squirrel

	public constructor({
		model,
		usdBudget,
		usdMinimum,
		apiKey,
		cachingMode,
		cacheKey = `openai-safegen`,
		logger,
	}: OpenAiSafeGenOptions) {
		this.usdBudget = usdBudget
		this.usdMinimum = usdMinimum
		this.squirrel = new Squirrel(cachingMode)
		this.getUnknownJsonFromOpenAi = setUpOpenAiJsonGenerator(apiKey)
		this.getUnknownJsonFromOpenAiSquirreled = this.squirrel.add(
			cacheKey,
			this.getUnknownJsonFromOpenAi,
		)
		this.from = createSafeDataGenerator(async (...params) => {
			if (this.usdBudget < this.usdMinimum) {
				logger?.warn(`SafeGen budget exhausted`)
				const fallback = params[1]
				return fallback
			}
			const openAiParams = buildOpenAiRequestParams(model, ...params)
			const instruction = params[0]
			const previouslyFailedResponses = params[3]
			const response = await this.getUnknownJsonFromOpenAiSquirreled
				.for(
					`${instruction.replace(/[^a-zA-Z0-9-_. ]/g, `_`)}-${previouslyFailedResponses.length}`,
				)
				.get(openAiParams)
			this.usdBudget -= response.usdPrice
			return response.data
		})
	}

	public from: GenerateFromSchema
}
