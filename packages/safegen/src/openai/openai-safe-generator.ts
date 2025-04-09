import type { StandardSchemaV1 } from "@standard-schema/spec"
import OpenAI from "openai"
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
import { buildOpenAiRequestParams } from "./build-openai-request-params"
import type { OPEN_AI_PRICING_FACTS } from "./openai-pricing-facts"
import type { GetUnknownJsonFromOpenAi } from "./set-up-openai-json-generator"
import { setUpOpenAiJsonGenerator } from "./set-up-openai-json-generator"

export const clientCache = new Map<string, OpenAI>()

export type OpenAiSafeGenOptions<S extends StandardSchemaV1 = ZodSchema> = {
	model: keyof typeof OPEN_AI_PRICING_FACTS
	usdBudget: number
	usdMinimum: number
	apiKey: string
	cachingMode: CacheMode
	cacheKey?: string
	logger?: Pick<Console, `error` | `info` | `warn`>
	toJsonSchema?: ToJsonSchema<S>
}

export class OpenAiSafeGenerator<S extends StandardSchemaV1 = ZodSchema>
	implements SafeGenerator<S>
{
	public usdBudget: number
	public usdMinimum: number
	public getUnknownJsonFromOpenAi: GetUnknownJsonFromOpenAi
	public getUnknownJsonFromOpenAiSquirreled: Squirreled<GetUnknownJsonFromOpenAi>
	public squirrel: Squirrel
	public client?: OpenAI
	public lastUsage?: OpenAI.Completions.CompletionUsage

	public constructor({
		model,
		usdBudget,
		usdMinimum,
		apiKey,
		cachingMode,
		cacheKey = `openai-safegen`,
		logger,
		toJsonSchema = zodToJsonSchema as unknown as ToJsonSchema<S>,
	}: OpenAiSafeGenOptions<S>) {
		this.usdBudget = usdBudget
		this.usdMinimum = usdMinimum
		this.squirrel = new Squirrel(cachingMode)
		let client = clientCache.get(apiKey)
		if (cachingMode !== `read`) {
			if (!client) {
				client = new OpenAI({
					apiKey,
					dangerouslyAllowBrowser: process.env.NODE_ENV === `test`,
				})
				clientCache.set(apiKey, client)
			}
			this.client = client
		}
		this.getUnknownJsonFromOpenAi = setUpOpenAiJsonGenerator(this.client)
		this.getUnknownJsonFromOpenAiSquirreled = this.squirrel.add(
			cacheKey,
			this.getUnknownJsonFromOpenAi,
		)
		this.from = createSafeDataGenerator(
			async (...params) => {
				if (this.usdBudget < this.usdMinimum) {
					logger?.warn(`SafeGen budget exhausted`)
					const fallback = params[1]
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
			},
			logger,
			toJsonSchema,
		)
	}

	public from: GenerateFromSchema<NoInfer<S>>
}
