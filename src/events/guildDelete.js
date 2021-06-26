const path = require('path');
const logger = require(path.join(__dirname, '..', 'config', 'logger'));
const intLang = require(path.join(__dirname, '..', 'locale', 'language'));
const {dbGuilds, dbVoiceChannels} = require(path.join(__dirname, '..', 'utilities', 'datastore'));

// Event Emittion
module.exports = (client, guild) => {

    // NeDB Guilds Removal
    dbGuilds.remove({id: guild.id}, error => {
        if (error) return logger.error(intLang('nedb._errors.guildsRemoveIneffective', error)+ ' [0090]');
    });

    // NeDB VoiceChannels Removal
    dbVoiceChannels.remove({guild: guild.id}, {multi: true}, error => {
        if (error) return logger.error(intLang('nedb._errors.voiceChannelsRemoveIneffective', error)+ ' [0091]');
    });
};
