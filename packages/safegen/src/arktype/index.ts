import type { Type } from "arktype"

export function arktypeToJsonSchema(type: Type) {
	return type.toJsonSchema()
}
