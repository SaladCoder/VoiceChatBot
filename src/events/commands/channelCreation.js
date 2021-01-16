const {discord} = require('../../config/config');
const logger = require('../../config/logger');
const intLang = require('../../locale/language');
const fs = require('fs');

// Command Module
module.exports = {
    name: 'channelcreation',
    description: 'Sets the slots and the voice channel lock status on channel creation.',
    allowDisable: false,
    arguments: true,
    managerOnly: true,
    hide: true,
    usage: '<slots/lock> <Number/True or False>',
    cooldown: 5,
    execute(client, message) {

        // Message Commands Parser
        const args = message.content.slice(discord.prefix.length).trim().split(/\s+/g);
        const type = args[1].toLowerCase();
        const property = args[2];

        // Check we have all 3 args for this command
        if (args.length !== 3) return message.reply(intLang('commands.channelCreation._errors.wrongOption', discord.prefix));

        // Load our Config file for later reading and writing
        const configFile = JSON.parse(fs.readFileSync(`${__dirname}/../../config/config.json`, 'utf8'));

        switch(type){
            case 'slots':

                // Convert to a number for comparison
                const slots = Number(property);

                // If the Number given is the same as the config file, we return making the planet greener
                if (slots === configFile.channelTemplate.channelSlots) return message.reply(intLang('commands.channelCreation.slots.failed.slotsNotUpdated'));

                // Check if a number was given for arg slots
                if (typeof slots === 'number') {

                    // Check if the range is not above 99 and not below 1, else return
                    if (!slots > 99 || !slots < 1) configFile.channelTemplate.channelSlots = slots;
                    else return message.reply(intLang('commands.channelCreation.slots._errors.slotsIncorrectValue'));
                }
                break;
            case 'lock':

                // If the option [true/false] given is the same as the config file, we return making the planet more greener :D
                if (property === configFile.channelTemplate.lockStatus) return message.reply(intLang('commands.channelCreation.lock.failed.lockNotUpdated'));

                // Check if we was given a string
                if (typeof property === 'string') {

                    // Straight forward if statement, if anything other than [true/false] given, return
                    if (property === 'true' || property === 'false') configFile.channelTemplate.lockStatus = property.toLowerCase();
                    else return message.reply(intLang('commands.channelCreation.lock._errors.lockIncorrectType'));
                }
                break;
            default:

                // if any of the options given do not equal slots or lock, return here
                return message.reply(intLang('commands.channelCreation._errors.wrongOption', discord.prefix));
        }

        // Write to file if any changes are accepted
        fs.writeFile(`${__dirname}/../../config/config.json`, JSON.stringify(configFile, null, "\t"), error => {	
            if (error) return logger.error(intLang('commands.channelCreation.failed.unableToWriteFile', error)+ ' [0004]');

        // Give the appropriate response
        if (type === 'slots') message.react('✅')
            .then(() => message.reply(intLang('commands.channelCreation.slots.success.slotsUpdated', Number(property)))) // Success Response ┬─┬ ノ( ゜-゜ノ)
            .catch(() => logger.error(intLang('discord._errors.messageReactIneffective', message.channel.id)+ ' [0005]')); // Error Handle (╯°□°）╯︵ ┻━┻
        if (type === 'lock') message.react('✅')
            .then(() => message.reply(intLang('commands.channelCreation.lock.success.lockUpdated', property.toLowerCase()))) // Success Response ┬─┬ ノ( ゜-゜ノ)
            .catch(() => logger.error(intLang('discord._errors.messageReactIneffective', message.channel.id)+ ' [0006]')); // Error Handle (╯°□°）╯︵ ┻━┻
        });
    }
};