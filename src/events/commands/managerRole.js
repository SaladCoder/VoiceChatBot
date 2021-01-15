const {dbStaffRoles} = require('../../utilities/datastore');
const logger = require('../../config/logger');
const intLang = require('../../locale/language');
const {discord} = require('../../config/config');
const {dumpEvent} = require('../../utilities/dumpEvent');

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
        const member = message.mentions.members.first() || message.guild.members.cache.get(arg[1]);
        const role = message.mentions.roles.first() || message.guild.roles.cache.get(arg[1]);
        if (!message.member.hasPermission('ADMINISTRATOR')) return message.reply(intLang('commands.manager._errors.invalidPermissions'));
        if (!member && !role) return message.reply(intLang('commands.manager._errors.invalidMemberOrRole'));
        
        // Option Verification
        const option = arg[0].toLowerCase();
        if (option !== 'add' && option !== 'remove') return message.reply(intLang('commands.manager._errors.firstOption', discord.prefix));

        // Check if we're dealing with a Role or a Member and assign the right value
        if (!role){ 
            manager = member;
            type = 'member';
            title = 'null';
        }else{
            manager = role;
            type = 'role';
            title = role.name;
        };

        switch(option){
            case 'add':

                // Start search for Role or Member
                dbStaffRoles.find({ staff: manager.id }, (error, isStaff) => {
                    if (error) return logger.error(intLang('nedb._errors.staffRolesFindIneffective', error)+ ' [0029]'); // Error Handle (╯°□°）╯︵ ┻━┻
                    messageintLang = (!member) ? 'commands.manager._errors.isStaffRole' : 'commands.manager._errors.isStaffMember';
                    if (isStaff.length > 0) return message.reply(intLang(messageintLang, discord.prefix, discord.prefix));

                    // Check for duplicate entry
                    dbStaffRoles.findOne({ manager: manager.id }, (error, staffRoles) => {
                        
                        // Check if a Role or Member is already added
                        if (error) return logger.error(intLang('nedb._errors.staffRolesFindOneIneffective', error)+ ' [0030]'); // Error Handle (╯°□°）╯︵ ┻━┻
                        messageintLang = (!member) ? 'commands.manager.add.addRoleBotManagerIneffective' : 'commands.manager.add.addBotManagerIneffective';
                        if (staffRoles !== null) return message.reply(intLang(messageintLang, manager.id, discord.prefix, discord.prefix));
                        
                        // Insert the new Bot manager
                        dbStaffRoles.insert({ manager: manager.id, type: type, roleTitle: title }, error => {
                            if (error) return logger.error(intLang('nedb._errors.staffRolesInsertIneffective', error)+ ' [0031]'); // Error Handle (╯°□°）╯︵ ┻━┻

                            // Success Response ┬─┬ ノ( ゜-゜ノ)
                            message.react('✅')

                                // Assign the right message depending on Role or Member
                                .then(() => messageintLang = (!member) ? 'commands.manager.add.successRole' : 'commands.manager.add.successMember')
                                .then(() => message.reply(intLang(messageintLang, manager.id)))
                                .then(() => dumpEvent.dumpCommand(client, message, 'black', `${this.name} add`, manager, `${role ? true : false}`))
                                .catch(() => logger.error(intLang('discord._errors.messageReactIneffective', message.channel.id)+ ' [0032]'))
                        });
                    });
                });
                break;

            case 'remove':

                // Start search for Role or Member
                dbStaffRoles.find({ staff: manager.id }, (error, isStaff) => {
                    if (error) return logger.error(intLang('nedb._errors.staffRolesFindIneffective', error)+ ' [0033]'); // Error Handle (╯°□°）╯︵ ┻━┻
                    messageintLang = (!member) ? 'commands.manager._errors.isStaffRemoveRole' : 'commands.manager._errors.isStaffRemoveMember';
                    if (isStaff.length > 0) return message.reply(intLang(messageintLang, discord.prefix, discord.prefix));
            
                    // Check if entry exists
                    dbStaffRoles.findOne({ manager: manager.id }, (error, staffRoles) => {
                        
                        // Check for error and duplicate entry
                        if (error) return logger.error(intLang('nedb._errors.staffRolesFindIneffective', error)+ ' [0034]'); // Error Handle (╯°□°）╯︵ ┻━┻

                        // Assign the right message depending on Role or Member
                        messageintLang = (!member) ? 'commands.manager.remove.removeBotManagerRoleIneffective' : 'commands.manager.remove.removeBotManagerIneffective';
                        if (staffRoles === null) return message.reply(intLang(messageintLang, manager.id, discord.prefix, discord.prefix));
                        
                        // Remove a Bot manager
                        dbStaffRoles.remove({ manager: manager.id }, { multi: true }, error => {
                            if (error) return logger.error(intLang('nedb._errors.staffRolesRemoveIneffective', error)+ ' [0035]'); // Error Handle (╯°□°）╯︵ ┻━┻

                            // Success Response ┬─┬ ノ( ゜-゜ノ)
                            message.react('✅')

                                // Assign the right message depending on Role or Member
                                .then(() => messageintLang = (!member) ? 'commands.manager.remove.successRole' : 'commands.manager.remove.successMember')
                                .then(() => message.reply(intLang(messageintLang, manager.id,)))
                                .then(() => dumpEvent.dumpCommand(client, message, 'black', `${this.name} remove`, manager, `${role ? true : false}`))
                                .catch(() => logger.error(intLang('discord._errors.messageReactIneffective', message.channel.id)+ ' [0036]'));


                        });
                    });
                });
                break;
        }
    }
};
