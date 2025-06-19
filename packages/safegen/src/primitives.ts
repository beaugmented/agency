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

export async function booleanGen(
	instruction: string,
	getCompletion: (prompt: string, filename: string) => Promise<string>,
): Promise<Error | boolean> {
	const prompt = `${instruction} [respond either 'y' or 'n' only]/n/nAnswer: `
	const filename = `boolean-${instruction}`
	const text = await getCompletion(prompt, filename)
	const lowerText = text.toLowerCase()
	if (lowerText === `y`) {
		return true
	}
	if (lowerText === `n`) {
		return false
	}
	return new Error(
		formatIssue(
			instruction,
			text,
			`Expected 'y' or 'n'`,
			`Cannot be parsed as a boolean.`,
		),
	)
}

export async function numberGen(
	instruction: string,
	min: number,
	max: number,
	getCompletion: (prompt: string, filename: string) => Promise<string>,
): Promise<Error | number> {
	if (min > max) {
		return new Error(
			`For prompt "${instruction}", a minimum number ${min} was specified, but a maximum number ${max} was specified. This is unachievable.`,
		)
	}
	const prompt = `Q: ${instruction} [answer with only a number from ${min} to ${max}]\nA: `
	const filename = `number-${instruction}-${min}-${max}`
	const text = await getCompletion(prompt, filename)
	const number = Number.parseInt(text, 10)
	if (Number.isNaN(number)) {
		return new Error(formatIssue(instruction, text, `Expected a number.`))
	}
	return number
}

export async function chooseGen<T extends (number | string)[]>(
	instruction: string,
	options: T,
	min: number,
	max: number,
	getCompletion: (
		prompt: string,
		filename: string,
		maxTokens: number,
	) => Promise<string>,
	logger: Pick<Console, `error` | `info` | `warn`>,
): Promise<Error | T[number] | T[number][]> {
	const isSingleChoice = min === 1 && max === 1
	if (options.length === 0) {
		if (isSingleChoice) {
			return new Error(
				`For prompt "${instruction}", exactly one option was required to be chosen, but no options were provided.`,
			)
		}
	}
	if (options.length === 1) {
		logger.warn(
			`For prompt: ${instruction}, options has only one option: "${options[0]}". Returning it.`,
		)
		return [options[0]]
	}
	if (min > max) {
		return new Error(
			`For prompt "${instruction}", a minimum of ${min} options must be chosen, but a maximum of ${max} options was specified. This is unachievable.`,
		)
	}
	if (max === 0) {
		logger.warn(
			`For prompt "${instruction}", a maximum of 0 options was specified; returning an empty array.`,
		)
		return []
	}
	const optionsString = options
		.map((option) => `- ${String(option)}`)
		.join(`\n`)
	let formattingInstruction = optionsString
	let maxTokens: number
	if (min === 0 && max === 1) {
		formattingInstruction += `\n\respond with the best option given.`
		formattingInstruction += `\n\nif none of the options are good, respond with just the phase "$NONE".`
		maxTokens = 12
	} else if (min === 1 && max === 1) {
		formattingInstruction += `\n\nrespond with only the best option given`
		formattingInstruction += `\n\nif none of the options are good, just say the one that fits best`
		maxTokens = 12
	} else {
		formattingInstruction += `\n\n`
		if (min === 0) {
			formattingInstruction += `if none of the options apply, respond "$NONE". otherwise, `
		}
		formattingInstruction += `format your response as a numbered list, like this:`
		formattingInstruction += `\n`
		formattingInstruction += Array.from(
			{ length: max },
			(_, i) => `${i + 1}. choice ${i + 1}`,
		).join(`\n`)

		if (min === max) {
			formattingInstruction += `\n\nchoose exactly ${min} options`
		} else {
			formattingInstruction += `\n\nchoose as few as ${min} options, or as many as ${max} options`
		}

		maxTokens = 12 * max
	}
	formattingInstruction += `\n\nRESPONSE:\n`

	const text = await getCompletion(
		`${instruction}\n\n${formattingInstruction}`,
		`choose-${instruction}-FROM-${options.join(`-`)}`,
		maxTokens,
	)

	if (isSingleChoice) {
		if (options.includes(text)) {
			return text
		}
		const lowercase = text.toLowerCase()
		if (options.includes(lowercase)) {
			return lowercase
		}
		const number = Number(text)
		if (options.includes(number)) {
			return number
		}
		return new Error(
			formatIssue(
				instruction,
				text,
				`"${text}" is not found among [${options.join(`, `)}]`,
			),
		)
	}
	if (text.toLowerCase() === `$none`) {
		return []
	}
	const lines = text.split(`\n`)
	const filteredLines = lines.filter((line) => line.match(/^\d+\. /))
	const selections: T[number][] = []
	for (const line of filteredLines) {
		const cleanedLine = line.trim().split(`. `)[1]
		if (options.includes(cleanedLine)) {
			selections.push(cleanedLine)
		} else if (options.includes(cleanedLine.toLowerCase())) {
			selections.push(cleanedLine.toLowerCase())
		} else if (options.includes(Number(cleanedLine))) {
			selections.push(Number(cleanedLine))
		} else if (cleanedLine === `$none`) {
		} else {
			formatIssue(
				instruction,
				cleanedLine,
				`"${cleanedLine}" is not found among [${options.join(`, `)}]`,
				`This element will not be included in the final result.`,
			)
		}
	}
	if (selections.length < min) {
		return new Error(
			`For prompt "${instruction}", at least ${min} options must be chosen, but ${selections.length} options were chosen.`,
		)
	}
	if (selections.length > max) {
		logger.warn(
			`For prompt "${instruction}", at most ${max} options must be chosen, but ${selections.length} options were chosen.`,
		)
		return selections.slice(0, max)
	}
	return selections
}
