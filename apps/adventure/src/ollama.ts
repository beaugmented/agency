import { OllamaSafeGenerator } from "safegen/ollama"

export const ollamaGen = new OllamaSafeGenerator({
	usdBudget: 0.01,
	usdMinimum: 0.00_01,
	model: `llama3.2`,
	cachingMode: `read-write`,
	//  process.env.CI
	// 	? `read`
	// 	: process.env.NODE_ENV === `production`
	// 		? `off`
	// 		: `read-write`,
	logger: console,
})
