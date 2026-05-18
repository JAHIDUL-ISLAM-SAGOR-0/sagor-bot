const logger = require("../utils/log.js");
const moment = require("moment-timezone");
const stringSimilarity = require("string-similarity");

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function handleCommand({ api, models, Users, Threads, Currencies }) {
  return async function ({ event }) {
    try {
      const dateNow = Date.now();
      const time = moment.tz("Asia/Dhaka").format("HH:mm:ss DD/MM/YYYY");
      const { allowInbox, PREFIX, ADMINBOT = [], SUPERADMIN = [], PREMIUM = [], DEV = [], VIP = [], DeveloperMode, adminPrefix: adminPrefixCfg } = global.config;

      if (global._notificationEnabled && !global._notificationEnabled()) return;
      const { userBanned, threadBanned, threadInfo, threadData, commandBanned } = global.data;
      const { commands, cooldowns } = global.client;
      var { body, senderID, threadID, messageID } = event;
      senderID = String(senderID || "");
      threadID = String(threadID || "");
      const isSingleUser = senderID === threadID;
      const isGroup = event.isGroup === true || (threadID !== senderID && threadID.length > 10);
      if (!body) return;

      const threadSetting = threadData.get(threadID) || {};
      const prefixRegex = new RegExp(
        `^(<@!?${senderID}>|${escapeRegex(threadSetting.hasOwnProperty("PREFIX") ? threadSetting.PREFIX : PREFIX)})\\s*`
      );

      const adminOnly   = global.config.adminOnly;
      const superadminOnly = global.config.superadminOnly;
      const adminPaOnly = global.config.adminPaOnly;

      if (!global.data.allThreadID.includes(threadID) && !ADMINBOT.includes(senderID) && adminPaOnly === true) return;
      if (!ADMINBOT.includes(senderID) && adminOnly === true) return;
      if (!SUPERADMIN.includes(senderID) && !ADMINBOT.includes(senderID) && superadminOnly === true) return;

      let dataAdbox = { adminbox: {} };
      try { dataAdbox = require('../../src/cmds/cache/data.json'); } catch (_) {}

      let threadInf;
      try {
        threadInf = threadInfo.get(threadID) || await Threads.getInfo(threadID);
      } catch (_) { threadInf = { adminIDs: [] }; }
      if (!threadInf) threadInf = { adminIDs: [] };
      if (!Array.isArray(threadInf.adminIDs)) threadInf.adminIDs = [];

      const findd = threadInf.adminIDs.find(el => el.id == senderID);
      if (
        dataAdbox.adminbox.hasOwnProperty(threadID) &&
        dataAdbox.adminbox[threadID] == true &&
        !ADMINBOT.includes(senderID) &&
        !findd &&
        event.isGroup == true
      ) return await api.sendMessage(
        'Admin Only: Only admins can use the bot in this group.',
        event.threadID, event.messageID
      );

      if (userBanned.has(senderID) || threadBanned.has(threadID) || (allowInbox === false && senderID == threadID)) {
        if (!ADMINBOT.includes(senderID.toString())) {
          if (userBanned.has(senderID)) {
            const { reason, dateAdded } = userBanned.get(senderID) || {};
            return api.sendMessage(
              `You are banned from using the bot.\nReason: ${reason || 'N/A'}\nDate: ${dateAdded || 'N/A'}`,
              threadID, async (err, info) => {
                if (err || !info) return;
                await new Promise(r => setTimeout(r, 5000));
                api.unsendMessage(info.messageID);
              }, messageID
            );
          } else if (threadBanned.has(threadID)) {
            const { reason, dateAdded } = threadBanned.get(threadID) || {};
            return api.sendMessage(
              `This group has been banned.\nReason: ${reason || 'N/A'}\nDate: ${dateAdded || 'N/A'}`,
              threadID, async (err, info) => {
                if (err || !info) return;
                await new Promise(r => setTimeout(r, 5000));
                api.unsendMessage(info.messageID);
              }, messageID
            );
          }
        }
      }

      const _adminPfxCfg = adminPrefixCfg || {};
      const _adminPfxEnabled = _adminPfxCfg.enable === true;
      const _adminPfx = (_adminPfxCfg.prefix || "//");
      const _adminPfxRoles = _adminPfxCfg.allowedRoles || ["ADMINBOT", "SUPERADMIN", "DEV"];

      if (_adminPfxEnabled && body.startsWith(_adminPfx) && body.length > _adminPfx.length) {
        const isAdminPfxAllowed = (
          (_adminPfxRoles.includes("ADMINBOT") && ADMINBOT.includes(senderID)) ||
          (_adminPfxRoles.includes("SUPERADMIN") && SUPERADMIN.includes(senderID)) ||
          (_adminPfxRoles.includes("DEV") && DEV.includes(senderID)) ||
          (_adminPfxRoles.includes("PREMIUM") && PREMIUM.includes(senderID)) ||
          (_adminPfxRoles.includes("VIP") && VIP.includes(senderID))
        );
        if (!isAdminPfxAllowed) return;
        const _adminArgs = body.slice(_adminPfx.length).trim().split(/ +/);
        const _adminCmdName = _adminArgs.shift()?.toLowerCase();
        const _adminCmd = commands.get(_adminCmdName) ||
          Array.from(commands.values()).find(c => {
            const al = c.config?.aliases;
            if (Array.isArray(al)) return al.some(a => a.toLowerCase() === _adminCmdName);
            if (typeof al === "string") return al.toLowerCase() === _adminCmdName;
            return false;
          });
        if (_adminCmd) {
          event._adminPrefixUsed = true;
          event._parsedCommandName = _adminCmdName;
          event._parsedArgs = _adminArgs;
        }
      }

      const _adminNoPfxEnabled = _adminPfxEnabled && _adminPfxCfg.noPrefix === true;
      const _isAdminUser = (
        (_adminPfxRoles.includes("ADMINBOT") && ADMINBOT.includes(senderID)) ||
        (_adminPfxRoles.includes("SUPERADMIN") && SUPERADMIN.includes(senderID)) ||
        (_adminPfxRoles.includes("DEV") && DEV.includes(senderID)) ||
        (_adminPfxRoles.includes("PREMIUM") && PREMIUM.includes(senderID)) ||
        (_adminPfxRoles.includes("VIP") && VIP.includes(senderID))
      );

      if (_adminNoPfxEnabled && _isAdminUser && !event._adminPrefixUsed) {
        const _noPfxInput = body.trim();
        const _noPfxFirstWord = _noPfxInput.split(/ +/)[0].toLowerCase();
        const _noPfxCmd = commands.get(_noPfxFirstWord) ||
          Array.from(commands.values()).find(c => {
            const al = c.config?.aliases;
            if (Array.isArray(al)) return al.some(a => a.toLowerCase() === _noPfxFirstWord);
            if (typeof al === "string") return al.toLowerCase() === _noPfxFirstWord;
            return false;
          });
        if (_noPfxCmd) {
          event._adminPrefixUsed = true;
          const _noPfxArgs = _noPfxInput.split(/ +/);
          event._parsedCommandName = _noPfxArgs.shift()?.toLowerCase();
          event._parsedArgs = _noPfxArgs;
        }
      }

      let args = [], commandName = "", isCommand = false;

      if (event._adminPrefixUsed) {
        commandName = event._parsedCommandName;
        args = event._parsedArgs;
        isCommand = true;
      } else if (prefixRegex.test(body)) {
        const [matchedPrefix] = body.match(prefixRegex);
        args = body.slice(matchedPrefix.length).trim().split(/ +/);
        commandName = args.shift()?.toLowerCase();
        isCommand = true;
      } else if (global.config.usePrefix?.enable === false) {
        const input = body.trim();
        const firstWord = input.split(/ +/)[0].toLowerCase();
        const cmd = commands.get(firstWord) ||
          Array.from(commands.values()).find(c => {
            const aliases = c.config?.aliases;
            if (Array.isArray(aliases)) return aliases.some(a => a.toLowerCase() === firstWord);
            if (typeof aliases === "string") return aliases.toLowerCase() === firstWord;
            return false;
          });
        if (cmd) {
          args = input.split(/ +/);
          commandName = args.shift()?.toLowerCase();
          isCommand = true;
        }
      }

      if (!isCommand) return;

      const prefix = threadSetting.hasOwnProperty("PREFIX") ? threadSetting.PREFIX : PREFIX;

      if (!commandName && body.trim() === prefix)
        return await api.sendMessage(global.getText("handleCommand", "noprefix"), threadID, messageID);
      if (!commandName && body.startsWith(prefix))
        return await api.sendMessage(global.getText("handleCommand", "onlyprefix"), threadID, messageID);

      let command = commands.get(commandName);
      if (!command) {
        command = Array.from(commands.values()).find(cmd => {
          const aliases = cmd.config?.aliases;
          if (Array.isArray(aliases)) return aliases.some(a => a.toString().toLowerCase() === commandName);
          if (typeof aliases === "string") return aliases.toLowerCase() === commandName;
          return false;
        });
      }

      if (!command) {
        if (!global.config.hideNotiMessage?.commandNotFound) {
          try {
            const allNames = Array.from(commands.values()).flatMap(cmd => {
              const names = [cmd.config.name];
              if (Array.isArray(cmd.config.aliases)) names.push(...cmd.config.aliases);
              else if (typeof cmd.config.aliases === "string") names.push(cmd.config.aliases);
              return names.map(n => String(n).toLowerCase());
            });
            const checker = stringSimilarity.findBestMatch(commandName, allNames);
            const topMatches = checker.ratings
              .filter(r => r.rating >= 0.35)
              .sort((a, b) => b.rating - a.rating)
              .slice(0, 3)
              .map(r => r.target);

            if (checker.bestMatch.rating >= 0.5) {
              const suggestions = topMatches.length > 1
                ? topMatches.map((s, i) => `${i + 1}. ${prefix}${s}`).join('\n')
                : `${prefix}${checker.bestMatch.target}`;
              return await api.sendMessage(
                `Command "${commandName}" not found.\n\nDid you mean?\n${suggestions}\n\nSee all commands: ${prefix}help`,
                threadID, messageID
              );
            }
          } catch (_) {}
          return await api.sendMessage(
            `Command "${commandName}" does not exist.\nSee all commands: ${prefix}help\nSearch: ${prefix}cmds <keyword>`,
            threadID, messageID
          );
        }
        return;
      }

      if (commandBanned.get(threadID) || commandBanned.get(senderID)) {
        if (!ADMINBOT.includes(senderID)) {
          const banThreads = (commandBanned.get(threadID) || []).filter(Boolean);
          const banUsers   = (commandBanned.get(senderID) || []).filter(Boolean);
          if (banThreads.includes(command.config.name))
            return api.sendMessage(
              `"${command.config.name}" is disabled in this group.`,
              threadID, async (err, info) => {
                if (err || !info) return;
                await new Promise(r => setTimeout(r, 5000));
                api.unsendMessage(info.messageID);
              }, messageID
            );
          if (banUsers.includes(command.config.name))
            return api.sendMessage(
              `"${command.config.name}" is disabled for you.`,
              threadID, async (err, info) => {
                if (err || !info) return;
                await new Promise(r => setTimeout(r, 5000));
                api.unsendMessage(info.messageID);
              }, messageID
            );
        }
      }

      if (command.config.commandCategory?.toLowerCase() == 'nsfw' && !global.data.threadAllowNSFW.includes(threadID) && !ADMINBOT.includes(senderID))
        return api.sendMessage(
          `This command can only be used in NSFW-enabled groups.\nAdmin: .setnsfw on`,
          threadID, async (err, info) => {
            if (err || !info) return;
            await new Promise(r => setTimeout(r, 5000));
            api.unsendMessage(info.messageID);
          }, messageID
        );

      const find2 = threadInf.adminIDs.find(el => el.id == senderID);
      const sid = senderID.toString();
      let permssion = 0;
      if (VIP.includes(sid))            permssion = 6;
      else if (DEV.includes(sid))       permssion = 5;
      else if (PREMIUM.includes(sid))   permssion = 4;
      else if (SUPERADMIN.includes(sid)) permssion = 3;
      else if (ADMINBOT.includes(sid))  permssion = 2;
      else if (find2)                   permssion = 1;

      if ((command.config.hasPermssion || 0) > permssion) {
        const needed = command.config.hasPermssion;
        const roleNames = {
          0: '👤 User',
          1: '👑 Group Admin',
          2: '🔧 Bot Admin',
          3: '⚡ Superadmin',
          4: '💎 Premium',
          5: '🛠️ Dev',
          6: '🌟 VIP'
        };
        const yourRole = roleNames[permssion] || '👤 User';
        const needRole = roleNames[needed] || '🔒 Higher Permission';
        return await api.sendMessage(
          `🚫 Permission Denied!\n\n` +
          `📌 Command : ${command.config.name}\n` +
          `🔓 Required : ${needRole} (Level ${needed})\n` +
          `👤 Your Level : ${yourRole} (Level ${permssion})\n\n` +
          `You don't have permission to use this command.`,
          event.threadID, event.messageID
        );
      }

      if (!cooldowns.has(command.config.name)) cooldowns.set(command.config.name, new Map());
      const timestamps     = cooldowns.get(command.config.name);
      const expirationTime = (command.config.cooldowns || 1) * 1000;

      if (timestamps.has(senderID) && dateNow < timestamps.get(senderID) + expirationTime) {
        const remaining = ((timestamps.get(senderID) + expirationTime - dateNow) / 1000).toFixed(1);
        return await api.sendMessage(
          `Please wait ${remaining}s before using "${command.config.name}" again.`,
          threadID, messageID
        );
      }

      let getText2 = () => {};
      if (command.languages && typeof command.languages == 'object' && command.languages.hasOwnProperty(global.config.language)) {
        getText2 = (...values) => {
          var lang = command.languages[global.config.language][values[0]] || '';
          for (var i = 1; i <= values.length - 1; i++) {
            lang = lang.replace(new RegExp('%' + i, 'g'), values[i]);
          }
          return lang;
        };
      }

      try {
        const typCfg = global.config.typingIndicator || {};
        if (typCfg.enable) {
          Promise.resolve(api.sendTypingIndicator(true, threadID)).catch(() => {});
          const thinkDelay = 600 + Math.floor(Math.random() * 1900);
          await new Promise(r => setTimeout(r, thinkDelay));
          Promise.resolve(api.sendTypingIndicator(false, threadID)).catch(() => {});
          await new Promise(r => setTimeout(r, 80 + Math.floor(Math.random() * 120)));
        }

        await command.run({ api, event, args, models, Users, Threads, Currencies, permssion, getText: getText2, isSingleUser, isGroup });
        timestamps.set(senderID, dateNow);
        if (DeveloperMode)
          logger(global.getText("handleCommand", "executeCommand", time, commandName, senderID, threadID, args.join(" "), Date.now() - dateNow), "[ DEV MODE ]");
      } catch (e) {
        const errMsg   = e && e.message ? e.message : String(e);
        const errStack = e && e.stack   ? e.stack   : "(no stack trace)";
        console.error(
          `\n${"─".repeat(60)}\n` +
          `[ CMD ERROR ] Command  : ${commandName}\n` +
          `[ CMD ERROR ] Sender   : ${senderID}\n` +
          `[ CMD ERROR ] Thread   : ${threadID}\n` +
          `[ CMD ERROR ] Args     : ${args.join(" ") || "(none)"}\n` +
          `[ CMD ERROR ] Message  : ${errMsg}\n` +
          `[ CMD ERROR ] Stack    :\n${errStack}\n` +
          `${"─".repeat(60)}\n`
        );
        logger(`Command "${commandName}" error: ${errMsg}`, 'error');
        return await api.sendMessage(
          `❌ Command "${commandName}" error:\n${errMsg.slice(0, 150)}\n\nCheck console for full details.`,
          threadID
        );
      }

    } catch (outerErr) {
      console.error(
        `\n${"─".repeat(60)}\n` +
        `[ FATAL ] handleCommand crashed!\n` +
        `[ FATAL ] Message: ${outerErr.message}\n` +
        `[ FATAL ] Stack  :\n${outerErr.stack || "(no stack)"}\n` +
        `${"─".repeat(60)}\n`
      );
      logger(`handleCommand fatal: ${outerErr.message}`, 'error');
    }
  };
}

