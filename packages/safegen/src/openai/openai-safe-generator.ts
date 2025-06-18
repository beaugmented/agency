import type { Json } from "atom.io/json"
import OpenAI from "openai"
import type { CacheMode, Squirreled } from "varmint"
import { Squirrel } from "varmint"

import type { GenerateFromSchema, SafeGenerator } from "../safegen"
import { createSafeDataGenerator } from "../safegen"
import { buildOpenAiRequestParams } from "./build-openai-request-params"
import type { NonPreviewTextModel } from "./openai-pricing-facts"
import type { GetUnknownJsonFromOpenAi } from "./set-up-openai-json-generator"
import { setUpOpenAiJsonGenerator } from "./set-up-openai-json-generator"

export const clientCache: Map<string, OpenAI> = new Map()

export type OpenAiSafeGenOptions = {
	model: NonPreviewTextModel
	usdBudget: number
	usdMinimum: number
	apiKey: string
	cachingMode: CacheMode
	cacheKey?: string
	logger?: Pick<Console, `error` | `info` | `warn`>
}

export type GetCompletion = typeof OpenAI.prototype.completions.create

export class OpenAiSafeGenerator implements SafeGenerator {
	public usdBudget: number
	public usdMinimum: number
	public getCompletionSquirreled: Squirreled<GetCompletion>
	public getUnknownJsonFromOpenAi: GetUnknownJsonFromOpenAi
	public getUnknownJsonFromOpenAiSquirreled: Squirreled<GetUnknownJsonFromOpenAi>
	public squirrel: Squirrel
	public model: NonPreviewTextModel
	public client: OpenAI
	public lastUsage?: OpenAI.Completions.CompletionUsage
	public logger: Pick<Console, `error` | `info` | `warn`>

