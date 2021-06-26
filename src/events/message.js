const path = require('path');
const {Collection} = require('discord.js');
const logger = require(path.join(__dirname, '..', 'config', 'logger'));
const intLang = require(path.join(__dirname, '..', 'locale', 'language'));
const {discord} = require(path.join(__dirname, '..', 'config', 'config'));
const {dbGuilds, dbDisabledCommand, dbStaffRoles} = require(path.join(__dirname, '..', 'utilities', 'datastore'));

// Event Emittion
module.exports = (client, message) => {

    // Message Verification
    if (message.author.bot || message.channel.type !== 'text') return;
    if (!message.content.startsWith(discord.prefix)) return;

    // Message Commands Parser
    const args = message.content.slice(discord.prefix.length).trim().split(/\s+/g);
    const commandName = args.shift().toLowerCase();

    // Query to check if we're typing in the commands text channel that is provided, also check for extra command channel if opted
    dbGuilds.count({ $or: [ { "channels.text": message.channel.id }, { extraCommandChannel: message.channel.id } ] }, (error, InternalQuery) => {

        // Check if we're typing in the provided commands channel
        if (error) return logger.error(intLang('nedb._errors.guildsFindOneIneffective', error)+ ' [0092]');
        if (!InternalQuery && commandName !== 'setup') return;
        
        // Return commandVerification
        return commandVerification(args, commandName);
    });

    // Check the command exist and that it's of the correct usage
    function commandVerification(args, commandName) {
        
        // Command Query
        const command = client.commands.get(commandName) || client.commands.find(command => command.aliases && command.aliases.includes(commandName));
        if (!command) return message.reply(intLang('events.message._errors.commandUnknown', discord.prefix))
            .catch(() => logger.error(intLang('discord._errors.messageIneffective', message.channel.id)+ ' [0093]'));

        // Command Arguments Verification
        if (command.arguments && !args.length) return message.reply(intLang('events.message._errors.argumentsRequired', discord.prefix))
            .catch(() => logger.error(intLang('discord._errors.messageIneffective', message.channel.id)+ ' [0099]'));

        // Command can be disabled check
        const commandCanDisable = client.commands.get(args[0]) || client.commands.find(command => command.aliases && command.aliases.includes(args[0]));
        if (command.name === 'disable' && commandCanDisable.allowDisable === false) return message.reply(intLang('commands.disable.failed.cannotDisable', args));
        
        // Check if user is an ADMINISTRATOR of the server, otherwise, we proceed with checks
        if (message.member.hasPermission('ADMINISTRATOR')) return commandExecute(args, command);

        // If the command is not a staff, manager or admin command, we can skip some checks here
        if (!command.adminOnly && !command.managerOnly && !command.staffOnly) return commandDisableVerification(args, commandName, command);
        else return staffPermissionCheck(args, commandName, command);
    }
    
    // Check that the given command is allowed to be ran by this user and they possess the right role
    function staffPermissionCheck(args, commandName, command) {

        // Command Permission Verification for ADMINISTRATOR, saves runtime
        if (command.adminOnly) return message.reply(intLang('events.message._errors.adminPermissionInsufficient'))
            .catch(() => logger.error(intLang('discord._errors.messageIneffective', message.channel.id)+ ' [0125]'));

        // Query for manager and staff that match the discord member
        dbStaffRoles.find({}, async (error, result) => {
            if (error) return logger.error(intLang('nedb._errors.staffRolesFindIneffective', error)+ ' [0094]');
            if (!result) return;

            if (command.managerOnly) return managerInternalCheck(result);
            if (command.staffOnly) return staffInternalCheck(result);

            async function managerInternalCheck(result) {

            // This check runs regards of command type, this allows managers to run Staff commands also
                for(let i = 0; i < result.length; i++) {
                    const managerRoleCheck = await message.member.roles.cache.find(role => role.id === result[i].manager);
                    if (managerRoleCheck) return commandCoolDownCheck(args, command);
                }
                return message.reply(intLang('events.message._errors.managerPermissionInsufficient'))
                    .catch(() => logger.error(intLang('discord._errors.messageIneffective', message.channel.id)+ ' [0095]'));

            }

            async function staffInternalCheck(result) {

                // If the staffOnly flag is set on a command, we check if the user has the staff role
                for(let i = 0; i < result.length; i++) {
                    const staffRoleCheck = await message.member.roles.cache.find(role => role.id === result[i].staff || role.id === result[i].manager);
                    if (staffRoleCheck && result[i].manager) return commandCoolDownCheck(args, command);
                    if (staffRoleCheck) return commandDisableVerification(args, commandName, command);
                }
                return message.reply(intLang('events.message._errors.staffPermissionInsufficient'))
                    .catch(() => logger.error(intLang('discord._errors.messageIneffective', message.channel.id)+ ' [0095]'));
            }
        });
    }

    // is the command disabled
    function commandDisableVerification(args, commandName, command) {

        // Command Disabled Verification
        dbDisabledCommand.find({commandDisabled: commandName}, (error, result) => {
            if (error) return logger.error(intLang('nedb._errors.DisableOrEnableFindIneffective', error)+ ' [0097]');
            
            if (result.length !== 0) return message.reply(intLang('events.message._errors.commandDisabled'))
                .catch(() => logger.error(intLang('discord._errors.messageIneffective', message.channel.id)+ ' [0098]'));

            return commandCoolDownCheck(args, command);
        });
    }

    // Message cooldown, this does not apply to Administrators
    function commandCoolDownCheck(args, command) {

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

        return commandExecute(args, command)
    }

    // Final Execute of command
    function commandExecute(args, command) {

        // Command Execution
        try {
            command.execute(client, message, args);
        } catch(error) {
            logger.error(intLang('commands._errors.executionIneffective', command.name, error)+ ' [0101]');
            message.reply(intLang('events.message._errors.executionIneffective'))
                .catch(() => logger.error(intLang('discord._errors.messageIneffective', message.channel.id)+ ' [0102]'));
        }
    }
};
