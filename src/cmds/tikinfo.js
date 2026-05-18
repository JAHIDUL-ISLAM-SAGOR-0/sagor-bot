module.exports.config = {
  name: "tikinfo",
  version: "1.0.3",
  hasPermssion: 0,
  credits: "Sagor",
  description: "Get TikTok user information",
  commandCategory: "info",
  usages: "tikinfo <username>",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  const axios = require("axios");
  const fs = require("fs-extra");

  if (!args[0]) return api.sendMessage("Username dao.", event.threadID, event.messageID);

  const path = __dirname + "/cache/tik.jpg";

  try {
    const res = await axios.get(`https://sagor.nav.bd/sagor/tikinfo?username=${args[0]}&apikey=sagor`);
    const d = res.data?.data;
    if (!d) return api.sendMessage("User pawa jai nai.", event.threadID, event.messageID);

    const msg =
`╭───『 𝗧𝗜𝗞𝗧𝗢𝗞 𝗜𝗡𝗙𝗢 』───╮
│ 👤 ${d.fullname}
│ 🔗 @${d.username}
│ 🆔 ${d.userId}
│
│ 👥 ${d.followers} followers
│ ➡️ ${d.following} following
│ ❤️ ${d.likes} likes
│ 🎬 ${d.videos} videos
│
│ 🌍 ${d.region} | ${d.language}
╰────────────────────╯

📄 Bio:
${d.bio || "No bio..."}`;

    let att;
    try {
      const img = await axios.get(d.profile_image, { responseType: "arraybuffer" });
      fs.writeFileSync(path, Buffer.from(img.data));
      att = fs.createReadStream(path);
    } catch {}

    return api.sendMessage(
      att ? { body: msg, attachment: att } : msg,
      event.threadID,
      event.messageID
    );

  } catch {
    return api.sendMessage("API error.", event.threadID, event.messageID);
  }
};