	public formatIssue(
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

	public constructor({
		model,
		usdBudget,
		usdMinimum,
		apiKey,
		cachingMode,
		cacheKey = `openai-safegen`,
		logger = console,
	}: OpenAiSafeGenOptions) {
		this.usdBudget = usdBudget
		this.usdMinimum = usdMinimum
		this.model = model
		this.squirrel = new Squirrel(cachingMode)
		this.logger = logger
		let client = clientCache.get(apiKey)
		if (!client) {
			client = new OpenAI({
				apiKey,
				dangerouslyAllowBrowser: process.env.NODE_ENV === `test`,
			})
			clientCache.set(apiKey, client)
		}
		this.client = client
		this.getCompletionSquirreled = this.squirrel.add(
			`openai-safegen`,
			this.client.completions.create.bind(this.client.completions),
		)
		this.getUnknownJsonFromOpenAi = setUpOpenAiJsonGenerator(this.client)
		this.getUnknownJsonFromOpenAiSquirreled = this.squirrel.add(
			cacheKey,
			this.getUnknownJsonFromOpenAi,
		)
		this.from = createSafeDataGenerator(async (...params) => {
			if (this.usdBudget < this.usdMinimum) {
				logger?.warn(`SafeGen budget exhausted`)
				const fallback = params[2]
				return fallback
			}
			const openAiParams = buildOpenAiRequestParams(model, ...params)
			const instruction = params[0]
			const previouslyFailedResponses = params[3]
			const { data, usage, usdPrice } =
				await this.getUnknownJsonFromOpenAiSquirreled
					.for(
						`${instruction.replace(/[^a-zA-Z0-9-_. ]/g, `_`)}-${previouslyFailedResponses.length}`,
					)
					.get(openAiParams)
			this.lastUsage = usage
			this.usdBudget -= usdPrice
			return data
		}, logger)
	}

	public from: GenerateFromSchema

	public async boolean(prompt: string): Promise<Error | boolean> {
		const response = await this.getCompletionSquirreled
			.for(`boolean-${prompt}`)
			.get({
				model: this.model,
				prompt: `${prompt} [respond either 'y' or 'n' only]/n/nAnswer: `,
				max_tokens: 1,
			})
		const text = response.choices[0].text.trim().toLowerCase()
		if (text === `y`) {
			return true
		}
		if (text === `n`) {
			return false
		}
		return new Error(
			this.formatIssue(
				prompt,
				text,
				`Expected 'y' or 'n'`,
				`Cannot be parsed as a boolean.`,
			),
		)
	}

	public async number(
		prompt: string,
		min: number,
		max: number,
	): Promise<Error | number> {
		if (min > max) {
			return new Error(
				`For prompt "${prompt}", a minimum number ${min} was specified, but a maximum number ${max} was specified. This is unachievable.`,
			)
		}
		const response = await this.getCompletionSquirreled
			.for(`number-${prompt}`)
			.get({
				model: this.model,
				prompt: `${prompt} [say only a number from ${min} to ${max}]`,
				max_tokens: 10,
			})
		const text = response.choices[0].text.trim()
		const number = Number(text)
		if (Number.isNaN(number)) {
			return new Error(this.formatIssue(prompt, text, `Expected a number.`))
		}
		return number
	}

	public async choose<T extends (number | string)[]>(
		prompt: string,
		options: T,
		min?: 1,
		max?: 1,
	): Promise<Error | T[number]>
	public async choose<T extends (number | string)[]>(
		prompt: string,
		options: T,
		min: number,
		max?: number,
	): Promise<Error | T[number][]>
	public async choose<T extends (number | string)[]>(
		prompt: string,
		options: T,
		min = 1,
		max = min,
	): Promise<Error | T[number] | T[number][]> {
		const isSingleChoice = min === 1 && max === 1
		if (options.length === 0) {
			if (isSingleChoice) {
				return new Error(
					`For prompt "${prompt}", exactly one option was required to be chosen, but no options were provided.`,
				)
			}
		}
		if (options.length === 1) {
			this.logger.warn(
				`For prompt: ${prompt}, options has only one option: "${options[0]}". Returning it.`,
			)
			return [options[0]]
		}
		if (min > max) {
			return new Error(
				`For prompt "${prompt}", a minimum of ${min} options must be chosen, but a maximum of ${max} options was specified. This is unachievable.`,
			)
		}
		const optionsString = options
			.map((option) => `- ${String(option)}`)
			.join(`\n`)
		let formattingInstruction: string
		if (min === max) {
			formattingInstruction = `choose exactly ${min} option${min === 1 ? `` : `s`} from the following list:`
		} else {
			formattingInstruction = `choose between ${min} and ${max} options from the following list:`
		}
		formattingInstruction += `\n\n${optionsString}`
		if (max === 1) {
			formattingInstruction += `\n\nANSWER: `
		} else {
			formattingInstruction += `\n\nformat your response as a numbered list, like this:`
			formattingInstruction += `\n`
			formattingInstruction += Array.from(
				{ length: max },
				(_, i) => `${i + 1}. choice ${i + 1}`,
			).join(`\n`)
			if (min !== max) {
				formattingInstruction += `\n\nremember, you can choose as few as ${min} option${min === 1 ? `` : `s`}, or as many as ${max} option${max === 1 ? `` : `s`}`
			}
			if (min === 0) {
				formattingInstruction += `\n\nto choose 0 options, only say "none"`
			}
			formattingInstruction += `\n\nRESPONSE:\n`
		}

		const response = await this.getCompletionSquirreled
			.for(`choose-${prompt}-FROM-${options.join(`-`)}`)
			.get({
				model: this.model,
				prompt: `${prompt}\n\n${formattingInstruction}`,
				max_tokens: 100,
			})

		console.log({ prompt, formattingInstruction, choices: response.choices })
		const text = response.choices[0].text.trim()
		if (isSingleChoice) {
			if (options.includes(text)) {
				return text
			}
			if (options.includes(Number(text))) {
				return Number(text)
			}
			return new Error(
				this.formatIssue(
					prompt,
					text,
					`"${text}" is not found among [${options.join(`, `)}]`,
				),
			)
		}
		if (text.toLowerCase() === `none`) {
			return []
		}
		const lines = text.split(`\n`)
		const filteredLines = lines.filter((line) => line.match(/^\d+\. /))
		console.log({ lines, filteredLines })
		const selections: T[number][] = []
		for (const line of filteredLines) {
			const cleanedLine = line.trim().split(`. `)[1]
			if (options.includes(cleanedLine)) {
				selections.push(cleanedLine)
			} else if (options.includes(Number(cleanedLine))) {
				selections.push(Number(cleanedLine))
			} else if (cleanedLine === `none`) {
			} else {
				this.formatIssue(
					prompt,
					cleanedLine,
					`"${cleanedLine}" is not found among [${options.join(`, `)}]`,
					`This element will not be included in the final result.`,
				)
			}
		}
		if (selections.length < min) {
			return new Error(
				`For prompt "${prompt}", at least ${min} options must be chosen, but ${selections.length} options were chosen.`,
			)
		}
		if (selections.length > max) {
			this.logger.warn(
				`For prompt "${prompt}", at most ${max} options must be chosen, but ${selections.length} options were chosen.`,
			)
			return selections.slice(0, max)
		}
		return selections
	}
}
