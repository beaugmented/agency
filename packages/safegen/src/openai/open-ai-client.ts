import type { Json } from "atom.io/json"
import OpenAI from "openai"
import type * as OpenAICore from "openai/core"
import type OpenAIResources from "openai/resources/index"

let openAiClient: OpenAI
export function setUpOpenAiJsonGenerator(apiKey: string) {
	return async function getUnknownJsonFromOpenAi(
		body: OpenAIResources.ChatCompletionCreateParamsNonStreaming,
		options?: OpenAICore.RequestOptions,
	): Promise<Json.Object> {
		if (!openAiClient) {
			openAiClient = new OpenAI({
				apiKey,
				dangerouslyAllowBrowser: process.env.NODE_ENV === `test`,
			})
		}
		const completion = await openAiClient.chat.completions.create(
			{
				...body,
				stream: false,
				response_format: { type: `json_object` },
			},
			options,
		)
		const content = completion.choices[0].message?.content
		if (content) {
			return JSON.parse(content)
		}
		throw new Error(`No message found in completion`)
	}
}
