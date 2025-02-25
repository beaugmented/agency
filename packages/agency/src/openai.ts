import type { Loadable } from "atom.io"
import { selectorFamily } from "atom.io"
import OpenAI from "openai"
import type * as OpenAICore from "openai/core"
import type OpenAIResources from "openai/resources/index"
import { Squirrel } from "varmint"

import { agendaSystemMessageSelectors } from "./agenda"
import { conversationSelectors } from "./conversation"
import { orientationAtoms } from "./orientation"

let openAiClient: OpenAI
export function aiComplete(
	body: OpenAIResources.ChatCompletionCreateParamsNonStreaming,
	options?: OpenAICore.RequestOptions,
): OpenAICore.APIPromise<OpenAIResources.ChatCompletion> {
	if (!openAiClient) {
		openAiClient = new OpenAI({
			apiKey: import.meta.env.VITE_OPENAI_API_KEY,
			dangerouslyAllowBrowser: process.env.NODE_ENV === `test`,
		})
	}
	return openAiClient.chat.completions.create(
		{
			...body,
			stream: false,
		},
		options,
	)
}

export const squirrel = new Squirrel(
	process.env.CI
		? `read`
		: process.env.NODE_ENV === `production`
			? `off`
			: `read-write`,
)
export const completions = squirrel.add(`openai`, aiComplete)

export const openAiParamsSelectors = selectorFamily<
	Loadable<OpenAIResources.Chat.Completions.ChatCompletionCreateParamsNonStreaming>,
	string
>({
	key: `openAIParams`,
	get:
		(key) =>
		async ({ find, get }) => {
			const conversationMessages = get(find(conversationSelectors, key))
			const orientation = get(find(orientationAtoms, key))
			const agendaMessage = get(find(agendaSystemMessageSelectors, key))
			const messages = await conversationMessages
			messages.push({
				role: `system`,
				content: `${orientation}\n\nKeep messages short.`, // ❗
			})
			if (agendaMessage) {
				messages.push(agendaMessage)
			}

			const params = {
				model: `gpt-4-turbo`,
				messages,
			}
			return params
		},
})
