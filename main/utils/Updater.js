const axios = require("axios");
const { getVersion, compare } = require("./Version");

const MAIN_REPO = "JAHIDUL-ISLAM-SAGOR-0/sagor-bot";
const BRANCH = "main";

function isValidRepo(repo) {
  return typeof repo === "string" && /^[\w.-]+\/[\w.-]+$/.test(repo.trim());
}

function getVersionUrl(repo, branch) {
  return `https://raw.githubusercontent.com/${repo}/${branch}/version.json`;
}

async function checkForUpdate() {
  const localVersion = getVersion();

  if (!isValidRepo(MAIN_REPO)) {
    return {
      hasUpdate: false,
      error: `Invalid MAIN_REPO format: "${MAIN_REPO}" — must be "username/repo-name"`
    };
  }

  const VERSION_URL = getVersionUrl(MAIN_REPO, BRANCH);

  try {
    const res = await axios.get(VERSION_URL, { timeout: 10000 });

    if (!res.data || typeof res.data !== "object") {
      return { hasUpdate: false, error: "Remote version.json is empty or invalid" };
    }

    const remote = res.data;

    if (!remote.version) {
      return { hasUpdate: false, error: "Remote version.json missing 'version' field" };
    }

    const diff = compare(localVersion, remote.version);
    return {
      hasUpdate: diff > 0,
      localVersion,
      remoteVersion: remote.version,
      changelog: remote.changelog || [],
      repo: MAIN_REPO,
      branch: BRANCH,
      releasedAt: remote.releasedAt || null,
      forceUpdate: remote.forceUpdate === true,
      error: null
    };
  } catch (err) {
    let reason = err.message;
    if (err.response) {
      if (err.response.status === 404) {
        reason = `Repo "${MAIN_REPO}" not found or version.json missing (404)`;
      } else if (err.response.status === 403) {
        reason = `Repo "${MAIN_REPO}" is private or access denied (403)`;
      } else {
        reason = `GitHub returned status ${err.response.status}`;
      }
    } else if (err.code === "ECONNABORTED" || err.code === "ETIMEDOUT") {
      reason = "Connection timeout — check internet or GitHub availability";
    }
    return { hasUpdate: false, error: reason };
  }
}

async function getRemoteInfo() {
  if (!isValidRepo(MAIN_REPO)) return null;
  try {
    const res = await axios.get(getVersionUrl(MAIN_REPO, BRANCH), { timeout: 10000 });
    return res.data || null;
  } catch (_) {
    return null;
  }
}

module.exports = { checkForUpdate, getRemoteInfo, MAIN_REPO, BRANCH, isValidRepo };
