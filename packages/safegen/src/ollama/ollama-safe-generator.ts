import type { StandardSchemaV1 } from "@standard-schema/spec"
import { Ollama } from "ollama"
import type { CacheMode, Squirreled } from "varmint"
import { Squirrel } from "varmint"
import type { ZodSchema } from "zod"
import zodToJsonSchema from "zod-to-json-schema"

import type {
	GenerateFromSchema,
	SafeGenerator,
	ToJsonSchema,
} from "../safegen"
import { createSafeDataGenerator } from "../safegen"
import { buildOllamaRequestParams } from "./build-ollama-request-params"
import type { GetUnknownJsonFromOllama } from "./set-up-ollama-json-generator"
import { setUpOllamaJsonGenerator } from "./set-up-ollama-json-generator"

export type OllamaSafeGenOptions<S extends StandardSchemaV1 = ZodSchema> = {
	model: `llama3.2:1b` | `llama3.2` | (string & {})
	usdBudget: number
	usdMinimum: number
	cachingMode: CacheMode
	cacheKey?: string
	logger?: Pick<Console, `error` | `info` | `warn`>
	toJsonSchema?: ToJsonSchema<S>
}

export class OllamaSafeGenerator implements SafeGenerator {
	public usdBudget: number
	public usdMinimum: number
	public getUnknownJsonFromOllama: GetUnknownJsonFromOllama
	public getUnknownJsonFromOllamaSquirreled: Squirreled<GetUnknownJsonFromOllama>
	public squirrel: Squirrel
	public client?: Ollama

	public constructor({
		model,
		usdBudget,
		usdMinimum,
		cachingMode,
		cacheKey = `ollama-safegen`,
		logger,
	}: OllamaSafeGenOptions) {
		this.usdBudget = usdBudget
		this.usdMinimum = usdMinimum
		this.squirrel = new Squirrel(cachingMode)
		if (cachingMode !== `read`) {
			this.client = new Ollama()
		}
		this.getUnknownJsonFromOllama = setUpOllamaJsonGenerator(this.client)
		this.getUnknownJsonFromOllamaSquirreled = this.squirrel.add(
			cacheKey,
			this.getUnknownJsonFromOllama,
		)
		this.from = createSafeDataGenerator(async (...params) => {
			if (this.usdBudget < this.usdMinimum) {
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
		}, logger)
	}

	public from: GenerateFromSchema
}
