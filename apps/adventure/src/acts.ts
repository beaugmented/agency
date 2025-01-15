import type { Tree, TreePath } from "treetrunks"
import { isTreePath, optional, required } from "treetrunks"
export const ACTS = {
	go: `"go <direction>": travel in a direction (possible directions: north, east, south, or west)`,
	take: `"take <item>": put an item from the environment into the inventory / "take <item> from <being>": put an item from a being into the inventory`,
	look: `"look": observe the environment / "look <item>": observe an item / "look <being>": observe a being`,
	exit: `"exit": quit the game`,
	try: `"try <complete sentence>": try to do something`,
} satisfies Record<keyof (typeof ACT_SPEC)[1], string>

export const ACT_SPEC = required({
	go: required({
		north: null,
		east: null,
		south: null,
		west: null,
	}),
	take: required({
		$item: null,
	}),
	look: optional({
		$item: null,
	}),
	exit: optional({
		$item: null,
	}),
	try: optional({
		$item: null,
	}),
}) satisfies Tree
export type Act = TreePath<typeof ACT_SPEC>
export type ActName = Act[number]

export function isAct(act: unknown[]): act is Act {
	return isTreePath(ACT_SPEC, act)
}

export const ENTITIES = {
	act: `an action you can take in the game`,
	being: `a living being you can interact with`,
	item: `an object you can take from the environment`,
	zone: `a location you can travel to. items and beings can be found in zones.`,
}
export type EntityTypeName = keyof typeof ENTITIES

export const DICTIONARY = {
	acts: ACTS,
	entities: ENTITIES,
}
