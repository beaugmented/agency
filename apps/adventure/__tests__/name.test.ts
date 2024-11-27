import { getState } from "atom.io"

import { nameSelectors, traitScoresAtoms } from "../src/traits"

test(`name`, async () => {
	for (let i = 0; i < 10; i++) {
		const traitScores = getState(traitScoresAtoms, [0, 0, i])
		const name = await getState(nameSelectors, [0, 0, i])
		console.log({
			traitScores,
			name,
		})
	}
})
