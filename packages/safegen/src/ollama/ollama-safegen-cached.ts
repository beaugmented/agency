import type { Squirreled, SquirrelMode } from "varmint"
import { Squirrel } from "varmint"

import type { GenerateFromSchema } from "../safegen"
import { createSafeDataGenerator } from "../safegen"
import { buildOllamaRequestParams } from "./build-ollama-request-params"
import type { GetUnknownJsonFromOllama } from "./set-up-ollama-generator"
import { setUpOllamaJsonGenerator } from "./set-up-ollama-generator"

export type OllamaSafeGenOptions = {
	model: `llama3.2:1b` | `llama3.2` | (string & {})
	usdBudget: number
	usdMinimum: number
	cachingMode: SquirrelMode
	cacheKey?: string
	logger?: Pick<Console, `error` | `info` | `warn`>
}

export class OllamaSafeGenerator {
	public usdFloor: number
	public usdBudget: number
	public getUnknownJsonFromOllama: GetUnknownJsonFromOllama
	public getUnknownJsonFromOllamaSquirreled: Squirreled<GetUnknownJsonFromOllama>
	public squirrel: Squirrel

	public constructor({
		model,
		usdBudget,
		usdMinimum,
		cachingMode,
		cacheKey = `ollama-safegen`,
		logger,
	}: OllamaSafeGenOptions) {
		this.usdBudget = usdBudget
		this.usdFloor = usdMinimum
		this.squirrel = new Squirrel(cachingMode)
		this.getUnknownJsonFromOllama = setUpOllamaJsonGenerator()
		this.getUnknownJsonFromOllamaSquirreled = this.squirrel.add(
			cacheKey,
			this.getUnknownJsonFromOllama,
		)
		this.from = createSafeDataGenerator(async (...params) => {
			if (this.usdBudget < this.usdFloor) {
				logger?.warn(`SafeGen budget exhausted`)
				const fallback = params[1]
				return fallback
			}
			const ollamaParams = buildOllamaRequestParams(model, ...params)
			const instruction = params[0]
			const previouslyFailedResponses = params[3]
			const response = await this.getUnknownJsonFromOllamaSquirreled
				.for(
					`${instruction.replace(/[^a-zA-Z0-9-_. ]/g, `_`)}-${previouslyFailedResponses.length}`,
				)
				.get(ollamaParams)
			this.usdBudget -= response.usdPrice
			return response.data
		})
	}

	public from: GenerateFromSchema
}
