const fs = require("fs");
const path = require("path");

const VERSION_FILE = path.join(__dirname, "../../version.json");
const CONFIG_FILE = path.join(__dirname, "../../config.json");

function getLocal() {
  try {
    if (fs.existsSync(VERSION_FILE)) {
      const data = JSON.parse(fs.readFileSync(VERSION_FILE, "utf8"));
      return data;
    }
    const cfg = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
    return {
      version: cfg.version || "1.0.0",
      name: cfg.BOTNAME || "SAGOR Bot",
      updatedAt: null
    };
  } catch (_) {
    return { version: "1.0.0", name: "SAGOR Bot", updatedAt: null };
  }
}

function setLocal(data) {
  try {
    const current = getLocal();
    const updated = Object.assign({}, current, data, { updatedAt: new Date().toISOString() });
    fs.writeFileSync(VERSION_FILE, JSON.stringify(updated, null, 2), "utf8");
    return true;
  } catch (_) {
    return false;
  }
}

function getVersion() {
  return getLocal().version || "1.0.0";
}

function compare(localVer, remoteVer) {
  const parse = (v) => String(v).replace(/[^0-9.]/g, "").split(".").map(Number);
  const local = parse(localVer);
  const remote = parse(remoteVer);
  const len = Math.max(local.length, remote.length);
  for (let i = 0; i < len; i++) {
    const l = local[i] || 0;
    const r = remote[i] || 0;
    if (r > l) return 1;
    if (r < l) return -1;
  }
  return 0;
}

module.exports = { getLocal, setLocal, getVersion, compare };
