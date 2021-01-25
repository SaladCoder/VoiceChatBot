const {discord} = require('../../config/config');
const {dbVoiceChannels} = require('../../utilities/datastore');
const logger = require('../../config/logger');
const intLang = require('../../locale/language');
const {dumpEvent} = require('../../utilities/dumpEvent');

// Command Module
module.exports = {
    name: 'lock',
    description: 'Locks your voice channel that prevents anyone from joining.',
    allowDisable: true,
    cooldown: 10,
    execute(client, message) {

        // NeDB VoiceChannels Query
        dbVoiceChannels.findOne({id: message.member.voice.channelID, guild: message.guild.id}, async (error, VoiceChannel) => {
            if (error) return logger.error(intLang('nedb._errors.voiceChannelsFindOneIneffective', error)+ ' [0022]');

            // Voice Channel Verification
            if (!message.member.voice.channel || !VoiceChannel || message.member.voice.channelID !== VoiceChannel.id) return message.reply(intLang('commands.lock._errors.incorrectChannel'))
                .catch(() => logger.error(intLang('discord._errors.messageIneffective', message.channel.id)+ ' [0188]'));

            if (VoiceChannel.channelOwner !== message.author.id) return message.reply(intLang('commands.lock._errors.unownedChannel'))
                .catch(() => logger.error(intLang('discord._errors.messageIneffective', message.channel.id)+ ' [0189]'));

            // We do a check to see if the channel is already locked, and if so, return
            const isLocked = message.member.voice.channel.permissionOverwrites.get(message.guild.roles.everyone.id);
            if (typeof isLocked !== 'undefined' && isLocked.deny.has('CONNECT')) return message.reply(intLang('commands.lock._errors.isLocked', discord.prefix))
                .catch(() => logger.error(intLang('discord._errors.messageIneffective', message.channel.id)+ ' [0190]'));

            // Voice Channel Permission Overwrites
            await message.member.voice.channel.updateOverwrite(message.author.id, {CONNECT: true}, intLang('commands.lock.permissionOverwrites.userlockReason', message.author.tag))
                .catch(() => logger.error(intLang('discord._errors.channelUpdateOverwriteIneffective', message.member.voice.channel.id)+ ' [0023]'));

            await message.member.voice.channel.updateOverwrite(message.guild.roles.everyone.id, {CONNECT: false}, intLang('commands.lock.permissionOverwrites.everyonelockReason'))
                .then(() => message.react('✅') // Success Response ┬─┬ ノ( ゜-゜ノ)
                    .catch(() => logger.error(intLang('discord._errors.messageReactIneffective', message.channel.id)+ ' [0191]')))
                .then(() => dumpEvent.dumpCommand(client, message, 'yellow', this.name))
                .catch(() => logger.error(intLang('discord._errors.channelUpdateOverwriteIneffective', message.member.voice.channel.id)+ ' [0024]')); // Error Handle (╯°□°）╯︵ ┻━┻
        });
    }
};
