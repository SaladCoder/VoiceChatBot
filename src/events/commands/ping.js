const logger = require('../../config/logger');
const intLang = require('../../locale/language');

// Command Module
module.exports = {
    name: 'ping',
    description: 'Check the time it takes the bot to reply and also the bots ping',
    allowDisable: true,
    staffOnly: true,
    hide: true,
    cooldown: 10,
    execute(client, message) {
        message.channel.send(`Response time \`${Date.now() - message.createdTimestamp}ms\`\nAPI Response time \`${Math.round(client.ws.ping)}ms\``)
            .catch(() => logger.error(intLang('discord._errors.messageIneffective', message.channel.id)+ ' [0039]'));
    }
};