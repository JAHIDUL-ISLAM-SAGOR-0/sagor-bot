const { spawn } = require("child_process");
const axios = require("axios");
require("./main/utils/authorLock").verifyAuthor();
require("./main/utils/repoLock").verifyRepo();
const logger = require("./main/utils/log");
const config = require("./config.json");

const _indexCfgIssues = [];
if (!config.telegramNotify || !config.telegramNotify.enable) {
    _indexCfgIssues.push("📵  telegramNotify is disabled — crash/restart alerts will NOT be sent to Telegram");
}
if (config.autoRestartWhenListenMqttError === undefined) {
    _indexCfgIssues.push("💡  autoRestartWhenListenMqttError not set in config — defaulting to false");
}
if (_indexCfgIssues.length > 0) {
    setTimeout(() => logger.configValidation && logger.configValidation(_indexCfgIssues), 100);
}

require("./main/utils/keep_alive");

async function sendTelegram(text) {
  try {
    const tg = config.telegramNotify;
    if (!tg || !tg.enable || !tg.botToken || !tg.chatId) return;
    await axios.post(
      `https://api.telegram.org/bot${tg.botToken}/sendMessage`,
      { chat_id: tg.chatId, text, parse_mode: "HTML" },
      { timeout: 10000 }
    );
  } catch (_) {}
}

function tgBotName() {
  return config.BOTNAME || "SAGOR Bot";
}
function tgTime() {
  return new Date().toLocaleString("en-GB", { timeZone: config.timeZone || "Asia/Dhaka" });
}

const { checkForUpdate } = require("./main/utils/Updater");
const { applyUpdate } = require("./main/utils/Update");

async function checkUpdate() {
  const updCfg = (config && config.updateNotification) || {};
  if (updCfg.enable === false) {
    logger("updateNotification disabled — skipping update check", "[ UPDATE ]");
    return;
  }
  try {
    const info = await checkForUpdate();
    if (info.error) {
      logger(`Update check failed: ${info.error}`, "[ UPDATE ]");
      return;
    }
    if (info.hasUpdate) {
      logger(
        `Update available! v${info.localVersion} → v${info.remoteVersion}`,
        "[ UPDATE ]"
      );
      if (info.changelog && info.changelog.length > 0) {
        info.changelog.forEach(c => logger(`  • ${c}`, "[ UPDATE ]"));
      }
      if (info.forceUpdate || (updCfg.autoApply === true)) {
        logger("Auto-applying update...", "[ UPDATE ]");
        await applyUpdate({ forceRestart: true });
      } else {
        logger(
          "Run applyUpdate() or set updateNotification.autoApply: true in config.json to auto-update",
          "[ UPDATE ]"
        );
      }
    } else {
      logger(`Bot is on the latest version (v${info.localVersion})`, "[ UPDATE ]");
    }
  } catch (err) {
    logger(`Update check error: ${err.message}`, "[ UPDATE ]");
  }
}

const express = require("express");
const path = require("path");
const app = express();
const port = process.env.PORT || (config.dashBoard && config.dashBoard.port) || 5000;

app.set("trust proxy", true);
app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  next();
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "/main/dashboard/login.html"));
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "/main/dashboard/index.html"));
});

function isBotAlive() {
  const p = global.botProcess;
  return !!(p && p.exitCode === null && p.signalCode === null);
}

app.get("/health", (req, res) => {
  const botAlive = isBotAlive();
  const lastHB = global.lastHeartbeat
    ? Math.floor((Date.now() - global.lastHeartbeat) / 1000) + "s ago"
    : "N/A";
  const mem = process.memoryUsage();
  res.json({
    status: botAlive ? "ok" : "bot_down",
    uptime: Math.floor(process.uptime()) + "s",
    restarts: global.countRestart || 0,
    lastHeartbeat: lastHB,
    nodeVersion: process.version,
    platform: process.platform,
    memRss: Math.round(mem.rss / 1024 / 1024) + " MB",
    memHeap: Math.round(mem.heapUsed / 1024 / 1024) + " MB",
    cmdCount: global.cmdCount || 0,
    evtCount: global.evtCount || 0,
  });
});

