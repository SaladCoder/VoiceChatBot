const {dbVoiceChannels} = require('../../utilities/datastore');
const logger = require('../../config/logger');
const intLang = require('../../locale/language');
const {dumpEvent} = require('../../utilities/dumpEvent');

// Command Module
module.exports = {
    name: 'permit',
    description: 'Permits a client to join a voice channel, when the channel is locked.',
    allowDisable: true,
    arguments: true,
    hide: false,
    usage: '<@Mention>',
    cooldown: 6,
    execute(client, message, arg) {

        // NeDB VoiceChannels Query
        dbVoiceChannels.findOne({id: message.member.voice.channelID, guild: message.guild.id}, async (error, VoiceChannel) => {
            if (error) return logger.error(intLang('nedb._errors.voiceChannelsFindOneIneffective', error)+ ' [0037]');

            // Voice Channel Verification
            if (!message.member.voice.channel || !VoiceChannel || message.member.voice.channelID !== VoiceChannel.id) return message.reply(intLang('commands.permit._errors.incorrectChannel'))
                .catch(() => logger.error(intLang('discord._errors.messageIneffective', message.channel.id)+ ' [0176]'));

            if (VoiceChannel.channelOwner !== message.author.id) return message.reply(intLang('commands.permit._errors.unownedChannel'))
                .catch(() => logger.error(intLang('discord._errors.messageIneffective', message.channel.id)+ ' [0177]'));

            // Member Mention Verification
            const member = message.mentions.members.first() || message.guild.members.cache.get(arg[0]);
            if (!member) return message.reply(intLang('commands.permit._errors.invalidMember'))
                .catch(() => logger.error(intLang('discord._errors.messageIneffective', message.channel.id)+ ' [0178]'));

            if (member.id === message.author.id) return message.reply(intLang('commands.permit._errors.selfMember'))
                .catch(() => logger.error(intLang('discord._errors.messageIneffective', message.channel.id)+ ' [0179]'));
            
            // Check the user is not already in the channel! >:F
            if (VoiceChannel.id === member.voice.channelID) return message.reply(intLang('commands.permit._errors.userIsPresent'))
                .catch(() => logger.error(intLang('discord._errors.messageIneffective', message.channel.id)+ ' [0180]'));

            // Voice Channel allow user to join the channel
            await message.member.voice.channel.updateOverwrite(member.user.id, { CONNECT: true })
                .then(() => message.react('✅') // Success Response ┬─┬ ノ( ゜-゜ノ)
                    .catch(() => logger.error(intLang('discord._errors.messageReactIneffective', message.channel.id)+ ' [0181]')))
                .then(() => dumpEvent.dumpCommand(client, message, 'yellow', this.name, member))
                .catch(() => logger.error(intLang('discord._errors.channelPermitIneffective', message.channel.id)+ ' [0038]')); // Error Handle (╯°□°）╯︵ ┻━┻
        });
    }
};
