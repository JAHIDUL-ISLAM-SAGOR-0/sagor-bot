const crypto = require("crypto");
const path = require("path");
const fs = require("fs");

const _h = "87bd027c6484363ee80c074373ffd7b5e47ff4e71b5ee1e5bba6a913155cb176";

function _fail(reason) {
    const line = "═".repeat(60);
    const msg =
        "\n\x1b[31m" + line + "\x1b[0m\n" +
        "\x1b[31m  ⛔ AUTHOR VERIFICATION FAILED — BOT LOCKED\x1b[0m\n" +
        "\x1b[31m" + line + "\x1b[0m\n" +
        "\x1b[33m  Reason: " + reason + "\x1b[0m\n" +
        "\x1b[33m  AUTHOR_UID and AUTHOR_NAME in config.json have been\x1b[0m\n" +
        "\x1b[33m  modified. Restore the original author info to run the bot.\x1b[0m\n" +
        "\x1b[31m" + line + "\x1b[0m\n";
    try { process.stderr.write(msg); } catch (_) {}
    process.exit(87);
}

function verifyAuthor() {
    let cfg;
    try {
        const cfgPath = path.resolve(__dirname, "..", "..", "config.json");
        cfg = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
    } catch (e) {
        _fail("config.json not readable (" + e.message + ")");
        return;
    }
    const uid = cfg && cfg.AUTHOR_UID;
    const name = cfg && cfg.AUTHOR_NAME;
    if (!uid || !name) _fail("AUTHOR_UID or AUTHOR_NAME missing in config.json");
    const got = crypto.createHash("sha256").update(String(uid) + "|" + String(name)).digest("hex");
    if (got !== _h) _fail("AUTHOR_UID / AUTHOR_NAME does not match the locked author");
}

module.exports = { verifyAuthor };
