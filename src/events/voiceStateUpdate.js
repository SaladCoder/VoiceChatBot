const {dbGuilds, dbVoiceChannels} = require('../utilities/datastore');
const {dumpEvent} = require('../utilities/dumpEvent');
const logger = require('../config/logger');
const intLang = require('../locale/language');
const fs = require('fs');

// Event Emitting
module.exports = (client, oldState, newState) => {

    // Connection logs for dumpEvent [If opt-in for]
    if (oldState.channelID === null && newState.channelID !== null) dumpEvent.dumpJoinAndLeave(client, newState, 'green', 'Connect');
    if (oldState.channelID !== null && newState.channelID === null) dumpEvent.dumpJoinAndLeave(client, oldState, 'red', 'Disconnect');

    // Voice Channel Creation Function
    function createVoiceChannel(Guild) {
        const guild = newState.guild;
        const channelCategory = guild.channels.cache.get(Guild.channels.category);
        const member = newState.member;

        // NeDB VoiceChannels Query & Verification
        dbVoiceChannels.findOne({guild: newState.guild.id, channelOwner: member.id}, async (error, VoiceChannel) => {
            if (error) return logger.error(intLang('nedb._errors.voiceChannelsFindOneIneffective', error)+ ' [0104]');

            // If a user has a registered channel in our DB, we do our checks.
            if (VoiceChannel) {

                // Gather a check if we have a match from channels on our Discord to our NeDB
                const isVoiceChannel = guild.channels.cache.find(voice => VoiceChannel.id === voice.id);

                // Remove the matching Voice channel from our NeDB so our Member can create a new channel and give ownership of the old channel
                dbVoiceChannels.remove({id: isVoiceChannel.id, guild: guild.id}, {}, error => {
                    if (error) return logger.error(intLang('nedb._errors.voiceChannelsRemoveIneffective', error)+ ' [0105]');

                    // Category and old channel check to make sure we're in the right place and the old channel doesn't have members inside it
                    if (typeof isVoiceChannel === 'undefined') return;
                    if (isVoiceChannel.parent.id !== Guild.channels.category) return;
                    if (isVoiceChannel.members.array().length) return;

                    // If all checks are valid then we can remove the old channel and log it
                    isVoiceChannel.delete()

                        // Log our channel removed to the Dump channel [If opt-in for].
                        .then(dumpEvent.dumpChannel(client, oldState, 'red', 'Channel Removed', 'Last person to leave'))
                        .catch(() => logger.info(intLang('discord._errors.channelDeleteIneffective', member.voice.channel.id)+ ' [0106]'));
                });
            };

            // Grab our config file for channel creation
            const configFile = JSON.parse(fs.readFileSync(`${__dirname}/../config/config.json`, 'utf8'));

            // Voice Channel Creation
            const channelVoice = await guild.channels.create(intLang('discord.channels.voiceUser', member.user.username), {type: 'voice', parent: channelCategory, userLimit: configFile.channelTemplate.channelSlots, reason: intLang('events.voiceStateUpdate.channelVoiceReason', member.user.tag)})
                .catch(() => logger.error(intLang('discord._errors.channelCreateIneffective', member.voice.channel.id)+ ' [0107]'));

            // Set a lock on the channel if true is set in the config
            if (configFile.channelTemplate.lockStatus === 'true') channelVoice.updateOverwrite(guild.roles.everyone.id, {CONNECT: false});
            
            // Member Voice Channel Movement
            member.voice.setChannel(channelVoice)
                .catch(() =>  {
                    logger.info(intLang('discord._errors.channelMoveIneffective', member.id)+ ' [0108]');
                    channelVoice.delete();
                });

            // Log our new channel creation to the Dump channel [If opt-in for].
            dumpEvent.dumpChannel(client, newState, 'green', 'Channel Creation');

            // NeDB VoiceChannels Insertion
            dbVoiceChannels.insert({id: channelVoice.id, guild: guild.id, channelOwner: member.id}, error => {
                if (error) return logger.error(intLang('nedb._errors.voiceChannelsInsertIneffective', error)+ ' [0109]');
            });
        })
    };

    // Voice Channel Deletion Function
    function deleteVoiceChannel(Guild) {
        const guild = oldState.guild;
        const channel = oldState.channel;

        // Voice Channel Verification
        if (channel.parent.id !== Guild.channels.category || channel.id === Guild.channels.voice) return;
        if (channel.members.array().length) return;

        // NeDB VoiceChannels Removal
        dbVoiceChannels.remove({id: channel.id, guild: guild.id}, {}, error => {
            if (error) return logger.error(intLang('nedb._errors.voiceChannelsRemoveIneffective', error)+ ' [0110]');

            // Voice Channel Deletion
            channel.delete()

                // Log our channel removed to the Dump channel [If opt-in for].
                .then(() => dumpEvent.dumpChannel(client, oldState, 'red', 'Channel Removed', 'Empty'))
                .catch(() => logger.error(intLang('discord._errors.channelDeleteIneffective', oldState.channelID)+ ' [0111]'));
        });
    };

    // NeDB Guilds Query & Verification
    dbGuilds.findOne({id: newState.guild.id}, (error, Guild) => {
        if (error) return logger.error(intLang('nedb._errors.guildsFindOneIneffective', error)+ ' [0112]');
        if (!Guild) return;

        // Member joins "Create a channel" Voice Channel
        if (newState.channelID === Guild.channels.voice) {
            createVoiceChannel(Guild);
        }

        // Member leaves Voice Channel
        if (oldState.channelID) {
            deleteVoiceChannel(Guild);
        }
    });
};
