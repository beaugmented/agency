import { createSafeDataGenerator } from "../safegen"
import { buildOpenAiRequestParams } from "./build-open-ai-request-params"
import type { OPEN_AI_PRICING_FACTS } from "./pricing-facts"
import { setUpOpenAiJsonGenerator } from "./set-up-open-ai-generator"

let getUnknownJsonFromOpenAi: ReturnType<typeof setUpOpenAiJsonGenerator>
export const openaiSafeGen = (
	model: keyof typeof OPEN_AI_PRICING_FACTS,
	apiKey: string,
) =>
	createSafeDataGenerator((...params) => {
		if (!getUnknownJsonFromOpenAi) {
			getUnknownJsonFromOpenAi = setUpOpenAiJsonGenerator(apiKey)
		}
		const openAiParams = buildOpenAiRequestParams(model, ...params)
		return getUnknownJsonFromOpenAi(openAiParams)
	})
