const path = require('path');
const intLang = require(path.join(__dirname, '../..', 'locale', 'language'));
const {dumpEvent} = require(path.join(__dirname, '../..', 'utilities', 'dumpEvent'));
const {messageEmbedSend} = require(path.join(__dirname, '../..', 'utilities', 'utilities'));

// Command Module
module.exports = {
    name: 'credits',
    description: 'Displays and credits awesome contributors who worked on the development.',
    allowDisable: true,
    hide: true,
    cooldown: 60,
    execute(client, message) {

        // Message Embed Response
        messageEmbedSend(client, message.channel, true, intLang('commands.credits.embedMessage.title', client.user.username), intLang('commands.credits.embedMessage.description'));
        dumpEvent.dumpCommand(client, message, 'yellow', this.name);
    }
};
