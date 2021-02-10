const {discord} = require('../../config/config');
const {dbVoiceChannels} = require('../../utilities/datastore');
const logger = require('../../config/logger');
const intLang = require('../../locale/language');
const {dumpEvent} = require('../../utilities/dumpEvent');

// Command Module
module.exports = {
    name: 'unlock',
    description: 'Unlocks your voice channel that allows everyone to join.',
    allowDisable: true,
    cooldown: 10,
    execute(client, message) {

        // NeDB VoiceChannels Query
        dbVoiceChannels.findOne({id: message.member.voice.channelID, guild: message.guild.id}, async (error, VoiceChannel) => {
            if (error) return logger.error(intLang('nedb._errors.voiceChannelsFindOneIneffective', error)+ ' [0087]');

            // Voice Channel Verification
            if (!message.member.voice.channel || !VoiceChannel || message.member.voice.channelID !== VoiceChannel.id) return message.reply(intLang('commands.unlock._errors.incorrectChannel'))
                .catch(() => logger.error(intLang('discord._errors.messageIneffective', message.channel.id)+ ' [0156]'));

            if (VoiceChannel.channelOwner !== message.author.id) return message.reply(intLang('commands.unlock._errors.unownedChannel'))
                .catch(() => logger.error(intLang('discord._errors.messageIneffective', message.channel.id)+ ' [0157]'));

            // We do a check to see if the channel is already unlocked, and if so, return
            const isUnlocked = message.member.voice.channel.permissionOverwrites.get(message.guild.roles.everyone.id);
            if (typeof isUnlocked !== 'undefined' && isUnlocked.allow.has('CONNECT')) return message.reply(intLang('commands.unlock._errors.isUnlocked', discord.prefix))
                .catch(() => logger.error(intLang('discord._errors.messageIneffective', message.channel.id)+ ' [0158]'));

            // Voice Channel Permission Overwrites
            await message.member.voice.channel.updateOverwrite(message.guild.roles.everyone.id, {CONNECT: true}, intLang('commands.unlock.permissionOverwrites.everyoneUnlockReason'))
                .then(() => message.react('✅') // Success Response ┬─┬ ノ( ゜-゜ノ)
                    .catch(() => logger.error(intLang('discord._errors.messageReactIneffective', message.channel.id)+ ' [0159]')))
                .then(() => dumpEvent.dumpCommand(client, message, 'yellow', this.name))
                .catch(() => logger.error(intLang('discord._errors.channelUpdateOverwriteIneffective', message.member.voice.channel.id)+ ' [0088]')); // Error Handle (╯°□°）╯︵ ┻━┻
        });
    }
};
