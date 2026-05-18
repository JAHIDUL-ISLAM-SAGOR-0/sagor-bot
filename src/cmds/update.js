const { checkForUpdate } = require("../../main/utils/Updater");
const { applyUpdate } = require("../../main/utils/Update");

module.exports.config = {
  name: "update",
  version: "1.0.0",
  credits: "SAGOR",
  hasPermssion: 3,
  description: "Check and apply bot update from main repo",
  usages: "[check | apply]",
  commandCategory: "Admin",
  cooldowns: 10
};

module.exports.languages = {
  en: {
    checking: "🔍 Checking for updates...",
    latest: "✅ Bot is already on the latest version!\n📦 Version: v{version}",
    available: "🆕 Update Available!\n\n📦 Current: v{local}\n🚀 New: v{remote}\n\n📝 Changelog:\n{changelog}\n\nReply with .update apply to install.",
    applying: "⏳ Downloading and applying update...\nBot will restart after update.",
    success: "✅ Update applied successfully!\n📦 New version: v{version}\n🔄 Restarting bot...",
    failed: "❌ Update failed: {error}",
    noUpdate: "✅ No update needed.",
    error: "❌ Error: {error}"
  }
};

module.exports.run = async ({ api, event, getText, args }) => {
  const action = (args[0] || "check").toLowerCase();

  if (action === "check") {
    await api.sendMessage(getText("checking"), event.threadID);
    const info = await checkForUpdate();
    if (info.error) {
      return api.sendMessage(getText("error").replace("{error}", info.error), event.threadID);
    }
    if (!info.hasUpdate) {
      return api.sendMessage(
        getText("latest").replace("{version}", info.localVersion),
        event.threadID
      );
    }
    const changelog = (info.changelog && info.changelog.length > 0)
      ? info.changelog.map(c => `• ${c}`).join("\n")
      : "• No changelog provided";
    return api.sendMessage(
      getText("available")
        .replace("{local}", info.localVersion)
        .replace("{remote}", info.remoteVersion)
        .replace("{changelog}", changelog),
      event.threadID
    );
  }

  if (action === "apply") {
    await api.sendMessage(getText("applying"), event.threadID);
    const result = await applyUpdate({ forceRestart: true });
    if (result.success) {
      return api.sendMessage(
        getText("success").replace("{version}", result.remoteVersion),
        event.threadID
      );
    } else if (result.reason === "already_latest") {
      return api.sendMessage(getText("noUpdate"), event.threadID);
    } else {
      return api.sendMessage(
        getText("failed").replace("{error}", result.error || "Unknown error"),
        event.threadID
      );
    }
  }
};
