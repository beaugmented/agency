import { atom, atomFamily, getState, selector, setState } from "atom.io"
import { join } from "atom.io/data"
import type { stringified } from "atom.io/json"
import { parseJson } from "atom.io/json"
import { z } from "zod"

import { d } from "./traits"

export const playerX = atom<number>({ key: `playerX`, default: 0 })
export const playerY = atom<number>({ key: `playerY`, default: 0 })
export const playerZ = atom<number>({ key: `playerZ`, default: 0 })

export type Coordinates = z.infer<typeof coordinatesSchema>
export const coordinatesSchema = z.tuple([z.number(), z.number(), z.number()])
export const playerCoordinatesSelector = selector<Coordinates>({
	key: `playerCoordinates`,
	get: ({ get }) => {
		const px = get(playerX)
		const py = get(playerY)
		const pz = get(playerZ)
		return [px, py, pz]
	},
})

export const zoneExistsAtoms = atomFamily<boolean | null, Coordinates>({
	key: `zoneExists`,
	default: (coordinates) => !coordinates.some((c) => c) || null,
})

export function enterZone(coordinates: Coordinates) {
	const zoneExists = getState(zoneExistsAtoms, coordinates)
	if (zoneExists === true) {
		const numberExits = d(2) + 1

		const nCoords = [
			coordinates[0],
			coordinates[1] + 1,
			coordinates[2],
		] as Coordinates
		const sCoords = [
			coordinates[0],
			coordinates[1] - 1,
			coordinates[2],
		] as Coordinates
		const eCoords = [
			coordinates[0] + 1,
			coordinates[1],
			coordinates[2],
		] as Coordinates
		const wCoords = [
			coordinates[0] - 1,
			coordinates[1],
			coordinates[2],
		] as Coordinates
		const toActivate = [nCoords, sCoords, eCoords, wCoords]
			.filter((c) => getState(zoneExistsAtoms, c) === null)
			.sort(() => Math.random() - 0.5)
		let numberActivated = 4 - toActivate.length
		while (numberActivated < numberExits) {
			const willActivate = toActivate.shift()
			if (willActivate === undefined) {
				break
			}
			setState(zoneExistsAtoms, willActivate, true)
			numberActivated++
		}
	}
}

export const listExits = (coordinates: Coordinates) => {
	const exits: string[] = []

	const nCoords = [
		coordinates[0],
		coordinates[1] + 1,
		coordinates[2],
	] satisfies Coordinates
	const sCoords = [
		coordinates[0],
		coordinates[1] - 1,
		coordinates[2],
	] satisfies Coordinates
	const eCoords = [
		coordinates[0] + 1,
		coordinates[1],
		coordinates[2],
	] satisfies Coordinates
	const wCoords = [
		coordinates[0] - 1,
		coordinates[1],
		coordinates[2],
	] satisfies Coordinates

	if (getState(zoneExistsAtoms, nCoords) === true) {
		exits.push(`north`)
	}
	if (getState(zoneExistsAtoms, sCoords) === true) {
		exits.push(`south`)
	}
	if (getState(zoneExistsAtoms, eCoords) === true) {
		exits.push(`east`)
	}
	if (getState(zoneExistsAtoms, wCoords) === true) {
		exits.push(`west`)
	}
	return exits
}

const beingZones = join({
	key: `beingZones`,
	cardinality: `1:n`,
	between: [`zone`, `being`],
	isAType: (x): x is stringified<Coordinates> => {
		try {
			const json = parseJson(x)
			if (Array.isArray(json) && json.length === 3) {
				for (const element of json) {
					if (typeof element !== `number`) {
						return false
					}
				}
				return true
			}
		} catch (_) {}
		return false
	},
	isBType: (x): x is `being:${string}` => x.startsWith(`being:`),
})
