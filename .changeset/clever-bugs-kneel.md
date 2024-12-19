---
"safegen": patch
---

🐛 Fix bug where the client for openai or anthropic would not be attached to the safe generator if a client had already been created with that api key.
