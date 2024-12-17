import type { Json } from "atom.io/json"
import type { GenerateRequest, Ollama } from "ollama"

export type GetUnknownJsonFromOllama = (
	body: GenerateRequest & { stream: false },
) => Promise<{ data: Json.Object; usdPrice: number }>

export function setUpOllamaJsonGenerator(
	client?: Ollama,
): GetUnknownJsonFromOllama {
	return async function getUnknownJsonFromOllama(body) {
		if (!client) {
			throw new Error(
				`This is a bug in safegen. Ollama client not available to the json generator.`,
			)
		}
		const completion = await client.generate(body)
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
