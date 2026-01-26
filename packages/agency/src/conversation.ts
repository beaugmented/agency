import type { Loadable } from "atom.io"
import { atomFamily, selectorFamily } from "atom.io"

import type {
	AssistantMessage,
	Message,
	SystemMessage,
	UserMessage,
} from "./agent"

export const messageKeysAtoms = atomFamily<string[], string>({
	key: `messageKeys`,
	default: [],
})

export const chatMessageAtoms = atomFamily<
	Loadable<Omit<Message, `id`>>,
	string
>({
	key: `chatMessage`,
	default: {
		role: `user`,
		content: ``,
	},
})

export const conversationSelectors = selectorFamily<
	Loadable<(AssistantMessage | SystemMessage | UserMessage)[]>,
	string
>({
	key: `conversation`,
	get:
		(conversationKey) =>
		({ get }) => {
			const messageIds = get(messageKeysAtoms, conversationKey)
			const allMessages = Promise.all(
				messageIds.map((messageId) => get(chatMessageAtoms, messageId)),
			)
			return allMessages
		},
})
