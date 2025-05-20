# Safegen

Generate well-formed data from Large Language Models (LLMs) without encountering `TypeError`s, leveraging the power of [Zod](https://github.com/colinhacks/zod) and `zod-to-json-schema`.

## Features

- **Type Safety**: Ensure data from LLMs conforms to your defined schemas.
- **Budget Control**: Set a real USD budget before running queries using `OpenAiSafeGenerator`.
- **Caching**: Automatically cache AI generations during test-time to avoid unnecessary API costs and flaky CI outcomes.

## Installation

```bash
npm install safegen
```

## Quick Start

```typescript
import { z } from "zod/v4";
import { OpenAiSafeGenerator } from "safegen/openai";

// Initialize the generator with your OpenAI API key and budget
const gptGenerator = new OpenAiSafeGenerator({
  usdBudget: 0.01,
  usdMinimum: 0.0001,
  model: "gpt-4",
  apiKey: process.env.OPENAI_API_KEY,
});

// Define the schema for the expected response
const countSpec = {
  schema: z.object({ count: z.number() }),
  fallback: { count: 0 },
};

// Create a generator function based on the schema
const counter = gptGenerator.from(countSpec);

// Use the generator to get data from the LLM
const { count: numberOfPlanets } = await counter(
  "How many planets are in the solar system?"
);

console.log(`There are ${numberOfPlanets} planets in the solar system.`);
// Output: There are 8 planets in the solar system.
```

In this example:

- **Schema Definition**: We use Zod to define the expected shape of the data.
- **Safe Generation**: Safegen ensures the response matches the schema or provides a fallback.
- **Budget Control**: The generator respects the set budget for API calls.

## License

MIT License
