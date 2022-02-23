'use strict'

const { statki } = require('../lib/statkiManager')

module.exports = {
	name: 'statki_decline',
	async execute(buttonInteraction) {
		const data = buttonInteraction.customId.split('#')[1]
		statki.pendingChallenges.delete(data)
		await buttonInteraction.update({
			content: `${buttonInteraction.user.username} jest tchórzem i odrzucił wyzwanie. Wstyd!`,
			components: [],
		})
	},
}