app.post("/api/bot/:action", requireAuth, express.json(), (req, res) => {
  const { action } = req.params;
  if (action === "restart") {
    logger("Dashboard requested bot restart", "[ DASHBOARD ]");
    global.botStopped = false;
    global.botPausedReason = null;
    global.countRestart = 0;
    if (isBotAlive()) {
      try { global.botProcess.kill("SIGTERM"); } catch (_) {}
    } else {
      startBot();
    }
    res.json({ ok: true, action });
  } else if (action === "stop") {
    logger("Dashboard requested bot stop", "[ DASHBOARD ]");
    global.botStopped = true;
    if (isBotAlive()) {
      try { global.botProcess.kill("SIGTERM"); } catch (_) {}
    }
    res.json({ ok: true, action });
  } else if (action === "start") {
    logger("Dashboard requested bot start", "[ DASHBOARD ]");
    global.botStopped = false;
    global.botPausedReason = null;
    if (!isBotAlive()) startBot();
    res.json({ ok: true, action });
  } else {
    res.status(400).json({ error: "Unknown action" });
  }
});

const crypto = require("crypto");
const verifyCodeStore = new Map();

function isDashboardEnabled() {
  return !config.dashBoard || config.dashBoard.enable !== false;
}

app.get("/dashboard/gencode", (req, res) => {
  if (!isDashboardEnabled()) return res.status(403).json({ error: "Dashboard disabled" });
  const code = crypto.randomBytes(4).toString("hex").toUpperCase();
  const expiresAt = Date.now() + ((config.dashBoard && config.dashBoard.expireVerifyCode) || 300000);
  verifyCodeStore.set(code, { expiresAt });
  setTimeout(() => verifyCodeStore.delete(code), (config.dashBoard && config.dashBoard.expireVerifyCode) || 300000);
  res.json({ code, expiresIn: ((config.dashBoard && config.dashBoard.expireVerifyCode) || 300000) / 1000 + "s" });
});

app.get("/dashboard/verify", (req, res) => {
  if (!isDashboardEnabled()) return res.status(403).json({ error: "Dashboard disabled" });
  const { code } = req.query;
  if (!code) return res.status(400).json({ error: "Missing code" });
  const entry = verifyCodeStore.get(code.toUpperCase());
  if (!entry) return res.status(401).json({ error: "Invalid or expired code" });
  if (Date.now() > entry.expiresAt) {
    verifyCodeStore.delete(code.toUpperCase());
    return res.status(401).json({ error: "Code expired" });
  }
  verifyCodeStore.delete(code.toUpperCase());
  const sessionToken = crypto.randomBytes(16).toString("hex");
  verifyCodeStore.set("session_" + sessionToken, { expiresAt: Date.now() + 3600000 });
  res.json({ token: sessionToken, expiresIn: "3600s" });
});

function requireAuth(req, res, next) {
  const token = req.headers["x-dashboard-token"] || req.query.token;
  const session = token ? verifyCodeStore.get("session_" + token) : null;
  if (!session || Date.now() > session.expiresAt) {
    return res.status(401).json({ error: "Unauthorized — please log in via /login" });
  }
  next();
}



app.get("/dashboard/stats", (req, res) => {
  if (!isDashboardEnabled()) return res.status(403).json({ error: "Dashboard disabled" });
  const token = req.headers["x-dashboard-token"] || req.query.token;
  const session = token ? verifyCodeStore.get("session_" + token) : null;
  if (!session || Date.now() > session.expiresAt) return res.status(401).json({ error: "Unauthorized" });
  res.json({
    status: isBotAlive() ? "ok" : "bot_down",
    uptime: Math.floor(process.uptime()) + "s",
    restarts: global.countRestart || 0,
    lastHeartbeat: global.lastHeartbeat
      ? Math.floor((Date.now() - global.lastHeartbeat) / 1000) + "s ago"
      : "N/A",
  });
});

if (config.serverUptime && config.serverUptime.enable) {
  try {
    const http = require("http");
    const { Server } = require("socket.io");
    const uptimePort = config.serverUptime.port || 3001;
    const socketCfg = config.serverUptime.socket || {};
    const channel = socketCfg.channelName || "uptime";
    const verifyToken = socketCfg.verifyToken || "";

    const uptimeServer = http.createServer();
    const io = new Server(uptimeServer, { cors: { origin: "*" } });

    io.on("connection", (socket) => {
      if (verifyToken) {
        const clientToken = socket.handshake.auth && socket.handshake.auth.token;
        if (clientToken !== verifyToken) {
          socket.disconnect(true);
          return;
        }
      }
      socket.emit(channel, {
        status: isBotAlive() ? "online" : "offline",
        uptime: Math.floor(process.uptime()),
        restarts: global.countRestart || 0,
        ts: Date.now()
      });
    });

    setInterval(() => {
      io.emit(channel, {
        status: isBotAlive() ? "online" : "offline",
        uptime: Math.floor(process.uptime()),
        restarts: global.countRestart || 0,
        ts: Date.now()
      });
    }, 30000);

    uptimeServer.listen(uptimePort, "0.0.0.0", () => {
      logger(`ServerUptime socket running on port ${uptimePort} (channel: ${channel})`, "[ SERVER ]");
    });
    uptimeServer.on("error", (e) => logger(`ServerUptime socket error: ${e.message}`, "[ ERROR ]"));
  } catch (e) {
    logger(`serverUptime init failed: ${e.message}`, "[ ERROR ]");
  }
}

