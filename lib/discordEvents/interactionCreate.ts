'use strict'

import { Interaction } from "discord.js"

export default async function(interaction: Interaction) {
	const client = interaction.client
	// To ogólnie do zmiany
	if (interaction.isButton()) {
		if (interaction.customId.startsWith('statki_')) {
			console.debug(interaction.customId)
			try {
				console.debug(interaction.customId.split('#')[0])
				await client.buttonInteractions.get(interaction.customId.split('#')[0]).execute(interaction)
			}
			catch (error) {
				console.error(error)
			}
		}
		else {
			try {
				await client.commands.get(interaction.customId.split('#')[0]).execute(interaction)
			}
			catch (error) {
				console.log(error)
			}
		}
		return
	}

	if (!interaction.isCommand()) return

	if (!client.commands.has(interaction.commandName)) return

	try {
		try {
			client.commands.get(interaction.commandName).execute(interaction)
		}
		catch (error) {
			console.log(error)
		}
	}
	catch (error) {
		console.error(error)
		try {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true })
		}
		catch (error2) {
			console.log('Error: Couldn\'t reply, probably already replied, trying to edit')
			console.log(error2)
			await interaction.editReply({ content: 'There was an error while executing this command!' })
		}
	}
}