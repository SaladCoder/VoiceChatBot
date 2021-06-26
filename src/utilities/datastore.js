const path = require('path');
const Datastore = require('nedb');

// NeDB Datastore Collections
const dbGuilds = new Datastore({filename: path.join(__dirname, '../..', 'data', 'guilds.db'), autoload: true});
const dbVoiceChannels = new Datastore({filename: path.join(__dirname, '../..', 'data', 'voiceChannels.db'), autoload: true});
const dbStaffRoles = new Datastore({filename: path.join(__dirname, '../..', 'data', 'staffRoles.db'), autoload: true});
const dbNewMemberHelp = new Datastore({filename: path.join(__dirname, '../..', 'data', 'dbNewMemberHelp.db'), autoload: true});
const dbDisabledCommand = new Datastore({filename: path.join(__dirname, '../..', 'data', 'disabledCommand.db'), autoload: true});

// Auto compaction of dbGuilds Database file, every 1 Hour
dbGuilds.persistence.setAutocompactionInterval(3600000);

// Auto compaction of dbVoiceChannels Database file, every 10 Mins
dbVoiceChannels.persistence.setAutocompactionInterval(600000);

// Ensure indexing
dbVoiceChannels.ensureIndex({ fieldName: 'id', unique: true }, function (err) {
});

dbVoiceChannels.ensureIndex({ fieldName: 'channelOwner', unique: true }, function (err) {
});

// Datastore Module
module.exports = {

    // NeDB Guilds Queries
    dbGuilds: {
        
        // NeDB Guilds Count Query
        count: (query, callback) => {
            return dbGuilds.count(query, (error, count) => callback(error, count));
        },

        // NeDB Guilds Find Query
        find: (query, callback) => {
            return dbGuilds.find(query, (error, document) => callback(error, document));
        },

        // NeDB Guilds FindOne Query
        findOne: (query, callback) => {
            return dbGuilds.findOne(query, (error, document) => callback(error, document));
        },

        // NeDB Guilds Insertion Query
        insert: (query, callback) => {
            return dbGuilds.insert(query, (error, document) => callback(error, document));
        },

        // NeDB Guilds Update Query
        update: (query, update, options, callback) => {
            return dbGuilds.update(query, update, options, (error, numAffected, affectedDocuments, upsert) => callback(error, numAffected, affectedDocuments, upsert));
        },

        // NeDB Guilds Removal Query
        remove: (query, options, callback) => {
            return dbGuilds.remove(query, options, (error, document) => callback(error, document));
        }
    },

    // NeDB VoiceChannels Queries
    dbVoiceChannels: {
        
        // NeDB VoiceChannels Find Query
        find: (query, callback) => {
            return dbVoiceChannels.find(query, (error, document) => callback(error, document));
        },

        // NeDB VoiceChannels FindOne Query
        findOne: (query, callback) => {
            return dbVoiceChannels.findOne(query, (error, document) => callback(error, document));
        },

        // NeDB VoiceChannels Insertion Query
        insert: (query, callback) => {
            return dbVoiceChannels.insert(query, (error, document) => callback(error, document));
        },

        // NeDB VoiceChannels Removal Query
        remove: (query, options, callback) => {
            return dbVoiceChannels.remove(query, options, (error, document) => callback(error, document));
        }
    },

    // NeDB Bot Manager & Staff Role Query
    dbStaffRoles: {

        // NeDB Bot Manager & Staff Role Find Query
        find: (query, callback) => {
            return dbStaffRoles.find(query, (error, document) => callback(error, document));
        },

        // NeDB Bot Manager & Staff Role FindOne Query
        findOne: (query, callback) => {
            return dbStaffRoles.findOne(query, (error, document) => callback(error, document));
        },

        // NeDB Bot Manager & Staff Role Insertion Query
        insert: (query, callback) => {
            return dbStaffRoles.insert(query, (error, document) => callback(error, document));
        },

        // NeDB Bot Manager & Staff Role Removal Query
        remove: (query, options, callback) => {
            return dbStaffRoles.remove(query, options, (error, document) => callback(error, document));
        }
    },

    // NeDB Command Disabled or Enabled Query
    dbDisabledCommand: {

        // NeDB Guilds Count Query
        count: (query, callback) => {
            return dbDisabledCommand.count(query, (error, count) => callback(error, count));
        },

        // NeDB Command Disabled or Enabled Find Query
        find: (query, callback) => {
            return dbDisabledCommand.find(query, (error, document) => callback(error, document));
        },

        // NeDB Command Disabled or Enabled FindOne Query
        findOne: (query, callback) => {
            return dbDisabledCommand.findOne(query, (error, document) => callback(error, document));
        },

        // NeDB Command Disabled or Enabled Insertion Query
        insert: (query, callback) => {
            return dbDisabledCommand.insert(query, (error, document) => callback(error, document));
        },

        // NeDB Command Disabled or Enabled Removal Query
        remove: (query, options, callback) => {
            return dbDisabledCommand.remove(query, options, (error, document) => callback(error, document));
        }
    },

    // NeDB New Member Help Query
    dbNewMemberHelp: {

        // NeDB New Member Help FindOne Query
        findOne: (query, callback) => {
            return dbNewMemberHelp.findOne(query, (error, document) => callback(error, document));
        },
        
        // NeDB New Member Help Insertion Query
        insert: (query, callback) => {
            return dbNewMemberHelp.insert(query, (error, document) => callback(error, document));
        }
    }
};
