const fs = require('fs');
const path = require('path');
const {MessageEmbed} = require('discord.js');
const logger = require(path.join(__dirname, '..', 'config', 'logger'));
const intLang = require(path.join(__dirname, '..', 'locale', 'language'));

// Event Emitting
module.exports = {

    // Start of our dump functions \o/ woo
    dumpEvent: {
        
        // If opt-in for Channel log dump, then we log the creation and removing of voice channels
        dumpChannel: (client, arg, colour, type, reason) => {
            
            // Read our config file for the text channel set for dumping	            
            fs.readFile(path.join(__dirname, '..', 'config', 'config.json'), function readFileJson(error, dump) {

                // Error Handle (╯°□°）╯︵ ┻━┻	
                if (error) return logger.error(intLang('utilities._errors.dumpJoinAndLeave', error)+ ' [0113]');

                // Grab our channelID if exists
                dump = JSON.parse(dump);

                // Not much point to this statement, I guess it saves some runtime ¯\_(ツ)_/¯
                if (dump.dumpChannel.channelID === '') return;
                dumpChannelID = dump.dumpChannel.channelID;

                // Nice switch statement, so when we call our function I don't have to look up the HEX code every single F&$%&$% TIME!
                switch(colour){
                    case 'green':
                        colour = '#56E39F';
                        break;
                    case 'yellow':
                        colour = '#F9C22E';
                        break;
                    case 'black':
                        colour = '#0C090D';
                        break;
                    case 'red':
                        colour = '#E01A4F';
                        break;
                    default:
                        colour = '#38FEDC';
                }
                try {

                    // Find the Dump channel for sending the reply
                    const channelDump = client.channels.cache.find(channel => channel.id === dumpChannelID)

                    // If no match, then don't send anything
                    if (!channelDump) return;
                    const embedMessage = new MessageEmbed()
                        .setColor(`${colour}`)
                        .setTitle('Channel Manager Event')
                        .setAuthor(`${arg.member.user.username}`, arg.member.user.avatarURL({format: 'png', size: 64}))
                        .addFields(
                            { name: 'Event Type', value: 'Channel Manager' },
                            { name: '\u200B', value: '\u200B' },
                            { name: 'Type', value: `${type}`, inline: true },
                            { name: 'Reason', value: `${reason ? `${reason}` : 'User Input' }`, inline: true },
                        )
                        .setTimestamp()
                        .setFooter(`Client user ID: ${arg.member.user.id}`);
                    return channelDump.send(embedMessage) // Success Response ┬─┬ ノ( ゜-゜ノ)
                        .catch(error => logger.error(intLang('discord._errors.messageIneffective', error)+ ' [0114]')); // Error Handle (╯°□°）╯︵ ┻━┻
                } catch(error) {

                    // If for some reason the sun has come down to earth and my goldfish are no longer safe, Catch the error 'n' Save the Fish!!!
                    return logger.error(intLang('utilities.DumpEvent.dumpChannelEmbedIneffective', error)+ ' [0115]');
                }
            });
        },

        // If opt-in for Channel log dump, then we log the joining and leaving of voice channels
        dumpJoinAndLeave: (client, arg, colour, type) => {

            // Read our config file for the text channel set for dumping	            
            fs.readFile(path.join(__dirname, '..', 'config', 'config.json'), function readFileJson(error, dump) {

                // Error Handle (╯°□°）╯︵ ┻━┻	
                if (error) return logger.error(intLang('utilities._errors.dumpJoinAndLeave', error)+ ' [0116]');

                // Grab our channelID if exists
                dump = JSON.parse(dump);

                // Not much point to this statement, I guess it saves some runtime ¯\_(ツ)_/¯
                if (dump.dumpChannel.channelID === '') return;
                dumpChannelID = dump.dumpChannel.channelID;

                // Nice switch statement, so when we call our function I don't have to look up the HEX code every single F&$%&$% TIME!
                switch(colour){
                    case 'green':
                        colour = '#56E39F';
                        break;
                    case 'yellow':
                        colour = '#F9C22E';
                        break;
                    case 'black':
                        colour = '#0C090D';
                        break;
                    case 'red':
                        colour = '#E01A4F';
                        break;
                    default:
                        colour = '#38FEDC';
                }
                try {
                    const channelDump = client.channels.cache.find(channel => channel.id === dumpChannelID)
                    const voiceChannel = arg.channel;

                    // If no match, then don't send anything
                    if (!channelDump) return;
                    const embedMessage = new MessageEmbed()
                        .setColor(`${colour}`)
                        .setTitle('Voice Connection Event')
                        .setAuthor(`${arg.member.user.username}`, arg.member.user.avatarURL({format: 'png', size: 64}))
                        .addFields(
                            { name: 'Event Type', value: 'Connection' },
                            { name: '\u200B', value: '\u200B' },
                            { name: 'Type', value: `${type}`, inline: true },
                            { name: 'Channel', value: `${voiceChannel.name}`, inline: true },
                        )
                        .setTimestamp()
                        .setFooter(`Client user ID: ${arg.member.user.id}`);
                    return channelDump.send(embedMessage) // Success Response ┬─┬ ノ( ゜-゜ノ)
                        .catch(error => logger.error(intLang('discord._errors.messageIneffective', error)+ ' [0117]')); // Error Handle (╯°□°）╯︵ ┻━┻
                } catch(error) {

                    // If for some reason the sun has come down to earth and my goldfish are no longer safe, Catch the error 'n' Save the Fish!!!
                    return logger.error(intLang('utilities.DumpEvent.dumpJoinAndLeaveEmbedIneffective', error)+ ' [0118]');
                }
            });
        },

        // If opt-in for Channel log dump, then we log any commands used by this bot
        dumpCommand: (client, arg, colour, command, member, role) => {

            // Read our config file for the text channel set for dumping	            
            fs.readFile(path.join(__dirname, '..', 'config', 'config.json'), function readFileJson(error, dump) {

                // Error Handle (╯°□°）╯︵ ┻━┻	
                if (error) return logger.error(intLang('utilities._errors.dumpJoinAndLeave', error)+ ' [0119]');

                // Grab our channelID if exists
                dump = JSON.parse(dump);

                // Not much point to this statement, I guess it saves some runtime ¯\_(ツ)_/¯
                if (dump.dumpChannel.channelID === '') return;
                dumpChannelID = dump.dumpChannel.channelID;
            
                // Nice switch statement, so when we call our function I don't have to look up the HEX code every single F&$%&$% TIME!
                switch(colour){
                    case 'green':
                        colour = '#56E39F';
                        break;
                    case 'yellow':
                        colour = '#F9C22E';
                        break;
                    case 'purple':
                        colour = '#c203fc';
                        break;
                    case 'black':
                        colour = '#0C090D';
                        break;
                    case 'red':
                        colour = '#E01A4F';
                        break;
                    default:
                        colour = '#38FEDC';
                }
                try {
                    const channelDump = client.channels.cache.find(channel => channel.id === dumpChannelID)

                    // If no match, then don't send anything
                    if (!channelDump) return;
                    const embedMessage = new MessageEmbed()
                        .setColor(`${colour}`)
                        .setTitle('Command Event')
                        .setAuthor(`${arg.member.user.username}`, arg.member.user.avatarURL({format: 'png', size: 64}))
                        .addFields(
                            { name: 'Command', value: `${command}`, inline: true },
                            { name: `${role === 'true' ? 'On Role' : 'On Member'}`, value: `${member ? `${member}` : 'No Member'}`, inline: true },
                            { name: '\u200B', value: '\u200B' },
                            { name: 'Invoke Text Channel', value: `${arg.channel.name ? `${arg.channel.name}` : 'Error, no text channel o.O'}`, inline: true },
                            { name: 'Invoke VC Channel', value: `${arg.member.voice.channel ? `${arg.member.voice.channel.name}` : 'No Voice Channel'}`, inline: true },
                        )
                        .setTimestamp()
                        .setFooter(`Client user ID: ${arg.member.user.id}`);
                    return channelDump.send(embedMessage) // Success Response ┬─┬ ノ( ゜-゜ノ)
                        .catch(error => logger.error(intLang('discord._errors.messageIneffective', error)+ ' [0120]')); // Error Handle (╯°□°）╯︵ ┻━┻
                } catch(error) {

                    // If for some reason the sun has come down to earth and my goldfish are no longer safe, Catch the error 'n' Save the Fish!!!
                    return logger.error(intLang('utilities.DumpEvent.dumpCommandsEmbedIneffective', error)+ ' [0121]');
                }
            });
        }
    }
};