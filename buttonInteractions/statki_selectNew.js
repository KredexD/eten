'use strict'

const { MessageActionRow, MessageButton, Message, MessageSelectMenu } = require('discord.js')
const { statkiManager, statkiMoveAction } = require('../lib/statkiManager')

const numberToEmoji = {
	'1': '1️⃣',
	'2': '2️⃣',
	'3': '3️⃣',
	'4': '4️⃣',
	'5': '5️⃣',
	'6': '6️⃣',
	'7': '7️⃣',
	'8': '8️⃣',
	'9': '9️⃣',
	'10': '🔟',
}

const shipLengthToName = {
	'1': 'Jednomasztowiec',
	'2': 'Dwumasztowiec',
	'3': 'Trójmasztowiec',
	'4': 'Lotniskowiec',
	'5': 'BIG BOY',
}

module.exports = {
	name: 'statki_selectNew',
	async execute(buttonInteraction) {
		const interactorId = buttonInteraction.user.id
		// Ensure the player clicking the button is in the game
		if (!statkiManager.userGamesMap.has(interactorId)) {
			await buttonInteraction.reply({ content: 'Nie jesteś w tej grze.', ephemeral: true })
			return
		}
		const gameData = statkiManager.gameDataMap.get(statkiManager.userGamesMap.get(interactorId))
		let player = ''
		if (gameData.player1.id === interactorId) {
			player = 'player1'
		}
		else if (gameData.player2.id === interactorId) {
			player = 'player2'
		}
		else {
			await buttonInteraction.reply({ content: 'Nie jesteś w tej grze.', ephemeral: true })
			return
		}

		const shipSelection = []
		for (const [shipId, shipData] of Object.entries(gameData[player].ships)) {
			let shipDisabled = false
			if (shipData.placed)
				shipDisabled = true
			// Lmao
			shipSelection.push({
				label: shipLengthToName[shipData.initialSize],
				value: shipId,
			})
		}
		const actionsComponentsArray = [
			new MessageActionRow()
				.setComponents(
					new MessageButton()
						.setCustomId('statki_board')
						.setLabel('Cofnij')
						.setStyle('PRIMARY'),
				),
			new MessageActionRow()
				.setComponents(
					new MessageSelectMenu()
						.setCustomId('fuck')
						.setPlaceholder('Wybierz')
						.setOptions(shipSelection),
				),
		]
		await buttonInteraction.update({ content: 'Wybierz statek', ephemeral: true, components: actionsComponentsArray })
	},
}