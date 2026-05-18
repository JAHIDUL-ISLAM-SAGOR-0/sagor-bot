<div align="center">
  <h1>🤖 SAGOR BOT</h1>
  <p><b>A powerful Facebook Messenger Bot — AI chat, media downloader, group management, auto-update system, and a built-in Web Dashboard.</b></p>
  <img src="https://i.imgur.com/XLSPFgc.jpeg" alt="SAGOR BOT" width="400"/>
</div>

---

## 📊 STATS

<p align="center">
<img src="https://img.shields.io/badge/Commands-92-00d9ff?style=for-the-badge" />
<img src="https://img.shields.io/badge/Events-8-ff2d55?style=for-the-badge" />
<img src="https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=node.js&logoColor=white" />
<img src="https://img.shields.io/badge/Version-0.0.1-orange?style=for-the-badge" />
<img src="https://img.shields.io/badge/License-GPL--3.0-blue?style=for-the-badge" />
</p>

---

## ✨ FEATURES

- 🤖 **AI Chat** — Smart replies powered by OpenAI integration
- 🎬 **Video / Media Downloader** — TikTok, YouTube, Facebook, and more
- 🛡️ **Group Management** — Anti-out, Anti-name change, Welcome/Leave, Kick/Ban
- 🎨 **Stylish Image Cards** — Welcome cards, profile, rank built with Canvas + Jimp
- 🌍 **Multi-language** — English (default), and more
- 📊 **Web Dashboard** — Start/Stop/Restart bot, live stats, logs (port 5000)
- 🔁 **Auto-recovery** — Child process auto-restart with exponential backoff on crash
- 🍪 **Multi-cookie support** — Rotation across `cookie.txt`, `cookie2.txt`, `cookie3.txt`
- 💾 **SQLite Database** — Sequelize ORM, zero-config persistence
- 🔔 **Telegram Notify** — Get alerts on online/offline/crash/update events
- 🔄 **Auto-Update System** — Main repo controls all child bots automatically

---

## 🔄 AUTO-UPDATE SYSTEM

This bot has a built-in auto-update system. The **main repo** controls all child bots — no manual update needed.

### How it works

```
Main Repo (GitHub)
      ↓  update version.json
All child bots check every 2 minutes
      ↓  new version detected
Auto download full repo as ZIP
      ↓  apply all files
cookie.txt / cookie2.txt / cookie3.txt → SAFE (never touched)
      ↓
Bot restarts with new update ✅
```

### Main Repo Setup

In your main GitHub repo, keep a `version.json` file:

```json
{
  "version": "0.0.2",
  "name": "SAGOR Bot",
  "releasedAt": "2026-05-16",
  "forceUpdate": false,
  "changelog": [
    "New command added",
    "Bug fix"
  ]
}
```

Just bump the `version` number — all running bots will auto-update within 2 minutes.

### Child Bot Config (`config.json`)

```json
"updateNotification": {
    "enable": true,
    "autoApply": true,
    "checkIntervalMinutes": 2
}
```

| Option | Description |
|--------|-------------|
| `enable` | Turn update checking on/off |
| `autoApply` | `true` = auto apply updates, `false` = notify only |
| `checkIntervalMinutes` | How often to check (default: 2 min) |

### Update Files

| File | Purpose |
|------|---------|
| `main/utils/Version.js` | Read/write/compare version |
| `main/utils/Updater.js` | Check main repo for new version |
| `main/utils/Update.js` | Download ZIP and apply update |
| `version.json` | Version info (main repo controls this) |

### Bot Command

| Command | What it does |
|---------|-------------|
| `.update check` | Check if update is available |
| `.update apply` | Manually apply update now |

### Set Your Main Repo

Edit `main/utils/Updater.js` line 4:

```js
const MAIN_REPO = "your-github-username/your-repo-name";
```

---

## 🚀 GETTING STARTED

### On Replit
1. Import this repo into Replit
2. Paste your Facebook appstate (cookie JSON) into `cookie.txt`
3. Add your Facebook UID to `ADMINBOT` and `SUPERADMIN` in `config.json`
4. Hit **Run** (`node index.js`)
5. Open the dashboard in the webview on port `5000`

