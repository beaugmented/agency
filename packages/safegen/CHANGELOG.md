# safegen

## 0.8.6

### Patch Changes

- 6feb78e: ✨ Added pricing facts for OpenAI GPT-5.4 and GPT-5.3-chat-latest.

## 0.8.5

### Patch Changes

- 5914d1d: ✨ Added pricing facts for Claude 4.6 models.

## 0.8.4

### Patch Changes

- d4bd746: 🛸 Added `inference_geo` to `AnthropicSafeGenerator`'s `lastUsage` property.

## 0.8.3

### Patch Changes

- 24b3d01: ✨ Added support for OpenAI's GPT 5.2- series models.

## 0.8.2

### Patch Changes

- d8585fc: ✨ Added support for OpenAI's GPT 5.1- series models.
- d8585fc: 🛸 Updated pricing facts with current data. The `gpt-4.1` series and `o3` have both had their prices significantly reduced.

## 0.8.1

### Patch Changes

- ba526bc: ⬆️ Upgrade command-line parser, allowing for zod 4+ to be used without warnings.

## 0.8.0

### Minor Changes

- 60574ec: ✨ Support Claude Sonnet 4.5

## 0.7.0

### Minor Changes

- 652858c: ⬆️ Set the version requirement for `@anthropic-ai/sdk` to `>=0.60.0`.
- 652858c: ⬆️ Set the version requirement for `@google/genai` to `^1.13.0`.

## 0.6.4

### Patch Changes

- b77e90d: ⬆️ Upgrade `varmint`.

## 0.6.3

### Patch Changes

- 3de660b: ✨ Add GPT-5 pricing; update pricing for other models.

## 0.6.2

### Patch Changes

- 1f351a6: 🐛 Safegen just got even safer. Previously, when errors occurred with model providers like OpenAI, Anthropic, or Google, those errors would be propagated (thrown). Now, they are caught and logged, and will resultin fallback data.

## 0.6.1

### Patch Changes

- 67c1729: 🏷️ Made the `min` parameter representing the minimum number of selections in the `SafeGenerator.choose()` method optional in all overloads. This will fix type errors where various generator classes were being seen as incompatible with the SafeGenerator interface.

## 0.6.0

### Minor Changes

- 88d2347: ✨ Added three new experimental features for non-object safe data generation.

  - `SafeGenerator.boolean(prompt)`: Generates a boolean value from a prompt, e.g. `"Is the sky blue?"` → `true`
  - `SafeGenerator.number(prompt, min, max)`: Generates a number from a prompt, e.g. `"How many planets are in the solar system?"` → `8`
  - `SafeGenerator.choose(prompt, options, min, max)`: Generates a value from a list of options from a prompt, e.g. `"Which of the following animals are mammals?"` → `lion`

  These features are supported in all available generators, and show promise with small models.

  However, they are still experimental and may change in the future.

## 0.5.0

### Minor Changes

- 0008fc5: 💥 Requires `openai@^5.0.0`.

## 0.4.1

### Patch Changes

- 8d001b2: ⬆️ Upgrade varmint, fixing possible bug with invalid filenames.

## 0.4.0

### Minor Changes

- 4347f94: ⬆️ Require `zod/v4`. (Included in `zod@^3.25.0`.)

## 0.3.6

### Patch Changes

- bb338c5: ⬆️ Set minimum version of `openai` to `4.99.0`.
- bb338c5: ✨ Added pricing facts for `codex-mini-latest`.

## 0.3.5

### Patch Changes

- 3950c08: 🐛 Replaced reference to internal type in the Anthropic SDK with a reference to the public export of that same type.

## 0.3.4

### Patch Changes

- 999cacc: ♻️ Replaced build vendor `tsup` with `tsdown`.

## 0.3.3

### Patch Changes

- 923125c: ✨ Updated price sheet for Google with new models. Future updates to the the Google SDK that include new models will result in updates to SafeGen.

## 0.3.2

### Patch Changes

- 72e1c2c: ✨ Updated price sheet for Anthropic with new models. Future updates to the the Anthropic SDK that include new models will result in updates to SafeGen.

## 0.3.1

### Patch Changes

- 58b7244: ✨ Updated price sheet for OpenAI with new models. Future updates to the OpenAI SDK that include new models will result in updates to SafeGen.

## 0.3.0

### Minor Changes

- 80a2ae4: 💥 BREAKING CHANGE: Update to varmint 0.5.0, which shortens the filenames used to cache inputs and outputs.

## 0.2.16

### Patch Changes

- 089a88c: ✨ Add `safegen/google` module for using gemini. For now, we support only `gemini-2.0-flash-001`.

## 0.2.15

### Patch Changes

- ecf9d4a: 🐛 Add `standard-schema/spec` to dependencies, in order to fix type issues.
- ecf9d4a: 🐛 Add optional peer dependencies for `arktype`, `ollama`, `zod`, and `zod-to-json-schema`.

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
