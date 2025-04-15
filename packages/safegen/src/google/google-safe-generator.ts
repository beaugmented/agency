import type { GenerateContentResponseUsageMetadata } from "@google/genai"
import { GoogleGenAI } from "@google/genai"
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
import { buildGoogleRequestParams } from "./build-google-request-params"
import type { GOOGLE_PRICING_FACTS } from "./google-pricing-facts"
import type { GetUnknownJsonFromGoogle } from "./set-up-google-json-generator"
import { setUpGoogleJsonGenerator } from "./set-up-google-json-generator"

export const clientCache = new Map<string, GoogleGenAI>()

export type GoogleSafeGenOptions<S extends StandardSchemaV1 = ZodSchema> = {
	model: keyof typeof GOOGLE_PRICING_FACTS
	usdBudget: number
	usdMinimum: number
	apiKey: string
	cachingMode: CacheMode
	cacheKey?: string
	logger?: Pick<Console, `error` | `info` | `warn`>
	toJsonSchema?: ToJsonSchema<S>
}

export class GoogleSafeGenerator implements SafeGenerator {
	public usdBudget: number
	public usdMinimum: number
	public getUnknownJsonFromGoogle: GetUnknownJsonFromGoogle
	public getUnknownJsonFromGoogleSquirreled: Squirreled<GetUnknownJsonFromGoogle>
	public squirrel: Squirrel
	public client?: GoogleGenAI
	public lastUsage?: GenerateContentResponseUsageMetadata | undefined

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
		if (cachingMode !== `read`) {
			if (!client) {
				client = new GoogleGenAI({ apiKey })
				clientCache.set(apiKey, client)
			}
			this.client = client
		}
		this.getUnknownJsonFromGoogle = setUpGoogleJsonGenerator(this.client)
		this.getUnknownJsonFromGoogleSquirreled = this.squirrel.add(
			cacheKey,
			this.getUnknownJsonFromGoogle,
		)
		this.from = createSafeDataGenerator(async (...params) => {
			if (this.usdBudget < this.usdMinimum) {
				logger?.warn(`SafeGen budget exhausted`)
				const fallback = params[1]
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
	}

	public from: GenerateFromSchema
}
