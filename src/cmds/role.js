const fs = require("fs-extra");
const path = require("path");

const ROLE_KEYS = {
  2: "ADMINBOT",
  3: "SUPERADMIN",
  4: "PREMIUM",
  5: "DEV",
  6: "VIP"
};

const ROLE_NAMES = {
  0: "👤 User",
  1: "👑 Group Admin",
  2: "🔧 Bot Admin",
  3: "⚡ Superadmin",
  4: "💎 Premium",
  5: "🛠️ Dev",
  6: "🌟 VIP"
};

function box(title, body) {
  return `╭─── ${title}\n${body}\n╰${"─".repeat(28)}`;
}

module.exports.config = {
  name: "role",
  version: "1.0.0",
  hasPermssion: 3,
  credits: "SaGor",
  description: "Manage user roles (VIP, Dev, Premium, Superadmin, Bot Admin)",
  commandCategory: "Admin",
  usages: "role [list | add <level> | remove] @tag/reply/uid",
  cooldowns: 3
};

module.exports.run = async function ({ api, event, args, Users, permssion }) {
  try {
    const { threadID, messageID, mentions, senderID } = event;
    const configPath = global.client.configPath;

    delete require.cache[require.resolve(configPath)];
    const config = require(configPath);

    for (const key of Object.values(ROLE_KEYS)) {
      if (!Array.isArray(config[key])) config[key] = [];
      config[key] = config[key].map(String);
    }

    const saveConfig = () => {
      fs.writeFileSync(configPath, JSON.stringify(config, null, 4));
      for (const key of Object.values(ROLE_KEYS)) {
        global.config[key] = [...config[key]];
      }
    };

    const getTargets = () => {
      const mentionIDs = Object.keys(mentions || {}).map(String);
      if (mentionIDs.length) return mentionIDs;
      if (event.messageReply) return [String(event.messageReply.senderID)];
      const last = args[args.length - 1];
      if (last && /^\d{10,}$/.test(last)) return [last];
      return [];
    };

    const getName = async (id) => {
      try { return (await Users.getData(String(id)))?.name || String(id); }
      catch { return String(id); }
    };

    const getUserRole = (uid) => {
      const s = String(uid);
      if (config.VIP.includes(s))        return 6;
      if (config.DEV.includes(s))        return 5;
      if (config.PREMIUM.includes(s))    return 4;
      if (config.SUPERADMIN.includes(s)) return 3;
      if (config.ADMINBOT.includes(s))   return 2;
      return 0;
    };

    const sub = (args[0] || "").toLowerCase();

    if (!sub || sub === "help") {
      return api.sendMessage(
        box("🎭 ROLE MANAGER", [
          "│",
          "│  role list              → সব role দেখো",
          "│  role add 2 @tag        → 🔧 Bot Admin",
          "│  role add 3 @tag        → ⚡ Superadmin",
          "│  role add 4 @tag        → 💎 Premium",
          "│  role add 5 @tag        → 🛠️ Dev",
          "│  role add 6 @tag        → 🌟 VIP",
          "│  role remove @tag       → Role সরাও",
          "│  role check @tag        → কারো role দেখো",
          "│",
          "│  Level Chart:",
          "│  0 👤 User  1 👑 Group Admin",
          "│  2 🔧 Bot Admin  3 ⚡ Superadmin",
          "│  4 💎 Premium  5 🛠️ Dev  6 🌟 VIP",
          "│",
          `│  Your role: ${ROLE_NAMES[permssion]} (Lv.${permssion})`
        ].join("\n")),
        threadID, messageID
      );
    }

    if (sub === "list") {
      let body = "│\n";
      for (const [level, key] of Object.entries(ROLE_KEYS).reverse()) {
        const ids = config[key] || [];
        body += `│  ${ROLE_NAMES[level]} (${ids.length})\n`;
        if (ids.length) {
          for (const id of ids) {
            const name = await getName(id);
            body += `│    ↳ ${name} (${id})\n`;
          }
        }
        body += "│\n";
      }
      return api.sendMessage(box("📋 ROLE LIST", body.trimEnd()), threadID, messageID);
    }

    if (sub === "add") {
      if (permssion < 3) {
        return api.sendMessage(box("🔐 DENIED", "│\n│  ⚡ Superadmin+ required to add roles."), threadID, messageID);
      }

      const levelArg = parseInt(args[1]);
      if (isNaN(levelArg) || levelArg < 2 || levelArg > 6) {
        return api.sendMessage(
          box("⚠️ USAGE", [
            "│",
            "│  role add <level> @tag/reply/uid",
            "│",
            "│  Levels:",
            "│  2 = 🔧 Bot Admin",
            "│  3 = ⚡ Superadmin",
            "│  4 = 💎 Premium",
            "│  5 = 🛠️ Dev",
            "│  6 = 🌟 VIP"
          ].join("\n")),
          threadID, messageID
        );
      }

      if (levelArg >= 5 && permssion < 5) {
        return api.sendMessage(box("🔐 DENIED", "│\n│  🛠️ Dev+ required to assign Dev/VIP roles."), threadID, messageID);
      }

      const targets = getTargets();
      if (!targets.length) {
        return api.sendMessage(box("⚠️ ERROR", "│\n│  Tag someone, reply, or provide a UID."), threadID, messageID);
      }

      const targetKey = ROLE_KEYS[levelArg];
      const added = [], skipped = [];

      for (const id of targets) {
        const currentLevel = getUserRole(id);
        if (currentLevel >= levelArg) {
          const name = await getName(id);
          skipped.push(`${name} already at ${ROLE_NAMES[currentLevel]}`);
          continue;
        }
        if (!config[targetKey].includes(id)) config[targetKey].push(id);
        const name = await getName(id);
        added.push(`${ROLE_NAMES[levelArg]} → ${name} (${id})`);
      }

      saveConfig();

      let body = "│\n";
      if (added.length) body += `│  ✅ Added:\n${added.map(l => `│    • ${l}`).join("\n")}\n│\n`;
      if (skipped.length) body += `│  ⚠️ Skipped:\n${skipped.map(l => `│    • ${l}`).join("\n")}\n│\n`;
      if (!added.length && !skipped.length) body += "│  No changes made.\n│\n";

      return api.sendMessage(box("✅ ROLE ADDED", body.trimEnd()), threadID, messageID);
    }

    if (sub === "remove" || sub === "rm") {
      if (permssion < 3) {
        return api.sendMessage(box("🔐 DENIED", "│\n│  ⚡ Superadmin+ required to remove roles."), threadID, messageID);
      }

      const targets = getTargets();
      if (!targets.length) {
        return api.sendMessage(box("⚠️ ERROR", "│\n│  Tag someone, reply, or provide a UID."), threadID, messageID);
      }

      const removed = [], skipped = [];

      for (const id of targets) {
        const currentLevel = getUserRole(id);
        if (currentLevel === 0) {
          const name = await getName(id);
          skipped.push(`${name} has no role`);
          continue;
        }
        if (currentLevel >= 5 && permssion < 5) {
          const name = await getName(id);
          skipped.push(`${name} is ${ROLE_NAMES[currentLevel]} — need Dev+ to remove`);
          continue;
        }
        let wasRemoved = false;
        for (const key of Object.values(ROLE_KEYS)) {
          const idx = config[key].indexOf(id);
          if (idx !== -1) { config[key].splice(idx, 1); wasRemoved = true; }
        }
        if (wasRemoved) {
          const name = await getName(id);
          removed.push(`${ROLE_NAMES[currentLevel]} removed → ${name} (${id}) → 👤 User`);
        }
      }

      saveConfig();

      let body = "│\n";
      if (removed.length) body += `│  ✅ Removed:\n${removed.map(l => `│    • ${l}`).join("\n")}\n│\n`;
      if (skipped.length) body += `│  ⚠️ Skipped:\n${skipped.map(l => `│    • ${l}`).join("\n")}\n│\n`;

      return api.sendMessage(box("❌ ROLE REMOVED", body.trimEnd()), threadID, messageID);
    }

    if (sub === "check") {
      const targets = getTargets();
      const checkID = targets[0] || String(senderID);
      const level = getUserRole(checkID);
      const name = await getName(checkID);
      return api.sendMessage(
        box("🔍 ROLE CHECK", [
          "│",
          `│  👤 Name  : ${name}`,
          `│  🆔 UID   : ${checkID}`,
          `│  🎭 Role  : ${ROLE_NAMES[level]}`,
          `│  📊 Level : ${level}`,
          "│"
        ].join("\n")),
        threadID, messageID
      );
    }

    return api.sendMessage(
      box("⚠️ UNKNOWN", "│\n│  Type: role help\n│  to see all commands."),
      threadID, messageID
    );

  } catch (e) {
    return api.sendMessage(`❌ Role error: ${e.message || e}`, event.threadID, event.messageID);
  }
};
