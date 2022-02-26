'use strict'

const { statkiManager } = require('../lib/statkiManager')

module.exports = {
	name: 'statki_decline',
	async execute(buttonInteraction) {
		const data = buttonInteraction.customId.split('#')[1]
		if (statkiManager.pendingChallenges.get(data).userId !== buttonInteraction.user.id) {
			await buttonInteraction.reply({ content: 'Nie możesz tego zrobić.', ephemeral: true })
			return
		}
		statkiManager.pendingChallenges.delete(data)
		await buttonInteraction.update({
			content: `${buttonInteraction.user.username} jest tchórzem i odrzucił wyzwanie. Wstyd!`,
			components: [],
		})
	},
}