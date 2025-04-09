---
"safegen": patch
---

💥 Technically, there is a very small breaking change in this release to the standard schema functionality. Now, instead of passing a property `toJsonSchema` to the constructor of your `SafeGenerator`, pass the same property to the `.from()` method on a generator alongside `fallback` and `schema`.
