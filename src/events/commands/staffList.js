const path = require('path');
const logger = require(path.join(__dirname, '../..', 'config', 'logger'));
const intLang = require(path.join(__dirname, '../..', 'locale', 'language'));
const {messageEmbedSend} = require(path.join(__dirname, '../..', 'utilities', 'utilities'));
const {dbStaffRoles} = require(path.join(__dirname, '../..', 'utilities', 'datastore'));

// Command Module
module.exports = {
    name: 'stafflist',
    description: 'Displays list of all current managers and staff.',
    allowDisable: false,
    aliases: ['managerlist'],
    managerOnly: true,
    hide: true,
    cooldown: 15,
    execute(client, message) {

        // Results bring all current staff member(s) and role(s) back.
        dbStaffRoles.find({}, async (error, staffListResult) => {
            if (error) return logger.error(intLang('nedb._errors.staffRolesFindIneffective', error)+ ' [0078]'); // Error Handle (╯°□°）╯︵ ┻━┻

            // Assign empty arrays to be filled
            let managerListRoles = [];
            let staffListRoles = [];
            let managerList = [];
            let staffList = [];

            // If our List is empty we push no result string
            let listEmptyCheck = (type, list) => {
                const noItems = `**No ${type ? `role` : `member` } added to this permission**\n`;
                if (list.length === 0) list.push(noItems);
            }

            // Check all our results from our original DB Query
            let resultProcess = result => {
                for(i = 0; staffListResult.length > i; i++) {
                    switch (result[i].type) {
                        case "role":
                            if (result[i].manager) managerListRoles.push(`<@&${result[i].manager}>\n`);
                            if (result[i].staff) staffListRoles.push(`<@&${result[i].staff}>\n`);
                        break;
                        case "member":
                            if (result[i].manager) managerList.push(`<@${result[i].manager}>\n`);
                            if (result[i].staff) staffList.push(`<@${result[i].staff}>\n`);
                        break;
                    }
                }

                // Check if anyone of our Results came back empty, if so we assign a Push message to the array.
                listEmptyCheck(true, managerListRoles);
                listEmptyCheck(true, staffListRoles);

                listEmptyCheck(false, managerList);
                listEmptyCheck(false, staffList);
            };

            // Process our result from the Search Query
            resultProcess(staffListResult);
            await messageEmbedSend(client, message.channel, true, intLang('commands.staffList.embedMessage.title', client.user.username), intLang('commands.staffList.embedMessage.description', 'Bot Manager(s): \n' + managerList.join(' ') + '\nStaff Member(s): \n' + staffList.join(' ') + '\nManager Role(s): \n' + managerListRoles.join(' ') + '\nStaff Role(s): \n' + staffListRoles.join(' ')));
        });
    }
};
