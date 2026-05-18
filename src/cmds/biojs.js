module.exports.config = {
        name: "bio",
        version: "1.0.0",
        hasPermssion: 2,
        credits: "𝐏𝐫𝐢𝐲𝐚𝐧𝐬𝐡 𝐑𝐚𝐣𝐩𝐮𝐭",
        description: "Change bot's bio",
        commandCategory: "admin",
        usages: "bio [text]",
  cooldowns: 5
  
}
  
  module.exports.run = async ({ api, event, args, permssion, Users }) => {
    if (!args.join(" ").trim()) return api.sendMessage("Usage: bio [text]", event.threadID, event.messageID);
    api.changeBio(args.join(" "), (e) => {
      if (e) return api.sendMessage("An error occurred: " + (e.message || JSON.stringify(e)), event.threadID);
      return api.sendMessage("Has changed the biography of the bot into:\n" + args.join(" "), event.threadID, event.messageID);
    });
  }