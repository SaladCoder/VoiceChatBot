const path = require('path');
const logger = require(path.join(__dirname, '../..', 'config', 'logger'));
const intLang = require(path.join(__dirname, '../..', 'locale', 'language'));
const {discord} = require(path.join(__dirname, '../..', 'config', 'config'));
const {dumpEvent} = require(path.join(__dirname, '../..', 'utilities', 'dumpEvent'));
const {messageEmbedSend} = require(path.join(__dirname, '../..', 'utilities', 'utilities'));
const {dbGuilds} = require(path.join(__dirname, '../..', 'utilities', 'datastore'));

// Command Module
module.exports = {
    name: 'lockdown',
    description: 'Toggles the Voice Channel system from disabled/enabled!',
    allowDisable: false,
    hide: true,
    managerOnly: true,
    cooldown: 5,
    execute(client, message) {

        // NeDB Channels Query
        dbGuilds.findOne({id: message.guild.id}, (error, serverGuild) => {
            if (error) return logger.error(intLang('nedb._errors.voiceChannelsFindOneIneffective', error)+ ' [0025]');
            const category = client.channels.cache.find(category => category.id === serverGuild.channels.category);
            const responseChannel = client.channels.cache.find(responseChannel => responseChannel.id === serverGuild.channels.text);
            const isSetPermissions = category.permissionOverwrites.get(message.guild.roles.everyone.id);

            // Check for Channels permissions are not in a set state, in case someone has been messing with them, I see you >.>
            if (typeof isSetPermissions === 'undefined') return category.updateOverwrite(message.guild.roles.everyone.id, {CONNECT: false, SEND_MESSAGES: false})
                .then(() => message.react('✅').catch(() => logger.error(intLang('discord._errors.messageReactIneffective', message.channel.id)+ ' [0182]')))
                .then(() => message.reply(intLang('commands.lockdown.lockdownMessage.success.lockdownReplyOffline', discord.prefix)).catch(() => logger.error(intLang('discord._errors.messageIneffective', message.channel.id)+ ' [0183]')))
                .then(() => messageEmbedSend(client, responseChannel, false, intLang('commands.lockdown.lockdownMessage.embedMessageOffline.title'), intLang('commands.lockdown.lockdownMessage.embedMessageOffline.description')))
                .then(() => dumpEvent.dumpCommand(client, message, 'black', `${this.name} 'On'`))
                .catch(() => logger.error(intLang('commands.lockdown._errors.lockdownPermissionsIneffective')+ ' [0026]'));

            // Check to see if the channels are already in Lockdown
            if (isSetPermissions.deny.has('CONNECT' && 'SEND_MESSAGES')) return category.updateOverwrite(message.guild.roles.everyone.id, {CONNECT: true, SEND_MESSAGES: true})
                .then(() => message.react('✅').catch(() => logger.error(intLang('discord._errors.messageReactIneffective', message.channel.id)+ ' [0184]')))
                .then(() => message.reply(intLang('commands.lockdown.lockdownMessage.success.lockdownReplyOnline')).catch(() => logger.error(intLang('discord._errors.messageIneffective', message.channel.id)+ ' [0185]')))
                .then(() => messageEmbedSend(client, responseChannel, false, intLang('commands.lockdown.lockdownMessage.embedMessageOnline.title'), intLang('commands.lockdown.lockdownMessage.embedMessageOnline.description')))
                .then(() => dumpEvent.dumpCommand(client, message, 'black', `${this.name} 'Off'`))
                .catch(() => logger.error(intLang('commands.lockdown._errors.lockdownPermissionsIneffective')+ ' [0027]'));
            
            // Check to see if the channels are NOT in Lockdown
            if (isSetPermissions.allow.has('CONNECT' && 'SEND_MESSAGES')) return category.updateOverwrite(message.guild.roles.everyone.id, {CONNECT: false, SEND_MESSAGES: false})
                .then(() => message.react('✅').catch(() => logger.error(intLang('discord._errors.messageReactIneffective', message.channel.id)+ ' [0186]')))
                .then(() => message.reply(intLang('commands.lockdown.lockdownMessage.success.lockdownReplyOffline', discord.prefix)).catch(() => logger.error(intLang('discord._errors.messageIneffective', message.channel.id)+ ' [0187]')))
                .then(() => messageEmbedSend(client, responseChannel, false, intLang('commands.lockdown.lockdownMessage.embedMessageOffline.title'), intLang('commands.lockdown.lockdownMessage.embedMessageOffline.description')))
                .then(() => dumpEvent.dumpCommand(client, message, 'black', `${this.name} 'On'`))
                .catch(() => logger.error(intLang('commands.lockdown._errors.lockdownPermissionsIneffective')+ ' [0028]'));
        });
    }
};
