module.exports.config = {
  name: "tagall",
  version: "1.0.9",
  hasPermssion: 0,
  credits: "SaGor",
  description: "Mentions all group members one by one with optional text",
  commandCategory: "group",
  usages: "[custom text]",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  const threadInfo = await api.getThreadInfo(event.threadID);
  const allUsers = threadInfo.participantIDs.filter(id => id != api.getCurrentUserID());
  const customMessage = args.join(" ");

  for (let id of allUsers) {
    const userName = threadInfo.userInfo.find(u => u.id == id)?.name || "User";
    const body = customMessage ? `@${userName} ${customMessage}` : `@${userName}`;
    await api.sendMessage({ body, mentions: [{ tag: `@${userName}`, id }] }, event.threadID);
    await new Promise(resolve => setTimeout(resolve, 800));
  }
};
