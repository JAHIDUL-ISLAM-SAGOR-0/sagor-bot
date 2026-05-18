const axios = require("axios");
const fs = require("fs-extra");

module.exports.config = {
  name: "v2a",
  version: "1.2",
  hasPermssion: 0,
  credits: "SaGor",
  description: "Convert Video to audio",
  commandCategory: "media",
  usages: "reply video",
  cooldowns: 20
};

module.exports.run = async function ({ api, event }) {
  try {
    if (!event.messageReply || !event.messageReply.attachments || event.messageReply.attachments.length === 0) {
      return api.sendMessage("Please reply to a video message to convert it to audio.", event.threadID, event.messageID);
    }

    const sagor = event.messageReply.attachments[0];

    if (sagor.type !== "video") {
      return api.sendMessage("The replied content must be a video.", event.threadID, event.messageID);
    }

    const { data } = await axios.get(sagor.url, {
      method: "GET",
      responseType: "arraybuffer"
    });

    const path = __dirname + `/cache/dvia.m4a`;

    if (!fs.existsSync(__dirname + "/cache")) {
      fs.mkdirSync(__dirname + "/cache");
    }

    fs.writeFileSync(path, Buffer.from(data, "utf-8"));

    const audioReadStream = fs.createReadStream(path);

    return api.sendMessage(
      {
        body: "",
        attachment: audioReadStream
      },
      event.threadID,
      event.messageID
    );

  } catch (e) {
    console.log(e);
    return api.sendMessage(e.message, event.threadID, event.messageID);
  }
};
