const path = require('path');
const logger = require(path.join(__dirname, '../..', 'config', 'logger'));
const intLang = require(path.join(__dirname, '../..', 'locale', 'language'));
const {discord} = require(path.join(__dirname, '../..', 'config', 'config'));
const {messageEmbedSend} = require(path.join(__dirname, '../..', 'utilities', 'utilities'));
const {dbGuilds} = require(path.join(__dirname, '../..', 'utilities', 'datastore'));

// Command Module
module.exports = {
    name: 'setup',
    description: 'For initial setup of the Voice Channel System and also to access the repair option if already setup.',
    allowDisable: false,
    adminOnly: true,
    hide: true,
    cooldown: 10,
    execute(client, message) {

        // Message Reaction Function
        async function messageReaction(reactMessage, repairOption) {
            const automaticEmoji = '🖥️';
            const manualEmoji = '⚙️';
            const repairEmoji = '🔧';
            const resetEmoji = '🔄';

            // Message Reaction Insertion
            switch (repairOption){
                case true:

                    // If the server is setup, we'll switch this case
                    await reactMessage.react(repairEmoji)
                        .catch(() => logger.error(intLang('discord._errors.messageReactIneffective', message.channel.id)+ ' [0059]'));
                    await reactMessage.react(resetEmoji)
                        .catch(() => logger.error(intLang('discord._errors.messageReactIneffective', message.channel.id)+ ' [0060]'));
                    break;
                    
                default:
                    await reactMessage.react(automaticEmoji)
                        .catch(() => logger.error(intLang('discord._errors.messageReactIneffective', message.channel.id)+ ' [0061]'));
                    await reactMessage.react(manualEmoji)
                        .catch(() => logger.error(intLang('discord._errors.messageReactIneffective', message.channel.id)+ ' [0062]'));
            };

            // Await Message Reaction
            reactMessage.awaitReactions((reaction, member) => [automaticEmoji, manualEmoji, repairEmoji, resetEmoji].includes(reaction.emoji.name) && member.id === message.author.id, {max: 1, time: 120000, errors: ['time']})
                .then(collection => {
                    const reaction = collection.first();

                    // Message Reaction Responses
                    if (reaction.emoji.name === automaticEmoji) return automaticSetup();
                    if (reaction.emoji.name === manualEmoji) return manualSetup('categoryChannel');
                    if (reaction.emoji.name === repairEmoji && repairOption) return setupRepair();
                    if (reaction.emoji.name === resetEmoji && repairOption) return resetSetup();
                }).catch(() => message.reply(intLang('commands.setup._errors.reactionUnresponsive')))
                    .catch(() => logger.error(intLang('discord._errors.messageIneffective', message.channel.id)+ ' [0160]'));
        };

        // Setup Repair Function
        function setupRepair() {

            // dbGuild Query
            dbGuilds.findOne({id: message.guild.id}, async (error, guildResult) => {
                if (error) return logger.error(intLang('nedb._errors.guildsFindOneIneffective', error)+ ' [0063]');

                // I'm not sure of a reason this would run, better save than sorry. [If DB doesn't have a setup, then return]
                if (!guildResult) return logger.error(intLang('commands.setup.repair._errors.noRepairRequired')+ ' [0064]');
                
                // Permission needed for channel creations
                const clientPermissions = ['MANAGE_CHANNELS', 'SEND_MESSAGES', 'VIEW_CHANNEL', 'CONNECT', 'MOVE_MEMBERS', 'ADD_REACTIONS'];

                // Do a search to find our Guild related channels
                const channelCategory = await message.guild.channels.cache.find(channelCategory => channelCategory.id === guildResult.channels.category);
                const textChannel = await message.guild.channels.cache.find(textChannel => textChannel.id === guildResult.channels.text);
                const voiceChannel = await message.guild.channels.cache.find(voiceChannel => voiceChannel.id === guildResult.channels.voice);

                // Quick check to see if the Repair is needed, return if NOT
                if (channelCategory && textChannel && voiceChannel && textChannel.parentID === channelCategory.id && voiceChannel.parentID === channelCategory.id) return message.reply(intLang('commands.setup.repair._errors.noRepairApplicable'))
                    .catch(() => logger.error(intLang('discord._errors.messageIneffective', message.channel.id)+ ' [0161]'));

                // Category Check does exists
                if (!channelCategory) newChannelCategory = await message.guild.channels.create(intLang('discord.channels.category'), {type: 'category', permissionOverwrites: [{id: message.guild.members.cache.get(client.user.id).id, allow: clientPermissions}, {id: message.guild.roles.everyone.id, allow: ['CONNECT', 'SEND_MESSAGES']}]})
                    .catch(error => {
                        logger.error(intLang('discord._errors.channelCreateIneffective', error)+ ' [0065]');
                        return message.reply(intLang('commands.setup.repair._errors.commandIneffective'))
                            .catch(() => logger.error(intLang('discord._errors.messageIneffective', message.channel.id)+ ' [0162]'));
                    });
                else newChannelCategory = channelCategory;
                
                // Text Check does exists
                if (!textChannel) newTextChannel = await message.guild.channels.create(intLang('discord.channels.text'), {type: 'text', parent: channelCategory, permissionOverwrites: [{id: message.guild.members.cache.get(client.user.id).id, allow: clientPermissions}, {id: message.guild.roles.everyone.id, allow: ['CONNECT', 'SEND_MESSAGES']}]})
                    .catch(error => {
                        logger.error(intLang('discord._errors.channelCreateIneffective', error)+ ' [0066]');
                        return message.reply(intLang('commands.setup.repair._errors.commandIneffective'))
                            .catch(() => logger.error(intLang('discord._errors.messageIneffective', message.channel.id)+ ' [0163]'));
                    });
                else newTextChannel = textChannel;
                
                // Voice Check does exists
                if (!voiceChannel) newVoiceChannel = await message.guild.channels.create(intLang('discord.channels.voice'), {type: 'voice', parent: channelCategory, permissionOverwrites: [{id: message.guild.members.cache.get(client.user.id).id, allow: clientPermissions}, {id: message.guild.roles.everyone.id, allow: ['CONNECT', 'SEND_MESSAGES']}]})
                    .catch(error => {
                        logger.error(intLang('discord._errors.channelCreateIneffective', error)+ ' [0067]');
                        return message.reply(intLang('commands.setup.repair._errors.commandIneffective'))
                            .catch(() => logger.error(intLang('discord._errors.messageIneffective', message.channel.id)+ ' [0164]'));
                    });
                else newVoiceChannel = voiceChannel;
                
                // Move our Text and Voice channels if they're in the wrong Category
                if (newTextChannel.parentID !== newChannelCategory.id || !newTextChannel.parentID) newTextChannel.setParent(newChannelCategory);
                if (newVoiceChannel.parentID !== newChannelCategory.id || !newVoiceChannel.parentID) newVoiceChannel.setParent(newChannelCategory);
                
                // If new channels were made, update their ID's
                dbGuilds.update({ id: message.guild.id }, { $set: { id: message.guild.id, name: message.guild.name, channels: { category: newChannelCategory.id, text: newTextChannel.id, voice: newVoiceChannel.id } } }, {}, error => {
                    if (error) return logger.error(intLang('nedb._errors.guildsUpdateIneffective', error)+ ' [0068]');
                });

                // Success Response
                messageEmbedSend(client, message.channel, false, intLang('commands.setup.repair.success.embedMessageRepair.title', client.user.username), intLang('commands.setup.repair.success.embedMessageRepair.description'));
            });
        };

        // Reset Setup Function
        function resetSetup() {

            // Remove the DB entry for the setup and allow for a fresh install
            dbGuilds.remove({ id: message.guild.id, name: message.guild.name }, {multi: true}, error => {
                if (error) return logger.error(intLang('nedb._errors.guildsRemoveIneffective', error)+ ' [0069]');
            });

            // Success Response
            messageEmbedSend(client, message.channel, false, intLang('commands.setup.repair.success.embedMessageReset.title', client.user.username), intLang('commands.setup.repair.success.embedMessageReset.description'));
        }

        // Automatic Setup Function
        async function automaticSetup() {
            const clientPermissions = ['MANAGE_CHANNELS', 'SEND_MESSAGES', 'VIEW_CHANNEL', 'CONNECT', 'MOVE_MEMBERS', 'ADD_REACTIONS'];

            // Category Channel Creation
            const channelCategory = await message.guild.channels.create(intLang('discord.channels.category'), {type: 'category', permissionOverwrites: [{id: message.guild.members.cache.get(client.user.id).id, allow: clientPermissions}, {id: message.guild.roles.everyone.id, allow: ['CONNECT', 'SEND_MESSAGES']}]})
                .catch(error => {
                    logger.error(intLang('discord._errors.channelCreateIneffective', error)+ ' [0070]');
                    return message.reply(intLang('commands.setup._errors.commandIneffective'))
                        .catch(() => logger.error(intLang('discord._errors.messageIneffective', message.channel.id)+ ' [0165]'));
                });

            // Category Text Creation
            const channelText = await message.guild.channels.create(intLang('discord.channels.text'), {type: 'text', parent: channelCategory, permissionOverwrites: [{id: message.guild.members.cache.get(client.user.id).id, allow: clientPermissions}, {id: message.guild.roles.everyone.id, allow: ['CONNECT', 'SEND_MESSAGES']}]})
                .catch(error => {
                    logger.error(intLang('discord._errors.channelCreateIneffective', error)+ ' [0071]');
                    return message.reply(intLang('commands.setup._errors.commandIneffective'))
                        .catch(() => logger.error(intLang('discord._errors.messageIneffective', message.channel.id)+ ' [0166]'));
                });

            // Category Voice Creation
            const channelVoice = await message.guild.channels.create(intLang('discord.channels.voice'), {type: 'voice', parent: channelCategory, permissionOverwrites: [{id: message.guild.members.cache.get(client.user.id).id, allow: clientPermissions}, {id: message.guild.roles.everyone.id, allow: ['CONNECT', 'SEND_MESSAGES']}]})
                .catch(error => {
                    logger.error(intLang('discord._errors.channelCreateIneffective', error)+ ' [0072]');
                    return message.reply(intLang('commands.setup._errors.commandIneffective'))
                        .catch(() => logger.error(intLang('discord._errors.messageIneffective', message.channel.id)+ ' [0167]'));
                });

            // NeDB Guilds Insertion
            dbGuilds.insert({id: message.guild.id, name: message.guild.name, channels: {category: channelCategory.id, text: channelText.id, voice: channelVoice.id}}, error => {
                if (error) return logger.error(intLang('nedb._errors.guildsInsertIneffective', error)+ ' [0073]');

                // Success Response
                messageEmbedSend(client, message.channel, false, intLang('commands.setup.automatic.success.embedMessage.title'), intLang('commands.setup.automatic.success.embedMessage.description', discord.prefix));
            });
        };

        // Manual Setup Function
        function manualSetup(section, errorMessage) {

            // Error Message
            if (errorMessage) message.channel.send(intLang(`commands.setup.manual.${section}._errors.${errorMessage}`, message.author))
                .then(responseMessage => awaitManualSetupMessages(section, responseMessage))
                .catch(() => logger.error(intLang('discord._errors.messageIneffective', message.channel.id)+ ' [0074]'));

            // Section Message
            else messageEmbedSend(client, message.channel, false, intLang(`commands.setup.manual.${section}.embedMessage.title`), intLang(`commands.setup.manual.${section}.embedMessage.description`))
                .then(responseMessage => awaitManualSetupMessages(section, responseMessage));
        };

        // Manual Setup Await Messages Function
        let manualSettings = {};
        async function awaitManualSetupMessages(section, responseMessage) {

            // Message Await
            if (section !== 'permissions') responseMessage.channel.awaitMessages(msg => msg.author.id === message.author.id, {max: 1, time: 600000, errors: ['time']})
                .then(responses => {
                    const response = responses.first();
                    if (response.content.toLowerCase() === 'cancel') return message.reply(intLang('commands.setup.manual._errors.processCancelled'))
                        .catch(() => logger.error(intLang('discord._errors.messageIneffective', message.channel.id)+ ' [0168]'));
                    return verifyManualSetup(section, response);
                }).catch(() => message.reply(intLang('commands.setup._errors.responseTimeout')))
                    .catch(() => logger.error(intLang('discord._errors.messageIneffective', message.channel.id)+ ' [0169]'));

            // Message Reaction Await
            else {
                
                // Message Reaction Insertion
                await responseMessage.react('✅')
                    .catch(() => logger.error(intLang('discord._errors.messageReactIneffective', message.channel.id)+ ' [0075]'));

                // Await Message Reaction
                responseMessage.awaitReactions((reaction, member) => reaction.emoji.name === '✅' && member.id === message.author.id, {max: 1, time: 600000, errors: ['time']})
                    .then(() => {

                        // NeDB Guilds Insertion
                        dbGuilds.insert({id: message.guild.id, name: message.guild.name, channels: {category: manualSettings.category, text: manualSettings.text, voice: manualSettings.voice}}, error => {
                            if (error) return logger.error(intLang('nedb._errors.guildsInsertIneffective', error)+ ' [0076]');
            
                            // Success Response
                            messageEmbedSend(client, message.channel, false, intLang('commands.setup.manual.success.embedMessage.title'), intLang('commands.setup.manual.success.embedMessage.description', discord.prefix));
                        });
                    }).catch(() => message.reply(intLang('commands.setup._errors.responseTimeout')))
                        .catch(() => logger.error(intLang('discord._errors.messageIneffective', message.channel.id)+ ' [0170]'));
            }
        };

        // Manual Setup Verification
        function verifyManualSetup(section, response) {
            switch(section) {

                // Category Channel Setup Verification
                case 'categoryChannel':
                    let channelCategory = message.guild.channels.cache.get(response.content);
                    if (!channelCategory) return manualSetup('categoryChannel', 'unknownChannel');
                    if (channelCategory.type !== 'category') return manualSetup('categoryChannel', 'incorrectChannelType');
                    manualSettings.category = channelCategory.id;
                    return manualSetup('voiceChannel');

                // Voice Channel Setup Verification
                case 'voiceChannel':
                    let channelVoice = message.guild.channels.cache.get(response.content);
                    if (!channelVoice) return manualSetup('voiceChannel', 'unknownChannel');
                    if (channelVoice.type !== 'voice') return manualSetup('voiceChannel', 'incorrectChannelType');
                    if (channelVoice.parentID !== manualSettings.category) return manualSetup('voiceChannel', 'incorrectChannelCategory');
                    manualSettings.voice = channelVoice.id;
                    return manualSetup('textChannel');

                // Text Channel Setup Verification
                case 'textChannel':
                    let channelText = message.guild.channels.cache.get(response.content);
                    if (!channelText) return manualSetup('textChannel', 'unknownChannel');
                    if (channelText.type !== 'text') return manualSetup('textChannel', 'incorrectChannelType');
                    if (channelText.parentID !== manualSettings.category) return manualSetup('textChannel', 'incorrectChannelCategory');
                    manualSettings.text = channelText.id;
                    return manualSetup('permissions');
            }
        };
        
        // NeDB Guilds Query & Verification
        dbGuilds.findOne({id: message.guild.id}, (error, Guild) => {
            if (error) return logger.error(intLang('nedb._errors.guildsFindOneIneffective', error)+ ' [0077]');

            // If the server is setup then, Message Embed Response for Setup Repair
            if (Guild) return messageEmbedSend(client, message.channel, true, intLang('commands.setup.repair.embedMessage.title', client.user.username), intLang('commands.setup.repair.embedMessage.description'))
                .then(embedMessage => messageReaction(embedMessage, true));

            // Message Embed Response for Setup
            messageEmbedSend(client, message.channel, true, intLang('commands.setup.embedMessage.title', client.user.username), intLang('commands.setup.embedMessage.description'))
                .then(embedMessage => messageReaction(embedMessage));
        });
    }
};