const _replitDevUrl = process.env.REPLIT_DEV_DOMAIN
  ? `https://${process.env.REPLIT_DEV_DOMAIN}`
  : null;

const SELF_URL = process.env.RENDER_EXTERNAL_URL
  || process.env.RAILWAY_STATIC_URL
  || process.env.RAILWAY_PUBLIC_DOMAIN
  || process.env.APP_URL
  || _replitDevUrl
  || null;

// Self-ping is handled by main/utils/keep_alive.js (already required above).
// Removed duplicate ping loop here to avoid double-pinging the /health endpoint.

app.listen(port, "0.0.0.0", () => {
  logger(`Dashboard running at http://0.0.0.0:${port}`, "[ SERVER ]");
}).on("error", (err) => {
  logger(`Server error: ${err.message}`, "[ ERROR ]");
});

global.countRestart = 0;
global.botProcess = null;
global.lastHeartbeat = null;
global.isRestarting = false;
global.cmdCount = 0;
global.evtCount = 0;
global.botStopped = false;

const LOG_BUFFER_SIZE = 500;
global.logBuffer = [];
global.sseClients = new Set();

function pushLog(line) {
  const entry = { ts: Date.now(), line };
  global.logBuffer.push(entry);
  if (global.logBuffer.length > LOG_BUFFER_SIZE) global.logBuffer.shift();
  const payload = "data: " + JSON.stringify(entry) + "\n\n";
  for (const res of global.sseClients) {
    try { res.write(payload); } catch (_) { global.sseClients.delete(res); }
  }
}

app.get("/api/logs/stream", requireAuth, (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();
  const history = global.logBuffer.slice(-200);
  for (const entry of history) {
    res.write("data: " + JSON.stringify(entry) + "\n\n");
  }
  global.sseClients.add(res);
  req.on("close", () => { global.sseClients.delete(res); });
});

app.get("/api/logs", requireAuth, (req, res) => {
  res.json(global.logBuffer.slice(-200));
});

app.get("/api/modules", requireAuth, (req, res) => {
  const fs = require("fs");
  const pathMod = require("path");
  const cmdDir = pathMod.join(__dirname, "src/cmds");
  const evtDir = pathMod.join(__dirname, "src/events");

  function readModules(dir, type) {
    try {
      return fs.readdirSync(dir)
        .filter(f => f.endsWith(".js") && !f.includes("example"))
        .map(f => {
          try {
            const fpath = pathMod.join(dir, f);
            delete require.cache[require.resolve(fpath)];
            const mod = require(fpath);
            const cfg = mod.config || mod.exports && mod.exports.config || {};
            return {
              file: f,
              name: cfg.name || f.replace(".js", ""),
              description: cfg.description || "—",
              category: cfg.commandCategory || cfg.category || (type === "cmd" ? "general" : "event"),
              version: cfg.version || "—",
              credits: cfg.credits || "—",
              aliases: cfg.aliases || [],
              eventType: cfg.eventType || [],
              type,
              status: "loaded"
            };
          } catch (e) {
            return {
              file: f,
              name: f.replace(".js", ""),
              description: "Failed to load",
              category: "—",
              version: "—",
              credits: "—",
              aliases: [],
              eventType: [],
              type,
              status: "failed",
              error: e.message
            };
          }
        });
    } catch (e) {
      return [];
    }
  }

  const commands = readModules(cmdDir, "cmd");
  const events = readModules(evtDir, "evt");
  res.json({ commands, events });
});

