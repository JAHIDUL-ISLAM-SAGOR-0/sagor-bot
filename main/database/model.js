module.exports = async function (input) {
    const force = false;

    const Users = require("./models/users")(input);
    const Threads = require("./models/threads")(input);
    const Currencies = require("./models/currencies")(input);

    const dbCfg = (global.config && global.config.database) || {};
    const autoSync = dbCfg.autoSyncWhenStart !== false;

    if (autoSync) {
        await Users.sync({ force });
        await Threads.sync({ force });
        await Currencies.sync({ force });
    }

    return {
        model: { Users, Threads, Currencies },
        use: function (modelName) { return this.model[modelName]; }
    };
};
