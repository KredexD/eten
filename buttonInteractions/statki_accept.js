'use strict'

const { MessageActionRow, MessageButton } = require('discord.js')
const { statkiManager, statkiCellState, statkiGameState } = require('../lib/statkiManager')

/**
 * Generate 2D Array initalized with appropriate cell data
 */
function createBoard() {
	const shotsMatrix = new Array(10)
	for (let i = 0; i < 10; i++) {
		shotsMatrix[i] = new Array(10)
		for (let j = 0; j < 10; j++)
			shotsMatrix[i][j] = { shot: statkiCellState.NOT_SHOT, ship: null }
	}
	return shotsMatrix
}

/**
 * Generate Ships
 * @param {[]} sizes
 */
function createShips(sizes) {
	const ships = {}
	let id = 1
	for (const item of sizes) {
		ships[id] = {
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
		if (statkiManager.pendingChallenges.get(challengerUserId).userId !== challengedUserId) {
			await buttonInteraction.reply({ content: 'Nie możesz tego zrobić.', ephemeral: true })
			return
		}
		if (statkiManager.userGamesMap.has(challengerUserId)) {
			await buttonInteraction.reply({ content: 'NIE POWINIENEŚ TEGO WIDZIEĆ! Osoba, która cię wyzwała już jest w grze...', ephemeral: true })
			return
		}
		if (statkiManager.userGamesMap.has(challengedUserId)) {
			await buttonInteraction.reply({ content: 'NIE POWINIENEŚ TEGO WIDZIEĆ! Nie możesz akceptować nowych wyzwań jak jesteś już w grze!', ephemeral: true })
			return
		}
		// Remove challenge
		statkiManager.pendingChallenges.delete(challengerUserId)
		// Set both players as in-game
		statkiManager.userGamesMap.set(challengerUserId, buttonInteraction.message.id)
		statkiManager.userGamesMap.set(challengedUserId, buttonInteraction.message.id)
		// Create the initial game data
		statkiManager.gameDataMap.set(buttonInteraction.message.id, {
			state: statkiGameState.PREPLANNING,
			turn: challengerUserId,
			player1: {
				id: challengerUserId,
				ephemeralMessage: null,
				shipsLeft: 7,
				ships: createShips([5, 4, 3, 2, 2, 1, 1]),
				selectedShip: null,
				board: createBoard(),
				// shotsHistory: [
				// 	/**
				// 	 * x: number
				// 	 * y: number
				// 	 * hit: boolean
				// 	 */
				// ],
			},
			player2: {
				id: challengedUserId,
				ephemeralMessage: null,
				shipsLeft: 7,
				ships: createShips([5, 4, 3, 2, 2, 1, 1]),
				selectedShip: null,
				board: createBoard(),
				// shotsHistory: [],
			},
		})

		const board = new MessageActionRow()
			.setComponents(
				new MessageButton()
					.setCustomId('statki_board')
					.setLabel('Ustaw statki')
					.setStyle('PRIMARY'),
			)
		buttonInteraction.update({
			content: '**<:hard:884234129363836928> Gra rozpoczęta! <:hard:884234129363836928>**\nRozstawiaj statki!\nOstrzał się rozpocznie gdy oboje gracze będą gotowi.',
			components: [board],
		})
	},
}