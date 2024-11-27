import type * as Ollama from "ollama"

import type { GenerateJsonFromLLM } from "../safegen"
import { jsonSchemaToInstruction } from "../safegen"

export function buildOllamaRequestParams(
	model: `llama3.2:1b` | `llama3.2` | (string & {}),
	...params: Parameters<GenerateJsonFromLLM>
): Ollama.ChatRequest & { stream: false } {
	const [instruction, jsonSchema, _, previouslyFailedResponses] = params
	const messages: Ollama.Message[] = [
		{
			role: `user`,
			content: jsonSchemaToInstruction(jsonSchema),
		},
		{
			role: `user`,
			content: instruction,
		},
	]

	const lastFailedResponse = previouslyFailedResponses.at(-1)
	if (lastFailedResponse) {
		messages.push({
			role: `user`,
			content: [
				`Oops! That didn't work. Here's what was returned last time:`,
				JSON.stringify(lastFailedResponse.response, null, 2),
				`Here's the error message:`,
				lastFailedResponse.error.toString(),
			].join(`\n`),
		})
	}
	// if (lastFailedResponse) {
	// 	prompt += `\n\n`
	// 	prompt += [
	// 		`Oops! That didn't work. Here's what was returned last time:`,
	// 		JSON.stringify(lastFailedResponse.response, null, 2),
	// 		`Here's the error message:`,
	// 		lastFailedResponse.error.toString(),
	// 	].join(`\n`)
	// }
	return { model, messages, format: `json`, stream: false }
}