app.post("/api/cmd/add", requireAuth, express.json(), (req, res) => {
  const { name, code } = req.body || {};
  if (!name || !code) return res.status(400).json({ error: "Missing name or code" });
  const safeName = name.replace(/[^a-zA-Z0-9_-]/g, "");
  if (!safeName) return res.status(400).json({ error: "Invalid name" });
  const fs = require("fs");
  const filePath = require("path").join(__dirname, "src/cmds", safeName + ".js");
  try {
    fs.writeFileSync(filePath, code, "utf8");
    // Hot-reload: sagor.js-এর fs.watch automatically detect করবে
    // কিন্তু কিছু OS-এ writeFileSync rename event trigger করে না
    // তাই touch করে event force করি
    const now = new Date();
    fs.utimesSync(filePath, now, now);
    logger(`Dashboard: added/updated command file → ${safeName}.js`, "[ DASHBOARD ]");
    res.json({ ok: true, file: safeName + ".js", hotReloaded: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/evt/add", requireAuth, express.json(), (req, res) => {
  const { name, code } = req.body || {};
  if (!name || !code) return res.status(400).json({ error: "Missing name or code" });
  const safeName = name.replace(/[^a-zA-Z0-9_-]/g, "");
  if (!safeName) return res.status(400).json({ error: "Invalid name" });
  const fs = require("fs");
  const filePath = require("path").join(__dirname, "src/events", safeName + ".js");
  try {
    fs.writeFileSync(filePath, code, "utf8");
    const now = new Date();
    fs.utimesSync(filePath, now, now);
    logger(`Dashboard: added/updated event file → ${safeName}.js`, "[ DASHBOARD ]");
    res.json({ ok: true, file: safeName + ".js", hotReloaded: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const COOKIE_FILES = { 1: "cookie.txt", 2: "cookie2.txt", 3: "cookie3.txt" };

app.get("/api/cookie/status", requireAuth, (req, res) => {
  const fs = require("fs");
  const result = {};
  for (const [slot, fname] of Object.entries(COOKIE_FILES)) {
    const fpath = require("path").join(__dirname, fname);
    try {
      const content = fs.readFileSync(fpath, "utf8").trim();
      result[slot] = { exists: true, size: content.length, preview: content.substring(0, 60) + "..." };
    } catch (_) {
      result[slot] = { exists: false, size: 0, preview: "File not found" };
    }
  }
  res.json(result);
});

app.post("/api/cookie/save", requireAuth, express.json(), (req, res) => {
  const { slot, data } = req.body || {};
  const slotNum = parseInt(slot);
  if (!COOKIE_FILES[slotNum]) return res.status(400).json({ error: "Invalid slot (1-3)" });
  if (!data || !data.trim()) return res.status(400).json({ error: "Cookie data is empty" });
  const fs = require("fs");
  const fpath = require("path").join(__dirname, COOKIE_FILES[slotNum]);
  try {
    fs.writeFileSync(fpath, data.trim(), "utf8");
    res.json({ ok: true, slot: slotNum, file: COOKIE_FILES[slotNum], size: data.trim().length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const FREEZE_TIMEOUT_MS = 10 * 60 * 1000;

function startWatchdog() {
  setInterval(() => {
    if (!isBotAlive()) return;
    if (!global.lastHeartbeat) return;
    const silent = Date.now() - global.lastHeartbeat;
    if (silent > FREEZE_TIMEOUT_MS) {
      const frozenMin = Math.floor(silent / 60000);
      logger(
        `Bot frozen for ${frozenMin} min — force restarting...`,
        "[ WATCHDOG ]"
      );
      sendTelegram(
        `⚠️ <b>${tgBotName()} — FROZEN / WATCHDOG RESTART</b>\n\n` +
        `🧊 No heartbeat for <b>${frozenMin} min</b>\n` +
        `🔄 Force-killing and restarting...\n` +
        `🕐 Time: <b>${tgTime()}</b>`
      );
      try { global.botProcess.kill("SIGKILL"); } catch (_) {}
    }
  }, 60 * 1000);
}

function trackHeartbeat(data) {
  const str = data.toString();
  if (str.includes("HEARTBEAT")) {
    global.lastHeartbeat = Date.now();
  }
  const match = str.match(/MODULE_COUNTS:(\d+):(\d+)/);
  if (match) {
    global.cmdCount = parseInt(match[1]);
    global.evtCount = parseInt(match[2]);
    if (!global._onlineSent) {
      global._onlineSent = true;
      sendTelegram(
        `🟢 <b>${tgBotName()} — ONLINE</b>\n\n` +
        `📦 Commands: <b>${global.cmdCount}</b>\n` +
        `⚡ Events: <b>${global.evtCount}</b>\n` +
        `🔄 Restart count: <b>${global.countRestart || 0}</b>\n` +
        `🕐 Time: <b>${tgTime()}</b>`
      );
    }
  }
}

function startBot(message) {
  if (global.isRestarting) return;
  global.isRestarting = true;
  global._onlineSent = false;
  if (message) logger(message, "[ BOT ]");

  const delay = global.countRestart === 0
    ? 0
    : Math.min(3000 * Math.pow(2, Math.min(global.countRestart - 1, 4)), 60000);

  if (delay > 0) logger(`Waiting ${delay / 1000}s before restart...`, "[ RESTART ]");

  setTimeout(() => {
    global.isRestarting = false;
    global.lastHeartbeat = Date.now();

    const child = spawn(
      "node",
      ["--trace-warnings", "--async-stack-traces", "--max-old-space-size=512", "main/utils/sagor.js"],
      { cwd: __dirname, stdio: ["inherit", "pipe", "pipe"], shell: true }
    );

    global.botProcess = child;
    let _restartScheduled = false;

    child.stdout.on("data", (data) => {
      process.stdout.write(data);
      trackHeartbeat(data);
      data.toString().split("\n").forEach(l => { if (l.trim()) pushLog(l); });
    });

    child.stderr.on("data", (data) => {
      process.stderr.write(data);
      data.toString().split("\n").forEach(l => { if (l.trim()) pushLog("[STDERR] " + l); });
    });

    child.on("close", (codeExit) => {
      if (_restartScheduled) return;
      _restartScheduled = true;
      global.botProcess = null;
      if (codeExit === 78) {
        global.botPausedReason = "cookies_expired";
        logger(
          "All Facebook cookies are invalid/expired. Auto-restart paused. Update cookie.txt (and cookie2.txt/cookie3.txt) with a valid appstate, then restart the workflow.",
          "[ COOKIE ]"
        );
        sendTelegram(
          `🛑 <b>${tgBotName()} — COOKIES EXPIRED</b>\n\n` +
          `All Facebook cookies are invalid. Auto-restart paused.\n` +
          `Please update <code>cookie.txt</code> and restart manually.\n` +
          `🕐 Time: <b>${tgTime()}</b>`
        );
        return;
      }
      if (codeExit === 87) {
        global.botPausedReason = "author_lock";
        global.botStopped = true;
        logger(
          "AUTHOR_UID / AUTHOR_NAME in config.json was modified. Bot is locked and will not auto-restart. Restore the original author info to run the bot.",
          "[ AUTHOR LOCK ]"
        );
        sendTelegram(
          `⛔ <b>${tgBotName()} — AUTHOR LOCK TRIGGERED</b>\n\n` +
          `AUTHOR_UID / AUTHOR_NAME in <code>config.json</code> was modified.\n` +
          `Bot is locked. Auto-restart disabled.\n` +
          `🕐 Time: <b>${tgTime()}</b>`
        );
        process.exit(87);
        return;
      }
      if (codeExit === 89) {
        global.botPausedReason = "repo_lock";
        global.botStopped = true;
        logger(
          "MAIN_REPO in main/utils/Updater.js was changed to an unauthorized repo. Bot is locked and will not auto-restart. Restore the original MAIN_REPO to run the bot.",
          "[ REPO LOCK ]"
        );
        sendTelegram(
          `⛔ <b>${tgBotName()} — REPO LOCK TRIGGERED</b>\n\n` +
          `MAIN_REPO in <code>main/utils/Updater.js</code> was changed to an unauthorized repo.\n` +
          `Bot is locked. Auto-restart disabled.\n` +
          `🕐 Time: <b>${tgTime()}</b>`
        );
        process.exit(89);
        return;
      }
      const isCrash = codeExit !== 0 && codeExit !== null;
      if (isCrash) {
        global.countRestart++;
        const _delay = Math.min(3000 * Math.pow(2, Math.min(global.countRestart - 1, 4)), 60000);
        if (logger.crash) logger.crash(codeExit, global.countRestart, _delay);
      }
      if (global.botStopped) {
        logger(`Bot stopped by dashboard (code ${codeExit})`, "[ BOT ]");
        pushLog(`[DASHBOARD] Bot stopped by user`);
        sendTelegram(
          `⛔ <b>${tgBotName()} — STOPPED</b>\n\n` +
          `🛑 Stopped manually via dashboard\n` +
          `🕐 Time: <b>${tgTime()}</b>`
        );
        return;
      }
      if (isCrash) {
        sendTelegram(
          `🔴 <b>${tgBotName()} — CRASHED</b>\n\n` +
          `💥 Exit code: <b>${codeExit}</b>\n` +
          `🔄 Restart #<b>${global.countRestart}</b>\n` +
          `🕐 Time: <b>${tgTime()}</b>\n\n` +
          `⏳ Auto-restarting...`
        );
      }
      logger(
        `Bot exited (code ${codeExit}) — Restart #${global.countRestart}`,
        "[ RESTART ]"
      );
      startBot();
    });

    child.on("error", (error) => {
      if (_restartScheduled) return;
      _restartScheduled = true;
      if (logger.networkError) logger.networkError(`Spawn error: ${error.message}`, null);
      else logger(`Spawn error: ${error.message}`, "[ ERROR ]");
      global.countRestart++;
      sendTelegram(
        `🔴 <b>${tgBotName()} — SPAWN ERROR</b>\n\n` +
        `⚠️ <code>${error.message}</code>\n` +
        `🕐 Time: <b>${tgTime()}</b>`
      );
      if (!global.botStopped) startBot();
    });

  }, delay);
}

function startAutoUpdater() {
  const updCfg = (config && config.updateNotification) || {};
  if (updCfg.enable === false || updCfg.autoApply !== true) {
    logger("Auto-updater disabled — set updateNotification.autoApply: true to enable", "[ UPDATE ]");
    return;
  }
  const intervalMin = updCfg.checkIntervalMinutes || 30;
  const intervalMs = intervalMin * 60 * 1000;
  logger(`Auto-updater started — checking every ${intervalMin} minutes`, "[ UPDATE ]");

  setInterval(async () => {
    try {
      logger("Auto-update check running...", "[ UPDATE ]");
      const { checkForUpdate } = require("./main/utils/Updater");
      const { applyUpdate } = require("./main/utils/Update");
      const info = await checkForUpdate();
      if (info.error) {
        logger(`Auto-update check failed: ${info.error}`, "[ UPDATE ]");
        return;
      }
      if (!info.hasUpdate) {
        logger(`Auto-update: already on latest version (v${info.localVersion})`, "[ UPDATE ]");
        return;
      }
      logger(
        `Auto-update: new version found! v${info.localVersion} → v${info.remoteVersion}`,
        "[ UPDATE ]"
      );
      if (info.changelog && info.changelog.length > 0) {
        info.changelog.forEach(c => logger(`  • ${c}`, "[ UPDATE ]"));
      }
      sendTelegram(
        `🔄 <b>${tgBotName()} — AUTO UPDATE</b>\n\n` +
        `📦 v${info.localVersion} → v${info.remoteVersion}\n` +
        `📝 ${(info.changelog || []).map(c => `• ${c}`).join("\n") || "No changelog"}\n` +
        `⏳ Downloading and applying update...\n` +
        `🕐 Time: <b>${tgTime()}</b>`
      );
      const result = await applyUpdate({ forceRestart: true });
      if (result.success) {
        logger(`Auto-update applied! Now on v${result.remoteVersion} — restarting...`, "[ UPDATE ]");
        sendTelegram(
          `✅ <b>${tgBotName()} — UPDATE APPLIED</b>\n\n` +
          `📦 Now on v${result.remoteVersion}\n` +
          `🔄 Bot is restarting...\n` +
          `🕐 Time: <b>${tgTime()}</b>`
        );
      } else {
        logger(`Auto-update failed: ${result.error || result.reason}`, "[ UPDATE ]");
      }
    } catch (err) {
      logger(`Auto-updater error: ${err.message}`, "[ UPDATE ]");
    }
  }, intervalMs);
}

function gracefulShutdown(signal) {
  logger(`Received ${signal} — shutting down...`, "[ SHUTDOWN ]");
  if (global.botProcess && !global.botProcess.killed) {
    global.botProcess.kill("SIGTERM");
  }
  setTimeout(() => process.exit(0), 3000);
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("uncaughtException", (err) => {
  logger(`Uncaught exception in index.js: ${err.stack || err.message}`, "[ ERROR ]");
});
process.on("unhandledRejection", (reason) => {
  logger(`Unhandled rejection in index.js: ${reason}`, "[ ERROR ]");
});

(async () => {
  await checkUpdate();
  startWatchdog();
  startAutoUpdater();
  startBot("Bot is starting...");
})();
