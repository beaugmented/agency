import type {
	GenerateContentParameters,
	GenerateContentResponseUsageMetadata,
} from "@google/genai"
import { GoogleGenAI } from "@google/genai"
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
import { buildGoogleRequestParams } from "./build-google-request-params"
import { calculateInferencePrice, type ModelName } from "./google-pricing-facts"
import type { GetUnknownJsonFromGoogle } from "./set-up-google-json-generator"
import { setUpGoogleJsonGenerator } from "./set-up-google-json-generator"

export const clientCache: Map<string, GoogleGenAI> = new Map()

export type GoogleSafeGenOptions<S extends StandardSchemaV1 = ZodType> = {
	model: ModelName
	usdBudget: number
	usdMinimum: number
	apiKey: string
	cachingMode: CacheMode
	cacheKey?: string
	logger?: Pick<Console, `error` | `info` | `warn`>
	toJsonSchema?: ToJsonSchema<S>
}

export type GetCompletion = typeof GoogleGenAI.prototype.models.generateContent

export class GoogleSafeGenerator implements SafeGenerator {
	public usdBudget: number
	public usdMinimum: number
	public getCompletionSquirreled: Squirreled<GetCompletion>
	public getUnknownJsonFromGoogle: GetUnknownJsonFromGoogle
	public getUnknownJsonFromGoogleSquirreled: Squirreled<GetUnknownJsonFromGoogle>
	public squirrel: Squirrel
	public model: ModelName
	public client?: GoogleGenAI
	public lastUsage?: GenerateContentResponseUsageMetadata | undefined
	public logger: Pick<Console, `error` | `info` | `warn`>

	public constructor({
		model,
		usdBudget,
		usdMinimum,
		apiKey,
		cachingMode,
		cacheKey = `google-safegen`,
		logger,
	}: GoogleSafeGenOptions) {
		this.usdBudget = usdBudget
		this.usdMinimum = usdMinimum
		this.squirrel = new Squirrel(cachingMode)
		let client = clientCache.get(apiKey)
		if (!client) {
			client = new GoogleGenAI({ apiKey })
			clientCache.set(apiKey, client)
		}
		this.client = client
		this.getCompletionSquirreled = this.squirrel.add(
			`google-safegen`,
			this.client.models.generateContent.bind(this.client.models),
		)
		this.getUnknownJsonFromGoogle = setUpGoogleJsonGenerator(this.client)
		this.getUnknownJsonFromGoogleSquirreled = this.squirrel.add(
			cacheKey,
			this.getUnknownJsonFromGoogle,
		)
		this.from = createSafeDataGenerator(async (...params) => {
			if (this.usdBudget < this.usdMinimum) {
				logger?.warn(`SafeGen budget exhausted`)
				const fallback = params[2]
				return fallback
			}
			const googleParams = buildGoogleRequestParams(model, ...params)
			const instruction = params[0]
			const previouslyFailedResponses = params[3]
			const { data, usage, usdPrice } =
				await this.getUnknownJsonFromGoogleSquirreled
					.for(
						`${instruction.replace(/[^a-zA-Z0-9-_. ]/g, `_`)}-${previouslyFailedResponses.length}`,
					)
					.get(googleParams)
			this.lastUsage = usage
			this.usdBudget -= usdPrice
			return data
		}, logger)
		this.object = this.from
	}

	public getCompletion = async (
		key: string,
		body: GenerateContentParameters,
	): Promise<string> => {
		if (this.usdBudget < this.usdMinimum) {
			this.logger.warn(`SafeGen budget exhausted`)
			return ``
		}
		const completion = await this.getCompletionSquirreled.for(key).get(body)
		const { text, usageMetadata: usage } = completion
		if (usage) {
			const usdPrice = calculateInferencePrice(usage, body.model)
			this.usdBudget -= usdPrice
		}
		if (!text) {
			throw new Error(`No text message found in completion`)
		}
		return text
	}

	/** @deprecated Use `SafeGenerator.object()` instead */
	public from: GenerateFromSchema
	public object: GenerateFromSchema

	public boolean(instruction: string): Promise<Error | boolean> {
		return booleanGen(instruction, async (prompt, filename) => {
			const completion = await this.getCompletion(filename, {
				model: this.model,
				contents: {
					role: `user`,
					parts: [{ text: prompt }],
				},
				config: { maxOutputTokens: 1 },
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
				contents: {
					role: `user`,
					parts: [{ text: prompt }],
				},
				config: { maxOutputTokens: 6 },
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
		min: number,
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
					contents: {
						role: `user`,
						parts: [{ text: prompt }],
					},
					config: { maxOutputTokens: maxTokens },
				}),
			this.logger,
		)
	}
}
