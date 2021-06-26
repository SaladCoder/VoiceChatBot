const path = require('path');
const logger = require(path.join(__dirname, '../..', 'config', 'logger'));
const intLang = require(path.join(__dirname, '../..', 'locale', 'language'));
const {discord} = require(path.join(__dirname, '../..', 'config', 'config'));
const {dumpEvent} = require(path.join(__dirname, '../..', 'utilities', 'dumpEvent'));
const {dbGuilds} = require(path.join(__dirname, '../..', 'utilities', 'datastore'));

// Command Module
module.exports = {
    name: 'setcommandchannel',
    description: 'Sets one or more Text channels to accept any actions or commands for the Bot.',
    allowDisable: false,
    arguments: true,
    managerOnly: true,
    hide: true,
    usage: '<optional: remove> <ChannelID>',
    cooldown: 5,
    execute(client, message) {

        // Message Commands Parser
        const args = message.content.slice(discord.prefix.length).trim().split(/\s+/g);
        const newCommandChannel = args[1].toLowerCase();

        // If command arg1 was passed removed, check for arg2 is not undefined, also check the right options was used [remove]
        if (args.length === 3 && args[1].toLowerCase() !== 'remove') return message.reply(intLang('commands.setCommandChannel._errors.wrongOption', discord.prefix))
            .catch(() => logger.error(intLang('discord._errors.messageIneffective', message.channel.id)+ ' [0040]'));

        if (typeof args[2] === 'undefined' && newCommandChannel === 'remove') return message.reply(intLang('commands.setCommandChannel._errors.removeArgNotSet', discord.prefix))
            .catch(() => logger.error(intLang('discord._errors.messageIneffective', message.channel.id)+ ' [0041]'));

        if (newCommandChannel === 'remove') removeCommandChannel = args[2].toLowerCase();

        // Do a search to make sure the channel exists and it is the right type [Text]
        const channel = message.guild.client.channels.cache.find(channel => channel.id === newCommandChannel && channel.type === 'text');

        // Check if the channel exists
        if (!channel && newCommandChannel !== 'remove') return message.reply(intLang('commands.setCommandChannel._errors.unableToSetCommandChannel'))
            .catch(() => logger.error(intLang('discord._errors.messageIneffective', message.channel.id)+ ' [0042]'));

        // Adding a new command channel
        if (newCommandChannel !== 'remove') {

            // Pre check if our command channel has already been added
            dbGuilds.find({extraCommandChannel: newCommandChannel}, (error, result) => {
                if (error) return logger.error(intLang('nedb._errors.setCommandChannelFindIneffective', error)+ ' [0043]');

                if (result.length > 0) return message.reply(intLang('commands.setCommandChannel.failed.commandChannelAlreadyAdded'))
                    .catch(() => logger.error(intLang('discord._errors.messageIneffective', message.channel.id)+ ' [0044]'));

                // Insert the new command channel if our check passed
                dbGuilds.insert({extraCommandChannel: newCommandChannel}, error => {
                    if (error) return logger.error(intLang('nedb._errors.setCommandChannelInsertIneffective', error)+ ' [0045]');

                    message.react('✅')
                        .catch(() => logger.error(intLang('discord._errors.messageReactIneffective', message.channel.id)+ ' [0046]'));

                    message.reply(intLang('commands.setCommandChannel.success.newCommandChannelSet'))
                        .then(() => dumpEvent.dumpCommand(client, message, 'black', `${this.name}\n<#${newCommandChannel}>`))
                        .catch(() => logger.error(intLang('discord._errors.messageIneffective', message.channel.id)+ ' [0047]'));
                });
            });

        // Removing a command channel
        } else if (newCommandChannel === 'remove' && typeof removeCommandChannel !== 'undefined'){

            // Pre check if our command channel doesn't exists in our db then return
            dbGuilds.find({extraCommandChannel: removeCommandChannel}, (error, result) => {
                if (error) return logger.error(intLang('nedb._errors.setCommandChannelFindIneffective', error)+ ' [0048]');

                if (result.length < 1) return message.reply(intLang('commands.setCommandChannel.failed.nothingToRemove'))
                    .catch(() => logger.error(intLang('discord._errors.messageIneffective', message.channel.id)+ ' [0049]'));
                
                // Remove the channel as a command channel if our checks passed.
                dbGuilds.remove({extraCommandChannel: removeCommandChannel}, { multi: true }, error => {
                    if (error) return logger.error(intLang('nedb._errors.setCommandChannelRemoveIneffective', error)+ ' [0050]');

                    message.react('✅')
                        .catch(() => logger.error(intLang('discord._errors.messageReactIneffective', message.channel.id)+ ' [0051]'));
                        
                    message.reply(intLang('commands.setCommandChannel.success.commandChannelRemove'))
                        .then(() => dumpEvent.dumpCommand(client, message, 'black', `${this.name} ${newCommandChannel}\n<#${removeCommandChannel}>`))
                        .catch(() => logger.error(intLang('discord._errors.messageIneffective', message.channel.id)+ ' [0052]'));
                });
            });
        } else {
            return message.reply(intLang('commands.setCommandChannel.failed.incorrectSyntax'))
                .catch(() => logger.error(intLang('discord._errors.messageIneffective', message.channel.id)+ ' [0053]'));
        }
    }
};