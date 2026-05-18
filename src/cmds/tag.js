module.exports.config = {
    name: "tag",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "SaGor",
    description: "Tag the user you reply to, showing only their name",
    commandCategory: "other",
    usages: "",
    cooldowns: 5
};

module.exports.run = async function({ api, event }) {
    if (!event.messageReply) {
        return api.sendMessage("Please reply to the user you want to tag.", event.threadID, event.messageID);
    }

    const userID = event.messageReply.senderID;
    const userName = (await api.getUserInfo(userID))[userID].name;

    return api.sendMessage({
        body: userName,
        mentions: [{
            tag: userName,
            id: userID
        }]
    }, event.threadID, event.messageID);
};
