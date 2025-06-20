---
"safegen": patch
---

🏷️ Made the `min` parameter representing the minimum number of selections in the `SafeGenerator.choose()` method optional in all overloads. This will fix type errors where various generator classes were being seen as incompatible with the SafeGenerator interface.
