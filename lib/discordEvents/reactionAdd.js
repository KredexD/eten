'use strict'

module.exports = async function (reaction, reactedUser) {
    try {
        let letters = ['🇦', '🇧', '🇨', '🇩', '🇪', '🇫', '🇬', '🇭', '🇮']
        let letter = String.fromCharCode(letters.indexOf(reaction._emoji.name)+'a'.charCodeAt())
        let user = reaction.message.guild.members.cache.find(member => member.id == reactedUser.id)
        let role = undefined
      
        if (reaction.message.id == '932695585465704448') // 1. klasa
            role = user.guild.roles.cache.find(role => role.name === `1${letter}`)
        else if (reaction.message.id == '932695586426196060') // 2. klasa
            role = user.guild.roles.cache.find(role => role.name === `2${letter}`)
        else if (reaction.message.id == '932695588540141598') // 3. klasa podstawowka
            role = user.guild.roles.cache.find(role => role.name === `3${letter}4`)
        else if (reaction.message.id == '932695587424444466') // 3. klasa gimnazjum
            role = user.guild.roles.cache.find(role => role.name === `3${letter.toUpperCase()}3`)
    
        if (role) {
            await user.roles.add(role)
        }
    } catch(except) {
        console.log(reaction)
        console.log(except)
        let user = reaction.message.guild.members.cache.find(member => member.id == reactedUser.id)
        user.send('Był problem z dodaniem twojej roli, spróbuj jeszcze raz.')
    }
}