const path = require('path');
const logger = require(path.join(__dirname, '..', 'config', 'logger'));
const intLang = require(path.join(__dirname, '..', 'locale', 'language'));

// Event Emittion
module.exports = client => {

    // User Activity
    setInterval(() => {
        const activityArray = intLang('events.ready.activity.name');
        const extractActivity = activityArray.split(' ', 1);
        const setActivityFinal = activityArray.replace(extractActivity, '').trim();
        client.user.setActivity(setActivityFinal, {type: extractActivity[0]});
    }, 30000);

    // Ready Success
    logger.info(intLang('events.ready.success', client.user.tag, client.guilds.cache.reduce((accumulator, value) => accumulator + value.memberCount, 0)+ ' [0103]'));
};
