const fs = require("fs-extra");

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
  version: "2.0.0",
  hasPermssion: 3,
  credits: "SaGor",
  description: "Manage user roles — add/remove/list/check",
  commandCategory: "Admin",
  usages: "role [list | add <level/all> | remove <level/all> | check] @tag/reply/uid",
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

    const sub  = (args[0] || "").toLowerCase();
    const arg1 = (args[1] || "").toLowerCase();

    if (!sub || sub === "help") {
      return api.sendMessage(
        box("🎭 ROLE MANAGER", [
          "│",
          "│  role list                  → Show all roles",
          "│  role check @tag/reply/uid  → Check someone's role",
          "│",
          "│  ── ADD ──",
          "│  role add all @tag/reply/uid → Add all roles",
          "│  role add 2 @tag/reply/uid   → 🔧 Bot Admin",
          "│  role add 3 @tag/reply/uid   → ⚡ Superadmin",
          "│  role add 4 @tag/reply/uid   → 💎 Premium",
          "│  role add 5 @tag/reply/uid   → 🛠️ Dev",
          "│  role add 6 @tag/reply/uid   → 🌟 VIP",
          "│",
          "│  ── REMOVE ──",
          "│  role remove all @tag/reply/uid → Remove all roles",
          "│  role remove 2 @tag/reply/uid   → Only Bot Admin",
          "│  role remove 3 @tag/reply/uid   → Only Superadmin",
          "│  role remove 4 @tag/reply/uid   → Only Premium",
          "│  role remove 5 @tag/reply/uid   → Only Dev",
          "│  role remove 6 @tag/reply/uid   → Only VIP",
          "│",
          "│  Level: 2🔧 3⚡ 4💎 5🛠️ 6🌟",
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
        for (const id of ids) {
          const name = await getName(id);
          body += `│    ↳ ${name} (${id})\n`;
        }
        body += "│\n";
      }
      return api.sendMessage(box("📋 ROLE LIST", body.trimEnd()), threadID, messageID);
    }

    if (sub === "add") {
      if (permssion < 3) {
        return api.sendMessage(box("🔐 DENIED", "│\n│  ⚡ Superadmin+ required to add roles.\n│"), threadID, messageID);
      }

      const isAll = arg1 === "all";
      const levelArg = isAll ? null : parseInt(arg1);

      if (!isAll && (isNaN(levelArg) || levelArg < 2 || levelArg > 6)) {
        return api.sendMessage(
          box("⚠️ USAGE", [
            "│",
            "│  role add all @tag/reply/uid  → All roles",
            "│  role add 2   @tag/reply/uid  → 🔧 Bot Admin",
            "│  role add 3   @tag/reply/uid  → ⚡ Superadmin",
            "│  role add 4   @tag/reply/uid  → 💎 Premium",
            "│  role add 5   @tag/reply/uid  → 🛠️ Dev",
            "│  role add 6   @tag/reply/uid  → 🌟 VIP",
            "│"
          ].join("\n")),
          threadID, messageID
        );
      }

      if ((isAll || levelArg >= 5) && permssion < 5) {
        return api.sendMessage(box("🔐 DENIED", "│\n│  🛠️ Dev+ required to assign Dev/VIP/All roles.\n│"), threadID, messageID);
      }

      const targets = getTargets();
      if (!targets.length) {
        return api.sendMessage(box("⚠️ ERROR", "│\n│  Tag someone, reply, or provide a UID.\n│"), threadID, messageID);
      }

      const added = [], skipped = [];

      for (const id of targets) {
        const name = await getName(id);

        if (isAll) {
          let anyAdded = false;
          for (const [lvl, key] of Object.entries(ROLE_KEYS)) {
            if (!config[key].includes(id)) { config[key].push(id); anyAdded = true; }
          }
          if (anyAdded) added.push(`All roles → ${name} (${id})`);
          else skipped.push(`${name} already has all roles`);
        } else {
          const currentLevel = getUserRole(id);
          if (currentLevel >= levelArg) {
            skipped.push(`${name} already at ${ROLE_NAMES[currentLevel]}`);
            continue;
          }
          const targetKey = ROLE_KEYS[levelArg];
          if (!config[targetKey].includes(id)) config[targetKey].push(id);
          added.push(`${ROLE_NAMES[levelArg]} → ${name} (${id})`);
        }
      }

      saveConfig();

      let body = "│\n";
      if (added.length)   body += `│  ✅ Added:\n${added.map(l => `│    • ${l}`).join("\n")}\n│\n`;
      if (skipped.length) body += `│  ⚠️ Skipped:\n${skipped.map(l => `│    • ${l}`).join("\n")}\n│\n`;
      if (!added.length && !skipped.length) body += "│  No changes made.\n│\n";

      return api.sendMessage(box("✅ ROLE ADDED", body.trimEnd()), threadID, messageID);
    }

    if (sub === "remove" || sub === "rm") {
      if (permssion < 3) {
        return api.sendMessage(box("🔐 DENIED", "│\n│  ⚡ Superadmin+ required to remove roles.\n│"), threadID, messageID);
      }

      const isAll = arg1 === "all";
      const levelArg = isAll ? null : parseInt(arg1);
      const hasSpecificLevel = !isAll && !isNaN(levelArg) && levelArg >= 2 && levelArg <= 6;
      const specificKey = hasSpecificLevel ? ROLE_KEYS[levelArg] : null;

      const targets = getTargets();
      if (!targets.length) {
        return api.sendMessage(
          box("⚠️ USAGE", [
            "│",
            "│  role remove all @tag/reply/uid  → Remove all roles",
            "│  role remove 2   @tag/reply/uid  → Only Bot Admin",
            "│  role remove 3   @tag/reply/uid  → Only Superadmin",
            "│  role remove 4   @tag/reply/uid  → Only Premium",
            "│  role remove 5   @tag/reply/uid  → Only Dev",
            "│  role remove 6   @tag/reply/uid  → Only VIP",
            "│"
          ].join("\n")),
          threadID, messageID
        );
      }

      const removed = [], skipped = [];

      for (const id of targets) {
        const currentLevel = getUserRole(id);
        const name = await getName(id);

        if (isAll || !hasSpecificLevel) {
          if (currentLevel === 0) { skipped.push(`${name} has no role`); continue; }
          if (currentLevel >= 5 && permssion < 5) {
            skipped.push(`${name} is ${ROLE_NAMES[currentLevel]} — need 🛠️ Dev+ to remove`);
            continue;
          }
          let wasRemoved = false;
          for (const key of Object.values(ROLE_KEYS)) {
            const idx = config[key].indexOf(id);
            if (idx !== -1) { config[key].splice(idx, 1); wasRemoved = true; }
          }
          if (wasRemoved) removed.push(`All roles removed → ${name} (${id}) → 👤 User`);
        } else {
          if (!config[specificKey] || !config[specificKey].includes(id)) {
            skipped.push(`${name} is not ${ROLE_NAMES[levelArg]}`);
            continue;
          }
          if (levelArg >= 5 && permssion < 5) {
            skipped.push(`${name} is ${ROLE_NAMES[levelArg]} — need 🛠️ Dev+ to remove`);
            continue;
          }
          const idx = config[specificKey].indexOf(id);
          if (idx !== -1) config[specificKey].splice(idx, 1);
          removed.push(`${ROLE_NAMES[levelArg]} removed → ${name} (${id})`);
        }
      }

      saveConfig();

      let body = "│\n";
      if (removed.length)  body += `│  ✅ Removed:\n${removed.map(l => `│    • ${l}`).join("\n")}\n│\n`;
      if (skipped.length)  body += `│  ⚠️ Skipped:\n${skipped.map(l => `│    • ${l}`).join("\n")}\n│\n`;
      if (!removed.length && !skipped.length) body += "│  No changes made.\n│\n";

      return api.sendMessage(box("❌ ROLE REMOVED", body.trimEnd()), threadID, messageID);
    }

    if (sub === "check") {
      const targets = getTargets();
      const checkID = targets[0] || String(senderID);
      const level   = getUserRole(checkID);
      const name    = await getName(checkID);
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
      box("⚠️ UNKNOWN", "│\n│  Type: .role help\n│  to see all commands.\n│"),
      threadID, messageID
    );

  } catch (e) {
    return api.sendMessage(`❌ Role error: ${e.message || e}`, event.threadID, event.messageID);
  }
};
