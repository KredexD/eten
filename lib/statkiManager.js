'use strict'
const canvas = require('canvas')
const fs = require('fs')

const shotState = {
	NOT_SHOT: 0,
	MISS: 1,
	HIT: 2,
}

const shipOrientation = {
	NORTH: 0,
	SOUTH: 1,
	WEST: 2,
	EAST: 3,
}

let desiredChannel

function createTemplateCanvas() {
	const canvasWidth = 660, canvasHeight = 660
	const canvasObj = canvas.createCanvas(canvasWidth, canvasHeight)
	const ctx = canvasObj.getContext('2d')
	ctx.font = 'bold 40px Bahnschrift'
	ctx.textAlign = 'center'
	// Comment out for discord?
	ctx.fillStyle = '#36393F'
	ctx.fillRect(0, 0, canvasWidth, canvasHeight)
	//
	ctx.fillStyle = 'white'
	ctx.lineWidth = 2
	let x = 60
	let y = 60
	for (let i = 1; i <= 10; i++) {
		// Row
		ctx.beginPath()
		ctx.moveTo(0, y)
		ctx.lineTo(canvasWidth, y)
		ctx.stroke()
		// Column
		ctx.beginPath()
		ctx.moveTo(x, 0)
		ctx.lineTo(x, canvasHeight)
		ctx.stroke()
		y += 60
		x += 60
	}
	x = 29
	y = 105
	for (let i = 'A'.charCodeAt(0); i <= 'J'.charCodeAt(0); i++) {
		ctx.fillText(String.fromCharCode(i), x, y)
		y += 60
	}
	x = 90
	y = 45
	for (let i = 1; i <= 10; i++) {
		ctx.fillText(i, x, y)
		x += 60
	}
	return canvasObj
}
const templateCanvas = createTemplateCanvas()

class StatkiManager {
	/**
	 * Key: Discord user ID
	 * Value: Game ID for the user
	 */
	userGamesMap
	/**
	 * GameID (message ID) as key
	 * I WANNA USE TYPESCRIPT INTERFACES HERE GOT DAMN
	 */
	gameState
	/**
	 * Pending challenges Map
	 * Key: ID of challenger (Snowflake)
	 * Value: {userId: ID of person he challenged, time: when was the challenge sent, message: message object}
	 */
	pendingChallenges
	constructor() {
		this.userGamesMap = new Map()
		this.gameState = new Map()
		this.pendingChallenges = new Map()
	}
	async renderGame(gameId) {
		return new Promise((resolve) => {
			const out = fs.createWriteStream(`${__dirname}/../data/statki/${gameId}.jpg`)
			const stream = canvas.createJPGStream({ quality: 0.95, chromaSubsampling: false })
			stream.pipe(out)
			out.on('finish', () => {
				console.log('saved png')
				resolve()
			})
		})
	}
	async renderUserGame(userId) {
		// Replace with PNG?
		// DON'T DO PROMISE
		return new Promise((resolve, reject) => {
			// Reject if we don't handle within 10s
			setTimeout(reject, 10000)
			const out = fs.createWriteStream(`${__dirname}}/../data/statki/${userId}.jpg`)
			const stream = canvas.createJPGStream({ quality: 0.95, chromaSubsampling: false })
			stream.pipe(out)
			out.on('finish', () => {
				desiredChannel.send({ files:[`${__dirname}}/../data/statki/${userId}.jpg`] })
					.then(result => {
						resolve(result.attachments.first().url)
					})
					.catch(error => {
						console.error(error)
						reject()
					})
			})
		})
	}
}

const statki = new StatkiManager()
module.exports = {
	statki,
	shotState,
	setStatkiChannel(channel) {
		desiredChannel = channel
	},
}