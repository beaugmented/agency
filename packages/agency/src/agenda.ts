import { atomFamily, selectorFamily } from "atom.io"

import type { SystemMessage } from "."

export type Agenda = {
	[key: string]: boolean | string | null
}

export const agendaAtoms = atomFamily<Agenda, string>({
	key: `agenda`,
	default: {},
})
export const agendaSystemMessageSelectors = selectorFamily<
	SystemMessage | null,
	string
>({
	key: `agendaSystemMessage`,
	get:
		(agendaKey) =>
		({ find, get }) => {
			const agenda = get(find(agendaAtoms, agendaKey))
			const currentAgendaItems = Object.entries(agenda).filter(
				(entry): entry is [string, false | null] =>
					entry[1] === false || entry[1] === null,
			)
			if (currentAgendaItems[0] === undefined) {
				return null
			}
			let content: string
			switch (currentAgendaItems[0][1]) {
				case false:
					content = [
						`Your current agenda item is "${currentAgendaItems[0][0]}".`,
						`At the end of your message, determine whether this agenda item is complete.`,
						`If it is, end your message with the line`,
						`AGENDA_JSON{ "${currentAgendaItems[0][0]}": true }`,
						`If it remains incomplete, end your message with the line`,
						`AGENDA_JSON{ "${currentAgendaItems[0][0]}": false }`,
					].join(`\n\n`)
					break
				case null:
					content = [
						`This is your current agenda:`,
						JSON.stringify(agenda, null, 2),
						`Your current agenda item is a question: "${currentAgendaItems[0][0]}"`,
						`Review the conversation to determine whether this question has been answered.`,
						`If it has, end your message with the line`,
						`AGENDA_JSON{ "${currentAgendaItems[0][0]}": <answer, one or two sentences> }`,
						`otherwise, end your message with the line`,
						`AGENDA_JSON{ "${currentAgendaItems[0][0]}": null }`,
					].join(`\n\n`)
					break
			}
			return {
				role: `system`,
				content,
			}
		},
})
