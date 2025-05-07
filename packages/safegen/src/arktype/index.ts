import type { JsonSchema, Type } from "arktype"

export function arktypeToJsonSchema(type: Type): JsonSchema {
	return type.toJsonSchema()
}
