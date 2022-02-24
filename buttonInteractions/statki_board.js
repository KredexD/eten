'use strict'

const { statki } = require('../lib/statkiManager')

module.exports = {
	name: 'statki_decline',
	async execute(buttonInteraction) {
		const interactorId = buttonInteraction.user.id
		// Ensure the player clicking the button is in the game
		if (!statki.userGamesMap.has(interactorId)) {
			await buttonInteraction.reply({ content: 'Nie jesteś w tej grze.', ephemeral: true })
			return
		}
		const game = statki.gameState.get(statki.userGamesMap.get(interactorId))
		if (game.player1.id !== interactorId && game.player2.id !== interactorId) {
			await buttonInteraction.reply({ content: 'Nie jesteś w tej grze.', ephemeral: true })
			return
		}
		await statki.renderUserGame(interactorId)
		buttonInteraction.reply({ content: 'link', ephemeral: true })
	},
}