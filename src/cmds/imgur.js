const axios = require("axios");

module.exports.config = {
  name: "imgur",
  version: "3.0.0",
  hasPermssion: 0,
  credits: "SAGOR",
  description: "Upload media using Sagor API",
  commandCategory: "utility",
  usages: "reply image/video/gif",
  cooldowns: 5
};

module.exports.run = async ({ api, event }) => {
  try {
    const attachment = event.messageReply?.attachments[0];

    if (!attachment) {
      return api.sendMessage(
        "Reply to image/video/gif",
        event.threadID,
        event.messageID
      );
    }

    const wait = await api.sendMessage(
      "Uploading...",
      event.threadID
    );

    const apiUrl = `https://sagor-apis-nx.vercel.app/sagor/imgur?url=${encodeURIComponent(attachment.url)}`;

    const res = await axios.get(apiUrl);

    if (!res.data || res.data.status !== "success") {
      return api.editMessage(
        "Upload failed",
        wait.messageID
      );
    }

    const d = res.data.data;

    const msg = `
🔗 ${d.link}

📁 ${d.type || "N/A"}
`;

    api.editMessage(msg, wait.messageID);

  } catch (err) {
    api.sendMessage(
      "Error: " + err.message,
      event.threadID,
      event.messageID
    );
  }
};
