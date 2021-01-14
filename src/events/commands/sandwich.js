const {messageEmbedSend} = require('../../utilities/utilities');
const intLang = require('../../locale/language');
const {discord} = require('../../config/config');
const {dumpEvent} = require('../../utilities/dumpEvent');

// Command Module
module.exports = {
    name: '--!!sandwich',
    description: 'sandwich command, is all I need say!',
    allowDisable: true,
    hide: true,
    aliases: ['defeated'],
    cooldown: 1337,
    execute(client, message) {
        message.channel.send('https://www.youtube.com/watch?v=dkhOXRWnFkc');
    }
};
