'use strict'

import { MessageActionRow, MessageButton, ButtonInteraction, TextChannel, Message } from "discord.js"

import { EStatkiMoveAction, statkiManager } from '../lib/statkiManager'

export default async function execute(buttonInteraction: ButtonInteraction): Promise<void> {
	// Check if the player is in a game. If yes, get the relevant game data.
	const interactorId = buttonInteraction.user.id
	if (!statkiManager.userGamesMap.has(interactorId)) {
		await buttonInteraction.reply({ content: 'Nie jesteś w tej ani żadnej innej grze.', ephemeral: true })
		return
	}
	const gameId = statkiManager.userGamesMap.get(interactorId)
	const gameData = statkiManager.gameDataMap.get(gameId)
	let isEphemeral = false
	// Ensure this message tied to the players game. Remember if it is a known ephemeral one.
	if (gameData.players[interactorId].ephemeralMessage && gameData.players[interactorId].ephemeralMessage.id === buttonInteraction.message.id) {
		isEphemeral = true
	}
	else if (gameId !== buttonInteraction.message.id) {
		await buttonInteraction.reply({ content: 'Nie jesteś w tej grze.', ephemeral: true })
		return
	}
	//

	let hasShipsToPlaceDisabled = true
	let hasShipsToMoveDisabled = true
	// let hasShipSelectedDisabled = true
	// if (gameData.players[interactorId].selectedShip !== null)
	// 	hasShipSelectedDisabled = false
	for (const ship of gameData.players[interactorId].ships) {
		if (ship.placed)
			hasShipsToMoveDisabled = false
		else
			hasShipsToPlaceDisabled = false
	}
	const actionsComponentsArray = [
		new MessageActionRow()
			.setComponents(
				new MessageButton()
					.setCustomId('statki_selectNew')
					.setLabel('Nowy statek')
					.setStyle('PRIMARY')
					.setDisabled(hasShipsToPlaceDisabled),
				new MessageButton()
					.setCustomId('statki_selectPlaced')
					.setLabel('Zmień położenie')
					.setStyle('PRIMARY')
					.setDisabled(hasShipsToMoveDisabled),
				new MessageButton()
					.setCustomId('statki_board')
					.setLabel('Board')
					.setStyle('DANGER')
					.setDisabled(false),
			)
	]
	const imagePath = await statkiManager.renderGame(interactorId, false)
	const message = await (buttonInteraction.client.imageCdnChannel as TextChannel).send({ files: [imagePath] })
	const imageLink = message.attachments.first().url
	if (false) {
		await buttonInteraction.update({ content: imageLink, components: actionsComponentsArray, fetchReply: false })
	}
	else {
		const ephemeralReply = await buttonInteraction.reply({ content: imageLink, components: actionsComponentsArray, fetchReply: true, ephemeral: true})
		gameData.players[interactorId].ephemeralMessage = ephemeralReply as Message
		statkiManager.gameDataMap.set(gameId, gameData)
	}
	return
}