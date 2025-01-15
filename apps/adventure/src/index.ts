import { atom, getState, setState } from "atom.io"
import { z } from "zod"

import { ACTS, isAct } from "./acts"
import { spawnBeing } from "./beings"
import { ollamaGen } from "./ollama"
import { readline } from "./readline"
import { nameSelectors } from "./traits"
import {
	enterZone,
	listExits,
	playerCoordinatesSelector,
	playerX,
	playerY,
} from "./zones"

const inputModeAtom = atom<`confirm` | `prompt`>({
	key: `inputMode`,
	default: `prompt`,
})

// Game logic and user commands
const handleCommand = async (command: string): Promise<void> => {
	let act = command.trim().toLowerCase().split(` `)
	if (act[0] === `spawn`) {
		spawnBeing()
	}
	if (act[0] === `try`) {
		console.log(`Thinking about that...`)
		const { examples } = await ollamaGen.from({
			schema: z.object({ examples: z.array(z.string()) }),
			fallback: { examples: [] },
		})(
			`Here are all the possible actions: ${JSON.stringify(ACTS, null, 2)}\n\n Come up with some examples using this knowledge`,
		)
		const { interpretation } = await ollamaGen.from({
			schema: z.object({ interpretation: z.string() }),
			fallback: { interpretation: `` },
		})(
			`Please interpret the following intention as an action: ${act.slice(1).join(` `)}\n\nHere is the schema describing the possible actions: ${JSON.stringify(
				ACTS,
				null,
				2,
			)}\n\nHere are some example commands: ${examples.join(`\n`)}\n\nWhat is the intention of the above command?`,
		)
		console.log(`I guess you want to: "${interpretation}"`)
		act = interpretation.split(` `)
	}
	if (isAct(act)) {
		switch (act[0]) {
			case `try`:
				{
				}
				break

			case `look`:
				{
					const coordinates = getState(playerCoordinatesSelector)
					const name = await getState(nameSelectors, coordinates)
					const exits = listExits(coordinates)
					console.log(`You are in ${name}.`)
					console.log(`Exits are: ${exits.join(`, `)}`)
				}
				break

			case `take`:
				break

			case `go`:
				{
					const direction = act[1]
					const initialCoordinates = getState(playerCoordinatesSelector)
					const initialExits = listExits(initialCoordinates)
					if (!initialExits.includes(direction)) {
						console.log(`You can't go that way.`)
						break
					}
					console.log(`You walk ${direction}.`)
					switch (direction) {
						case `north`:
							setState(playerY, (prev) => prev + 1)
							break
						case `east`:
							setState(playerX, (prev) => prev + 1)
							break
						case `west`:
							setState(playerX, (prev) => prev - 1)
							break
						case `south`:
							setState(playerY, (prev) => prev - 1)
							break
					}
					const coordinates = getState(playerCoordinatesSelector)
					enterZone(coordinates)
					const name = await getState(nameSelectors, coordinates)
					const exits = listExits(coordinates)
					console.log(`You are in ${name}.`)
					console.log(`Exits are: ${exits.join(`, `)}`)
				}
				break

			case `exit`:
				console.log(`Goodbye, adventurer!`)
				readline.close()
				return
		}
	} else {
		console.log(`I don't understand that command.`)
	}
	prompt()
}

// Prompt user for input
const prompt = (): void => {
	readline.question(`> `, async (input) => {
		await handleCommand(input)
	})
}

// Start the game
console.log(`Welcome to the adventure! Type "look" to get started.`)
enterZone(getState(playerCoordinatesSelector))
prompt()