function handleCommandEvent({ api, models, Users, Threads, Currencies }) {
  return function ({ event }) {
    try {
      const { allowInbox } = global.config;
      const { userBanned, threadBanned } = global.data;
      const { commands, eventRegistered } = global.client;
      var { senderID, threadID } = event;
      senderID = String(senderID);
      threadID = String(threadID);

      if (userBanned.has(senderID) || threadBanned.has(threadID) || (allowInbox == false && senderID == threadID)) return;

      for (const eventReg of eventRegistered) {
        const cmd = commands.get(eventReg);
        if (!cmd || typeof cmd.handleEvent !== 'function') continue;

        let getText2 = () => {};
        if (cmd.languages && typeof cmd.languages == 'object') {
          getText2 = (...values) => {
            const lang = cmd.languages[global.config.language];
            if (!lang) return '';
            var text = lang[values[0]] || '';
            for (var i = values.length - 1; i >= 1; i--) {
              text = text.replace(new RegExp('%' + i, 'g'), values[i]);
            }
            return text;
          };
        }

        try {
          cmd.handleEvent({ event, api, models, Users, Threads, Currencies, getText: getText2 });
        } catch (error) {
          const errMsg   = error && error.message ? error.message : String(error);
          const errStack = error && error.stack   ? error.stack   : "(no stack trace)";
          console.error(
            `\n${"─".repeat(60)}\n` +
            `[ EVENT CMD ERROR ] Module : ${cmd.config.name}\n` +
            `[ EVENT CMD ERROR ] Msg    : ${errMsg}\n` +
            `[ EVENT CMD ERROR ] Stack  :\n${errStack}\n` +
            `${"─".repeat(60)}\n`
          );
          logger(global.getText('handleCommandEvent', 'moduleError', cmd.config.name), 'error');
        }
      }
    } catch (outerErr) {
      logger(`handleCommandEvent fatal: ${outerErr.message}`, 'error');
    }
  };
}

