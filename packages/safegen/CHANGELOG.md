# @beaugmented/agency

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
