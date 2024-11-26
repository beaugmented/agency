import type * as Ollama from "ollama"

import type { GenerateJsonFromLLM } from "../safegen"
import { jsonSchemaToInstruction } from "../safegen"

export function buildOllamaRequestParams(
	model: `llama3.2:1b` | `llama3.2` | (string & {}),
	...params: Parameters<GenerateJsonFromLLM>
): Ollama.GenerateRequest & { stream: false } {
	const [instruction, jsonSchema, _, previouslyFailedResponses] = params
	let prompt = `${jsonSchemaToInstruction(jsonSchema)}\n\n${instruction}`

	const lastFailedResponse = previouslyFailedResponses.at(-1)
	if (lastFailedResponse) {
		prompt += `\n\n`
		prompt += [
			`Oops! That didn't work. Here's what was returned last time:`,
			JSON.stringify(lastFailedResponse.response, null, 2),
			`Here's the error message:`,
			lastFailedResponse.error.toString(),
		].join(`\n`)
	}
	return { model, prompt, format: `json`, stream: false }
}
