import type { Json } from "atom.io/json"
import type { ChatRequest, GenerateRequest } from "ollama"
import { Ollama } from "ollama"

export const ollamaClientCache = new Map<string, Ollama>()

export type GetUnknownJsonFromOllama = (
	body: ChatRequest & { stream: false },
) => Promise<{ data: Json.Object; usdPrice: number }>

export function setUpOllamaJsonGenerator(): GetUnknownJsonFromOllama {
	return async function getUnknownJsonFromOllama(body) {
		let ollamaClient = ollamaClientCache.get(`ollama`)
		if (!ollamaClient) {
			ollamaClient = new Ollama()
			ollamaClientCache.set(`ollama`, ollamaClient)
		}
		const completion = await ollamaClient.chat(body)
		const { message } = completion

		let data: Json.Object
		try {
			data = JSON.parse(message.content)
		} catch (error) {
			data = {}
		}
		return { data, usdPrice: 0 }
	}
}
