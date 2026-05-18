const axios = require("axios");
const fs = require("fs");
const fse = require("fs-extra");
const path = require("path");
const { execSync } = require("child_process");
const { setLocal } = require("./Version");
const { checkForUpdate, MAIN_REPO, BRANCH, isValidRepo } = require("./Updater");

const ROOT = path.join(__dirname, "../..");
const TMP_DIR = path.join(ROOT, ".update_tmp");

const PRESERVE_FILES = [
  "cookie.txt",
  "cookie2.txt",
  "cookie3.txt"
];

function getLogger() {
  try { return require("./log"); } catch (_) { return (msg, tag) => console.log(`${tag || ""} ${msg}`); }
}

function cleanup() {
  try { fse.removeSync(TMP_DIR); } catch (_) {}
}

async function downloadZip(repo, branch) {
  const logger = getLogger();

  if (!isValidRepo(repo)) {
    throw new Error(`Invalid repo name: "${repo}" — must be "username/repo-name"`);
  }

  const zipUrl = `https://github.com/${repo}/archive/refs/heads/${branch}.zip`;
  logger(`Downloading update from ${zipUrl}`, "[ UPDATE ]");

  let res;
  try {
    res = await axios.get(zipUrl, { responseType: "arraybuffer", timeout: 60000 });
  } catch (err) {
    if (err.response) {
      if (err.response.status === 404) {
        throw new Error(`Repo "${repo}" not found on GitHub (404) — check MAIN_REPO in Updater.js`);
      } else if (err.response.status === 403) {
        throw new Error(`Repo "${repo}" is private or rate-limited (403) — make repo public`);
      } else {
        throw new Error(`GitHub ZIP download failed with status ${err.response.status}`);
      }
    } else if (err.code === "ECONNABORTED" || err.code === "ETIMEDOUT") {
      throw new Error("ZIP download timed out — check internet connection");
    } else {
      throw new Error(`ZIP download failed: ${err.message}`);
    }
  }

  if (!res.data || res.data.byteLength < 100) {
    throw new Error("Downloaded ZIP is empty or corrupted");
  }

  const zipPath = path.join(TMP_DIR, "update.zip");
  fse.ensureDirSync(TMP_DIR);
  fs.writeFileSync(zipPath, res.data);
  return zipPath;
}

function extractZip(zipPath) {
  const extractTo = path.join(TMP_DIR, "extracted");
  fse.ensureDirSync(extractTo);

  let extracted = false;

  try {
    execSync(`unzip -o "${zipPath}" -d "${extractTo}"`, { stdio: "ignore" });
    extracted = true;
  } catch (_) {}

  if (!extracted) {
    try {
      execSync(
        `python3 -c "import zipfile; z=zipfile.ZipFile('${zipPath}'); z.extractall('${extractTo}')"`,
        { stdio: "ignore" }
      );
      extracted = true;
    } catch (_) {}
  }

  if (!extracted) {
    throw new Error("Failed to extract ZIP — unzip and python3 both unavailable");
  }

  const items = fs.readdirSync(extractTo);
  if (items.length === 0) {
    throw new Error("Extracted ZIP is empty — repo may be empty or download was corrupted");
  }

  if (items.length === 1 && fs.statSync(path.join(extractTo, items[0])).isDirectory()) {
    return path.join(extractTo, items[0]);
  }
  return extractTo;
}

function copyAllExceptPreserved(srcDir, destDir, logger) {
  const items = fs.readdirSync(srcDir);
  for (const item of items) {
    if (PRESERVE_FILES.includes(item)) {
      logger(`Skipping (preserved): ${item}`, "[ UPDATE ]");
      continue;
    }
    const srcPath = path.join(srcDir, item);
    const destPath = path.join(destDir, item);
    try {
      fse.copySync(srcPath, destPath, { overwrite: true });
      logger(`Updated: ${item}`, "[ UPDATE ]");
    } catch (copyErr) {
      logger(`Warning: could not copy ${item} — ${copyErr.message}`, "[ UPDATE ]");
    }
  }
}

async function applyUpdate(options = {}) {
  const logger = getLogger();
  const { silent = false, forceRestart = true } = options;

  if (!isValidRepo(MAIN_REPO)) {
    const msg = `Cannot update — invalid MAIN_REPO: "${MAIN_REPO}". Edit main/utils/Updater.js and set correct repo name.`;
    logger(msg, "[ UPDATE ]");
    return { success: false, error: msg };
  }

  let updateInfo;
  try {
    updateInfo = await checkForUpdate();
  } catch (err) {
    logger(`Update check threw an error: ${err.message}`, "[ UPDATE ]");
    return { success: false, error: err.message };
  }

  if (updateInfo.error) {
    logger(`Cannot update — ${updateInfo.error}`, "[ UPDATE ]");
    return { success: false, error: updateInfo.error };
  }

  if (!updateInfo.hasUpdate && !options.force) {
    if (!silent) logger("Already on latest version — no update needed", "[ UPDATE ]");
    return { success: false, reason: "already_latest", ...updateInfo };
  }

  logger(
    `Starting update: v${updateInfo.localVersion} → v${updateInfo.remoteVersion}`,
    "[ UPDATE ]"
  );

  try {
    cleanup();
    fse.ensureDirSync(TMP_DIR);

    const zipPath = await downloadZip(MAIN_REPO, BRANCH);
    logger("Download complete. Extracting...", "[ UPDATE ]");

    const extracted = extractZip(zipPath);
    logger("Extraction done. Applying full update (preserving cookies)...", "[ UPDATE ]");

    copyAllExceptPreserved(extracted, ROOT, logger);

    setLocal({ version: updateInfo.remoteVersion });
    logger(`Update applied! New version: v${updateInfo.remoteVersion}`, "[ UPDATE ]");

    if (updateInfo.changelog && updateInfo.changelog.length > 0) {
      logger("Changelog:", "[ UPDATE ]");
      updateInfo.changelog.forEach((c) => logger(`  • ${c}`, "[ UPDATE ]"));
    }

    cleanup();

    if (forceRestart) {
      logger("Restarting bot to apply update...", "[ UPDATE ]");
      setTimeout(() => {
        if (global.botProcess && !global.botProcess.killed) {
          try { global.botProcess.kill("SIGTERM"); } catch (_) {}
        }
      }, 2000);
    }

    return { success: true, ...updateInfo };
  } catch (err) {
    cleanup();
    logger(`Update failed: ${err.message}`, "[ UPDATE ]");
    return { success: false, error: err.message };
  }
}

module.exports = { applyUpdate, checkForUpdate };
