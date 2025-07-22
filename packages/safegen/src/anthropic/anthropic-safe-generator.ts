import Anthropic from "@anthropic-ai/sdk"
import type { MessageCreateParamsNonStreaming } from "@anthropic-ai/sdk/resources"
import type { StandardSchemaV1 } from "@standard-schema/spec"
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
import {
	calculateInferencePrice,
	type SupportedModel,
} from "./anthropic-pricing-facts"
import { buildAnthropicRequestParams } from "./build-anthropic-request-params"
import type { GetUnknownJsonFromAnthropic } from "./set-up-anthropic-json-generator"
import { setUpAnthropicJsonGenerator } from "./set-up-anthropic-json-generator"

export const clientCache: Map<string, Anthropic> = new Map()

export type AnthropicSafeGenOptions<S extends StandardSchemaV1 = ZodType> = {
	model: SupportedModel
	usdBudget: number
	usdMinimum: number
	apiKey: string
	cachingMode: CacheMode
	cacheKey?: string
	logger?: Pick<Console, `error` | `info` | `warn`>
	toJsonSchema?: ToJsonSchema<S>
}

export type GetCompletion = typeof Anthropic.prototype.messages.create

export class AnthropicSafeGenerator implements SafeGenerator {
	public usdBudget: number
	public usdMinimum: number
	public getCompletionSquirreled: Squirreled<GetCompletion>
	public getUnknownJsonFromAnthropic: GetUnknownJsonFromAnthropic
	public getUnknownJsonFromAnthropicSquirreled: Squirreled<GetUnknownJsonFromAnthropic>
	public squirrel: Squirrel
	public model: SupportedModel
	public client: Anthropic
	public lastUsage?: Anthropic.Messages.Usage
	public logger: Pick<Console, `error` | `info` | `warn`>

	public constructor({
		model,
		usdBudget,
		usdMinimum,
		apiKey,
		cachingMode,
		cacheKey = `anthropic-safegen`,
		logger = console,
	}: AnthropicSafeGenOptions) {
		this.usdBudget = usdBudget
		this.usdMinimum = usdMinimum
		this.model = model
		this.squirrel = new Squirrel(cachingMode)
		this.logger = logger
		let client = clientCache.get(apiKey)
		// if (cachingMode !== `read`) {
		if (!client) {
			client = new Anthropic({
				apiKey,
				dangerouslyAllowBrowser: process.env.NODE_ENV === `test`,
			})
			clientCache.set(apiKey, client)
		}
		this.client = client
		// }
		this.getCompletionSquirreled = this.squirrel.add(
			`anthropic-safegen`,
			this.client.messages.create.bind(this.client.messages),
		)
		this.getUnknownJsonFromAnthropic = setUpAnthropicJsonGenerator(
			this.client,
			this.logger,
		)
		this.getUnknownJsonFromAnthropicSquirreled = this.squirrel.add(
			cacheKey,
			this.getUnknownJsonFromAnthropic,
		)
		this.from = createSafeDataGenerator(async (...params) => {
			if (this.usdBudget < this.usdMinimum) {
				logger?.warn(`SafeGen budget exhausted`)
				const fallback = params[2]
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
		this.object = this.from
	}

	/** @deprecated Use `SafeGenerator.object()` instead */
	public from: GenerateFromSchema
	public object: GenerateFromSchema

	public getCompletion = async (
		key: string,
		body: MessageCreateParamsNonStreaming,
	): Promise<string> => {
		if (this.usdBudget < this.usdMinimum) {
			this.logger.warn(`SafeGen budget exhausted`)
			return ``
		}
		const completion = await this.getCompletionSquirreled.for(key).get(body)
		const { usage } = completion
		if (usage) {
			const usdPrice = calculateInferencePrice(usage, body.model)
			this.usdBudget -= usdPrice
		}
		const textMessage = completion.content.find(
			(message) => message.type === `text`,
		)
		if (!textMessage) {
			throw new Error(`No text message found in completion`)
		}
		return textMessage.text
	}

	public boolean(instruction: string): Promise<Error | boolean> {
		return booleanGen(instruction, async (prompt, filename) => {
			const completion = await this.getCompletion(filename, {
				model: this.model,
				messages: [
					{
						role: `user`,
						content: prompt,
					},
				],
				max_tokens: 1,
			})
			return completion.toLowerCase()
		})
	}

	public number(
		instruction: string,
		min: number,
		max: number,
	): Promise<Error | number> {
		return numberGen(instruction, min, max, async (prompt, filename) =>
			this.getCompletion(filename, {
				model: this.model,
				messages: [
					{
						role: `user`,
						content: prompt,
					},
				],
				max_tokens: 6,
			}),
		)
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
			async (prompt, filename, maxTokens) =>
				this.getCompletion(filename, {
					model: this.model,
					messages: [
						{
							role: `user`,
							content: prompt,
						},
					],
					max_tokens: maxTokens,
				}),
			this.logger,
		)
	}
}
