const path = require('path');
const logger = require(path.join(__dirname, '../..', 'config', 'logger'));
const intLang = require(path.join(__dirname, '../..', 'locale', 'language'));
const {discord} = require(path.join(__dirname, '../..', 'config', 'config'));
const {dumpEvent} = require(path.join(__dirname, '../..', 'utilities', 'dumpEvent'));
const {dbGuilds, dbStaffRoles} = require(path.join(__dirname, '../..', 'utilities', 'datastore'));

// Command Module
module.exports = {
    name: 'manager',
    description: 'Adds or removes a bot manager for management commands and channel immunity',
    allowDisable: false,
    arguments: true,
    adminOnly: true,
    hide: true,
    usage: '<add/remove> <@Mention>',
    cooldown: 2,
    execute(client, message, arg) {

        // Member and Role Mention Verification
        const role = message.mentions.roles.first() || message.guild.roles.cache.get(arg[1]);

        if (!message.member.hasPermission('ADMINISTRATOR')) return message.reply(intLang('commands.manager._errors.invalidPermissions'))
            .catch(() => logger.error(intLang('discord._errors.messageIneffective', message.channel.id)+ ' [0144]'));

        if (!role) return message.reply(intLang('commands.manager._errors.invalidRole'))
            .catch(() => logger.error(intLang('discord._errors.messageIneffective', message.channel.id)+ ' [0145]'));
        
        // Option Verification
        const option = arg[0].toLowerCase();
        if (option !== 'add' && option !== 'remove') return message.reply(intLang('commands.manager._errors.firstOption', discord.prefix))
            .catch(() => logger.error(intLang('discord._errors.messageIneffective', message.channel.id)+ ' [0146]'));

        // We set channel Category permission for manager to override the Channel lock
        function setCategoryPermissions(updateType) {
            dbGuilds.findOne({ id: message.member.guild.id }, async (error, result) => {
                if (error) return logger.error(intLang('nedb._errors.guildsFindOneIneffective', error)+ ' [0147]');

                if (updateType) await message.member.guild.channels.cache.find(category => category.id === result.channels.category).updateOverwrite(role.id, {VIEW_CHANNEL: true, CONNECT: true, SEND_MESSAGES: true})
                    .catch(() => logger.error(intLang('discord._errors.channelUpdateOverwriteIneffective', message.member.voice.channel.id)+ ' [0148]'));

                else await message.member.guild.channels.cache.find(category => category.id === result.channels.category).permissionOverwrites.get(role.id).delete()
                    .catch(() => logger.error(intLang('discord._errors.channelUpdateOverwriteIneffective', message.member.voice.channel.id)+ ' [0149]'));
            });
        }

        switch(option){
            case 'add':

                // Check for duplicate entry
                dbStaffRoles.findOne({ $or: [ { manager: role.id }, { staff: role.id } ] }, (error, result) => {
                    
                    // Check if a Role or Member is already added
                    if (error) return logger.error(intLang('nedb._errors.staffRolesFindOneIneffective', error)+ ' [0030]'); // Error Handle (╯°□°）╯︵ ┻━┻

                    // Check they're not a Staff or Manager member to avoid double entry.
                    if (result) {
                        if (result.staff) return message.reply(intLang('commands.manager._errors.isStaffRole', discord.prefix, discord.prefix))
                            .catch(() => logger.error(intLang('discord._errors.messageIneffective', message.channel.id)+ ' [0150]'));

                        if (result.manager) return message.reply(intLang('commands.manager.add.addRoleBotManagerIneffective', role.id, discord.prefix, discord.prefix))
                            .catch(() => logger.error(intLang('discord._errors.messageIneffective', message.channel.id)+ ' [0151]')); 
                    }

                    // Insert the new Bot manager
                    dbStaffRoles.insert({ manager: role.id, type: 'role', roleTitle: role.name }, error => {
                        if (error) return logger.error(intLang('nedb._errors.staffRolesInsertIneffective', error)+ ' [0031]'); // Error Handle (╯°□°）╯︵ ┻━┻

                        // Success Response ┬─┬ ノ( ゜-゜ノ)
                        message.react('✅')

                            // Assign the right message depending on Role or Member
                            .then(() => message.reply(intLang('commands.manager.add.successRole', role.id))
                                .catch(() => logger.error(intLang('discord._errors.messageIneffective', message.channel.id)+ ' [0152]')))
                            .then(() => setCategoryPermissions(true))
                            .then(() => dumpEvent.dumpCommand(client, message, 'black', `${this.name} add`, role, true))
                            .catch(() => logger.error(intLang('discord._errors.messageReactIneffective', message.channel.id)+ ' [0032]'))
                    });
                });
                break;

            case 'remove':

                // Check if entry exists
                dbStaffRoles.findOne({ $or: [ { manager: role.id }, { staff: role.id } ] }, (error, result) => {
                    
                    // Check for error and duplicate entry
                    if (error) return logger.error(intLang('nedb._errors.staffRolesFindIneffective', error)+ ' [0034]'); // Error Handle (╯°□°）╯︵ ┻━┻
                    
                    // Check that entry exists and that they're not staff
                    if (!result) return message.reply(intLang('commands.manager.remove.removeBotManagerRoleIneffective', role.id, discord.prefix, discord.prefix))
                        .catch(() => logger.error(intLang('discord._errors.messageIneffective', message.channel.id)+ ' [0153]'));

                    if (result.staff) return message.reply(intLang('commands.manager._errors.isStaffRemoveRole', discord.prefix, discord.prefix))
                        .catch(() => logger.error(intLang('discord._errors.messageIneffective', message.channel.id)+ ' [0154]'));
                    
                    // Remove a Bot manager
                    dbStaffRoles.remove({ manager: role.id }, {}, error => {
                        if (error) return logger.error(intLang('nedb._errors.staffRolesRemoveIneffective', error)+ ' [0035]'); // Error Handle (╯°□°）╯︵ ┻━┻

                        // Success Response ┬─┬ ノ( ゜-゜ノ)
                        message.react('✅')

                            // Assign the right message depending on Role or Member
                            .then(() => message.reply(intLang('commands.manager.remove.successRole', role.id,))
                                .catch(() => logger.error(intLang('discord._errors.messageIneffective', message.channel.id)+ ' [0155]')))
                            .then(() => setCategoryPermissions(false))
                            .then(() => dumpEvent.dumpCommand(client, message, 'black', `${this.name} remove`, role, true))
                            .catch(() => logger.error(intLang('discord._errors.messageReactIneffective', message.channel.id)+ ' [0036]'));


                    });
                });
                break;
        }
    }
};
