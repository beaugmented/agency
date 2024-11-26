test(`ollama`, async () => {
	const response = await fetch(`http://localhost:11434/api/generate`, {
		method: `POST`,
		headers: {
			"Content-Type": `application/json`,
		},
		body: JSON.stringify({
			model: `llama3.2:1b`,
			prompt: `What is the capital of New Zealand?`,
			stream: true,
			max_tokens: 1000,
			temperature: 0.5,
			top_p: 1,
			frequency_penalty: 0,
			presence_penalty: 0,
			stop: [`\n`],
			logprobs: 10,
		}),
	})

	if (!response.body) {
		throw new Error(`HTTP error! status: ${response.status}`)
	}
	// handle stream
	const reader = response.body.getReader()
	let data: string = []
	while (true) {
		const { done, value } = await reader.read()
		console.log(value)
		if (done) {
			break
		}
		data += new TextDecoder().decode(value)
	}

	console.log(data)
})
