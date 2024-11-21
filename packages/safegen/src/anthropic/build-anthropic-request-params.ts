import type {
	MessageCreateParamsNonStreaming,
	MessageParam,
	Model,
} from "@anthropic-ai/sdk/resources/index"

import type { GenerateJsonFromLLM } from "../safegen"
import { jsonSchemaToInstruction } from "../safegen"

export function buildAnthropicRequestParams(
	model: Model,
	...params: Parameters<GenerateJsonFromLLM>
): MessageCreateParamsNonStreaming {
	const [instruction, jsonSchema, _, previouslyFailedResponses] = params
	const messages: MessageParam[] = [
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
	return { model, messages, max_tokens: 1000 /* ❗ look into this */ }
}
