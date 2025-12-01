import { z } from "zod"

import type { Message, SystemMessage, UserMessage } from "./agent"
import { completions } from "./openai"

export type TestTools = {
	describe: (key: string, fn: () => void) => void
	it: (key: string, fn: () => void) => void
}

export const evaluationSchema = z.object({
	passed: z.boolean(),
	message: z.string(),
})
export type Evaluation = z.infer<typeof evaluationSchema>

export type EvaluationOptions = {
	exchange: readonly(Message | SystemMessage | UserMessage)[]
	statement: string
}
export async function evaluateAgentResponse({
	exchange,
	statement,
}: EvaluationOptions): Promise<Evaluation> {
	const messages = [
		{
			role: `system`,
			content: [
				`You are an AI assistant designed to assess other AI agents.`,
				`You will receive an EXCHANGE of messages between a human and an AI agent.`,
				`You will also receive a STATEMENT.`,
				`Please confine your response to only an Evaluation in JSON format.`,
				`\`\`\`ts\ntype Evaluation = {\n\tpassed: boolean // your determination of whether the is true,\n\tmessage: string // concise reasoning in this matter\n}\n\n`,
				`EXCHANGE:`,
				JSON.stringify(exchange, null, `\t`),
				`STATEMENT:`,
				statement,
			].join(`\n\n`),
		} as const,
	]
	return completions
		.for(statement)
		.get({
			model: `gpt-4-turbo`,
			messages,
		})
		.then((response) => {
			const text = response.choices[0].message.content
			if (!text) {
				throw new Error(`No text found in response`)
			}
			const json = JSON.parse(text)
			const evaluation = evaluationSchema.parse(json)
			return evaluation
		})
}
