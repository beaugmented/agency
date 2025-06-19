---
"safegen": minor
---

✨ Added three new experimental features for non-object safe data generation.

- `SafeGenerator.boolean(prompt)`: Generates a boolean value from a prompt, e.g. `"Is the sky blue?"` → `true`
- `SafeGenerator.number(prompt, min, max)`: Generates a number from a prompt, e.g. `"How many planets are in the solar system?"` → `8`
- `SafeGenerator.choose(prompt, options, min, max)`: Generates a value from a list of options from a prompt, e.g. `"Which of the following animals are mammals?"` → `lion`

These features are supported in all available generators, and show promise with small models.

However, they are still experimental and may change in the future.
