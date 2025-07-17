import type { Loadable } from "atom.io"
import { selectorFamily } from "atom.io"
import type { APIPromise } from "openai"
import OpenAI from "openai"
import type * as OpenAIResources from "openai/resources"
import { Squirrel } from "varmint"

import { agendaSystemMessageSelectors } from "./agenda"
import { conversationSelectors } from "./conversation"
import { orientationAtoms } from "./orientation"

let openAiClient: OpenAI
export function aiComplete(
	body: OpenAIResources.ChatCompletionCreateParamsNonStreaming,
	options?: OpenAI.RequestOptions,
): APIPromise<OpenAIResources.ChatCompletion> {
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
		async ({ get }) => {
			const conversationMessagesLoadable = get(conversationSelectors, key)
			const orientation = get(orientationAtoms, key)
			const agendaMessage = get(agendaSystemMessageSelectors, key)
			const conversationMessages = [...(await conversationMessagesLoadable)]
			conversationMessages.push({
				role: `system`,
				content: `${orientation}\n\nKeep messages short.`, // ❗
			})
			if (agendaMessage) {
				conversationMessages.push(agendaMessage)
			}

			const params = {
				model: `gpt-4-turbo`,
				messages: conversationMessages,
			}
			return params
		},
})
