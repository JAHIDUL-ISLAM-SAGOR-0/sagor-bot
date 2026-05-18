module.exports.config = {
    name: "leave",
    eventType: ["log:unsubscribe"],
    version: "8.0.0",
    credits: "SaGor",
    description: "Leave notification - fixed icons, layout, admin image"
};

module.exports.onLoad = function () {
    const fs   = global.nodemodule["fs-extra"];
    const path = global.nodemodule["path"];
    const dir  = path.join(__dirname, "cache", "leave");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

// ══════════════════════════════════════════
//  HELPERS
// ══════════════════════════════════════════
async function downloadImg(url) {
    const axios = global.nodemodule["axios"] || require("axios");
    const res   = await axios.get(url, {
        responseType: "arraybuffer",
        timeout: 8000,
        headers: { "User-Agent": "Mozilla/5.0" }
    });
    return Buffer.from(res.data);
}

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function clipCircle(ctx, cx, cy, r, img) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, cx - r, cy - r, r * 2, r * 2);
    ctx.restore();
}

function drawPersonIcon(ctx, cx, cy, r, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx, cy - r * 0.28, r * 0.32, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx, cy + r * 0.28, r * 0.40, r * 0.32, 0, Math.PI, 0, true);
    ctx.fill();
    ctx.restore();
}

// Small canvas-drawn person icon for label
function drawLabelPerson(ctx, x, y, size, color) {
    ctx.save();
    ctx.fillStyle = color;
    const cx = x + size * 0.5, cy = y + size * 0.3;
    ctx.beginPath(); ctx.arc(cx, cy, size * 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx, cy + size * 0.55, size * 0.4, size * 0.3, 0, Math.PI, 0, true); ctx.fill();
    ctx.restore();
}

// Small canvas-drawn shield icon for label
function drawLabelShield(ctx, x, y, size, color) {
    ctx.save();
    ctx.fillStyle = color;
    const cx = x + size * 0.5, cy = y + size * 0.42;
    ctx.beginPath();
    ctx.moveTo(cx, cy - size * 0.42);
    ctx.bezierCurveTo(cx + size * 0.42, cy - size * 0.42, cx + size * 0.42, cy + size * 0.06, cx, cy + size * 0.42);
    ctx.bezierCurveTo(cx - size * 0.42, cy + size * 0.06, cx - size * 0.42, cy - size * 0.42, cx, cy - size * 0.42);
    ctx.fill();
    ctx.strokeStyle = "#fff"; ctx.lineWidth = size * 0.1; ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(cx - size * 0.14, cy + size * 0.04);
    ctx.lineTo(cx - size * 0.02, cy + size * 0.16);
    ctx.lineTo(cx + size * 0.16, cy - size * 0.1);
    ctx.stroke();
    ctx.restore();
}

// Clock icon for timestamp
function drawClock(ctx, x, y, r, color) {
    ctx.save();
    ctx.strokeStyle = color; ctx.lineWidth = r * 0.2;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
    ctx.lineCap = "round"; ctx.lineWidth = r * 0.18;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - r * 0.55); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + r * 0.42, y + r * 0.3); ctx.stroke();
    ctx.restore();
}

