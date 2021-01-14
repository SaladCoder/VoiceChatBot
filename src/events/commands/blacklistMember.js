const {dbGuilds} = require('../../utilities/datastore');
const logger = require('../../config/logger');
const intLang = require('../../locale/language');
const {discord} = require('../../config/config');
const {dumpEvent} = require('../../utilities/dumpEvent');

// Command Module
module.exports = {
    name: 'blacklist',
    description: 'Add or remove a blacklist, this will prevent a member from using the VC system, i.e. Creation of a voice channel.',
    allowDisable: false,
    arguments: true,
    staffOnly: true,
    hide: true,
    usage: '<add/remove> <@Mention>',
    cooldown: 2,
    execute(client, message, arg) {

        // Member and Role Mention Verification
        const member = message.mentions.members.first() || message.guild.members.cache.get(arg[1]);
        if (typeof member !== 'undefined' && member.id === message.author.id) return message.reply(intLang('commands.blacklistMember._errors.selfMember'));
        if (!member) return message.reply(intLang('commands.blacklistMember._errors.isBlacklistedMemberGuild'));

        switch(arg[0]){
            case 'add':
                dbGuilds.findOne({ id: member.guild.id }, async (error, result) => {
                    if (error) return logger.error(intLang('nedb._errors.guildsFindOneIneffective', error)+' [0001]');

                    const channel = await client.channels.cache.find(channel => channel.id === result.channels.voice);
                    const permissions = channel.permissionOverwrites.get(member.user.id);

                    if (typeof permissions !== 'undefined') return message.reply(intLang('commands.blacklistMember._errors.memberIsAlreadyBlacklist'));

                    channel.updateOverwrite(member.user.id, { CONNECT: false })
                        .then(() => member.voice.kick())
                        .then(() => message.react('✅')) // Success Response ┬─┬ ノ( ゜-゜ノ)
                        .then(() => message.reply(intLang('commands.blacklistMember.add.memberHasBlacklist')))
                        .then(() => dumpEvent.dumpCommand(client, message, 'black', `${this.name} add`, member))
                        .catch(error => logger.error(intLang('commands.blacklistMember._errors.channelPermissionsIneffective', error))); // Error Handle (╯°□°）╯︵ ┻━┻
                });
                break;

            case 'remove':
                dbGuilds.findOne({ id: member.guild.id }, async (error, result) => {
                    if (error) return logger.error(intLang('nedb._errors.guildsFindOneIneffective', error)+' [0002]');

                    const channel = await client.channels.cache.find(channel => channel.id === result.channels.voice);
                    const permissions = channel.permissionOverwrites.get(member.user.id);

                    if (typeof permissions === 'undefined') return message.reply(intLang('commands.blacklistMember._errors.memberIsNotBlacklist'));

                    permissions.delete()
                            .then(() => message.react('✅')) // Success Response ┬─┬ ノ( ゜-゜ノ)
                            .then(() => message.reply(intLang('commands.blacklistMember.remove.memberNoBlacklist')))
                            .then(() => dumpEvent.dumpCommand(client, message, 'black', `${this.name} remove`, member))
                            .catch(error => logger.error(intLang('commands.blacklistMember._errors.channelRemovePermissionsIneffective', error)+' [0003]')); // Error Handle (╯°□°）╯︵ ┻━┻
                });
                break;

            default:
                message.reply(intLang('commands.blacklistMember._errors.incorrectFormat', discord.prefix, discord.prefix));
        }
    }
};
