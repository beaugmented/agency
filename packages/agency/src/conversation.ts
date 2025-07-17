import type { Loadable } from "atom.io"
import { atomFamily, selectorFamily } from "atom.io"

import type {
	AssistantMessage,
	Message,
	SystemMessage,
	UserMessage,
} from "./agent"

export const messageIndices = atomFamily<string[], string>({
	key: `messageIndices`,
	default: [],
})

export const chatMessageAtoms = atomFamily<
	Loadable<Omit<Message, `id`>>,
	string
>({
	key: `messages`,
	default: {
		role: `user`,
		content: ``,
	},
})

export const conversationSelectors = selectorFamily<
	Loadable<(AssistantMessage | SystemMessage | UserMessage)[]>,
	string
>({
	key: `conversationMessages`,
	get:
		(conversationKey) =>
		({ get }) => {
			const messageIds = get(messageIndices, conversationKey)
			const allMessages = Promise.all(
				messageIds.map((messageId) => get(chatMessageAtoms, messageId)),
			)
			return allMessages
		},
})
