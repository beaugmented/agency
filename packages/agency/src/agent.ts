import type { Loadable } from "atom.io"

export type AssistantMessage = {
	role: `assistant`
	content: string
}
export type UserMessage = {
	role: `user`
	content: string
}
export type SystemMessage = {
	role: `system`
	content: string
}
export type Message = AssistantMessage | UserMessage

export type AgentCompletion<Update> = {
	message: AssistantMessage
	update: Update
}

export type Agent<State = null, Update = null> = {
	conversation: Loadable<readonly (AssistantMessage | SystemMessage | UserMessage)[]>
	state: Loadable<State>
	stream?: (handleDelta: (delta: string) => void) => { release: () => void }
	callAssistant: () => Promise<{
		message: AssistantMessage
		update: Update
	}>
	addUserMessage: (content: string) => void
}
