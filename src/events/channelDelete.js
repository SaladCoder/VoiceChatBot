const {dbGuilds, dbVoiceChannels} = require('../utilities/datastore');
const logger = require('../config/logger');
const intLang = require('../locale/language');
const fs = require('fs');

// Event Emittion
module.exports = (client, channel) => {

    // Grab our log channel ID
    const logChannel = JSON.parse(fs.readFileSync(`${__dirname}/../config/config.json`, 'utf8'));
    
    if (logChannel.dumpChannel.channelID === channel.id) {

        // Assign empty value for channelID as it was removed
        logChannel.dumpChannel.channelID = '';

        // Write to file
        fs.writeFile(`${__dirname}/../config/config.json`, JSON.stringify(logChannel, null, "\t"), error => {	
            if (error) return logger.error(intLang('events.channelDelete.unableToWriteFile', error)+ ' [0126]');
        });
    }

    // Remove the channel as a command channel if the channel was removed
    dbGuilds.remove({extraCommandChannel: channel.id}, { multi: true }, error => {
        if (error) return logger.error(intLang('nedb._errors.setCommandChannelRemoveIneffective', error)+ ' [0127]');
    });

    // NeDB VoiceChannels Removal
    dbVoiceChannels.remove({id: channel.id}, {}, error => {
        if (error) return logger.error(intLang('nedb._errors.voiceChannelsRemoveIneffective', error)+ ' [0089]');
    });
};
