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
		if (cachingMode !== `read`) {
			if (!client) {
				client = new OpenAI({
					apiKey,
					dangerouslyAllowBrowser: process.env.NODE_ENV === `test`,
				})
				clientCache.set(apiKey, client)
			}
			this.client = client
		}
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

	public async boolean(prompt: string): Promise<boolean> {
		const response = await this.getCompletionSquirreled
			.for(`boolean-${prompt}`)
			.get({
				model: this.model,
				prompt: `${prompt} [respond either 'y' or 'n' only]`,
				max_tokens: 1,
			})
		const text = response.choices[0].text.trim().toLowerCase()
		if (text === `y`) {
			return true
		}
		if (text === `n`) {
			return false
		}
		this.logger.error(`Invalid response: ${text}`)
		return false
	}

	public async number(
		prompt: string,
		min: number,
		max: number,
	): Promise<number> {
		if (min > max) {
			throw new Error(`min must be less than max`)
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
			this.logger.error(`Invalid response: ${text}`)
			return 0
		}
		return number
	}

	public async choose<T extends (number | string)[]>(
		prompt: string,
		options: T,
		min?: 1,
		max?: 1,
	): Promise<T[number]>
	public async choose<T extends (number | string)[]>(
		prompt: string,
		options: T,
		min: number,
		max: number,
	): Promise<T[number][]>
	public async choose<T extends (number | string)[]>(
		prompt: string,
		options: T,
		min = 1,
		max = min,
	): Promise<T[number] | T[number][]> {
		if (options.length === 0) {
			throw new Error(`options must not be empty`)
		}
		if (options.length === 1) {
			this.logger.warn(`options has only one option`)
			return [options[0]]
		}
		if (min > max) {
			throw new Error(`min must be less than max`)
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
		if (max > 1) {
			formattingInstruction += `\n\nformat your response as a numbered list, like this:`
			formattingInstruction += Array.from(
				{ length: max },
				(_, i) => `${i + 1}. choice ${i + 1}`,
			).join(`\n`)
			if (min !== max) {
				formattingInstruction += `\n\nremember, you can choose as few as ${min} option${min === 1 ? `` : `s`}, or as many as ${max} option${max === 1 ? `` : `s`}`
			}
			formattingInstruction += `\n\n--\n\n`
		} else {
			formattingInstruction += `\n\nAnswer: `
		}

		const response = await this.getCompletionSquirreled
			.for(`choose-${prompt}`)
			.get({
				model: this.model,
				prompt: `${prompt}\n\n${formattingInstruction}`,
				max_tokens: 100,
			})

		console.log({ response })
		if (min === 1 && max === 1) {
			const text = response.choices[0].text.trim()
			if (options.includes(text)) {
				return text
			}
			if (options.includes(Number(text))) {
				return Number(text)
			}
			this.logger.warn(`Invalid response: ${text}`)
			return options[0]
		}
		const text = response.choices[0].text.trim()
		const lines = text.split(`\n`)
		const selections: T[number][] = []
		for (const line of lines) {
			const cleanedLine = line.trim().split(`. `)[1]
			console.log({ cleanedLine })
			if (options.includes(cleanedLine)) {
				selections.push(cleanedLine)
			} else if (options.includes(Number(cleanedLine))) {
				selections.push(Number(cleanedLine))
			} else {
				this.logger.warn(`Invalid response: ${text}`)
			}
		}
		return selections
	}
}
