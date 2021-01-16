const {Collection} = require('discord.js');
const {dbGuilds, dbStaffRoles, dbDisabledCommand} = require('../utilities/datastore');
const {discord} = require('../config/config');
const intLang = require('../locale/language');
const logger = require('../config/logger');

// Event Emittion
module.exports = (client, message) => {

    // Message Verification
    if (message.author.bot || message.channel.type !== 'text') return;
    if (!message.content.startsWith(discord.prefix)) return;

    // Message Commands Parser
    let args = message.content.slice(discord.prefix.length).trim().split(/\s+/g);
    let commandName = args.shift().toLowerCase();

    // Query to check if we're typing in the commands text channel that is provided, also check for extra command channel if opted
    dbGuilds.count({ $or: [ { "channels.text": message.channel.id }, { extraCommandChannel: message.channel.id } ] }, (error, InternalQuery) => {

        // Check if we're typing in the provided commands channel
        if (error) return logger.error(intLang('nedb._errors.guildsFindOneIneffective', error)+ ' [0092]');
        if (!InternalQuery && commandName !== 'setup') return;

        // Command Query
        const command = client.commands.get(commandName) || client.commands.find(command => command.aliases && command.aliases.includes(commandName));
        if (!command) return message.reply(intLang('events.message._errors.commandUnknown', discord.prefix))
            .catch(() => logger.error(intLang('discord._errors.messageIneffective', message.channel.id)+ ' [0093]'));

        // Command can be disabled check
        const secondCommand = client.commands.get(args[0]) || client.commands.find(command => command.aliases && command.aliases.includes(args[0]));
        if (command.name === 'disable' && secondCommand.allowDisable === false) return message.reply(intLang('commands.disable.failed.cannotDisable', args));
        
        // Variable set for pre-checks of staff ranks
        let overRide = false;
        let isManager = false;
        let isStaff = false;

        // Check if user is an ADMINISTRATOR of the server, otherwise, we proceed with checks
        if (message.member.hasPermission('ADMINISTRATOR')) overRide = true;

        // Query for manager and staff that match the discord member
        dbStaffRoles.find({ $or: [{staff: message.member.id}, {manager: message.member.id}] }, async (error, result) => {
            if (error) return logger.error(intLang('nedb._errors.staffRolesFindIneffective', error)+ ' [0094]');

            // If result for manager or staff come back with a match, we set our appropriate variable
            if (result.length !== 0) {
                if (result[0].manager === message.member.id) isManager = true;
                if (result[0].staff === message.member.id) isStaff = true;
            };

            // Command Permission Verification
            if (command.adminOnly && !overRide) return message.reply(intLang('events.message._errors.adminPermissionInsufficient'))
                .catch(() => logger.error(intLang('discord._errors.messageIneffective', message.channel.id)+ ' [0125]'));
            if (command.managerOnly && !overRide && !isManager) return message.reply(intLang('events.message._errors.managerPermissionInsufficient'))
                .catch(() => logger.error(intLang('discord._errors.messageIneffective', message.channel.id)+ ' [0095]'));
            if (command.staffOnly && !overRide && !isStaff && !isManager) return message.reply(intLang('events.message._errors.staffPermissionInsufficient'))
                .catch(() => logger.error(intLang('discord._errors.messageIneffective', message.channel.id)+ ' [0096]'));

            // Command Disabled Verification
            dbDisabledCommand.find({commandDisabled: commandName}, (error, result) => {
                if (error) return logger.error(intLang('nedb._errors.DisableOrEnableFindIneffective', error)+ ' [0097]');
                if (result.length !== 0 && !overRide && !isManager) return message.reply(intLang('events.message._errors.commandDisabled'))
                    .catch(() => logger.error(intLang('discord._errors.messageIneffective', message.channel.id)+ ' [0098]'));

                // Command Arguments Verification
                if (command.arguments && !args.length) return message.reply(intLang('events.message._errors.argumentsRequired', discord.prefix))
                    .catch(() => logger.error(intLang('discord._errors.messageIneffective', message.channel.id)+ ' [0099]'));

                // Command Cooldown Verification
                if (!client.cooldowns.has(command.name)) client.cooldowns.set(command.name, new Collection());
                const now = Date.now();
                const cooldown = client.cooldowns.get(command.name);
                const cooldownTime = (command.cooldown || 3) * 1000;
                if (cooldown.has(message.author.id)) {
                    const expiration = cooldown.get(message.author.id) + cooldownTime;
                    if (now < expiration) {
                        const remaining = (expiration - now) / 1000;
                        return message.reply(intLang('events.message._errors.cooldownInsufficient', Math.ceil(remaining)))
                            .catch(() => logger.error(intLang('discord._errors.messageIneffective', message.channel.id)+ ' [0100]'));
                    }
                }
                cooldown.set(message.author.id, now);
                setTimeout(() => cooldown.delete(message.author.id), cooldownTime);

                // Command Execution
                try {
                    command.execute(client, message, args);
                } catch(error) {
                    logger.error(intLang('commands._errors.executionIneffective', command.name, error)+ ' [0101]');
                    message.reply(intLang('events.message._errors.executionIneffective'))
                        .catch(() => logger.error(intLang('discord._errors.messageIneffective', message.channel.id)+ ' [0102]'));
                }
            });
        });
    });
};
