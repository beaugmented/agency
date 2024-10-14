# @beaugmented/agency

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
