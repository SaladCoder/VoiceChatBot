const {dbGuilds} = require('../../utilities/datastore');
const logger = require('../../config/logger');
const intLang = require('../../locale/language');
const {dumpEvent} = require('../../utilities/dumpEvent');

// Command Module
module.exports = {
    name: 'clear',
    description: 'Clears all invalid voice channels in the datastore.',
    allowDisable: false,
    staffOnly: true,
    hide: true,
    cooldown: 15,
    execute(client, message) {

        // NeDB VoiceChannels Query
        dbGuilds.findOne({id: message.guild.id}, async (error, Guild) => {
            if (error) return logger.error(intLang('nedb._errors.guildFindOneIneffective', error)+ ' [0007]');

            // Two vars set for Number of channels removed and promise return in an Array
            let removeCount = 0;
            let promiseArray = [];

            // Voice Channel Deletion
            await message.guild.channels.cache.filter(channel => channel.parentID === Guild.channels.category).each(channel => {

                // Push a Channel removed promise to an Array that we will then wait for completion later on [There are two by default].
                promiseArray.push(
                    channel.fetch()
                        .then(channel => {
                            if (channel.type !== 'voice' || channel.id === Guild.channels.voice || channel.members.array().length) return;
                                channel.delete(intLang('commands.clear.voiceDelete.deleteChannelReason', message.author.tag), removeCount++)

                                // Increment removeCount for successful channel removal
                                .then(() => removeCount++)
                                .catch(error => logger.error(intLang('discord._errors.channelDeleteIneffective', error)+ ' [0008]'));
                        }).catch(error => logger.error(intLang('discord._errors.channelFetchIneffective', error)+ ' [0009]'))
                );
            });

            // Wait for all channel removed promises to resolve
            Promise.all(promiseArray).then(() => {
                
                // We check to see if a channel has been removed and take action if it has
                if(removeCount > 0) {
                    message.react('✅')
                        .then(() => message.reply(intLang('commands.clear.voiceDelete.deleteChannelCount', removeCount)))
                        .then(() => dumpEvent.dumpCommand(client, message, 'purple', this.name));
                }
            }).catch(error => logger.error(intLang('discord._errors.channelRemovePromiseReturnIneffective', error)+ ' [0010]'));
        });
    }
};