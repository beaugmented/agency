import type { StandardSchemaV1 } from "@standard-schema/spec"
import { Ollama } from "ollama"
import type { CacheMode, Squirreled } from "varmint"
import { Squirrel } from "varmint"
import type { ZodType } from "zod/v4"

import { booleanGen, chooseGen, numberGen } from "../primitives"
import type {
	GenerateFromSchema,
	SafeGenerator,
	ToJsonSchema,
} from "../safegen"
import { createSafeDataGenerator } from "../safegen"
import { buildOllamaRequestParams } from "./build-ollama-request-params"
import type { GetUnknownJsonFromOllama } from "./set-up-ollama-json-generator"
import { setUpOllamaJsonGenerator } from "./set-up-ollama-json-generator"

export type OllamaSafeGenOptions<S extends StandardSchemaV1 = ZodType> = {
	model: `llama3.2:1b` | `llama3.2` | (string & {})
	usdBudget: number
	usdMinimum: number
	cachingMode: CacheMode
	cacheKey?: string
	logger?: Pick<Console, `error` | `info` | `warn`>
	toJsonSchema?: ToJsonSchema<S>
}

export type GetCompletion = typeof Ollama.prototype.generate

export class OllamaSafeGenerator implements SafeGenerator {
	public usdBudget: number
	public usdMinimum: number
	public getCompletionSquirreled: Squirreled<GetCompletion>
	public getUnknownJsonFromOllama: GetUnknownJsonFromOllama
	public getUnknownJsonFromOllamaSquirreled: Squirreled<GetUnknownJsonFromOllama>
	public squirrel: Squirrel
	public model: `llama3.2:1b` | `llama3.2` | (string & {})
	public client?: Ollama
	public logger: Pick<Console, `error` | `info` | `warn`>

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
		this.model = model
		this.logger = logger ?? console
		this.squirrel = new Squirrel(cachingMode)
		// if (cachingMode !== `read`) {
		this.client = new Ollama()
		// }
		this.getCompletionSquirreled = this.squirrel.add(
			`ollama-safegen`,
			this.client.generate.bind(this.client),
		)
		this.getUnknownJsonFromOllama = setUpOllamaJsonGenerator(this.client)
		this.getUnknownJsonFromOllamaSquirreled = this.squirrel.add(
			cacheKey,
			this.getUnknownJsonFromOllama,
		)
		this.from = createSafeDataGenerator(async (...params) => {
			if (this.usdBudget < this.usdMinimum) {
				logger?.warn(`SafeGen budget exhausted`)
				const fallback = params[2]
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
		this.object = this.from
	}

	/** @deprecated Use `SafeGenerator.object()` instead */
	public from: GenerateFromSchema
	public object: GenerateFromSchema

	public boolean(instruction: string): Promise<Error | boolean> {
		return booleanGen(instruction, async (prompt, filename) => {
			const { response } = await this.getCompletionSquirreled
				.for(filename)
				.get({
					model: this.model,
					prompt,
				})
			const text = response.trim().toLowerCase()
			return text
		})
	}

	public number(
		instruction: string,
		min: number,
		max: number,
	): Promise<Error | number> {
		return numberGen(instruction, min, max, async (prompt, filename) => {
			const { response } = await this.getCompletionSquirreled
				.for(filename)
				.get({
					model: this.model,
					prompt,
				})
			const text = response.trim()
			return text
		})
	}

	public choose<T extends (number | string)[]>(
		instruction: string,
		options: T,
		min?: 1,
		max?: 1,
	): Promise<Error | T[number]>
	public choose<T extends (number | string)[]>(
		instruction: string,
		options: T,
		min?: number,
		max?: number,
	): Promise<Error | T[number][]>
	public choose<T extends (number | string)[]>(
		instruction: string,
		options: T,
		min = 1,
		max = min,
	): Promise<Error | T[number] | T[number][]> {
		return chooseGen(
			instruction,
			options,
			min,
			max,
			async (prompt, filename) => {
				const { response } = await this.getCompletionSquirreled
					.for(filename)
					.get({
						model: this.model,
						prompt,
					})
				const text = response.trim()
				console.log({
					prompt,
					response,
					text,
					lowercaseText: text.toLowerCase(),
				})
				return text
			},
			this.logger,
		)
	}
}
