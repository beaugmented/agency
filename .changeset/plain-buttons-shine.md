---
"safegen": patch
---

🐛 Safegen just got even safer. Previously, when errors occurred with model providers like OpenAI, Anthropic, or Google, those errors would be propagated (thrown). Now, they are caught and logged, and will resultin fallback data.
