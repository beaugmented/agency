import type { Json } from "atom.io/json"
import type { GenerateRequest } from "ollama"
import { Ollama } from "ollama"

export const ollamaClientCache = new Map<string, Ollama>()

export type GetUnknownJsonFromOllama = (
	body: GenerateRequest & { stream: false },
) => Promise<{ data: Json.Object; usdPrice: number }>

export function setUpOllamaJsonGenerator(): GetUnknownJsonFromOllama {
	return async function getUnknownJsonFromOllama(body) {
		let ollamaClient = ollamaClientCache.get(`ollama`)
		if (!ollamaClient) {
			ollamaClient = new Ollama()
			ollamaClientCache.set(`ollama`, ollamaClient)
		}
		const completion = await ollamaClient.generate(body)
		const { response } = completion

		let data: Json.Object
		try {
			data = JSON.parse(response)
		} catch (error) {
			data = {}
		}
		return { data, usdPrice: 0 }
	}
}
