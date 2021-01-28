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

    // Voice Channel Creation Function
    async function createVoiceChannel(Guild) {
        const guild = newState.guild;
        const member = newState.member;
        const channelCategory = guild.channels.cache.get(Guild.channels.category);
        
        // NeDB VoiceChannels Query & Verification
        dbVoiceChannels.findOne({guild: newState.guild.id, channelOwner: member.id}, async (error, VoiceChannel) => {
            if (error) return logger.error(intLang('nedb._errors.voiceChannelsFindOneIneffective', error)+ ' [0104]');
            
            // If a user has a registered channel in our DB, we do our checks.
            if (VoiceChannel) {

                // Remove the matching Voice channel from our NeDB so our Member can create a new channel and give ownership of the old channel
                dbVoiceChannels.remove({guild: guild.id, channelOwner: member.id}, {}, async error => {
                    if (error) return logger.error(intLang('nedb._errors.voiceChannelsRemoveIneffective', error)+ ' [0105]');
                    
                    // Gather a check if we have a match from channels on our Discord to our NeDB
                    isVoiceChannel = await guild.channels.cache.find(voice => VoiceChannel.id === voice.id);

                    // Category and old channel check to make sure we're in the right place and the old channel doesn't have members inside it
                    if (typeof isVoiceChannel === 'undefined') return;
                    if (isVoiceChannel.parent.id !== Guild.channels.category) return;
                    if (isVoiceChannel.members.array().length) return;

                    // If all checks are valid then we can remove the old channel and log it
                    isVoiceChannel.delete()

                        // Log our channel removed to the Dump channel [If opt-in for]
                        .then(dumpEvent.dumpChannel(client, oldState, 'red', 'Channel Removed', 'Empty'))
                        .catch(() => logger.info(intLang('discord._errors.channelDeleteIneffective', member.voice.channel.id)+ ' [0106]'));
                });
            };
            
            // If the Category has more than 49 channels in it, we return, we can only have 50 channels per category
            if (channelCategory.children.size > 49) return;

            // Waits 1.000 seconds and checks if the user is still waiting for a voice channel
            setTimeout(async () => {

                dbGuilds.findOne({id: newState.guild.id}, async (error, Guild) => {
                    if (error) return logger.error(intLang('nedb._errors.guildsFindOneIneffective', error)+ ' [0128]');

                    // Checks if the member is in the "Join to Create Channel"
                    waitMember = await guild.channels.cache.find(voice => Guild.channels.voice === voice.id).members.find(waitMember => waitMember.id === member.id);
                    if (!waitMember) return;

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

                    // Log our new channel creation to the Dump channel [If opt-in for]
                    dumpEvent.dumpChannel(client, newState, 'green', 'Channel Creation');

                    // NeDB VoiceChannels Insertion
                    dbVoiceChannels.insert({id: channelVoice.id, guild: guild.id, channelOwner: member.id}, error => {
                        if (error) return logger.error(intLang('nedb._errors.voiceChannelsInsertIneffective', error)+ ' [0109]');
                    });
                });
            }, 1000);
        });
    };

    // Voice Channel Deletion Function
    function deleteVoiceChannel(Guild) {
        const guild = oldState.guild;
        const channel = oldState.channel;

        // Voice Channel Verification
        if (channel === null || channel.parent === null || channel.parent.id !== Guild.channels.category || channel.id === Guild.channels.voice) return;

        // NeDB VoiceChannels Removal
        dbVoiceChannels.remove({ id: channel.id, guild: guild.id, channelOwner: oldState.member.id }, {}, error => {
            if (error) return logger.error(intLang('nedb._errors.voiceChannelsRemoveIneffective', error)+ ' [0110]');
            if (channel.members.array().length) return;
            
            // Voice Channel Deletion
            channel.delete()

                // Log our channel removed to the Dump channel [If opt-in for].
                .then(() => dumpEvent.dumpChannel(client, oldState, 'red', 'Channel Removed', 'Empty'))
                .catch(() => logger.info(intLang('discord._errors.channelDeleteIneffective', oldState.channelID)+ ' [0111]'));
        });
    };

    async function voiceSlowDownCheck(Guild) {

        // voiceSlowDown for voice channel creations
        if (await client.voiceSlowDown.has(newState.member.id) && Date.now() < client.voiceSlowDown.get(newState.member.id)) return;
        else {

            // voiceSlowDown add if member doesn't have one.
            await client.voiceSlowDown.delete(newState.member.id);
            await client.voiceSlowDown.set(newState.member.id, Date.now() + channelTemplate.creationSlowDownSeconds * 1000); // 20 Seconds voicesSlowDown from voice creation
            return createVoiceChannel(Guild);
        }
    }

    function newMemberHelp() {
        dbNewMemberHelp.findOne({ memberID: newState.member.id }, (error, result) => {
            if (error) return logger.error(intLang('nedb._errors.newMemberHelpFindOneIneffective', error)+ ' [0130]');
            if (result) return;
            dbNewMemberHelp.insert({ memberID: newState.member.id }, error => {
                if (error) return logger.error(intLang('nedb._errors.newMemberHelpInsertIneffective', error)+ ' [0131]');
                messageEmbedSend(client, null, true, intLang('events.voiceStateUpdate.embedNewMemberMessage.title'), intLang('events.voiceStateUpdate.embedNewMemberMessage.description', discord.prefix, discord.prefix, discord.prefix), null, newState.member);
            });
        });
    }

    // NeDB Guilds Query & Verification
    dbGuilds.findOne({id: newState.guild.id}, async (error, Guild) => {
        if (error) return logger.error(intLang('nedb._errors.guildsFindOneIneffective', error)+ ' [0112]');
        if (!Guild) return;

        // Member joins "Create a channel" Voice Channel
        if (newState.channelID === Guild.channels.voice) {
            newMemberHelp();
            return voiceSlowDownCheck(Guild);
        }

        // Member leaves Voice Channel
        if (oldState.channelID) {
            return deleteVoiceChannel(Guild);
        }
    });
};
