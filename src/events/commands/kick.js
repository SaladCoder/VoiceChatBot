const {dbVoiceChannels, dbStaffRoles} = require('../../utilities/datastore');
const logger = require('../../config/logger');
const intLang = require('../../locale/language');
const {dumpEvent} = require('../../utilities/dumpEvent');

// Command Module
module.exports = {
    name: 'kick',
    description: 'Kicks a user from your voice channel.',
    allowDisable: true,
    arguments: true,
    hide: false,
    usage: '<@Mention>',
    cooldown: 6,
    execute(client, message, arg) {
        
        // NeDB VoiceChannels Query
        dbVoiceChannels.findOne({id: message.member.voice.channelID, guild: message.guild.id}, async (error, VoiceChannel) => {
            if (error) return logger.error(intLang('nedb._errors.voiceChannelsFindOneIneffective', error)+ ' [0018]');

            // Voice Channel Verification
            if (!message.member.voice.channel || !VoiceChannel || message.member.voice.channelID !== VoiceChannel.id) return message.reply(intLang('commands.kick._errors.incorrectChannel'));
            if (VoiceChannel.channelOwner !== message.author.id) return message.reply(intLang('commands.kick._errors.unownedChannel'));

            // Member Mention Verification
            const member = message.mentions.members.first() || message.guild.members.cache.get(arg[0]);
            if (!member) return message.reply(intLang('commands.kick._errors.invalidMember'));
            if (member.id === message.author.id) return message.reply(intLang('commands.kick._errors.selfMember'));
            if (member.hasPermission('ADMINISTRATOR')) return message.reply(intLang('commands.kick._errors.isStaff'));
            if (!message.member.voice.channel.members.some(user => user.id === member.id)) return message.reply(intLang('commands.kick._errors.unknownMember'));

            // If we have a registered Manager or Staff member in the channel, they can't be kicked
            dbStaffRoles.find({ $or: [{manager: member.id}, {staff: member.id}] }, (error, isStaff) => {
                if (error) return logger.error(intLang('nedb._errors.staffRolesFindIneffective', error)+ ' [0019]');
                if (isStaff.length > 0) return message.reply(intLang('commands.kick._errors.isStaff'));

                // If we have a registered Manager or Staff role in the channel, they can't be kicked
                dbStaffRoles.find({}, async (error, isStaff) => {
                    if (error) return logger.error(intLang('nedb._errors.staffRolesFindIneffective', error)+ ' [0020]');
                    for(let i = 0; isStaff.length > i; i++) if (member.roles.cache.has(isStaff[i]['manager']) || member.roles.cache.has(isStaff[i]['staff'])) return message.reply(intLang('commands.kick._errors.isStaff'));

                    // Voice Channel Flag change to Connect: FALSE for this member and disconnection of the member
                    await message.member.voice.channel.updateOverwrite(member.user.id, { CONNECT: false })
                        .then(() => member.voice.kick(intLang('commands.kick.voiceKick.kickMemberReason', message.author.tag, member.user.tag)))
                        .then(() => message.react('✅')) // Success Response ┬─┬ ノ( ゜-゜ノ)
                        .then(() => dumpEvent.dumpCommand(client, message, 'yellow', this.name, member))
                        .catch(() => logger.error(intLang('discord._errors.channelKickIneffective', message.member.voice.channel.id)+ ' [0021]')); // Error Handle (╯°□°）╯︵ ┻━┻
                });
            });
        });
    }
};