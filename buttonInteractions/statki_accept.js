'use strict'

const { statki, shotState } = require('../lib/statkiManager')

/**
 * Generate 2D Array initalized with appropriate cell data
 */
function createBoard() {
	const shotsMatrix = new Array(10)
	for (let i = 0; i < 10; i++) {
		shotsMatrix[i] = new Array(10)
		for (let j = 0; j < 10; j++)
			shotsMatrix[i][j] = shotState.NOT_SHOT
	}
	return shotsMatrix
}

/**
 * Generate Ships
 * @param {[]} sizes
 */
function createShips(sizes) {
	const ships = {}
	let id = 0
	for (const item of sizes) {
		ships[`id${id}`] = {
			placed: false,
			initialSize: item,
			sizeLeft: item,
			x: null,
			y: null,
			orientation: null,
		}
		id++
	}
	return ships
}

module.exports = {
	name: 'statki_accept',
	async execute(buttonInteraction) {
		const challengerUserId = buttonInteraction.customId.split('#')[1]
		const challengedUserId = buttonInteraction.user.id
		if (statki.pendingChallenges.get(challengerUserId).userId !== challengedUserId) {
			await buttonInteraction.reply({ content: 'To nie jest twoje zaproszenie.', ephemeral: true })
			return
		}
		if (statki.userGamesMap.has(challengerUserId)) {
			await buttonInteraction.reply({ content: 'NIE POWINIENEŚ TEGO WIDZIEĆ! Osoba, która cię wyzwała już jest w grze...', ephemeral: true })
			return
		}
		if (statki.userGamesMap.has(challengedUserId)) {
			await buttonInteraction.reply({ content: 'NIE POWINIENEŚ TEGO WIDZIEĆ! Nie możesz akceptować nowych wyzwań jak jesteś już w grze!', ephemeral: true })
			return
		}
		statki.pendingChallenges.delete(challengerUserId)
		statki.userGamesMap.set(challengerUserId, buttonInteraction.message.id)
		statki.userGamesMap.set(challengedUserId, buttonInteraction.message.id)
		statki.gameState.set(buttonInteraction.message.id, {
			turn: challengerUserId,
			player1: {
				id: challengerUserId,
				ephemeralMessage: null,
				shipsLeft: 7,
				ships: createShips([5, 4, 3, 2, 2, 1, 1]),
				board: createBoard(),
				shotsHistory: [
					/**
					 * x: number
					 * y: number
					 * hit: boolean
					 */
				],
			},
			player2: {
				id: challengedUserId,
				ephemeralMessage: null,
				shipsLeft: 7,
				ships: createShips([5, 4, 3, 2, 2, 1, 1]),
				board: createBoard(),
				shotsHistory: [],
			},
		})
		buttonInteraction.update({
			content: `Gra rozpoczęta!
			Użyjcie komedy \`/statki plansza\` aby zobaczyć swoją planszę na której możecie rozkładać swoje statki.
			Ostrzał się rozpocznie gdy oboje gracze ułożą swoje statki.`.replace('\t', ''),
			components: [],
		})
	},
}