import type { ChatModel } from "openai/resources/index.mjs"
import type { Squirreled, SquirrelMode } from "varmint"
import { Squirrel } from "varmint"

import type { GenerateFromSchema } from "../safegen"
import { createSafeDataGenerator } from "../safegen"
import { buildOpenAiRequestParams } from "./build-open-ai-request-params"
import type { GetUnknownJsonFromOpenAi } from "./set-up-open-ai-generator"
import { setUpOpenAiJsonGenerator } from "./set-up-open-ai-generator"

export type OpenAiSafeGenOptions = {
	model: ChatModel
	usdBudget: number
	usdMinimum: number
	apiKey: string
	cachingMode: SquirrelMode
	logger?: Pick<Console, `error` | `info` | `warn`>
}

export class OpenAiSafeGenerator {
	public usdFloor: number
	public usdBudget: number
	public getUnknownJsonFromOpenAi: GetUnknownJsonFromOpenAi
	public getUnknownJsonFromOpenAiSquirreled: Squirreled<GetUnknownJsonFromOpenAi>
	public squirrel: Squirrel

	public constructor({
		model,
		usdBudget,
		usdMinimum,
		apiKey,
		cachingMode,
		logger,
	}: OpenAiSafeGenOptions) {
		this.usdBudget = usdBudget
		this.usdFloor = usdMinimum
		this.squirrel = new Squirrel(cachingMode)
		this.getUnknownJsonFromOpenAi = setUpOpenAiJsonGenerator(apiKey)
		this.getUnknownJsonFromOpenAiSquirreled = this.squirrel.add(
			`openai-safegen`,
			this.getUnknownJsonFromOpenAi,
		)
		this.from = createSafeDataGenerator(async (...params) => {
			if (this.usdBudget < this.usdFloor) {
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
			if (this.usdBudget !== undefined && response.usdPrice !== undefined) {
			this.usdBudget -= response.usdPrice
			return response.data
		})
	}

	public from: GenerateFromSchema
}