function handleReply({ api, models, Users, Threads, Currencies }) {
  return async function ({ event }) {
    try {
      if (!event.messageReply) return;
      const { handleReply, commands } = global.client;
      const { messageID, threadID, messageReply } = event;
      if (!handleReply || handleReply.length === 0) return;

      const indexOfHandle = handleReply.findIndex(e => e.messageID == messageReply.messageID);
      if (indexOfHandle < 0) return;

      const indexOfMessage = handleReply[indexOfHandle];
      const handleNeedExec = commands.get(indexOfMessage.name);

      if (!handleNeedExec || typeof handleNeedExec.handleReply !== 'function') {
        return api.sendMessage(global.getText('handleReply', 'missingValue'), threadID, messageID);
      }

      let getText2 = () => {};
      if (handleNeedExec.languages && typeof handleNeedExec.languages == 'object') {
        getText2 = (...value) => {
          const lang = handleNeedExec.languages[global.config.language];
          if (!lang) return '';
          var text = lang[value[0]] || '';
          for (var i = value.length - 1; i >= 1; i--) {
            text = text.replace(new RegExp('%' + i, 'g'), value[i]);
          }
          return text;
        };
      }

      const typCfg = global.config.typingIndicator || {};
      if (typCfg.enable) {
        Promise.resolve(api.sendTypingIndicator(true, threadID)).catch(() => {});
        const thinkDelay = 500 + Math.floor(Math.random() * 1500);
        await new Promise(r => setTimeout(r, thinkDelay));
        Promise.resolve(api.sendTypingIndicator(false, threadID)).catch(() => {});
        await new Promise(r => setTimeout(r, 60 + Math.floor(Math.random() * 100)));
      }

      try {
        handleNeedExec.handleReply({ api, event, models, Users, Threads, Currencies, handleReply: indexOfMessage, getText: getText2 });
      } catch (error) {
        return api.sendMessage(global.getText('handleReply', 'executeError', error), threadID, messageID);
      }
    } catch (outerErr) {
      logger(`handleReply fatal: ${outerErr.message}`, 'error');
    }
  };
}

