const {discord} = require('../../config/config');
const logger = require('../../config/logger');
const intLang = require('../../locale/language');
const fs = require('fs');

// Command Module
module.exports = {
    name: 'setlogchannel',
    description: 'Sets a channel for log dumps for all action and commands',
    allowDisable: false,
    arguments: true,
    managerOnly: true,
    hide: true,
    usage: '<optional: remove> <ChannelID>',
    cooldown: 5,
    execute(client, message) {

        // Message Commands Parser
        const args = message.content.slice(discord.prefix.length).trim().split(/\s+/g);
        const newLogChannel = args[1].toLowerCase();

        // Check the member type remove
        if (args.length === 3 && args[1].toLowerCase() !== 'remove') return message.reply(intLang('commands.setLogChannel._errors.wrongOption', discord.prefix))
            .catch(() => logger.error(intLang('discord._errors.messageIneffective', message.channel.id)+ ' [0054]'));

        // Do a search to make sure the channel exists and it is the right type [Text]
        const channel = message.guild.client.channels.cache.find(channel => channel.id === newLogChannel && channel.type === 'text');

        // Read our config file for the text channel set for dumping (Why does dumping sound rude to me <.<)
        fs.readFile(`${__dirname}../../../config/config.json`, function readFileJson(error, dump) {

            // Error Handle (╯°□°）╯︵ ┻━┻
            if (error) return logger.error(intLang('commands.setLogChannel._errors.unableToReadFile', error)+ ' [0055]');

            // Grab our channelID if exists
            dump = JSON.parse(dump);

            // Error Handle (╯°□°）╯︵ ┻━┻
            if (!channel && newLogChannel !== 'remove') {
                return message.reply(intLang('commands.setLogChannel.failed.unableToSetLogChannel'));
            }else if (newLogChannel === 'remove' && dump.dumpChannel.channelID !== '') {
                dump.dumpChannel.channelID = '';
                setLogType = 'remove'
            }else if (newLogChannel === 'remove' && dump.dumpChannel.channelID === '') {
                return message.reply(intLang('commands.setLogChannel.failed.nothingToRemove'));
            }else if (dump.dumpChannel.channelID === channel.id) {
                return message.reply(intLang('commands.setLogChannel.failed.logChannelAlreadyAdded'));
            }else{

                // Finally if all checks are valid, we can pass the new channelID to fs.writeFile
                dump.dumpChannel.channelID = channel.id;
                setLogType = 'new'
            }

            // Write to file our new Channel ID for the log dumps
            fs.writeFile(`${__dirname}../../../config/config.json`, JSON.stringify(dump, null, "\t"), error => {	
                if (error) return logger.error(intLang('commands.setLogChannel.failed.unableToWriteFile', error)+ ' [0056]');
            });

            // Give the appropriate response
            if (setLogType === 'remove') message.react('✅')
                .then(() => message.reply(intLang('commands.setLogChannel.success.logChannelRemove'))) // Success Response ┬─┬ ノ( ゜-゜ノ)
                .catch(() => logger.error(intLang('discord._errors.messageReactIneffective', message.channel.id)+ ' [0057]')); // Error Handle (╯°□°）╯︵ ┻━┻
            if (setLogType === 'new') message.react('✅')
                .then(() => message.reply(intLang('commands.setLogChannel.success.newLogChannelSet'))) // Success Response ┬─┬ ノ( ゜-゜ノ)
                .catch(() => logger.error(intLang('discord._errors.messageReactIneffective', message.channel.id)+ ' [0058]')); // Error Handle (╯°□°）╯︵ ┻━┻
        });
    }
};