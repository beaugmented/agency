import Anthropic from "@anthropic-ai/sdk"
import type { StandardSchemaV1 } from "@standard-schema/spec"
import type { CacheMode, Squirreled } from "varmint"
import { Squirrel } from "varmint"
import type { ZodSchema } from "zod"

import type {
	GenerateFromSchema,
	SafeGenerator,
	ToJsonSchema,
} from "../safegen"
import { createSafeDataGenerator } from "../safegen"
import type { SupportedModel } from "./anthropic-pricing-facts"
import { buildAnthropicRequestParams } from "./build-anthropic-request-params"
import type { GetUnknownJsonFromAnthropic } from "./set-up-anthropic-json-generator"
import { setUpAnthropicJsonGenerator } from "./set-up-anthropic-json-generator"

export const clientCache: Map<string, Anthropic> = new Map()

export type AnthropicSafeGenOptions<S extends StandardSchemaV1 = ZodSchema> = {
	model: SupportedModel
	usdBudget: number
	usdMinimum: number
	apiKey: string
	cachingMode: CacheMode
	cacheKey?: string
	logger?: Pick<Console, `error` | `info` | `warn`>
	toJsonSchema?: ToJsonSchema<S>
}

export class AnthropicSafeGenerator implements SafeGenerator {
	public usdBudget: number
	public usdMinimum: number
	public getUnknownJsonFromAnthropic: GetUnknownJsonFromAnthropic
	public getUnknownJsonFromAnthropicSquirreled: Squirreled<GetUnknownJsonFromAnthropic>
	public squirrel: Squirrel
	public client?: Anthropic
	public lastUsage?: Anthropic.Messages.Usage

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
		this.usdMinimum = usdMinimum
		this.squirrel = new Squirrel(cachingMode)
		let client = clientCache.get(apiKey)
		if (cachingMode !== `read`) {
			if (!client) {
				client = new Anthropic({
					apiKey,
					dangerouslyAllowBrowser: process.env.NODE_ENV === `test`,
				})
				clientCache.set(apiKey, client)
			}
			this.client = client
		}
		this.getUnknownJsonFromAnthropic = setUpAnthropicJsonGenerator(this.client)
		this.getUnknownJsonFromAnthropicSquirreled = this.squirrel.add(
			cacheKey,
			this.getUnknownJsonFromAnthropic,
		)
		this.from = createSafeDataGenerator(async (...params) => {
			if (this.usdBudget < this.usdMinimum) {
				logger?.warn(`SafeGen budget exhausted`)
				const fallback = params[1]
				return fallback
			}
			const anthropicParams = buildAnthropicRequestParams(model, ...params)
			const instruction = params[0]
			const previouslyFailedResponses = params[3]
			const { data, usage, usdPrice } =
				await this.getUnknownJsonFromAnthropicSquirreled
					.for(
						`${instruction.replace(/[^a-zA-Z0-9-_. ]/g, `_`)}-${previouslyFailedResponses.length}`,
					)
					.get(anthropicParams)
			this.lastUsage = usage
			this.usdBudget -= usdPrice
			return data
		}, logger)
	}

	public from: GenerateFromSchema
}
