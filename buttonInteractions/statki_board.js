'use strict'

const { MessageActionRow, MessageButton } = require('discord.js')
const { statkiManager, statkiMoveAction } = require('../lib/statkiManager')

module.exports = {
	name: 'statki_board',
	async execute(buttonInteraction) {
		const interactorId = buttonInteraction.user.id
		// Ensure the player clicking the button is in the game
		if (!statkiManager.userGamesMap.has(interactorId)) {
			await buttonInteraction.reply({ content: 'Nie jesteś w tej grze.', ephemeral: true })
			return
		}
		const gameId = statkiManager.userGamesMap.get(interactorId)
		const gameData = statkiManager.gameDataMap.get(gameId)
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

		let hasShipsToPlace = true
		let hasShipsToMove = true
		let hasShipSelected = true
		if (gameData[player].selectedShip !== null)
			hasShipSelected = false
		console.debug(gameData[player].ships['1'])
		for (const [shipId, shipData] of Object.entries(gameData[player].ships)) {
			if (shipData.placed)
				hasShipsToMove = false
			else
				hasShipsToPlace = false
		}
		const actionsComponentsArray = [
			new MessageActionRow()
				.setComponents(
					new MessageButton()
						.setCustomId('statki_selectNew')
						.setLabel('Nowy statek')
						.setStyle('PRIMARY')
						.setDisabled(hasShipsToPlace),
					new MessageButton()
						.setCustomId('statki_selectPlaced')
						.setLabel('Zmień położenie')
						.setStyle('PRIMARY')
						.setDisabled(hasShipsToMove),
				),
			new MessageActionRow()
				.setComponents(
					new MessageButton()
						.setCustomId(`statki_move#${statkiMoveAction.UP_LEFT}`)
						.setEmoji('↖')
						.setStyle('SECONDARY')
						.setDisabled(hasShipSelected),
					new MessageButton()
						.setCustomId(`statki_move#${statkiMoveAction.UP}`)
						.setEmoji('⬆')
						.setStyle('SECONDARY')
						.setDisabled(hasShipSelected),
					new MessageButton()
						.setCustomId(`statki_move#${statkiMoveAction.UP_RIGHT}`)
						.setEmoji('↗')
						.setStyle('SECONDARY')
						.setDisabled(hasShipSelected),
				),
			new MessageActionRow()
				.setComponents(
					new MessageButton()
						.setCustomId(`statki_move#${statkiMoveAction.LEFT}`)
						.setEmoji('⬅')
						.setStyle('SECONDARY')
						.setDisabled(hasShipSelected),
					new MessageButton()
						.setCustomId(`statki_move#${statkiMoveAction.ROTATE_CLOCKWISE}`)
						.setEmoji('↩')
						.setStyle('SECONDARY')
						.setDisabled(hasShipSelected),
					new MessageButton()
						.setCustomId(`statki_move#${statkiMoveAction.RIGHT}`)
						.setEmoji('➡')
						.setStyle('SECONDARY')
						.setDisabled(hasShipSelected),
				),
			new MessageActionRow()
				.setComponents(
					new MessageButton()
						.setCustomId(`statki_move#${statkiMoveAction.DOWN_LEFT}`)
						.setEmoji('↙')
						.setStyle('SECONDARY')
						.setDisabled(hasShipSelected),
					new MessageButton()
						.setCustomId(`statki_move#${statkiMoveAction.DOWN}`)
						.setEmoji('⬇')
						.setStyle('SECONDARY')
						.setDisabled(hasShipSelected),
					new MessageButton()
						.setCustomId(`statki_move#${statkiMoveAction.DOWN_RIGHT}`)
						.setEmoji('↘')
						.setStyle('SECONDARY')
						.setDisabled(hasShipSelected),
				),
			new MessageActionRow()
				.setComponents(
					new MessageButton()
						.setCustomId(`statki_move#${statkiMoveAction.PLACE}`)
						.setLabel('Postaw')
						.setStyle('SUCCESS')
						.setDisabled(hasShipSelected),
				),
		]
		const imagePath = await statkiManager.renderGame(interactorId, false)
		const sendResult = await buttonInteraction.client.imageCdnChannel.send({ files: [imagePath] })
		const link = sendResult.attachments.first().url
		if (buttonInteraction.message.id === gameId)
			await buttonInteraction.reply({ content: link, ephemeral: true, components: actionsComponentsArray })
		else
			await buttonInteraction.update({ content: link, ephemeral: true, components: actionsComponentsArray })
	},
}