const path = require('path');
const logger = require(path.join(__dirname, '../..', 'config', 'logger'));
const intLang = require(path.join(__dirname, '../..', 'locale', 'language'));
const {dumpEvent} = require(path.join(__dirname, '../..', 'utilities', 'dumpEvent'));
const {dbGuilds, dbVoiceChannels} = require(path.join(__dirname, '../..', 'utilities', 'datastore'));

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
        dbVoiceChannels.find({}, async (error, voiceChannelData) => {
            if (error) return logger.error(intLang('nedb._errors.voiceChannelsFindIneffective', error)+ ' [0248]');

            // NeDB OverFlow Category Query
            dbGuilds.find({ type: 'OVERFLOW' }, async (error, overFlowCategoryData) => {
                if (error) return logger.error(intLang('nedb._errors.guildsFindIneffective', error)+ ' [0249]');
                return removeVoiceChannels(voiceChannelData, overFlowCategoryData);
            });
        });

        async function removeVoiceChannels(voiceChannelData, overFlowCategoryData) {

            // Two vars set for Number of channels removed and promise return in an Array
            let removeCount = 0;
            let promiseArray = [];

            for (let i = 0; i < voiceChannelData.length; i++){
                // Voice Channel Deletion
                await message.guild.channels.cache.filter(channel => channel.id === voiceChannelData[i].id).each(channel => {

                    // Push a Channel removed promise to an Array that we will then wait for completion later on [There are two by default].
                    promiseArray.push(
                        channel.fetch()
                            .then(channel => {
                                if (channel.type !== 'voice' || channel.members.array().length) return;
                                    channel.delete(intLang('commands.clear.voiceDelete.deleteChannelReason', message.author.tag), removeCount++) // Increment removeCount for successful channel removal
                                        .catch(error => logger.error(intLang('discord._errors.channelDeleteIneffective', error)+ ' [0250]'));
                            }).catch(error => logger.error(intLang('discord._errors.channelFetchIneffective', error)+ ' [0251]'))
                    );
                });
            }

            // Wait for all channel removed promises to resolve
            Promise.all(promiseArray).then(() => {
                
                // We check to see if a channel has been removed and take action if it has
                if(removeCount > 0) {
                    message.react('✅')
                        .then(() => message.reply(intLang('commands.clear.voiceDelete.deleteChannelCount', removeCount))
                            .catch(() => logger.error(intLang('discord._errors.messageIneffective', message.channel.id)+ ' [0252]')))
                        .catch(() => logger.error(intLang('discord._errors.messageReactIneffective', message.channel.id)+ ' [0253]'));
                }
            }).catch(error => logger.error(intLang('discord._errors.channelRemovePromiseReturnIneffective', error)+ ' [0254]'));

            setTimeout(() => {
                return removeOverFlowCategories(overFlowCategoryData);
            }, 5000);
        }

        async function removeOverFlowCategories(overFlowCategoryData) {

            // Two vars set for Number of channels removed and promise return in an Array
            let removeCount = 0;
            let promiseArray = [];

            for (let i = 0; i < overFlowCategoryData.length; i++){
                // Voice Channel Deletion
                await message.guild.channels.cache.filter(category => category.id === overFlowCategoryData[i].channels.category).each(category => {

                    // Push a Channel removed promise to an Array that we will then wait for completion later on [There are two by default].
                    promiseArray.push(
                        category.fetch()
                            .then(category => {
                                if (category.type !== 'category' || category.children.size > 0) return;
                                category.delete(intLang('commands.clear.voiceDelete.deleteCategoryReason', message.author.tag), removeCount++) // Increment removeCount for successful channel removal
                                        .catch(error => logger.error(intLang('discord._errors.categoryDeleteIneffective', error)+ ' [0255]'));
                            }).catch(error => logger.error(intLang('discord._errors.categoryFetchIneffective', error)+ ' [0256]'))
                    );
                });
            }

            // Wait for all channel removed promises to resolve
            Promise.all(promiseArray).then(() => {
                
                // We check to see if a channel has been removed and take action if it has
                if(removeCount > 0) {
                    message.reply(intLang('commands.clear.voiceDelete.deleteCategoryCount', removeCount))
                        .catch(() => logger.error(intLang('discord._errors.messageIneffective', message.channel.id)+ ' [0257]'));
                }
            }).catch(error => logger.error(intLang('discord._errors.channelRemovePromiseReturnIneffective', error)+ ' [0259]'));
        }
        return dumpEvent.dumpCommand(client, message, 'purple', this.name);
    }
};