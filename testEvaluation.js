'use strict'

const Board=require('./pilkarzykiRenderer.js')
const ExtBoard=require('./bot.js')
var fs = require('fs')

const DRAW_BOARDS=true

/**
 * 
 * EVALUATION FUNCTIONS
 *
 */

const evalQuad=require('./evaluationFunctions/evaluationQuad.js')
const evalQuadReverse=require('./evaluationFunctions/evaluationQuadReverse.js')
const evalBFS=require('./evaluationFunctions/evaluationBFS.js')
const evalBFSReverse=require('./evaluationFunctions/evaluationBFSReverse.js')
const evalBFSCubic=require('./evaluationFunctions/evaluationBFSCubic.js')
const evalBFSCubicReverse=require('./evaluationFunctions/evaluationBFSCubicReverse.js')


function play(eval1, eval2, depth, cleanFiles) {
	console.log("Playing %s vs %s...", eval1.name, eval2.name)
	var b = new Board(50, 50, 50, [1, 1], [eval1.name, eval2.name], 0)
	var ext_board = [new ExtBoard(b, 9, 13, eval1), new ExtBoard(b, 9, 13, eval2)]

	var avg = [0, 0]
	var avgNodes = [0, 0]
	var n = 0
	while (b.win == -1) {
		var start = performance.now()
		ext_board[b.turn].nodes = 0
		var move = ext_board[b.turn].search(depth, b.turn, -2000, 2000)[1]
		var end = performance.now()
		console.log("%s searched %d nodes for %f ms (%f node/s)", (b.turn == 0 ? eval1.name : eval2.name), ext_board[b.turn].nodes, Math.round((end-start)*100)/100, Math.round(ext_board[b.turn].nodes/((end-start)/1000)*100)/100)
		n++

		// each player played only half of all turns
		var m = (n + 1) / 2
		avgNodes[b.turn] = (avgNodes[b.turn]*(m - 1) + ext_board[b.turn].nodes) / m
		avg[b.turn] = (avg[b.turn]*(m - 1) + end-start) / m

		if (move.length == 0) {
			console.log("Fuck")
		}

		for (var dir of move) {
			var ind = b.possibleMovesIndexes()
			if (!b.move(ind.indexOf(dir))) {
				console.log("AAaaaaaaaaaaaaa")
				break
			}
		}
		ext_board[0].makeMove(move)
		ext_board[1].makeMove(move)

		// ext_board[0].save("testGraph.json")
		// b.save("board.json")

		if (DRAW_BOARDS)
			b.draw(n)
	}
	console.log("%s won! There were %d moves", (b.win == 0 ? eval1.name : eval2.name), n)
	console.log("Average time for %s was %f ms, for %s was %f ms",
				eval1.name, Math.round(avg[0]*100)/100, eval2.name, Math.round(avg[1]*100)/100)
	console.log("Average performance for %s was %f nodes/s, for %s was %f nodes/s\n",
				eval1.name, Math.round(avgNodes[0]*100)/100, eval2.name, Math.round(avgNodes[1]*100)/100)

	// clean files
	if (cleanFiles) {
		const path = 'data/'
		let regex = /^boardPilkarzyki\d*[.]png$/
		fs.readdirSync(path)
			.filter(f => regex.test(f))
			.map(f => fs.unlinkSync(path + f))
	}

	return b.win
}

function testEval(evalArr, depth) {
	var n = evalArr.length
	var allGames = n*(n - 1)
	console.log("Tournament with %d games (depth = %d):", allGames, depth)
	
	var won = []
	for (var i = 0; i < n; ++i)
		won.push(0)

	var start = performance.now()
	for (var i = 0; i < n; ++i) {
		for (var j = 0; j < n; ++j) {
			if (i == j)
				continue

			var winner = play(evalArr[i], evalArr[j], depth, true)
			++won[(winner == 0 ? i : j)]
		}
	}
	var end = performance.now()
	
	for (var i = 0; i < n; ++i) {
		console.log("%s won %f\% of games", evalArr[i].name, Math.round(won[i]/allGames*10000)/100)
	}
	console.log("\nTournament took %d seconds", Math.round((end - start)/1000))
}

// testEval([evalLinear, evalQuad, evalQuadSign, evalCubic, evalBFS, evalBFSCubic], 4)
// testEval([evalQuadSign, evalQuad, evalBFS, evalBFSCubic], 4)
testEval([evalBFS, evalQuadReverse, evalBFSReverse, evalBFSCubicReverse, evalQuad, evalBFSCubic], 4)