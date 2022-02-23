'use strict'

const { SlashCommandBuilder, SlashCommandUserOption, SlashCommandSubcommandBuilder } = require('@discordjs/builders')
const { MessageButton, MessageActionRow } = require('discord.js')
const { statki } = require('../lib/statkiManager')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('statki')
		.setDescription('Komenda do statków')
		.addSubcommand(
			new SlashCommandSubcommandBuilder()
				.setName('wyzwij')
				.setDescription('Wyzwij gracza na nową gre')
				.addUserOption(
					new SlashCommandUserOption()
						.setName('gracz')
						.setDescription('Gracz do wyzwania')
						.setRequired(true),
				),
		)
		.addSubcommand(
			new SlashCommandSubcommandBuilder()
				.setName('plansza')
				.setDescription('Pokaż planszę gry z twoimi statkami'),
		),
	async execute(interaction) {
		if (interaction.options.getSubcommand() === 'wyzwij') {
			const challenger = interaction.user
			const challenged = interaction.options.getUser('gracz')
			if (challenged.bot) {
				await interaction.reply({ content: 'Nie możesz wyzwać bota!', ephemeral: true })
				return
			}
			if (statki.userGamesMap.has(challenger.id)) {
				await interaction.reply({ content: 'Już jesteś w grze!', ephemeral: true })
				return
			}
			if (statki.userGamesMap.has(challenged.id)) {
				await interaction.reply({ content: 'Twój przeciwnik jest już w grze!', ephemeral: true })
				return
			}
			if (statki.pendingChallenges.has(challenger.id)) {
				const lastChallenge = statki.pendingChallenges.get(challenger.id)
				if (lastChallenge.userId === challenged.id) {
					if (lastChallenge.time > new Date().getTime() - 1000 * 60 * 60 * 2) {
						await interaction.reply({ content: 'Już wyzwałeś tego gracza!', ephemeral: true })
						return
					}
					else {
						await lastChallenge.message.delete()
					}
				}
			}
			const row = new MessageActionRow()
				.addComponents(
					new MessageButton()
						.setCustomId(`statki_accept#${challenger.id}`)
						.setLabel('Przyjmij')
						.setStyle('SUCCESS'),
					new MessageButton()
						.setCustomId(`statki_decline#${challenger.id}`)
						.setLabel('Odrzuć')
						.setStyle('DANGER'),
				)
			const msg = await interaction.reply({ content: `<@${challenged.id}>, ${challenger.username} wyzwał cię na pojedynek mistrzów xiaolin`, components: [row] })
			statki.pendingChallenges.set(challenger.id, { userId: challenged.id, time: new Date().getTime(), message: msg })
		}
		else if (interaction.options.getSubcommand() === 'plansza') {
			if (!statki.userGamesMap.has(interaction.user.id)) {
				await interaction.reply({ content: 'Nie jesteś obecnie w grze.', ephemeral: true })
				return
			}
			const gameId = statki.userGamesMap.get(interaction.user.id)
			await statki.renderGame(gameId)
			
			interaction.reply({ content: 'image link here', ephemeral: true })
		}
	},
}