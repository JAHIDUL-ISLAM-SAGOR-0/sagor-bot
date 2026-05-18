module.exports.config = {
    name: "appstate",
    version: "1.0.0",
    hasPermssion: 3,
    credits: "SaGor",
    description: "Refresh cookie.txt with current appstate",
    commandCategory: "Admin",
    usages: "appstate",
    cooldowns: 5,
};

module.exports.run = async function ({ api, event }) {
    const fs = require("fs-extra");
    const ADMINBOT = (global.config && global.config.ADMINBOT) || [];
    const SUPERADMIN = (global.config && global.config.SUPERADMIN) || [];
    if (!ADMINBOT.includes(event.senderID) && !SUPERADMIN.includes(event.senderID))
        return api.sendMessage("You don't have permission to use this command.", event.threadID, event.messageID);

    const appstate = api.getAppState();
    const data = JSON.stringify(appstate);
    fs.writeFile(`${__dirname}/../../cookie.txt`, data, "utf8", (err) => {
        if (err) return api.sendMessage(`Error writing file: ${err}`, event.threadID);
        return api.sendMessage("Refreshed appstate successfully.", event.threadID);
    });
};
