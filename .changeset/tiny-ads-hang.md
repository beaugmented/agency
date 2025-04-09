---
"safegen": patch
---

🐛 Fix issue where due to incorrect application of generic typing in the `GenerateFromSchema` type, safegen would only infer the type of a generator from its `fallback` value, not its `schema` value.