function handleReaction({ api, models, Users, Threads, Currencies }) {
  return function ({ event }) {
    try {
      const { handleReaction, commands } = global.client;
      const { messageID, threadID } = event;
      if (!handleReaction || handleReaction.length === 0) return;

      const indexOfHandle = handleReaction.findIndex(e => e.messageID == messageID);
      if (indexOfHandle < 0) return;

      const indexOfMessage = handleReaction[indexOfHandle];
      const handleNeedExec = commands.get(indexOfMessage.name);

      if (!handleNeedExec || typeof handleNeedExec.handleReaction !== 'function') {
        return api.sendMessage(global.getText('handleReaction', 'missingValue'), threadID, messageID);
      }

      let getText2 = () => {};
      if (handleNeedExec.languages && typeof handleNeedExec.languages == 'object') {
        getText2 = (...value) => {
          const lang = handleNeedExec.languages[global.config.language];
          if (!lang) return '';
          var text = lang[value[0]] || '';
          for (var i = value.length - 1; i >= 1; i--) {
            text = text.replace(new RegExp('%' + i, 'g'), value[i]);
          }
          return text;
        };
      }

      try {
        handleNeedExec.handleReaction({ api, event, models, Users, Threads, Currencies, handleReaction: indexOfMessage, getText: getText2 });
      } catch (error) {
        return api.sendMessage(global.getText('handleReaction', 'executeError', error), threadID, messageID);
      }
    } catch (outerErr) {
      logger(`handleReaction fatal: ${outerErr.message}`, 'error');
    }
  };
}

