import type { ChatModel } from "openai/resources/index.mjs"
import { Squirrel } from "varmint"

import { createSafeDataGenerator } from "../safegen"
import { buildOpenAiRequestParams } from "./build-open-ai-request-params"
import { setUpOpenAiJsonGenerator } from "./open-ai-client"

/* eslint-disable @typescript-eslint/no-explicit-any */
// biome-ignore lint/suspicious/noExplicitAny: here it's really the type of a function
export type AsyncFn = (...params: any[]) => Promise<any>
/* eslint-enable @typescript-eslint/no-explicit-any */

export type Squirreled<Fn extends AsyncFn> = ReturnType<typeof squirrel.add<Fn>>
let squirrel: Squirrel
let getUnknownJsonFromOpenAi: ReturnType<typeof setUpOpenAiJsonGenerator>
let getUnknownJsonFromOpenAiCached: Squirreled<typeof getUnknownJsonFromOpenAi>

export const openaiSafeGenCached = (model: ChatModel, apiKey: string) =>
	createSafeDataGenerator(async (...params) => {
		if (!squirrel) {
			squirrel = new Squirrel(
				process.env.CI
					? `read`
					: process.env.NODE_ENV === `production`
						? `off`
						: `read-write`,
			)
			getUnknownJsonFromOpenAi = setUpOpenAiJsonGenerator(apiKey)
			getUnknownJsonFromOpenAiCached = squirrel.add(
				`openai-safegen`,
				getUnknownJsonFromOpenAi,
			)
		}

		const openAiParams = buildOpenAiRequestParams(model, ...params)
		const instruction = params[0]
		const previouslyFailedResponses = params[3]
		const response = await getUnknownJsonFromOpenAiCached
			.for(
				`${instruction.replace(/[^a-zA-Z0-9-_. ]/g, `_`)}-${previouslyFailedResponses.length}`,
			)
			.get(openAiParams)
		return response
	})
