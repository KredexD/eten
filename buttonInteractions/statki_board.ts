'use strict'

import { MessageActionRow, MessageButton, ButtonInteraction, TextChannel } from "discord.js"

import { EStatkiMoveAction, statkiManager } from '../lib/statkiManager')

module.exports = {
	name: 'statki_board',
	async execute(buttonInteraction: ButtonInteraction) {
		const interactorId = buttonInteraction.user.id
		// Ensure the player clicking the button is in the game
		if (!statkiManager.userGamesMap.has(interactorId)) {
			await buttonInteraction.reply({ content: 'Nie jesteś w tej grze.', ephemeral: true })
			return
		}
		const gameId = statkiManager.userGamesMap.get(interactorId)
		const gameData = statkiManager.gameDataMap.get(gameId)
		let player = ''
		if (!(interactorId in gameData.players)) {
			await buttonInteraction.reply({ content: 'Nie jesteś w tej grze.', ephemeral: true })
			return
		}

		let hasShipsToPlace = true
		let hasShipsToMove = true
		let hasShipSelected = true
		if (gameData.players[player].selectedShip !== null)
			hasShipSelected = false
		console.debug(gameData.players[player].ships['1'])
		for (const [shipId, shipData] of Object.entries(gameData.players[player].ships)) {
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
						.setCustomId(`statki_move#${EStatkiMoveAction.UP_LEFT}`)
						.setEmoji('↖')
						.setStyle('SECONDARY')
						.setDisabled(hasShipSelected),
					new MessageButton()
						.setCustomId(`statki_move#${EStatkiMoveAction.UP}`)
						.setEmoji('⬆')
						.setStyle('SECONDARY')
						.setDisabled(hasShipSelected),
					new MessageButton()
						.setCustomId(`statki_move#${EStatkiMoveAction.UP_RIGHT}`)
						.setEmoji('↗')
						.setStyle('SECONDARY')
						.setDisabled(hasShipSelected),
				),
			new MessageActionRow()
				.setComponents(
					new MessageButton()
						.setCustomId(`statki_move#${EStatkiMoveAction.LEFT}`)
						.setEmoji('⬅')
						.setStyle('SECONDARY')
						.setDisabled(hasShipSelected),
					new MessageButton()
						.setCustomId(`statki_move#${EStatkiMoveAction.ROTATE_RIGHT}`)
						.setEmoji('↩')
						.setStyle('SECONDARY')
						.setDisabled(hasShipSelected),
					new MessageButton()
						.setCustomId(`statki_move#${EStatkiMoveAction.RIGHT}`)
						.setEmoji('➡')
						.setStyle('SECONDARY')
						.setDisabled(hasShipSelected),
				),
			new MessageActionRow()
				.setComponents(
					new MessageButton()
						.setCustomId(`statki_move#${EStatkiMoveAction.DOWN_LEFT}`)
						.setEmoji('↙')
						.setStyle('SECONDARY')
						.setDisabled(hasShipSelected),
					new MessageButton()
						.setCustomId(`statki_move#${EStatkiMoveAction.DOWN}`)
						.setEmoji('⬇')
						.setStyle('SECONDARY')
						.setDisabled(hasShipSelected),
					new MessageButton()
						.setCustomId(`statki_move#${EStatkiMoveAction.DOWN_RIGHT}`)
						.setEmoji('↘')
						.setStyle('SECONDARY')
						.setDisabled(hasShipSelected),
				),
			new MessageActionRow()
				.setComponents(
					new MessageButton()
						.setCustomId(`statki_move#${EStatkiMoveAction.PLACE}`)
						.setLabel('Postaw')
						.setStyle('SUCCESS')
						.setDisabled(hasShipSelected),
				),
		]
		const imagePath = await statkiManager.renderGame(interactorId, false)
		const sendResult = await (buttonInteraction.client.imageCdnChannel as TextChannel).send({ files: [imagePath] })
		const link = sendResult.attachments.first().url
		if (buttonInteraction.message.id === gameId)
			await buttonInteraction.reply({ content: link, ephemeral: true, components: actionsComponentsArray })
		else
			await buttonInteraction.update({ content: link, components: actionsComponentsArray })
	},
}