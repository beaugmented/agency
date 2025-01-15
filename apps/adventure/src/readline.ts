import type { Interface } from "node:readline"
import { createInterface } from "node:readline"

export const readline: Interface = (() => {
	let { __readline: readlineInterface } = globalThis as unknown as {
		__readline: Interface
	}
	if (!readlineInterface) {
		console.clear()
		readlineInterface = globalThis.__readline = createInterface({
			input: process.stdin,
			output: process.stdout,
		})
	}
	return readlineInterface
})()

// function getTerminalSize() {
// 	const { columns, rows } = process.stdout
// 	return { x: columns, y: rows }
// }

// process.stdout.on(`resize`, () => {
// 	console.clear()
// 	// console.log(getTerminalSize())
// 	function drawHorizontalLine(y, startX, endX) {
// 		process.stdout.cursorTo(startX, y)
// 		process.stdout.write(`─`.repeat(endX - startX + 1))
// 	}

// 	function drawVerticalLine(x, startY, endY) {
// 		for (let y = startY; y <= endY; y++) {
// 			process.stdout.cursorTo(x, y)
// 			process.stdout.write(`│`)
// 		}
// 	}

// 	function drawBox(startX, startY, width, height) {
// 		const endX = startX + width - 1
// 		const endY = startY + height - 1

// 		// Draw corners
// 		process.stdout.cursorTo(startX, startY)
// 		process.stdout.write(`┌`)
// 		process.stdout.cursorTo(endX, startY)
// 		process.stdout.write(`┐`)
// 		process.stdout.cursorTo(startX, endY)
// 		process.stdout.write(`└`)
// 		process.stdout.cursorTo(endX, endY)
// 		process.stdout.write(`┘`)

// 		// Draw edges
// 		drawHorizontalLine(startY, startX + 1, endX - 1) // Top edge
// 		drawHorizontalLine(endY, startX + 1, endX - 1) // Bottom edge
// 		drawVerticalLine(startX, startY + 1, endY - 1) // Left edge
// 		drawVerticalLine(endX, startY + 1, endY - 1) // Right edge
// 	}

// 	function drawScreen() {
// 		const { columns, rows } = process.stdout

// 		console.clear()

// 		const halfWidth = Math.floor(columns / 2)
// 		const boxHeight = Math.floor(rows - 2) // Leave room for padding

// 		// Draw left box
// 		drawBox(1, 1, halfWidth - 1, boxHeight)

// 		// Draw right box
// 		drawBox(halfWidth + 1, 1, halfWidth - 1, boxHeight)

// 		// Optional: Add labels or content
// 		process.stdout.cursorTo(2, 2)
// 		process.stdout.write(`Left Box`)
// 		process.stdout.cursorTo(halfWidth + 2, 2)
// 		process.stdout.write(`Right Box`)
// 	}

// 	// Draw the screen
// 	drawScreen()

// 	// Listen for resize events to redraw the boxes
// 	process.stdout.on(`resize`, drawScreen)
// })
