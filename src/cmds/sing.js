const axios = require("axios");
const yts = require("yt-search");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "sing",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "SaGor",
  description: "Search YouTube and download mp3",
  commandCategory: "media",
  usages: "sing <song name>",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {

  try {

    const query = args.join(" ").trim();
    if (!query) return api.sendMessage(
      "🎵 | Please enter a song name.",
      event.threadID, event.messageID
    );

    const loading = await api.sendMessage(
      "Please wait...",
      event.threadID
    );

    const search = await yts(query);
    if (!search || !search.videos || search.videos.length === 0) {
      api.unsendMessage(loading.messageID);
      return api.sendMessage("No song found.", event.threadID, event.messageID);
    }

    const cachePath = path.join(__dirname, "cache");
    if (!fs.existsSync(cachePath)) fs.mkdirSync(cachePath, { recursive: true });

    let audioUrl = null;
    let selectedVideo = null;

    for (var i = 0; i < Math.min(search.videos.length, 10); i++) {
      var video = search.videos[i];
      try {
        var res = await axios.get(
          "https://sagor.nav.bd/sagor/ytdl/ytmp3?url=" + encodeURIComponent(video.url),
          {
            timeout: 30000,
            headers: { "User-Agent": "Mozilla/5.0" }
          }
        );

        var url = (res.data && (res.data.downloadUrl || res.data.url));
        if (url) {
          audioUrl = url;
          selectedVideo = video;
          break;
        }
      } catch (e) {}
    }

    api.unsendMessage(loading.messageID);

    if (!audioUrl || !selectedVideo) return api.sendMessage(
      "No downloadable song found.",
      event.threadID, event.messageID
    );

    var filePath = path.join(cachePath, Date.now() + ".mp3");

    var streamRes = await axios({
      url: audioUrl,
      method: "GET",
      responseType: "stream",
      timeout: 60000,
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    await new Promise(function (resolve, reject) {
      var writer = fs.createWriteStream(filePath);
      streamRes.data.pipe(writer);
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    await api.sendMessage(
      {
        body: "🎶 𝗬𝗢𝗨𝗧𝗨𝗕𝗘 𝗦𝗢𝗡𝗚\n\n" +
              "📌 " + selectedVideo.title + "\n" +
              "⏱ " + selectedVideo.timestamp + "\n" +
              "🔗 " + selectedVideo.url,
        attachment: fs.createReadStream(filePath)
      },
      event.threadID,
      function () {
        try { fs.unlinkSync(filePath); } catch (e) {}
      }
    );

  } catch (err) {
    api.sendMessage("Failed to fetch song.", event.threadID, event.messageID);
  }
};
