const path = require('path');
const logger = require(path.join(__dirname, '../..', 'config', 'logger'));
const intLang = require(path.join(__dirname, '../..', 'locale', 'language'));
const {dumpEvent} = require(path.join(__dirname, '../..', 'utilities', 'dumpEvent'));

// Command Module
module.exports = {
    name: 'find',
    description: 'Find a member in any Voice channel and return their current channel',
    allowDisable: true,
    arguments: true,
    staffOnly: true,
    hide: true,
    usage: '<@Mention>',
    cooldown: 3,
    execute(client, message, arg) {

        // Member and Role Mention Verification
        const member = message.mentions.members.first() || message.guild.members.cache.get(arg[0]);
        if (!member) return message.reply(intLang('commands.findMember._errors.invalidMember'))
            .catch(() => logger.error(intLang('discord._errors.messageIneffective', message.channel.id)+ ' [0200]'));

        if (member.id === message.author.id) return message.reply(intLang('commands.findMember._errors.selfMember'))
            .catch(() => logger.error(intLang('discord._errors.messageIneffective', message.channel.id)+ ' [0201]'));

        if (!member.voice.channel) return message.reply(intLang('commands.findMember._errors.unknownMember'))
            .catch(() => logger.error(intLang('discord._errors.messageIneffective', message.channel.id)+ ' [0202]'));

        // Create new invite for the found voice channel
        member.voice.channel.createInvite({maxAge: 30, unique: true})
            .then(voiceChannelInvite => message.reply(intLang('commands.findMember.find.createInvite', member.user.username, member.voice.channel.name, voiceChannelInvite)) // Success Response ┬─┬ ノ( ゜-゜ノ)
                .catch(() => logger.error(intLang('discord._errors.messageIneffective', message.channel.id)+ ' [0203]')))
            .then(dumpEvent.dumpCommand(client, message, 'purple', this.name, member))
            .catch(() => logger.error(intLang('commands.findMember._errors.createInviteIneffective')+ ' [0017]')); // Error Handle (╯°□°）╯︵ ┻━┻
    }
};
