'use strict'

const Discord = require('discord.js')
const config = require('./config.json')
const fs = require('fs')
const threadwatcher = require('./lib/threadwatcher')
const createRequiredFiles = require('./lib/createRequiredFiles')
const cronJobs = require('./lib/cronJobs')
const randomSounds = require('./lib/randomSoundOnVC')
const librus = require('./lib/librus')
const incrementDays = require('./lib/incrementDays')
const discordEvents = require('./lib/discordEvents')
const client = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES, Discord.Intents.FLAGS.GUILD_MEMBERS, Discord.Intents.FLAGS.GUILD_VOICE_STATES, Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS], partials: ['MESSAGE', 'CHANNEL', 'REACTION'] })
client.commands = new Discord.Collection()
client.buttonInteractions = new Discord.Collection()
// client.textTriggers = new Discord.Collection()

let autoMemesChannel
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'))

// TODO: Regex triggers for free text? ("/ROZPIERDOL.+KOTA/gi")
// Won't this overload the bot if there are too many?
// TODO: Handling for editReply in interactions? and stuff

async function updateSlashCommands() {
	const slashCommands = []
	for (const file of commandFiles) {
		const command = require(`./commands/${file}`)
		client.commands.set(command.data.name, command)

		slashCommands.push(command.data.toJSON())

		for (const alias in command.aliases)
			client.commands.set(command.aliases[alias], command)
	}
	// const response = await client.application.commands.set(slashCommands)
	// console.log(response)
}
function updateButtonInteractions() {
	const buttonInteractionFiles = fs.readdirSync('./buttonInteractions').filter(file => file.endsWith('.js'))
	for (const file of buttonInteractionFiles) {
		const buttonInteract = require(`./buttonInteractions/${file}`)
		client.buttonInteractions.set(buttonInteract.name, buttonInteract)
	}
	console.debug(client.buttonInteractions)
}

threadwatcher.newReply.on('newPost', async (board, threadID, postID, text, attachmentUrl) => {
	// console.log(`${board}/${threadID}/p${postID}`)
	// console.log(text)
	// console.log(attachmentUrl)
	await autoMemesChannel.send({
		content: `<https://boards.4channel.org/${board}/thread/${threadID}#p${postID}>`,
		files: [attachmentUrl],
	})
	threadwatcher.changePostTimeoutEvent.emit('subtractTimeout')
})

client.once('ready', async () => {
	createRequiredFiles()

	client.user.setStatus('online')
	client.user.setActivity('twoja stara')

	updateSlashCommands()
	updateButtonInteractions()
	// cronJobs(client)

	console.log(`Ready! Logged in as ${client.user.tag}`)

	// autoMemesChannel = await client.channels.fetch(config.autoMemesChannel)
	// Replace with Maslo's channel ()
	client.imageCdnChannel = await client.channels.fetch(config.statkiChannel)
	incrementDays()
	// librus(client)
	// randomSounds(client)
})

client.on('messageReactionAdd', discordEvents.messageReactionAdd)

client.on('messageReactionRemove', discordEvents.messageReactionRemove)

client.on('messageCreate', discordEvents.messageCreate)

client.on('interactionCreate', discordEvents.interactionCreate)

client.login(config.token)
