import type { StandardSchemaV1 } from "@standard-schema/spec"
import type { Json } from "atom.io/json"
import type { ZodType } from "zod/v4"
import { z } from "zod/v4"

export type PricingFacts = {
	promptPricePerToken: number
	promptPricePerTokenCached?: number
	completionPricePerToken: number
}

export type WhateverJsonSchema = unknown

export type GenerateFromSchema = <
	J extends Json.Object,
	S extends StandardSchemaV1 = ZodType,
>(
	dataSpec: DataSpec<J, S>,
) => GenerateSafeData<J>
export interface SafeGenerator {
	from: GenerateFromSchema
}

export type InvalidResponse = {
	response: Json.Object
	error: StandardSchemaV1.FailureResult
}

export type GenerateJsonFromLLM = (
	instruction: string,
	jsonSchema: WhateverJsonSchema,
	fallback: Json.Object,
	previouslyFailedResponses: InvalidResponse[],
) => Promise<Json.Object>

export type GenerateSafeData<T> = (
	userInstruction: string,
	maxAttempts?: number,
) => Promise<T>

export type DataSpec<T, S extends StandardSchemaV1 = ZodType> = {
	schema: Omit<S, `~standard`> &
		StandardSchemaV1<unknown, T> & {
			// eslint-disable-next-line quotes
			"~standard": { vendor: S[`~standard`][`vendor`] }
		}
	fallback: T
	toJsonSchema?: ToJsonSchema<S>
}

export type ToJsonSchema<S extends StandardSchemaV1> = (
	schema: S,
) => WhateverJsonSchema

export function createSafeDataGenerator(
	gen: GenerateJsonFromLLM,
	logger?: Pick<Console, `error` | `info` | `warn`>,
): GenerateFromSchema {
	return function generateFromSchema<
		J extends Json.Object,
		S extends StandardSchemaV1 = ZodType,
	>({
		schema,
		fallback,
		toJsonSchema = z.toJSONSchema as unknown as ToJsonSchema<S>,
	}: DataSpec<J, S>): GenerateSafeData<J> {
		const jsonSchema = toJsonSchema(schema as S)
		return async function generateSafeData(
			userInstruction: string,
			maxAttempts = 3,
		) {
			let currentResponse: Json.Object
			const invalidResponses: InvalidResponse[] = []
			while (invalidResponses.length < maxAttempts) {
				currentResponse = await gen(
					userInstruction,
					jsonSchema,
					fallback,
					invalidResponses,
				)
				const result = await schema[`~standard`].validate(currentResponse)
				if (`value` in result) {
					return result.value
				}
				logger?.warn(
					`safegen failed to generate well-formed data.\n`,
					`Here's what was returned last time:\n`,
					JSON.stringify(currentResponse, null, `\t`),
					`\n`,
					`Here are the issues returned from our validation:\n`,
					JSON.stringify(result.issues, null, `\t`),
				)
				invalidResponses.push({
					response: currentResponse,
					error: result,
				})
			}
			logger?.error(
				`safegen was unable to generate well-formed data after ${maxAttempts} failed attempts.`,
			)
			return fallback
		}
	}
}

export function jsonSchemaToInstruction(
	jsonSchema: WhateverJsonSchema,
): string {
	return [
		`Please generate a response in JSON that conforms to the following JSON Schema:`,
		JSON.stringify(jsonSchema, null, 2),
	].join(`\n`)
}
