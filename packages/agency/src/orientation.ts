import { atomFamily } from "atom.io"

export const orientationAtoms = atomFamily<string, string>({
	key: `orientation`,
	default: `You are an AI assistant designed to assist with tasks.`,
})
