import OpenAI from "openai"
import type { CacheMode, Squirreled } from "varmint"
import { Squirrel } from "varmint"

import { booleanGen, chooseGen, numberGen } from "../primitives"
import type { GenerateFromSchema, SafeGenerator } from "../safegen"
import { createSafeDataGenerator } from "../safegen"
import { buildOpenAiRequestParams } from "./build-openai-request-params"
import type { NonPreviewTextModel } from "./openai-pricing-facts"
import type { GetUnknownJsonFromOpenAi } from "./set-up-openai-json-generator"
import { setUpOpenAiJsonGenerator } from "./set-up-openai-json-generator"

export const clientCache: Map<string, OpenAI> = new Map()

export type OpenAiSafeGenOptions = {
	model: NonPreviewTextModel
	usdBudget: number
	usdMinimum: number
	apiKey: string
	cachingMode: CacheMode
	cacheKey?: string
	logger?: Pick<Console, `error` | `info` | `warn`>
}

export type GetCompletion = typeof OpenAI.prototype.completions.create

export class OpenAiSafeGenerator implements SafeGenerator {
	public usdBudget: number
	public usdMinimum: number
	public getCompletionSquirreled: Squirreled<GetCompletion>
	public getUnknownJsonFromOpenAi: GetUnknownJsonFromOpenAi
	public getUnknownJsonFromOpenAiSquirreled: Squirreled<GetUnknownJsonFromOpenAi>
	public squirrel: Squirrel
	public model: NonPreviewTextModel
	public client: OpenAI
	public lastUsage?: OpenAI.Completions.CompletionUsage
	public logger: Pick<Console, `error` | `info` | `warn`>

	public constructor({
		model,
		usdBudget,
		usdMinimum,
		apiKey,
		cachingMode,
		cacheKey = `openai-safegen`,
		logger = console,
	}: OpenAiSafeGenOptions) {
		this.usdBudget = usdBudget
		this.usdMinimum = usdMinimum
		this.model = model
		this.squirrel = new Squirrel(cachingMode)
		this.logger = logger
		let client = clientCache.get(apiKey)
		if (!client) {
			client = new OpenAI({
				apiKey,
				dangerouslyAllowBrowser: process.env.NODE_ENV === `test`,
			})
			clientCache.set(apiKey, client)
		}
		this.client = client
		this.getCompletionSquirreled = this.squirrel.add(
			`openai-safegen`,
			this.client.completions.create.bind(this.client.completions),
		)
		this.getUnknownJsonFromOpenAi = setUpOpenAiJsonGenerator(this.client)
		this.getUnknownJsonFromOpenAiSquirreled = this.squirrel.add(
			cacheKey,
			this.getUnknownJsonFromOpenAi,
		)
		this.from = createSafeDataGenerator(async (...params) => {
			if (this.usdBudget < this.usdMinimum) {
				logger?.warn(`SafeGen budget exhausted`)
				const fallback = params[2]
				return fallback
			}
			const openAiParams = buildOpenAiRequestParams(model, ...params)
			const instruction = params[0]
			const previouslyFailedResponses = params[3]
			const { data, usage, usdPrice } =
				await this.getUnknownJsonFromOpenAiSquirreled
					.for(
						`${instruction.replace(/[^a-zA-Z0-9-_. ]/g, `_`)}-${previouslyFailedResponses.length}`,
					)
					.get(openAiParams)
			this.lastUsage = usage
			this.usdBudget -= usdPrice
			return data
		}, logger)
	}

	public from: GenerateFromSchema

	public async boolean(instruction: string): Promise<Error | boolean> {
		return booleanGen(instruction, async (prompt, filename) => {
			const response = await this.getCompletionSquirreled.for(filename).get({
				model: this.model,
				prompt,
				max_tokens: 1,
			})
			const text = response.choices[0].text.trim().toLowerCase()
			return text
		})
	}

	public async number(
		instruction: string,
		min: number,
		max: number,
	): Promise<Error | number> {
		return numberGen(instruction, min, max, async (prompt, filename) => {
			const response = await this.getCompletionSquirreled.for(filename).get({
				model: this.model,
				prompt,
				max_tokens: 6,
			})
			const text = response.choices[0].text.trim()
			return text
		})
	}

	public async choose<T extends (number | string)[]>(
		instruction: string,
		options: T,
		min?: 1,
		max?: 1,
	): Promise<Error | T[number]>
	public async choose<T extends (number | string)[]>(
		instruction: string,
		options: T,
		min: number,
		max?: number,
	): Promise<Error | T[number][]>
	public async choose<T extends (number | string)[]>(
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
			async (prompt, filename, maxTokens) => {
				const response = await this.getCompletionSquirreled.for(filename).get({
					model: this.model,
					prompt,
					max_tokens: maxTokens,
				})
				const text = response.choices[0].text.trim()
				console.log({
					prompt,
					choices: response.choices,
					text,
					lowercaseText: text.toLowerCase(),
				})
				return text
			},
			this.logger,
		)
	}
}
