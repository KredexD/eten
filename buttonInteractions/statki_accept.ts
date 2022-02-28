'use strict'

const { MessageActionRow, MessageButton } = require('discord.js')
import { ButtonInteraction } from "discord.js"
// const { statkiManager, EStatkiCellState, statkiGameState } = require('../lib/statkiManager')
import { statkiManager, EStatkiCellState, EStatkiGameState, IShipsCollection, ICellState, IGameData } from "../lib/statkiManager"

/**
 * Generate 2D Array initalized with appropriate cell data
 */
function createBoard(): Array<Array<ICellState>> {
	const shotsMatrix = new Array(10)
	for (let i = 0; i < 10; i++) {
		shotsMatrix[i] = new Array(10)
		for (let j = 0; j < 10; j++)
			shotsMatrix[i][j] = { shot: EStatkiCellState.NOT_SHOT, ship: null }
	}
	return shotsMatrix
}

/**
 * Generate Ships
 * @param {[]} sizes
 */
function createShips(sizes: Array<number>): IShipsCollection {
	const ships: IShipsCollection = {}
	let id = 1
	for (const item of sizes) {
		ships[id.toString()] = {
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

const name = 'statki_accept'
export { name }
export default async function execute(buttonInteraction: ButtonInteraction) {
		const challengerUserId = buttonInteraction.customId.split('#')[1]
		const challengedUserId = buttonInteraction.user.id
		if (statkiManager.pendingChallengesMap.get(challengerUserId).userId !== challengedUserId) {
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
		statkiManager.pendingChallengesMap.delete(challengerUserId)
		// Set both players as in-game
		statkiManager.userGamesMap.set(challengerUserId, buttonInteraction.message.id)
		statkiManager.userGamesMap.set(challengedUserId, buttonInteraction.message.id)
		// Create the initial game data
		statkiManager.gameDataMap.set(buttonInteraction.message.id,
			{
				state: EStatkiGameState.PREPLANNING,
				turn: challengerUserId,
				players: {
					[challengerUserId]: {
						id: challengerUserId,
						ephemeralMessageId: null,
						shipsLeft: 7,
						ships: createShips([5, 4, 3, 2, 2, 1, 1]),
						selectedShip: null,
						board: createBoard(),
					},
					[challengedUserId]: {
						id: challengedUserId,
						ephemeralMessageId: null,
						shipsLeft: 7,
						ships: createShips([5, 4, 3, 2, 2, 1, 1]),
						selectedShip: null,
						board: createBoard(),
					},
				}
			}
		)
		

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
	}