function handleEvent({ api, models, Users, Threads, Currencies }) {
  return function ({ event }) {
    try {
      const timeStart = Date.now();
      const time = moment.tz("Asia/Dhaka").format("HH:mm:ss DD/MM/YYYY");
      const { userBanned, threadBanned } = global.data;
      const { events } = global.client;
      const { allowInbox, DeveloperMode } = global.config;
      var { senderID, threadID } = event;
      senderID = String(senderID);
      threadID = String(threadID);

      if (userBanned.has(senderID) || threadBanned.has(threadID) || (allowInbox == false && senderID == threadID)) return;
      if (event.type == "change_thread_image") event.logMessageType = "change_thread_image";

      try {
        const features = require("../utils/features.js");
        const cfg = (global.config && global.config.threadApproval) || {};
        const isBotEvent =
          event.logMessageType === "log:subscribe" &&
          event.logMessageData &&
          Array.isArray(event.logMessageData.addedParticipants) &&
          event.logMessageData.addedParticipants.some(u => String(u.userFbId) === String(api.getCurrentUserID()));
        if (cfg.enable && senderID !== threadID && !isBotEvent && !features.isThreadApproved(threadID)) {
          return;
        }
      } catch (_) {}

      let handledCount = 0;

      for (const [key, value] of events.entries()) {
        if (!value.config || !Array.isArray(value.config.eventType)) continue;
        if (value.config.eventType.indexOf(event.logMessageType) === -1) continue;

        const eventRun = events.get(key);
        try {
          eventRun.run({ api, event, models, Users, Threads, Currencies });
          handledCount++;
          if (DeveloperMode)
            logger(global.getText('handleEvent', 'executeEvent', time, eventRun.config.name, threadID, Date.now() - timeStart), '[ Event ]');
        } catch (error) {
          const errMsg   = error && error.message ? error.message : String(error);
          const errStack = error && error.stack   ? error.stack   : "(no stack trace)";
          console.error(
            `\n${"─".repeat(60)}\n` +
            `[ EVT ERROR ] Event : ${eventRun.config.name}\n` +
            `[ EVT ERROR ] Type  : ${event.logMessageType || 'unknown'}\n` +
            `[ EVT ERROR ] Thread: ${threadID}\n` +
            `[ EVT ERROR ] Msg   : ${errMsg}\n` +
            `[ EVT ERROR ] Stack :\n${errStack}\n` +
            `${"─".repeat(60)}\n`
          );
          logger(
            `Event Error | name: [${eventRun.config.name}] | type: ${event.logMessageType || 'unknown'} | err: ${errMsg}`,
            'error'
          );
        }
      }

      if (handledCount === 0 && event.logMessageType && DeveloperMode) {
        logger(
          `Unknown event type gracefully skipped → "${event.logMessageType}" (thread: ${threadID})`,
          '[ WARN ]'
        );
      }

    } catch (outerErr) {
      logger(`handleEvent fatal: ${outerErr.message}`, 'error');
    }
  };
}

