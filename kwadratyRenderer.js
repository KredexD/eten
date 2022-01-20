const { createCanvas } = require('canvas')
const { inspect } = require('util')
const fs = require('fs')
const { count } = require('console')

class Point {
    constructor(index, x, y, color) {
        this.index = index
        this.color = color
        this.x = x
        this.y = y
        this.edges = []
    }
}

class Edge {
    constructor(index, pointA, pointB) {
        this.index = index
        this.pointA = pointA
        this.pointB = pointB
    }
}

class Score {
    constructor(x, y, color) {
        this.x = x
        this.y = y
        this.color = color
    }
}

module.exports = class Board {
    constructor(spacing, offsetX, offsetY, uids, usernames, id = 0) {
        this.remis = []
        this.usernames = usernames
        this.uids = uids
        this.turn = 0
        this.win = -1
        this.thickness = 3
        this.scores = [0, 0]

        var settings = JSON.parse(fs.readFileSync('./data/userSettings.json'))
        this.colors = ['#5865f2', '#f04747']

        for (var i = 0; i < this.uids.length; i++)
            if (settings[this.uids[i]] !== undefined && settings[this.uids[i]]['color'] !== undefined)
                this.colors[i] = settings[this.uids[i]]['color']

        this.id = id
        this.spacing = spacing
        this.offsetX = offsetX
        this.offsetY = offsetY

        this.canvas = createCanvas(offsetX * 2 + 3 * spacing, offsetY * 2 + 3 * spacing)
        this.ctx = this.canvas.getContext('2d')

        var points = []
        var pos = new Array(5)
        for (var i = 0; i < pos.length; i++)
            pos[i] = new Array(5)

        var counted = new Array(4)
        for (var i = 0; i < counted.length; i++)
            counted[i] = new Array(4)
        for (var i = 1; i <= 3; i++)
            for (var j = 1; j <= 3; j++)
                counted[i][j] = 0
        this.counted = counted

        var ind = 1
        points.push(0)
        for (var y = 1; y <= 4; y++) {
            for (var x = 1; x <= 4; x++) {
                pos[x][y] = ind
                points.push(new Point(ind, x, y))
                ind++
            }
        }
        this.pos = pos
        this.points = points

        this.edges = []
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

        this.ctx.textAlign = 'center'
        this.ctx.font = '20px Arial'
        this.ctx.lineWidth = this.thickness

        this.ctx.fillStyle = '#fff'
        for (var i = 1; i <= 4; i++) {
            this.ctx.fillText(String.fromCharCode(i + 64), this.offsetX + (i - 1) * this.spacing, this.offsetY / 2)
            this.ctx.fillText(i, this.offsetX / 2, this.offsetY + (i - 1) * this.spacing + 5)
        }

        this.ctx.fillStyle = '#fff'
        for (var i = 0; i < this.points.length; i++) {
            var point = this.points[i]
            this.ctx.fillRect(this.offsetX + this.spacing * (point.x - 1) - this.thickness / 2, this.offsetY + this.spacing * (point.y - 1) - this.thickness / 2, this.thickness, this.thickness)
        }

        this.ctx.strokeStyle = '#fff'
        for (var i = 0; i < this.edges.length; i++) {
            var edge = this.edges[i]

            this.ctx.beginPath()
            this.ctx.moveTo(this.offsetX + this.spacing * (edge.pointA.x - 1), this.offsetY + this.spacing * (edge.pointA.y - 1))
            this.ctx.lineTo(this.offsetX + this.spacing * (edge.pointB.x - 1), this.offsetY + this.spacing * (edge.pointB.y - 1))
            this.ctx.stroke()
        }

        for (var y = 1; y <= 3; y++) {
            for (var x = 1; x <= 3; x++) {
                if (this.counted[x][y] == 0)
                    continue
                if (this.counted[x][y] == 1)
                    this.ctx.fillStyle = this.colors[0]
                else
                    this.ctx.fillStyle = this.colors[1]

                this.ctx.fillRect(this.offsetX + this.spacing * (x - 1), this.offsetY + this.spacing * (y - 1), this.spacing, this.spacing)
            }
        }

        var data = this.canvas.toDataURL().replace(/^data:image\/\w+;base64,/, "")
        var buf = Buffer.from(data, "base64")
        fs.writeFileSync('data/boardKwadraty' + this.id + '.png', buf)
    }

    move(mv) {
        if (mv.length != 4)
            return false

        mv = mv.toLowerCase()
        var pointA = mv.substring(0, 2)
        var pointB = mv.substring(2)

        if (!(['a', 'b', 'c', 'd'].includes(pointA[0])) ||
            !(['a', 'b', 'c', 'd'].includes(pointB[0])) ||
            !(['1', '2', '3', '4'].includes(pointA[1])) ||
            !(['1', '2', '3', '4'].includes(pointB[1])))
            return false

        pointA = new Point(0, pointA[0].charCodeAt(0) - 96, parseInt(pointA[1]))
        pointB = new Point(0, pointB[0].charCodeAt(0) - 96, parseInt(pointB[1]))

        if (!(pointA.x == pointB.x || pointA.y == pointB.y) || Math.abs(pointA.x - pointB.x) > 1 || Math.abs(pointA.y - pointB.y) > 1)
            return false

        if (this.points[this.pos[pointA.x][pointA.y]].edges.includes(this.pos[pointB.x][pointB.y]))
            return false

        this.edges.push(new Edge(0, pointA, pointB))
        this.points[this.pos[pointA.x][pointA.y]].edges.push(this.pos[pointB.x][pointB.y])
        this.points[this.pos[pointB.x][pointB.y]].edges.push(this.pos[pointA.x][pointA.y])

        var added = false
        for (var y = 1; y <= 3; y++) {
            for (var x = 1; x <= 3; x++) {
                if (this.counted[x][y] == 0 &&
                    this.points[this.pos[x][y]].edges.includes(this.pos[x + 1][y]) &&
                    this.points[this.pos[x + 1][y]].edges.includes(this.pos[x + 1][y + 1]) &&
                    this.points[this.pos[x + 1][y + 1]].edges.includes(this.pos[x][y + 1]) &&
                    this.points[this.pos[x][y + 1]].edges.includes(this.pos[x][y])) {
                    added = true
                    this.counted[x][y] = this.turn + 1
                    this.scores[this.turn]++
                }
            }
        }

        if (!added)
            this.turn = (this.turn + 1) % 2
        if (this.edges.length >= 24) {
            this.win = (this.scores[0] > this.scores[1] ? 0 : 1)
        }

        return true
    }

    turnUID() {
        return this.uids[this.turn]
    }

    removeBoard() {
        try {
            fs.unlinkSync('./data/boardKwadraty' + this.id + '.png')
        } catch (error) {
            console.log(error)
        }
    }

    dump() {
        fs.writeFileSync('./data/boardKwadraty' + this.id + '.dump', inspect(this, { depth: 10 }))
    }
}
