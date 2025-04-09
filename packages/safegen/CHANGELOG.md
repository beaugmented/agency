# @beaugmented/agency

## 0.2.14

### Patch Changes

- 6e32b44: 💥 Technically, there is a very small breaking change in this release to the standard schema functionality. Now, instead of passing a property `toJsonSchema` to the constructor of your `SafeGenerator`, pass the same property to the `.from()` method on a generator alongside `fallback` and `schema`.
- 6e32b44: 🐛 Fix issue where due to incorrect application of generic typing in the `GenerateFromSchema` type, safegen would only infer the type of a generator from its `fallback` value, not its `schema` value.

## 0.2.13

### Patch Changes

- c632c83: ✨ Support standard schema. Just set the key toJsonSchema in the options when constructing your SafeGenerator, and for the value supply a function that transforms a schema from your vendor of choice to a Json Schema.
- c632c83: ✨ `safegen/arktype` exports the convenience function `arktypeToJsonSchema`.

## 0.2.12

### Patch Changes

- 4abccf3: 🐛 Support superlong cache keys with varmint v0.4.3.

## 0.2.11

### Patch Changes

- cbae408: ⬆️ Upgrade varmint to v0.4.0.

## 0.2.10

### Patch Changes

- 61775a5: ⬆️ Update dependency varmint to v0.3.11

## 0.2.9

### Patch Changes

- fdfe9dc: ⬆️ Upgrade varmint to v0.3.9, including the global workspace features.

## 0.2.8

### Patch Changes

- f66ef78: 🔧 Add repository field to package manifests to support tools like renovate.

## 0.2.7

### Patch Changes

- 5959f36: ⬆️ Update dependency varmint to v0.3.7

## 0.2.6

### Patch Changes

- 77d4807: ⬆️ Update dependency varmint to v0.3.6

## 0.2.5

### Patch Changes

- 57fa3b3: ⬆️ Upgrade dependency varmint to v0.3.5

## 0.2.4

### Patch Changes

- a6bd009: ✨ `OpenAiSafeGenerator` and `AnthropicSafeGenerator` now include usage data in the type of their respective API clients stored as the property `lastUsage`.

## 0.2.3

### Patch Changes

- ec25167: 🐛 Fix bug where the client for openai or anthropic would not be attached to the safe generator if a client had already been created with that api key.

## 0.2.2

### Patch Changes

- 2f81003: 🐛 Include CHANGELOG.md in the package for messages like these!

## 0.2.1

### Patch Changes

- c3a44c8: ✨ `OpenAiSafeGenerator`, `AnthropicSafeGenerator`, and `OllamaSafeGenerator` now each include a `client` property with the type of their respective SDK client.

## 0.2.0

### Minor Changes

- f0c09d1: 💥 BREAKING CHANGE: Safegen now requires `zod` and `zod-to-json-schema` to be installed as peers.

## 0.1.5

### Patch Changes

- 16c1d90: 🏷️ Update `zod` to `3.24.0`.

## 0.1.4

### Patch Changes

- fd1435f: 🏷️ Add the `SafeGenerator` interface for custom implementations.
- fd1435f: ✨ Add `safegen/ollama` module for using local models.
- fd1435f: 🐛 Actually exported the anthropic module.
- fd1435f: 🚀 Reduce bundle size by properly excluding dependencies.

## 0.1.3

### Patch Changes

- 018de54: ✨ Add `safegen/anthropic` module for using claude.

## 0.1.2

### Patch Changes

- d98630f: ✨ The `OpenAISafeGenerator` class now takes an option `cacheKey` to control the name of the folder that responses are cached to.

## 0.1.1

### Patch Changes

- 3dc2d57: 🚀 `safegen/openai` now takes advantage of OpenAI's cached input tokens cost optimization by default by placing the unchanging response schema first in the prompt.
- 6320972: 🐛 Remove node version stipulation from safegen's engines field.

## 0.1.0

### Minor Changes

- a6d2674: Only allow openai models we have pricing data for

## 0.0.5

### Patch Changes

- 325dc93: ♻️ Internal updates to establish semantic versioning testing.

## 0.0.4

### Patch Changes

- 7aade89: ✨ OpenAiSafeGenerator now includes a `cachingMode` option to allow developers to cache or not on depending on environmental cues.

## 0.0.3

### Patch Changes

- 9263929: 💥 Renamed option `usdFloor` to `usdMinimum`. This is the amount of money below which no further API requests will be made.
- 9263929: ✨ Pass a custom `logger` in the `OpenAiSafegenOptions`.

## 0.0.2

### Patch Changes

- bd165de: ✨ Improved file caching.

## 0.0.1

### Patch Changes

- b7b23b7: ✨ Add a way to designate a budget for your data generator.
  - Added a budget management feature to the OpenAiSafeGenerator class, allowing users to set and monitor a budget for API usage.
  - Introduced OPEN_AI_PRICING_FACTS to define pricing details for different OpenAI models.
  - Updated the setup function to calculate and return the cost of API calls based on token usage.
  - Enhanced tests to verify the new budget feature, ensuring budget is deducted correctly after API calls.
  - Documented the changes in a new changeset file.

## 0.0.1

### Patch Changes

- 6dd39f1: 🎉 First feature release, including the `Grunt` agent and the `evaluateAgentResponse` testing function.
