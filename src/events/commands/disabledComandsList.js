const path = require('path');
const logger = require(path.join(__dirname, '../..', 'config', 'logger'));
const intLang = require(path.join(__dirname, '../..', 'locale', 'language'));
const {discord} = require(path.join(__dirname, '../..', 'config', 'config'));
const {messageEmbedSend} = require(path.join(__dirname, '../..', 'utilities', 'utilities'));
const {dbDisabledCommand} = require(path.join(__dirname, '../..', 'utilities', 'datastore'));

// Command Module
module.exports = {
    name: 'disabledcommands',
    description: 'Displays list of all currently disabled commands.',
    allowDisable: false,
    aliases: ['dcmds'],
    managerOnly: true,
    hide: true,
    cooldown: 15,
    execute(client, message) {

        // Results bring all current staff member(s) and role(s) back.
        dbDisabledCommand.find({}, async (error, disabledCommands) => {
            if (error) return logger.error(intLang('nedb._errors.staffRolesFindIneffective', error)+ ' [0016]'); // Error Handle (╯°□°）╯︵ ┻━┻

            // Assign empty arrays to be filled
            let disabledCommandsList = [];

            // If our List is empty we push no result string
            let listEmptyCheck = list => {
                const noItems = `**No commands are disabled at this time**\n`;
                if (list.length === 0) list.push(noItems);
            }

            // Check all our results from our original DB Query
            let resultProcess = result => {
                for(i = 0; disabledCommands.length > i; i++) {
                    if (result[i].commandDisabled) disabledCommandsList.push(`\`${discord.prefix}${result[i].commandDisabled}\`\n`);
                }

                // Check if anyone of our Results came back empty, if so we assign a Push message to the array.
                listEmptyCheck(disabledCommandsList);
            };

            // Process our result from the Search Query
            resultProcess(disabledCommands);
            await messageEmbedSend(client, message.channel, true, intLang('commands.disabledCommandsList.embedMessage.title', client.user.username), intLang('commands.disabledCommandsList.embedMessage.description', 'Disabled commands: \n' + disabledCommandsList.join(' ')));
        });
    }
};
