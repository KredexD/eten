'use strict'

import Discord from 'discord.js'
const config = require('./config.json')
const fs = require('fs')
const threadwatcher = require('./lib/threadwatcher')
const createRequiredFiles = require('./lib/createRequiredFiles')
const cronJobs = require('./lib/cronJobs')
const randomSounds = require('./lib/randomSoundOnVC')
const librus = require('./lib/librus')
const incrementDays = require('./lib/incrementDays')
import * as discordEvents from './lib/discordEvents'

declare module 'discord.js' {
	interface Client {
		commands: Discord.Collection<string, {data: string, execute: Function}>
		imageCdnChannel: Discord.AnyChannel
	}
}

const client = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES, Discord.Intents.FLAGS.GUILD_MEMBERS, Discord.Intents.FLAGS.GUILD_VOICE_STATES, Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS], partials: ['MESSAGE', 'CHANNEL', 'REACTION'] })
client.commands = new Discord.Collection()
// client.textTriggers = new Discord.Collection()

let autoMemesChannel: Discord.AnyChannel

function updateSlashCommands() {
	const commandFiles = fs.readdirSync(`${__dirname}/commands`).filter((file: string) => file.endsWith('.js'))
	const slashCommands = []
	for (const file of commandFiles) {
		const command = require(`${__dirname}/commands/${file}`)
		client.commands.set(command.data.name, command)

		slashCommands.push(command.data.toJSON())

		for (const alias in command.aliases)
			client.commands.set(command.aliases[alias], command)
	}
	// const response = await client.application.commands.set(slashCommands)
	// console.log(response)
	// console.debug(client.commands)
}

threadwatcher.newReply.on('newPost', async (board: any, threadID: any, postID: any, text: any, attachmentUrl: any) => {
	// console.log(`${board}/${threadID}/p${postID}`)
	// console.log(text)
	// console.log(attachmentUrl)
	await (autoMemesChannel as Discord.TextChannel).send({
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
	// cronJobs(client)

	console.log(`Ready! Logged in as ${client.user.tag}`)

	// autoMemesChannel = await client.channels.fetch(config.autoMemesChannel)
	// Replace with Maslo's channel ()
	client.imageCdnChannel = await client.channels.fetch(config.statkiChannel)
	incrementDays()
	// librus(client)
	// randomSounds(client)
})

// client.on('messageReactionAdd', discordEvents.messageReactionAdd)

// client.on('messageReactionRemove', discordEvents.messageReactionRemove)

// client.on('messageCreate', discordEvents.messageCreate)

client.on('interactionCreate', discordEvents.onInteractionCreate)

client.login(config.token)
