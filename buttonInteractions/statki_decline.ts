'use strict'

import { ButtonInteraction } from 'discord.js'
import { statkiManager } from '../lib/statkiManager'

const name = 'statki_decline'
export { name }

export async function execute(buttonInteraction: ButtonInteraction) {
	const data = buttonInteraction.customId.split('#')[1]
	if (statkiManager.pendingChallengesMap.get(data).userId !== buttonInteraction.user.id) {
		await buttonInteraction.reply({ content: 'Nie możesz tego zrobić.', ephemeral: true })
		return
	}
	statkiManager.pendingChallengesMap.delete(data)
	await buttonInteraction.update({
		content: `${buttonInteraction.user.username} jest tchórzem i odrzucił wyzwanie. Wstyd!`,
		components: [],
	})
}