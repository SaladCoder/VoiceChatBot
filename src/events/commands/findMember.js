const logger = require('../../config/logger');
const intLang = require('../../locale/language');
const {dumpEvent} = require('../../utilities/dumpEvent');

// Command Module
module.exports = {
    name: 'find',
    description: 'Find a member in any Voice channel and return there current channel',
    allowDisable: true,
    arguments: true,
    staffOnly: true,
    hide: true,
    usage: '<@Mention>',
    cooldown: 3,
    execute(client, message, arg) {

        // Member and Role Mention Verification
        const member = message.mentions.members.first() || message.guild.members.cache.get(arg[0]);
        if (!member) return message.reply(intLang('commands.findMember._errors.invalidMember'));
        if (member.id === message.author.id) return message.reply(intLang('commands.findMember._errors.selfMember',));
        if (!member.voice.channel) return message.reply(intLang('commands.findMember._errors.unknownMember'));

        // Create new invite for the found voice channel
        member.voice.channel.createInvite({maxAge: 30, unique: true})
            .then(voiceChannelInvite => message.reply(intLang('commands.findMember.find.createInvite', member.user.username, member.voice.channel.name, voiceChannelInvite))) // Success Response ┬─┬ ノ( ゜-゜ノ)
            .then(dumpEvent.dumpCommand(client, message, 'purple', this.name, member))
            .catch(() => logger.error(intLang('commands.findMember._errors.createInviteIneffective')+ ' [0017]')); // Error Handle (╯°□°）╯︵ ┻━┻
    }
};
