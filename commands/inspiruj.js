const util = require('util')
const streamPipeline = util.promisify(require('stream').pipeline)
const fetch = require('node-fetch')
const fs = require('fs')
const Discord = require('discord.js')

module.exports = {
  name: 'inspiruj',
  description: 'Zainspiruj się',
  aliases: ['inspiracja'],
  async execute (interaction) {
    const res = await fetch('https://inspirobot.me/api?generate=true')
    if (!res.ok) throw new Error(`Unexpected response ${res.statusText}`)
    const response = await fetch(await res.text())
    if (!response.ok) throw new Error(`Unexpected response ${response.statusText}`)
    await streamPipeline(response.body, fs.createWriteStream('./placeholder.jpg'))
    const attachment = new Discord.MessageAttachment('./placeholder.jpg')
    interaction.reply({ files: [attachment] })
  }
}
