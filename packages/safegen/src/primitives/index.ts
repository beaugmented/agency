import type { Json } from "atom.io/json"

export function formatIssue(
	prompt: string,
	actual: Json.Serializable,
	issue: string,
	consequence?: string,
): string {
	const lines = [
		`SafeGen saw that invalid data was produced for the prompt:`,
		`\t${prompt}`,
		`The actual data is:`,
		`\t${JSON.stringify(actual, null, 2)}`,
		`The issue that makes it invalid is:`,
		`\t${issue}`,
	]
	if (consequence) {
		lines.push(`The consequence of this issue is:`, `\t${consequence}`)
	}
	return lines.join(`\n`)
}

export async function numberGen(
	instruction: string,
	min: number,
	max: number,
	getCompletion: (prompt: string) => Promise<string>,
): Promise<Error | number> {
	if (min > max) {
		return new Error(
			`For prompt "${instruction}", a minimum number ${min} was specified, but a maximum number ${max} was specified. This is unachievable.`,
		)
	}
	const prompt = `Q: ${instruction} [answer with only a number from ${min} to ${max}]\nA: `
	const text = await getCompletion(prompt)
	const number = Number.parseInt(text, 10)
	if (Number.isNaN(number)) {
		return new Error(formatIssue(instruction, text, `Expected a number.`))
	}
	return number
}
