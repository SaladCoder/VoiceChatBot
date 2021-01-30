const {dbGuilds, dbVoiceChannels, dbNewMemberHelp} = require('../utilities/datastore');
const {messageEmbedSend} = require('../utilities/utilities');
const {dumpEvent} = require('../utilities/dumpEvent');
const {discord, channelTemplate} = require('../config/config');
const logger = require('../config/logger');
const intLang = require('../locale/language');
const fs = require('fs');

// Event Emitting
module.exports = (client, oldState, newState) => {

    // Connection logs for dumpEvent [If opt-in for]
    if (oldState.channelID === null && newState.channelID !== null) dumpEvent.dumpJoinAndLeave(client, newState, 'green', 'Connect');
    if (oldState.channelID !== null && newState.channelID === null) dumpEvent.dumpJoinAndLeave(client, oldState, 'red', 'Disconnect');

    async function createVoiceChannel(mainGuild, overFlowData, voiceChannelData) {
        const guild = newState.guild;
        const member = newState.member;
        const channelCategory = (!overFlowData) ? await guild.channels.cache.get(mainGuild.channels.category) : await guild.channels.cache.get(overFlowData.channels.category);

        // If the member had a previous Channel, return, this prevents some funky stuff happening
        if (voiceChannelData) return requestVoiceChannelDeletion(mainGuild, false);

        // voiceSlowDown for voice channel creations
        if (await client.voiceSlowDown.has(newState.member.id) && Date.now() < client.voiceSlowDown.get(newState.member.id)) return;
        else {

            // If our mainGuild Category is full, return to function requestDataOverFlow for a new category
            if (channelCategory.children.size >= 30 && !overFlowData) return requestDataOverFlow(mainGuild, voiceChannelData);

            // voiceSlowDown add if member doesn't have one.
            await client.voiceSlowDown.delete(newState.member.id);
            await client.voiceSlowDown.set(newState.member.id, Date.now() + channelTemplate.creationSlowDownSeconds * 1000);

            // Grab our config file for channel creation
            const configFile = JSON.parse(fs.readFileSync(`${__dirname}/../config/config.json`, 'utf8'));

            // Voice Channel Creation
            await guild.channels.create(intLang('discord.channels.voiceUser', member.user.username), {type: 'voice', parent: channelCategory, userLimit: configFile.channelTemplate.channelSlots, reason: intLang('events.voiceStateUpdate.channelVoiceReason', member.user.tag)})
                .then(async channel => {
                    
                    // Member Voice Channel Movement
                    await member.voice.setChannel(channel)
                        .catch(() => {
                            logger.info(intLang('discord._errors.channelMoveIneffective', member.id)+ ' [0230]');

                            // If moving the member was unsuccessful, we call for the channel to be removed.
                            return voiceChannelMoveFailed(mainGuild, channel);
                        })
                    return channel;
                })
                .then(async channel => {

                    // Set a lock on the channel if true is set in the config
                    if (configFile.channelTemplate.lockStatus === 'true') await channel.updateOverwrite(guild.roles.everyone.id, {CONNECT: false})
                        .catch(() => logger.info(intLang('discord._errors.channelUpdateOverwriteIneffective', channel.id)+ ' [0231]'));

                    // Log our new channel creation to the Dump channel [If opt-in for]
                    dumpEvent.dumpChannel(client, newState, 'green', 'Channel Creation');

                    // NeDB VoiceChannels Insertion
                    dbVoiceChannels.insert({ id: channel.id, guild: guild.id, channelOwner: member.id }, error => {
                        if (error) return logger.error(intLang('nedb._errors.voiceChannelsInsertIneffective', error)+ ' [0232]');
                    });
                }).catch(() => logger.error(intLang('discord._errors.channelCreateIneffective', member.voice.channel.id)+ ' [0233]'));
        }
    }

    // if moving the member was unsuccessful, we call here to have the channel removed.
    function voiceChannelMoveFailed(mainGuild, voiceChannelCreated) {

        // NeDB VoiceChannels Removal
        dbVoiceChannels.remove({ id: voiceChannelCreated.id, guild: newState.guild.id }, {}, async error => {
            if (error) return logger.error(intLang('nedb._errors.voiceChannelsRemoveIneffective', error)+ ' [0234]');

            try {
                // Voice Channel Deletion
                await voiceChannelCreated.delete()
                    .then(removedChannel => requestOverFlowCategoryDeletion(mainGuild, true, removedChannel))
                    .then(() => dumpEvent.dumpChannel(client, oldState, 'red', 'Channel Removed', 'Empty'))
                    .catch(() => logger.info(intLang('discord._errors.channelDeleteIneffective', oldState.channelID)+ ' [0235]'));
            } catch (error) {
                return logger.info(intLang('discord._errors.channelDeleteIneffective', oldState.channelID)+ ' [0236]');
            }
        });
    }

    // requestVoiceChannelDeletion is called when someone leaves a voice channel, or is requested by another function
    function requestVoiceChannelDeletion(mainGuild, stateType) {
        const memberState = (stateType) ? newState : oldState;

        if (memberState.channel === null || memberState.channel.id === null || memberState.channel.id === mainGuild.channels.voice) return;
        if (memberState.channel.members.array().length) return;

        // NeDB VoiceChannels Removal
        dbVoiceChannels.remove({ id: memberState.channel.id, guild: memberState.guild.id }, {}, async (error, removeCount) => {
            if (error) return logger.error(intLang('nedb._errors.voiceChannelsRemoveIneffective', error)+ ' [0237]');

            // Voice Channel Deletion
            if (removeCount) await memberState.channel.delete()
                .then(removedChannel => requestOverFlowCategoryDeletion(mainGuild, stateType, removedChannel))
                .then(() => dumpEvent.dumpChannel(client, oldState, 'red', 'Channel Removed', 'Empty'))
                .catch(() => logger.info(intLang('discord._errors.channelDeleteIneffective', memberState.channelID)+ ' [0238]'));
        });
    }

    // This request is handled via requestVoiceChannelDeletion function
    function requestOverFlowCategoryDeletion(mainGuild, stateType, removedChannel) {
        const memberState = (stateType) ? newState : oldState;

        if (removedChannel === null || removedChannel.id === null || removedChannel.parent === null || removedChannel.parent.id === null || removedChannel.id === mainGuild.channels.category) return;
        if (removedChannel.members.array().length) return;

        dbGuilds.findOne({ type: 'OVERFLOW', "channels.category": removedChannel.parent.id }, async (error, overFlowData) => {
            if (error) return logger.error(intLang('nedb._errors.guildsFindOneIneffective', error)+ ' [0239]');
            if (!overFlowData) return;

            const overFlowCategory = await memberState.guild.channels.cache.get(overFlowData.channels.category);
            if (overFlowCategory.children.size < 1) return await overFlowCategory.delete()
                .then(() => dumpEvent.dumpChannel(client, oldState, 'red', 'OverFlow Category Removed', 'Empty'))
                .catch(() => logger.info(intLang('discord._errors.categoryDeleteIneffective', overFlowCategory.id)+ ' [0240]'));
        });

    }

    // If a category is required and the mainGuild category is full, we make a new one.
    // This request is handled via requestDataOverFlow
    async function requestOverFlowCategory(mainGuild, voiceChannelData) {
        channelCategory = await newState.guild.channels.cache.get(mainGuild.channels.category);
        const overFlowCategory = await newState.guild.channels.create(intLang('discord.channels.categoryOverFlow'), {type: 'category', position: channelCategory.position+1, permissionOverwrites: [{id: newState.guild.members.cache.get(client.user.id).id, allow: ['MANAGE_CHANNELS', 'SEND_MESSAGES', 'VIEW_CHANNEL', 'CONNECT', 'MOVE_MEMBERS', 'ADD_REACTIONS']}, {id: newState.guild.roles.everyone.id, allow: ['CONNECT', 'VIEW_CHANNEL']}]})
            .catch(() => logger.error(intLang('discord._errors.categoryCreateIneffective')+ ' [0241]'));
            
        dbGuilds.insert({ type: 'OVERFLOW', channels: { category: overFlowCategory.id, text: mainGuild.channels.text, voice: mainGuild.channels.voice } }, (error, insertedOverFlowCategory) => {
            if (error) return logger.error(intLang('nedb._errors.guildsFindOneIneffective', error)+ ' [0242]');
            dumpEvent.dumpChannel(client, oldState, 'red', 'OverFlow Category Creation', 'User Input');
            return createVoiceChannel(mainGuild, insertedOverFlowCategory, voiceChannelData);
        });
    }

    // Gets data of an existing voice channel for later comparison
    function requestDataVoiceChannel(mainGuild, overFlowData) {
        dbVoiceChannels.findOne({ guild: newState.guild.id, channelOwner: newState.member.id }, (error, voiceChannelData) => {
            if (error) return logger.error(intLang('nedb._errors.voiceChannelsFindOneIneffective', error)+ ' [0243]');

            if (overFlowData === null) return createVoiceChannel(mainGuild, null, voiceChannelData);
            else return createVoiceChannel(mainGuild, overFlowData, voiceChannelData);
        });
    }

    // Called if an OverFlow category is requested for createVoiceChannel function
    // This function serves to find any previous created OverFlow categories
    // If one is available, send that back to createVoiceChannel function
    // else it will requestOverFlowCategory for a new one to be made.
    function requestDataOverFlow(mainGuild, voiceChannelData) {
        dbGuilds.find({ type: 'OVERFLOW' }, async (error, overFlowData) => {
            if (error) return logger.error(intLang('nedb._errors.guildsFindOneIneffective', error)+ ' [0244]');
            if (!overFlowData.length) return requestOverFlowCategory(mainGuild, voiceChannelData);

            for(let i = 0; i < overFlowData.length; i++) {
                const overFlowCategoryCheck = await newState.guild.channels.cache.get(overFlowData[i].channels.category);
                if (overFlowCategoryCheck.children.size < 30) return createVoiceChannel(mainGuild, overFlowData[i], voiceChannelData);
                if (overFlowData.length < 2) return requestOverFlowCategory(mainGuild, voiceChannelData);
                else return;
            }
        });
    }

    // Will try to DM a member with information on how this system works, this occurs only once.
    function newMemberHelp() {
        dbNewMemberHelp.findOne({ memberID: newState.member.id }, (error, memberHelpResult) => {
            if (error) return logger.error(intLang('nedb._errors.newMemberHelpFindOneIneffective', error)+ ' [0245]');
            if (memberHelpResult) return;

            dbNewMemberHelp.insert({ memberID: newState.member.id }, error => {
                if (error) return logger.error(intLang('nedb._errors.newMemberHelpInsertIneffective', error)+ ' [0246]');
                messageEmbedSend(client, null, true, intLang('events.voiceStateUpdate.embedNewMemberMessage.title'), intLang('events.voiceStateUpdate.embedNewMemberMessage.description', discord.prefix, discord.prefix, discord.prefix), null, newState.member);
            });
        });
    }

    // NeDB Guilds Query & Verification
    dbGuilds.findOne({ id: newState.guild.id }, (error, mainGuild) => {
        if (error) return logger.error(intLang('nedb._errors.guildsFindOneIneffective', error)+ ' [0247]');
        if (!mainGuild) return;

        // Member joins "Create a channel" Voice Channel
        if (newState.channelID === mainGuild.channels.voice) {
            newMemberHelp();
            return requestDataVoiceChannel(mainGuild);
        }

        // Member leaves Voice Channel
        if (oldState.channelID) {
            return requestVoiceChannelDeletion(mainGuild, false);
        }
    });
};