// ══════════════════════════════════════════
//  GENERATE CARD
// ══════════════════════════════════════════
async function generateCard({ leftUserName, adminName, isKicked, timeStr, leftImg, adminImg }) {
    const { createCanvas } = require("canvas");

    const W = 520, H = isKicked ? 586 : 590;
    const canvas = createCanvas(W, H);
    const ctx    = canvas.getContext("2d");

    const ACCENT  = isKicked ? "#e53935" : "#00e676";
    const GLOW    = isKicked ? "rgba(229,57,53,0.5)" : "rgba(0,230,118,0.45)";
    const GLOWLT  = isKicked ? "rgba(229,57,53,0.16)" : "rgba(0,230,118,0.16)";

    // ── Background ──
    const bg = ctx.createRadialGradient(W / 2, H * 0.3, 20, W / 2, H * 0.5, W * 0.92);
    bg.addColorStop(0, isKicked ? "#1e0d0d" : "#0d1e10");
    bg.addColorStop(0.6, isKicked ? "#110707" : "#080f0a");
    bg.addColorStop(1, "#060606");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    // Dot grid
    ctx.save();
    ctx.fillStyle = isKicked ? "rgba(229,57,53,0.055)" : "rgba(0,230,118,0.055)";
    for (let gx = 18; gx < W; gx += 26)
        for (let gy = 18; gy < H; gy += 26) {
            ctx.beginPath(); ctx.arc(gx, gy, 1.0, 0, Math.PI * 2); ctx.fill();
        }
    ctx.restore();

    // ── Card border ──
    ctx.save();
    roundRect(ctx, 16, 16, W - 32, H - 32, 20);
    ctx.fillStyle = "rgba(10,10,12,0.94)"; ctx.fill(); ctx.restore();

    ctx.save();
    roundRect(ctx, 16, 16, W - 32, H - 32, 20);
    ctx.strokeStyle = ACCENT; ctx.lineWidth = 1.8;
    ctx.shadowColor = GLOW; ctx.shadowBlur = 26; ctx.stroke(); ctx.restore();

    // ── TOP ICON ──
    const iconCY = 108;

    if (isKicked) {
        // Warning triangles
        const tri = (tx, ty, sz) => {
            ctx.save();
            ctx.fillStyle = ACCENT; ctx.globalAlpha = 0.72;
            ctx.beginPath();
            ctx.moveTo(tx, ty - sz);
            ctx.lineTo(tx + sz * 0.86, ty + sz * 0.52);
            ctx.lineTo(tx - sz * 0.86, ty + sz * 0.52);
            ctx.closePath(); ctx.fill();
            ctx.globalAlpha = 1; ctx.fillStyle = "#fff";
            ctx.font = `bold ${Math.round(sz * 0.82)}px sans-serif`;
            ctx.textAlign = "center"; ctx.textBaseline = "middle";
            ctx.fillText("!", tx, ty + sz * 0.12);
            ctx.textBaseline = "alphabetic"; ctx.restore();
        };
        tri(86, 78, 19); tri(W - 86, 78, 19);

        // Diamond decorators
        ctx.save(); ctx.fillStyle = ACCENT; ctx.globalAlpha = 0.52;
        [[126, 60], [W - 126, 60]].forEach(([dx, dy]) => {
            ctx.beginPath();
            ctx.moveTo(dx, dy - 7); ctx.lineTo(dx + 7, dy);
            ctx.lineTo(dx, dy + 7); ctx.lineTo(dx - 7, dy);
            ctx.closePath(); ctx.fill();
        });
        ctx.restore();

        // Glow ring
        ctx.save();
        ctx.beginPath(); ctx.arc(W / 2, iconCY, 62, 0, Math.PI * 2);
        const rg = ctx.createRadialGradient(W / 2, iconCY - 10, 5, W / 2, iconCY, 62);
        rg.addColorStop(0, "rgba(229,57,53,0.30)"); rg.addColorStop(1, "rgba(229,57,53,0.05)");
        ctx.fillStyle = rg; ctx.fill();
        ctx.strokeStyle = "rgba(229,57,53,0.40)"; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore();

        // Shield
        const sx = W / 2, sy = iconCY, ss = 48;
        ctx.save(); ctx.shadowColor = ACCENT; ctx.shadowBlur = 24; ctx.fillStyle = ACCENT;
        ctx.beginPath();
        ctx.moveTo(sx, sy - ss * 0.52);
        ctx.bezierCurveTo(sx + ss * 0.54, sy - ss * 0.52, sx + ss * 0.54, sy + ss * 0.08, sx, sy + ss * 0.52);
        ctx.bezierCurveTo(sx - ss * 0.54, sy + ss * 0.08, sx - ss * 0.54, sy - ss * 0.52, sx, sy - ss * 0.52);
        ctx.fill(); ctx.restore();

        ctx.save(); ctx.strokeStyle = "#fff"; ctx.lineWidth = 5.5; ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(sx - 14, sy - 14); ctx.lineTo(sx + 14, sy + 14);
        ctx.moveTo(sx + 14, sy - 14); ctx.lineTo(sx - 14, sy + 14);
        ctx.stroke(); ctx.restore();

    } else {
        // Outer ring
        ctx.save(); ctx.strokeStyle = "rgba(0,230,118,0.12)"; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(W / 2, iconCY, 72, 0, Math.PI * 2); ctx.stroke(); ctx.restore();

        // Inner glow circle
        ctx.save();
        ctx.beginPath(); ctx.arc(W / 2, iconCY, 58, 0, Math.PI * 2);
        const cg = ctx.createRadialGradient(W / 2, iconCY - 10, 5, W / 2, iconCY, 58);
        cg.addColorStop(0, "rgba(0,230,118,0.22)"); cg.addColorStop(1, "rgba(0,230,118,0.04)");
        ctx.fillStyle = cg; ctx.fill();
        ctx.strokeStyle = "rgba(0,230,118,0.50)"; ctx.lineWidth = 1.8;
        ctx.shadowColor = GLOW; ctx.shadowBlur = 18; ctx.stroke(); ctx.restore();

        // Side dots
        ctx.save(); ctx.fillStyle = ACCENT; ctx.globalAlpha = 0.42;
        [[86, 90], [W - 86, 90]].forEach(([dx, dy]) => {
            ctx.beginPath(); ctx.arc(dx, dy, 5, 0, Math.PI * 2); ctx.fill();
        });
        ctx.restore();

        // Person + arrow
        const ic = W / 2, iy = iconCY, isz = 50;
        ctx.save(); ctx.fillStyle = ACCENT; ctx.strokeStyle = ACCENT;
        ctx.lineWidth = isz * 0.115; ctx.lineCap = "round";
        ctx.beginPath(); ctx.arc(ic - isz * 0.18, iy - isz * 0.18, isz * 0.22, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(ic - isz * 0.18, iy + isz * 0.15, isz * 0.27, isz * 0.23, 0, Math.PI, 0, true); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(ic + isz * 0.06, iy); ctx.lineTo(ic + isz * 0.44, iy);
        ctx.moveTo(ic + isz * 0.28, iy - isz * 0.16); ctx.lineTo(ic + isz * 0.44, iy); ctx.lineTo(ic + isz * 0.28, iy + isz * 0.16);
        ctx.stroke(); ctx.restore();
    }

    // ── TITLE ──
    const titleY = iconCY + 80;

    ctx.save();
    ctx.strokeStyle = ACCENT; ctx.lineWidth = 1.5;
    ctx.shadowColor = GLOW; ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.moveTo(52, titleY - 12); ctx.lineTo(W / 2 - 118, titleY - 12); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(W - 52, titleY - 12); ctx.lineTo(W / 2 + 118, titleY - 12); ctx.stroke();
    ctx.shadowBlur = 0; ctx.fillStyle = ACCENT;
    ctx.beginPath(); ctx.arc(52, titleY - 12, 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(W - 52, titleY - 12, 4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.font = "900 26px sans-serif"; ctx.textAlign = "center";
    ctx.fillStyle = ACCENT; ctx.shadowColor = GLOW; ctx.shadowBlur = 20;
    ctx.fillText(isKicked ? "MEMBER REMOVED" : "GROUP LEAVE", W / 2, titleY);
    ctx.restore();

    ctx.save();
    ctx.font = "400 14px sans-serif"; ctx.textAlign = "center";
    ctx.fillStyle = "rgba(195,195,195,0.55)";
    ctx.fillText(
        isKicked ? "A member has been removed from the group" : "A member has left the group",
        W / 2, titleY + 24
    );
    ctx.restore();

    // Divider + chevron
    ctx.save();
    const dg = ctx.createLinearGradient(36, 0, W - 36, 0);
    dg.addColorStop(0, "transparent");
    dg.addColorStop(0.5, isKicked ? "rgba(229,57,53,0.28)" : "rgba(0,230,118,0.28)");
    dg.addColorStop(1, "transparent");
    ctx.strokeStyle = dg; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(36, titleY + 38); ctx.lineTo(W - 36, titleY + 38); ctx.stroke();
    ctx.strokeStyle = ACCENT; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 8, titleY + 34); ctx.lineTo(W / 2, titleY + 42); ctx.lineTo(W / 2 + 8, titleY + 34);
    ctx.stroke(); ctx.restore();

    // ── INFO CARDS ──
    const CX = 36, CW = W - 72, CR = 10;
    let CY = titleY + 54;
    const rowH = 76, gap = 8;

    const drawRow = (img, labelIconFn, labelText, valueText, valueColor) => {
        ctx.save();
        roundRect(ctx, CX, CY, CW, rowH, CR);
        ctx.fillStyle = isKicked ? "rgba(26,10,10,0.88)" : "rgba(9,20,13,0.90)";
        ctx.strokeStyle = GLOWLT; ctx.lineWidth = 1;
        ctx.fill(); ctx.stroke(); ctx.restore();

        // Avatar
        const avR = 26, avX = CX + 20 + avR, avY = CY + rowH / 2;
        ctx.save();
        ctx.beginPath(); ctx.arc(avX, avY, avR, 0, Math.PI * 2);
        ctx.fillStyle = isKicked ? "#1e0808" : "#091409"; ctx.fill();
        ctx.strokeStyle = ACCENT; ctx.lineWidth = 2;
        ctx.shadowColor = GLOW; ctx.shadowBlur = 8; ctx.stroke(); ctx.restore();
        if (img) clipCircle(ctx, avX, avY, avR, img);
        else drawPersonIcon(ctx, avX, avY, avR, isKicked ? "rgba(229,57,53,0.4)" : "rgba(0,230,118,0.38)");

        // Label
        labelIconFn(ctx, CX + 80, CY + 14, 14, "rgba(165,165,165,0.52)");
        ctx.save(); ctx.font = "400 12px sans-serif"; ctx.fillStyle = "rgba(165,165,165,0.65)"; ctx.textAlign = "left";
        ctx.fillText(labelText, CX + 98, CY + 26); ctx.restore();

        // Value
        ctx.save(); ctx.font = "700 19px sans-serif"; ctx.textAlign = "left";
        ctx.fillStyle = valueColor || "#ffffff";
        if (valueColor) { ctx.shadowColor = valueColor; ctx.shadowBlur = 8; }
        ctx.fillText(valueText, CX + 80, CY + 54); ctx.restore();

        CY += rowH + gap;
    };

    if (isKicked) {
        drawRow(leftImg, drawLabelPerson, "User", leftUserName, "#ffffff");
        // ★ adminImg if available, else same leftImg
        drawRow(adminImg || leftImg, drawLabelShield, "Removed By", adminName || "Admin", "#ffffff");

        // Status row
        ctx.save();
        roundRect(ctx, CX, CY, CW, 68, CR);
        ctx.fillStyle = "rgba(26,10,10,0.88)";
        ctx.strokeStyle = GLOWLT; ctx.lineWidth = 1;
        ctx.fill(); ctx.stroke(); ctx.restore();

        const six = CX + 20 + 22, siy = CY + 34;
        ctx.save();
        ctx.beginPath(); ctx.arc(six, siy, 22, 0, Math.PI * 2);
        ctx.strokeStyle = ACCENT; ctx.lineWidth = 2; ctx.shadowColor = GLOW; ctx.shadowBlur = 10; ctx.stroke();
        ctx.strokeStyle = ACCENT; ctx.lineWidth = 2.5; ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(six - 8, siy - 8); ctx.lineTo(six + 8, siy + 8);
        ctx.moveTo(six + 8, siy - 8); ctx.lineTo(six - 8, siy + 8);
        ctx.stroke(); ctx.restore();

        ctx.save(); ctx.font = "400 12px sans-serif"; ctx.fillStyle = "rgba(165,165,165,0.65)"; ctx.textAlign = "left";
        ctx.fillText("Status", CX + 80, CY + 22); ctx.restore();
        ctx.save(); ctx.font = "700 19px sans-serif"; ctx.fillStyle = ACCENT;
        ctx.shadowColor = GLOW; ctx.shadowBlur = 10; ctx.textAlign = "left";
        ctx.fillText("Kicked from the group", CX + 80, CY + 52); ctx.restore();
        CY += 68 + gap;

    } else {
        // Leave single card
        ctx.save();
        roundRect(ctx, CX, CY, CW, 128, CR);
        ctx.fillStyle = "rgba(9,20,13,0.90)";
        ctx.strokeStyle = GLOWLT; ctx.lineWidth = 1;
        ctx.fill(); ctx.stroke(); ctx.restore();

        const avR = 42, avCX = CX + 28 + avR, avCY = CY + 64;
        ctx.save();
        ctx.beginPath(); ctx.arc(avCX, avCY, avR, 0, Math.PI * 2);
        ctx.fillStyle = "#091409"; ctx.fill();
        ctx.strokeStyle = ACCENT; ctx.lineWidth = 2.5;
        ctx.shadowColor = GLOW; ctx.shadowBlur = 14; ctx.stroke(); ctx.restore();
        if (leftImg) clipCircle(ctx, avCX, avCY, avR, leftImg);
        else drawPersonIcon(ctx, avCX, avCY, avR, "rgba(0,230,118,0.38)");

        drawLabelPerson(ctx, CX + 122, CY + 24, 14, "rgba(155,155,155,0.52)");
        ctx.save(); ctx.font = "400 12px sans-serif"; ctx.fillStyle = "rgba(155,155,155,0.65)"; ctx.textAlign = "left";
        ctx.fillText("Name", CX + 140, CY + 36); ctx.restore();
        ctx.save(); ctx.font = "700 21px sans-serif"; ctx.fillStyle = "#fff"; ctx.textAlign = "left";
        ctx.fillText(leftUserName, CX + 122, CY + 62); ctx.restore();

        ctx.save(); ctx.strokeStyle = "rgba(0,230,118,0.1)"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(CX + 122, CY + 74); ctx.lineTo(CX + CW - 14, CY + 74); ctx.stroke(); ctx.restore();

        // Arrow icon for status
        ctx.save(); ctx.strokeStyle = ACCENT; ctx.lineWidth = 2; ctx.lineCap = "round";
        const ax = CX + 126, ay = CY + 96;
        ctx.beginPath(); ctx.moveTo(ax, ay - 6); ctx.lineTo(ax, ay + 6); ctx.lineTo(ax + 8, ay + 6); ctx.stroke(); ctx.restore();

        ctx.save(); ctx.font = "400 12px sans-serif"; ctx.fillStyle = "rgba(155,155,155,0.65)"; ctx.textAlign = "left";
        ctx.fillText("Status", CX + 138, CY + 100); ctx.restore();
        ctx.save(); ctx.font = "700 18px sans-serif"; ctx.fillStyle = ACCENT;
        ctx.shadowColor = GLOW; ctx.shadowBlur = 10; ctx.textAlign = "left";
        ctx.fillText("Left the group", CX + 122, CY + 122); ctx.restore();
        CY += 128 + gap;

        // Goodbye row
        ctx.save();
        roundRect(ctx, CX, CY, CW, 54, CR);
        ctx.fillStyle = "rgba(9,20,13,0.82)";
        ctx.strokeStyle = "rgba(0,230,118,0.13)"; ctx.lineWidth = 1;
        ctx.fill(); ctx.stroke(); ctx.restore();

        ctx.save(); ctx.font = "500 16px sans-serif"; ctx.fillStyle = "rgba(212,212,212,0.90)"; ctx.textAlign = "left";
        ctx.fillText("Goodbye and take care!", CX + 48, CY + 32); ctx.restore();

        // Wave hand (simple drawn)
        ctx.save(); ctx.fillStyle = "#e8b84b";
        ctx.font = "22px sans-serif"; ctx.textAlign = "left";
        // Draw simple waving hand as filled circle + rects
        ctx.beginPath(); ctx.ellipse(CX + 26, CY + 27, 10, 12, -0.3, 0, Math.PI * 2); ctx.fill();
        ctx.restore();

        // Heart
        ctx.save(); ctx.fillStyle = ACCENT;
        const hx = CX + CW - 22, hy = CY + 22;
        ctx.beginPath();
        ctx.moveTo(hx, hy + 6);
        ctx.bezierCurveTo(hx, hy, hx - 10, hy, hx - 10, hy + 7);
        ctx.bezierCurveTo(hx - 10, hy + 14, hx, hy + 19, hx, hy + 19);
        ctx.bezierCurveTo(hx, hy + 19, hx + 10, hy + 14, hx + 10, hy + 7);
        ctx.bezierCurveTo(hx + 10, hy, hx, hy, hx, hy + 6);
        ctx.fill(); ctx.restore();
        CY += 54 + gap;
    }

    // ── TIMESTAMP ──
    const tsY = CY + 22;
    drawClock(ctx, W / 2 - 58, tsY - 4, 7, "rgba(120,120,120,0.4)");
    ctx.save(); ctx.font = "400 12.5px sans-serif"; ctx.textAlign = "left";
    ctx.fillStyle = "rgba(120,120,120,0.42)";
    ctx.fillText(timeStr, W / 2 - 46, tsY); ctx.restore();

    return canvas.toBuffer("image/png");
}

// ══════════════════════════════════════════
//  MODULE RUN
// ══════════════════════════════════════════
module.exports.run = async function ({ api, event, Users }) {
    const path = global.nodemodule["path"];
    const fs   = global.nodemodule["fs-extra"];
    const { loadImage } = require("canvas");
    const { threadID } = event;

    try {
        const leftID   = event.logMessageData.leftParticipantFbId;
        const authorID = (event.author || "").replace("fbid:", "");

        if (leftID == api.getCurrentUserID()) return;

        // Left user name
        let leftUserName = "";
        try {
            leftUserName = global.data?.userName?.get(leftID) || "";
            if (!leftUserName && Users?.getNameUser) leftUserName = await Users.getNameUser(leftID);
            if (!leftUserName) {
                const uInfo = await api.getUserInfo(leftID);
                leftUserName = uInfo[leftID]?.name || "Unknown";
            }
        } catch (_) { leftUserName = "Unknown"; }

        // Kick vs self-leave
        const isKicked = !!(authorID && authorID !== String(leftID));
        let adminName = "", adminID = null;
        if (isKicked) {
            adminID = authorID;
            try {
                adminName = global.data?.userName?.get(authorID) || "";
                if (!adminName && Users?.getNameUser) adminName = await Users.getNameUser(authorID);
                if (!adminName) {
                    const aInfo = await api.getUserInfo(authorID);
                    adminName = aInfo[authorID]?.name || "Admin";
                }
            } catch (_) { adminName = "Admin"; }
        }

        // Time
        const timeStr = new Date().toLocaleString("en-US", {
            timeZone: "Asia/Dhaka",
            month: "short", day: "numeric", year: "numeric",
            hour: "numeric", minute: "2-digit", hour12: true
        });

        // Download avatars
        const TOKEN = "6628568379|c1e620fa708a1d5696fb991c1bde5662";
        let leftImg = null, adminImg = null;

        try {
            leftImg = await loadImage(
                await downloadImg(`https://graph.facebook.com/${leftID}/picture?width=400&height=400&access_token=${TOKEN}`)
            );
        } catch (_) {}

        if (isKicked && adminID) {
            try {
                adminImg = await loadImage(
                    await downloadImg(`https://graph.facebook.com/${adminID}/picture?width=400&height=400&access_token=${TOKEN}`)
                );
            } catch (_) {} // null = fallback to leftImg inside generateCard
        }

        // Generate
        const imgBuffer = await generateCard({
            leftUserName, adminName, isKicked, timeStr, leftImg, adminImg
        });

        const imgPath = path.join(__dirname, "cache", "leave", `${leftID}.png`);
        await fs.writeFile(imgPath, imgBuffer);

        const bodyText = isKicked
            ? `[ MEMBER KICKED OUT ]\n\nKicked : ${leftUserName}\nBy     : ${adminName}\nTime   : ${timeStr}\n\nAdmin-er shiddanto chudanto!`
            : `[ MEMBER LEFT ]\n\nName   : ${leftUserName}\nTime   : ${timeStr}\n\nValo theko...`;

        await api.sendMessage({
            body: bodyText,
            attachment: fs.createReadStream(imgPath)
        }, threadID);

    } catch (err) {
        console.error("[leave] Error:", err);
    }
};
