const path = require('path');
const intLang = require(path.join(__dirname, '../..', 'locale', 'language'));
const {discord} = require(path.join(__dirname, '../..', 'config', 'config'));
const {dumpEvent} = require(path.join(__dirname, '../..', 'utilities', 'dumpEvent'));
const {messageEmbedSend} = require(path.join(__dirname, '../..', 'utilities', 'utilities'));

// Command Module
module.exports = {
    name: 'managerhelp',
    description: 'Displays list of commands available to Bot Manager.',
    allowDisable: false,
    managerOnly: true,
    hide: true,
    aliases: ['mhelp'],
    cooldown: 120,
    execute(client, message) {

        // Command List
        const commandList = client.commands.reduce((accumulator, command) => {
            if (command.staffOnly && !command.adminOnly) accumulator.push(`**\`${discord.prefix}${command.name}${command.usage ? ` ${command.usage}` : ''}\`** ${command.aliases ? `or **\`${discord.prefix}${command.aliases}\`**`:''}\n${command.description}\n\n`);
            if (command.managerOnly && !command.adminOnly) accumulator.push(`**\`${discord.prefix}${command.name}${command.usage ? ` ${command.usage}` : ''}\`** ${command.aliases ? `or **\`${discord.prefix}${command.aliases}\`**`:''}\n${command.description}\n\n`);
            return accumulator;
        }, []);

        // Message Embed Response
        messageEmbedSend(client, message.channel, true, intLang('commands.managerCommands.embedMessage.title', client.user.username), intLang('commands.managerCommands.embedMessage.description', commandList.join(' '), discord.prefix));
        dumpEvent.dumpCommand(client, message, 'yellow', this.name);
    }
};
