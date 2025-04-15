import type { Content, GenerateContentParameters } from "@google/genai"

import type { GenerateJsonFromLLM } from "../safegen"
import { jsonSchemaToInstruction } from "../safegen"
import type { SafegenGoogleSupportedModel } from "./google-pricing-facts"

export function buildGoogleRequestParams(
	model: SafegenGoogleSupportedModel,
	...params: Parameters<GenerateJsonFromLLM>
): GenerateContentParameters {
	const [instruction, jsonSchema, _, previouslyFailedResponses] = params
	const contents = {
		role: `user`,
		parts: [
			{ text: jsonSchemaToInstruction(jsonSchema) },
			{ text: instruction },
		],
	} as const satisfies Content
	const lastFailedResponse = previouslyFailedResponses.at(-1)
	if (lastFailedResponse) {
		contents.parts.push({
			text: [
				`Oops! That didn't work. Here's what was returned last time:`,
				JSON.stringify(lastFailedResponse.response, null, 2),
				`Here's the error message:`,
				JSON.stringify(lastFailedResponse.error.issues, null, 2),
			].join(`\n`),
		})
	}
	return { model, contents, config: { responseMimeType: `application/json` } }
}