### Local
```bash
npm install
node index.js
```

---

## 📁 PROJECT STRUCTURE

```
.
├── index.js                  # Entry point — dashboard + bot manager + auto-updater
├── config.json               # All configuration (prefix, admins, features)
├── version.json              # Version tracker for auto-update system
├── cookie.txt                # Facebook session slot 1
├── cookie2.txt               # Facebook session slot 2
├── cookie3.txt               # Facebook session slot 3
├── main/
│   ├── utils/
│   │   ├── sagor.js          # Bot core loader
│   │   ├── log.js            # Logger
│   │   ├── keep_alive.js     # Uptime ping
│   │   ├── authorLock.js     # Author protection
│   │   ├── Version.js        # Version management
│   │   ├── Updater.js        # Update checker (GitHub)
│   │   └── Update.js        # Update downloader & applier
│   ├── controllers/          # DB controllers (Users, Threads, Currencies)
│   ├── database/             # Sequelize config + models
│   ├── handle/               # Command, reply, reaction, event handlers
│   ├── languages/            # Language files (en.lang, etc.)
│   └── dashboard/            # Web UI HTML files
└── src/
    ├── cmds/                 # 92+ command modules
    └── events/               # 8 event modules
```

---

## ⚙️ KEY CONFIG (config.json)

| Key | What it does |
|-----|--------------|
| `PREFIX` | Command prefix (default: `.`) |
| `ADMINBOT` | List of bot admin UIDs |
| `SUPERADMIN` | List of superadmin UIDs |
| `BOTNAME` | Bot display name |
| `language` | Language code (`en`, `vi`, etc.) |
| `dashBoard.port` | Dashboard port (default: `5000`) |
| `telegramNotify` | Telegram alert on crash/start/stop |
| `updateNotification.autoApply` | Auto-apply updates from main repo |
| `updateNotification.checkIntervalMinutes` | Update check interval (default: `2`) |
| `spamProtection` | Rate limit + auto-ban settings |
| `autoRestartWhenListenMqttError` | Auto restart on MQTT error |

---

## 🌐 WEB DASHBOARD

- **URL:** `http://0.0.0.0:5000`
- **Login:** `/login` (verify-code based auth)
- **Health check:** `/health`
- **Features:** Start/Stop/Restart bot, live stats, module list, log viewer, cookie manager

---

## 🛠️ TECH STACK

- **Node.js 20.x** — Runtime
- **Express.js** — Dashboard server
- **sagor-fca** — Facebook Chat API
- **Sequelize + SQLite** — Database
- **Socket.io** — Real-time uptime monitoring
- **canvas, jimp** — Image generation
- **openai** — AI chat features
- **axios** — HTTP requests + update downloads

---

## 🐛 TROUBLESHOOTING

| Issue | Fix |
|-------|------|
| Bot won't start, exit code `78` | All cookies expired — update `cookie.txt` |
| Bot locked, exit code `87` | AUTHOR_UID or AUTHOR_NAME was changed in `config.json` — restore original |
| Dashboard not visible | Set `config.json → dashBoard.port` to `5000` |
| Welcome message not sending | Set `groupNoti.enable: true` |
| Auto-update not working | Check `updateNotification.enable: true` and `autoApply: true` in `config.json` |
| Update check fails | Make sure main repo is public and `version.json` exists |

---

## 🔗 SOCIAL

<p align="center">
<a href="https://facebook.com/SAGOR.69x"><img src="https://img.shields.io/badge/Facebook-1877F2?style=for-the-badge&logo=facebook&logoColor=white" /></a>
<a href="https://github.com/SAGOR-KINGx"><img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white" /></a>
<a href="https://wa.me/+8801611079915"><img src="https://img.shields.io/badge/WhatsApp-25D366?style=for-the-badge&logo=whatsapp&logoColor=white" /></a>
<a href="https://t.me/xxSaGorxx"><img src="https://img.shields.io/badge/Telegram-26A5E4?style=for-the-badge&logo=telegram&logoColor=white" /></a>
</p>

---

## 📜 LICENSE

GPL-3.0 — © **SAGOR**

<div align="center">
  <sub>Built with 🩶 by SAGOR</sub>
</div>
