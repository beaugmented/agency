import * as crypto from "node:crypto"

import { findState, getState, setState } from "atom.io"
import type { Loadable } from "atom.io/data"

import { type Agenda, agendaAtoms } from "./agenda"
import type {
	Agent,
	AgentCompletion,
	AssistantMessage,
	Message,
	SystemMessage,
	UserMessage,
} from "./agent"
import {
	chatMessageAtoms,
	conversationSelectors,
	messageIndices,
} from "./conversation"
import { completions, openAiParamsSelectors } from "./openai"
import { orientationAtoms } from "./orientation"

export class Grunt<State extends Agenda>
	implements Agent<State, Partial<State>>
{
	public index = 0
	public constructor(
		public id: string,
		role: string,
		initialState?: State,
		initialConversation?: Message[],
	) {
		setState(findState(orientationAtoms, this.id), role)
		if (initialConversation) {
			const messageIds: string[] = []
			for (const message of initialConversation) {
				const messageId = crypto.randomUUID()
				messageIds.push(messageId)
				setState(findState(chatMessageAtoms, id), message)
			}
			setState(findState(messageIndices, id), messageIds)
		}
		if (initialState) {
			setState(findState(agendaAtoms, id), initialState)
		}
	}

	public get conversation(): Loadable<
		(AssistantMessage | SystemMessage | UserMessage)[]
	> {
		const conversationLoadable = getState(
			findState(conversationSelectors, this.id),
		)
		return conversationLoadable
	}

	public get state(): State {
		const stateLoadable = getState(findState(agendaAtoms, this.id))
		return stateLoadable as State
	}

	public async callAssistant(): Promise<AgentCompletion<Partial<State>>> {
		const messageId = `${this.id}-${crypto.randomUUID()}`
		const messageAtom = findState(chatMessageAtoms, messageId)
		const messageIndex = findState(messageIndices, this.id)
		const agendaAtom = findState(agendaAtoms, this.id)
		const paramsLoadable = getState(findState(openAiParamsSelectors, this.id))
		const params = await paramsLoadable
		const assistance = completions
			.get(`${this.id}-${this.index}`, params)
			.then((completion) => {
				const [text, stateUpdateRaw] =
					completion.choices[0].message.content?.split(`AGENDA_JSON`) ?? ``
				if (!stateUpdateRaw) {
					throw new Error(`No state update found in completion`)
				}
				const update = JSON.parse(stateUpdateRaw)
				return {
					update,
					message: {
						role: `assistant`,
						content: text,
					},
				} as const
			})
		this.index++
		setState(
			messageAtom,
			assistance.then(({ message }) => message),
		)
		await assistance.then(({ update }) => {
			setState(agendaAtom, (agenda) => {
				const [[k, v]] = Object.entries(update)
				const newAgenda = { ...agenda }
				newAgenda[k] = v as boolean | string | null
				return newAgenda
			})
		})

		setState(messageIndex, (messageIds) => [...messageIds, messageId])
		return assistance
	}

	public addUserMessage(content: string): void {
		const messageId = `${this.id}-${crypto.randomUUID()}`
		setState(findState(messageIndices, this.id), (messageIds) => [
			...messageIds,
			messageId,
		])
		const messageAtom = findState(chatMessageAtoms, messageId)
		setState(messageAtom, {
			role: `user`,
			content,
		})
	}
}
