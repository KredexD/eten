'use strict'
const canvas = require('canvas')
const fs = require('fs')

const statkiCellState = {
	NOT_SHOT: 0,
	MISS: 1,
	HIT: 2,
}

const statkiGameState = {
	PREPLANNING: 0,
	INGAME: 1,
	GAMEOVER: 2,
}

const statkiShipOrientation = {
	NORTH: 0,
	SOUTH: 1,
	WEST: 2,
	EAST: 3,
}

const statkiMoveAction = {
	UP_LEFT: 0,
	UP: 1,
	UP_RIGHT: 2,
	LEFT: 3,
	RIGHT: 4,
	DOWN_LEFT: 5,
	DOWN: 6,
	DOWN_RIGHT: 7,
	ROTATE_LEFT: 8,
	ROTATE_RIGHT: 9,
	PLACE: 10,
}

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
	gameDataMap
	/**
	 * Pending challenges Map
	 * Key: ID of challenger (Snowflake)
	 * Value: {userId: ID of person he challenged, time: when was the challenge sent, message: message object}
	 */
	pendingChallenges
	constructor() {
		this.userGamesMap = new Map()
		this.gameDataMap = new Map()
		this.pendingChallenges = new Map()
	}
	createTemplateCanvas() {
		const canvasWidth = 660, canvasHeight = 660
		const canvasObj = canvas.createCanvas(canvasWidth, canvasHeight)
		const ctx = canvasObj.getContext('2d')
		ctx.font = 'bold 40px Bahnschrift'
		ctx.textAlign = 'center'
		// Comment out for discord?
		// ctx.fillStyle = '#36393F'
		// ctx.fillRect(0, 0, canvasWidth, canvasHeight)
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
	async renderGame(userId, ships) {
		console.time('statki_board_render')
		const currentCanvas = this.createTemplateCanvas()
		const ctx = currentCanvas.getContext('2d')
		if (ships) {
			// Ship rendering here first to be below shots!
		}
		const game = this.gameDataMap.get(this.userGamesMap.get(userId))
		let player = ''
		if (userId === game.player1.id)
			player = 'player1'
		else
			player = 'player2'
		for (let x = 0; x < 10; x++) {
			for (let y = 0; y < 10; y++) {
				if (game[player].board[x][y].shot === statkiCellState.MISS) {
					ctx.beginPath()
					ctx.arc(90 + (x * 60), 90 + (y * 60), 24, 0, 2 * Math.PI)
					ctx.fillStyle = 'red'
					ctx.fill()
					ctx.lineWidth = 4
					ctx.strokeStyle = 'darkred'
					ctx.stroke()
				}
				else if (game[player].board[x][y].shot === statkiCellState.HIT) {
					ctx.beginPath()
					ctx.arc(90 + (x * 60), 90 + (y * 60), 24, 0, 2 * Math.PI)
					ctx.fillStyle = 'gray'
					ctx.fill()
					ctx.lineWidth = 4
					ctx.strokeStyle = 'lightgray'
					ctx.stroke()
				}
			}
		}
		console.timeEnd('statki_board_render')
		return new Promise((resolve, reject) => {
			// Reject if we don't handle within 10s
			setTimeout(reject, 10000)
			const out = fs.createWriteStream(`${__dirname}}/../data/statki/${userId}.jpg`)
			const stream = currentCanvas.createPNGStream()
			stream.pipe(out)
			out.on('finish', () => {
				resolve(`${__dirname}/../data/statki/${userId}.jpg`)
			})
			out.on('error', error => {
				reject(error)
			})
		})
	}
}

const statkiManager = new StatkiManager()
module.exports = {
	statkiManager,
	statkiCellState,
	statkiGameState,
	statkiShipOrientation,
	statkiMoveAction,
}