const {dbStaffRoles} = require('../../utilities/datastore');
const logger = require('../../config/logger');
const intLang = require('../../locale/language');
const {discord} = require('../../config/config');
const {dumpEvent} = require('../../utilities/dumpEvent');

// Command Module
module.exports = {
    name: 'staff',
    description: 'Adds or removes a staff member for channel immunity and special commands',
    allowDisable: false,
    arguments: true,
    managerOnly: true,
    hide: true,
    usage: '<add/remove> <@Mention>',
    cooldown: 2,
    execute(client, message, arg) {

        // Member and Role Mention Verification
        const member = message.mentions.members.first() || message.guild.members.cache.get(arg[1]);
        const role = message.mentions.roles.first() || message.guild.roles.cache.get(arg[1]);

        if (typeof member !== 'undefined' && member.id === message.author.id) return message.reply(intLang('commands.staff._errors.selfMember'));
        if (!member && !role) return message.reply(intLang('commands.staff._errors.invalidMemberOrRole'));

        // Option Verification
        const option = arg[0].toLowerCase();
        if (option !== 'add' && option !== 'remove') return message.reply(intLang('commands.staff._errors.firstOption', discord.prefix));

        // Check if we're dealing with a Role or a Member and assign the right value
        if (!role){ 
            staff = member;
            type = 'member';
            title = 'null';
        }else{
            staff = role;
            type = 'role';
            title = role.name;
        };

        switch(option){
            case 'add':

                // Check if entry exists
                dbStaffRoles.findOne({ $or: [{ manager: staff.id }, { staff: staff.id }] }, (error, result) => {
                    
                    // Check if a Role or Member is already added
                    if (error) return logger.error(intLang('nedb._errors.staffRolesFindOneIneffective', error)+ ' [0080]'); // Error Handle (╯°□°）╯︵ ┻━┻

                    // Check they're not a Manager or Staff member to avoid double entry.
                    if (result) {
                        if (result.manager) return message.reply(intLang((!member) ? 'commands.staff._errors.isManagerRole' : 'commands.staff._errors.isManagerMember', discord.prefix, discord.prefix));
                        if (result.staff) return message.reply(intLang((!member) ? 'commands.staff.add.addRoleStaffIneffective' : 'commands.staff.add.addStaffIneffective', staff.id, discord.prefix, discord.prefix));
                    }
                    
                    // Insert the new Staff member
                    dbStaffRoles.insert({ staff: staff.id, type: type, roleTitle: title }, error => {
                        if (error) return logger.error(intLang('nedb._errors.staffRolesInsertIneffective', error)+ ' [0081]'); // Error Handle (╯°□°）╯︵ ┻━┻

                        // Success Response ┬─┬ ノ( ゜-゜ノ)
                        message.react('✅')

                            // Assign the right message depending on Role or Member
                            .then(() => message.reply(intLang((!member) ? 'commands.staff.add.successRole' : 'commands.staff.add.successMember', staff.id)))
                            .then(() => dumpEvent.dumpCommand(client, message, 'black', `${this.name} add`, staff, `${role ? true : false}`))
                            .catch(() => logger.error(intLang('discord._errors.messageReactIneffective', message.channel.id)+ ' [0082]'));
                    });
                });
                break;

            case 'remove':

                    // Check if entry exists
                    dbStaffRoles.findOne({ $or: [{ manager: staff.id }, { staff: staff.id }] }, (error, result) => {
                        
                        // Check for error and duplicate entry
                        if (error) return logger.error(intLang('nedb._errors.staffRolesFindIneffective', error)+ ' [0084]'); // Error Handle (╯°□°）╯︵ ┻━┻

                        // Check that entry exists and that they're not manager
                        if (!result) return message.reply(intLang((!member) ? 'commands.staff.remove.removeStaffRoleIneffective' : 'commands.staff.remove.removeStaffIneffective', staff.id, discord.prefix, discord.prefix));
                        if (result.manager) return message.reply(intLang((!member) ? 'commands.staff._errors.isManagerRemoveRole' : 'commands.staff._errors.isManagerRemoveMember', discord.prefix, discord.prefix));

                        // Remove a Staff member
                        dbStaffRoles.remove({ staff: staff.id }, { multi: true }, error => {
                            if (error) return logger.error(intLang('nedb._errors.staffRolesRemoveIneffective', error)+ ' [0085]'); // Error Handle (╯°□°）╯︵ ┻━┻

                            // Success Response ┬─┬ ノ( ゜-゜ノ)
                            message.react('✅')

                                // Assign the right message depending on Role or Member
                                .then(() => message.reply(intLang((!member) ? 'commands.staff.remove.successRole' : 'commands.staff.remove.successMember', staff.id)))
                                .then(() => dumpEvent.dumpCommand(client, message, 'black', `${this.name} remove`, staff, `${role ? true : false}`))
                                .catch(() => logger.error(intLang('discord._errors.messageReactIneffective', message.channel.id)+ ' [0086]'));
                        });
                    });
                break;
        }
    }
};
