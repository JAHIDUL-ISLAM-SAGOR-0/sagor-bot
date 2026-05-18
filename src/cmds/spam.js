module.exports.config = {
    name: "spam",
    version: "1.0.0",
    hasPermssion: 2,
    credits: "SaGor",
    description: "Spam a message N times",
    commandCategory: "admin",
    usages: "[msg] [amount]",
    cooldowns: 5,
};

module.exports.run = function ({ api, event, args }) {
    const ADMINBOT = (global.config && global.config.ADMINBOT) || [];
    const SUPERADMIN = (global.config && global.config.SUPERADMIN) || [];
    if (!ADMINBOT.includes(event.senderID) && !SUPERADMIN.includes(event.senderID))
        return api.sendMessage("Only Bot Admin can use this command.", event.threadID, event.messageID);

    if (args.length < 2)
        return api.sendMessage(`Usage: ${global.config.PREFIX}spam [msg] [amount]`, event.threadID);

    const msg = args[0];
    const count = parseInt(args[1]);
    if (isNaN(count) || count < 1 || count > 30)
        return api.sendMessage("Amount must be a number between 1 and 30.", event.threadID);

    for (let i = 0; i < count; i++) {
        api.sendMessage(msg, event.threadID);
    }
};