function handleCreateDatabase({ Users, Threads, Currencies }) {
  return async function ({ event }) {
    try {
      const { allUserID, allCurrenciesID, allThreadID, userName, threadInfo } = global.data;
      const { autoCreateDB } = global.config;
      if (autoCreateDB == false) return;

      var { senderID, threadID } = event;
      senderID = String(senderID);
      threadID = String(threadID);

      const dbCfg = (global.config && global.config.database) || {};
      global._refreshedThreadsThisSession = global._refreshedThreadsThisSession || new Set();
      const _shouldRefresh = dbCfg.autoRefreshThreadInfoFirstTime
        && event.isGroup == true
        && allThreadID.includes(threadID)
        && !global._refreshedThreadsThisSession.has(threadID);

      if (_shouldRefresh) {
        global._refreshedThreadsThisSession.add(threadID);
        try {
          const fresh = await Threads.getInfo(threadID);
          if (fresh) {
            const dataThread = {
              threadName: fresh.threadName,
              adminIDs: fresh.adminIDs || [],
              nicknames: fresh.nicknames || {}
            };
            threadInfo.set(threadID, dataThread);
            await Threads.setData(threadID, { threadInfo: dataThread });
            logger(`autoRefreshThreadInfo: refreshed ${threadID}`, '[ DATABASE ]');
          }
        } catch (refErr) {
          logger(`autoRefreshThreadInfo failed (${threadID}): ${refErr.message}`, '[ WARN ]');
        }
      }

      if (!allThreadID.includes(threadID) && event.isGroup == true) {
        try {
          const threadIn4 = await Threads.getInfo(threadID);
          if (!threadIn4) throw new Error("No thread info returned");

          const dataThread = {
            threadName: threadIn4.threadName,
            adminIDs: threadIn4.adminIDs || [],
            nicknames: threadIn4.nicknames || {}
          };

          allThreadID.push(threadID);
          threadInfo.set(threadID, dataThread);
          await Threads.setData(threadID, { threadInfo: dataThread, data: {} });

          if (Array.isArray(threadIn4.userInfo)) {
            for (const singleData of threadIn4.userInfo) {
              try {
                userName.set(String(singleData.id), singleData.name);
                const uid = String(singleData.id);
                if (allUserID.includes(uid)) {
                  await Users.setData(uid, { name: singleData.name });
                } else {
                  await Users.createData(uid, { name: singleData.name, data: {} });
                  allUserID.push(uid);
                  logger(global.getText('handleCreateDatabase', 'newUser', uid), '[ DATABASE ]');
                }
              } catch (userErr) {
                logger(`User DB error (${singleData.id}): ${userErr.message}`, 'error');
              }
            }
          }

          logger(global.getText('handleCreateDatabase', 'newThread', threadID), '[ DATABASE ]');
        } catch (threadErr) {
          logger(`Thread DB error (${threadID}): ${threadErr.message}`, 'error');
        }
      }

      if (!allUserID.includes(senderID) || !userName.has(senderID)) {
        try {
          const infoUsers = await Users.getInfo(senderID);
          if (infoUsers && infoUsers.name) {
            await Users.createData(senderID, { name: infoUsers.name });
            allUserID.push(senderID);
            userName.set(senderID, infoUsers.name);
            logger(global.getText('handleCreateDatabase', 'newUser', senderID), '[ DATABASE ]');
          }
        } catch (userErr) {
          logger(`User info error (${senderID}): ${userErr.message}`, 'error');
        }
      }

      if (!allCurrenciesID.includes(senderID)) {
        try {
          await Currencies.createData(senderID, { data: {} });
          allCurrenciesID.push(senderID);
        } catch (_) {}
      }

    } catch (outerErr) {
      logger(`handleCreateDatabase fatal: ${outerErr.message}`, 'error');
    }
  };
}

module.exports = {
  handleCommand,
  handleCommandEvent,
  handleReply,
  handleReaction,
  handleEvent,
  handleCreateDatabase
};
