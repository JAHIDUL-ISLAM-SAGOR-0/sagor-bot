const AUTHORIZED_REPO = "SAGOR-OFFICIAL-09/PROJECT-5";

function verifyRepo() {
  try {
    const { MAIN_REPO } = require("./Updater");
    if (MAIN_REPO.trim() !== AUTHORIZED_REPO.trim()) {
      console.error(
        `\n[ REPO LOCK ] ❌ UNAUTHORIZED REPO DETECTED!\n` +
        `[ REPO LOCK ] Expected : ${AUTHORIZED_REPO}\n` +
        `[ REPO LOCK ] Found    : ${MAIN_REPO}\n` +
        `[ REPO LOCK ] Bot is shutting down. Restore the original MAIN_REPO in main/utils/Updater.js\n`
      );
      process.exit(89);
    }
    console.log(`[ REPO LOCK ] ✅ Repo verified: ${MAIN_REPO}`);
  } catch (err) {
    console.error(`[ REPO LOCK ] Failed to verify repo: ${err.message}`);
    process.exit(89);
  }
}

module.exports = { verifyRepo, AUTHORIZED_REPO };
