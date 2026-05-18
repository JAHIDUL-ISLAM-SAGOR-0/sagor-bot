const { createCanvas, loadImage } = require("canvas");
const fs    = require("fs");
const path  = require("path");
const axios = require("axios");

/* ════════════════════════════════════════════════
   CONFIG
════════════════════════════════════════════════ */
module.exports.config = {
  name: "owner",
  version: "5.0.0",
  hasPermssion: 0,
  credits: "Jahidul Islam Sagor",
  description: "Show bot owner information with stylish card",
  commandCategory: "info",
  cooldowns: 5,
  aliases: ["ownerinfo", "dev", "developer"]
};

/* ════════════════════════════════════════════════
   OWNER DATA
════════════════════════════════════════════════ */
const OWNER = {
  name:         "Jahidul Islam Sagor",
  uid:          "61581197276223",
  age:          "18+",
  country:      "Bangladesh",
  city:         "Rangpur",
  facebook:     "fb.com/SAGOR.69x",
  gmail:        "jahidullx6@gmail.com",
  relationship: "Single",
  hobby:        "Coding & Gaming",
  profession:   "Bot Developer",
  botName:      "SAGOR BOT",
  botVersion:   "V5.0.0",
};

const W = 500, PAD = 14, CR = 10;

/* ════════════════════════════════════════════════
   AVATAR LOADER — multiple fallbacks
════════════════════════════════════════════════ */
async function loadAvatar(uid) {
  const urls = [
    `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
  ];
  for (const url of urls) {
    try {
      const res = await axios.get(url, {
        responseType: "arraybuffer",
        timeout: 7000,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
          "Accept": "image/webp,image/apng,image/*,*/*;q=0.8",
        }
      });
      if (res.data && res.data.byteLength > 500) {
        const img = await loadImage(Buffer.from(res.data));
        return img;
      }
    } catch (_) {}
  }
  // local fallbacks
  for (const lp of [
    path.join(__dirname, "owner.png"),
    path.join(__dirname, "owner.jpg"),
    path.join(__dirname, "assets", "owner.png"),
  ]) {
    if (fs.existsSync(lp)) {
      try { return await loadImage(lp); } catch (_) {}
    }
  }
  return null;
}

/* ════════════════════════════════════════════════
   SVG HELPERS
════════════════════════════════════════════════ */
const _cache = {};
async function si(svgStr, size) {
  const k = svgStr + size;
  if (_cache[k]) return _cache[k];
  const w = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24">${svgStr}</svg>`;
  const img = await loadImage(`data:image/svg+xml;base64,${Buffer.from(w).toString("base64")}`);
  _cache[k] = img;
  return img;
}
async function ic(ctx, svg, cx, cy, sz) {
  try { ctx.drawImage(await si(svg, sz), cx - sz/2, cy - sz/2, sz, sz); } catch(_) {}
}

/* ════════════════════════════════════════════════
   ICONS
════════════════════════════════════════════════ */
const I = {
  crown:  (c="#FFD700") => `<path fill="${c}" d="M2 19h20v2H2v-2zm2-3l3.5-8 4.5 4 4.5-4L20 16H4z"/>`,
  user:   (c="#a0a8d0") => `<circle cx="12" cy="8" r="4" fill="${c}"/><path fill="${c}" d="M4 20c0-4.418 3.582-8 8-8s8 3.582 8 8H4z"/>`,
  cal:    (c="#34d399") => `<rect x="3" y="4" width="18" height="18" rx="2" fill="none" stroke="${c}" stroke-width="2"/><line x1="16" y1="2" x2="16" y2="6" stroke="${c}" stroke-width="2" stroke-linecap="round"/><line x1="8" y1="2" x2="8" y2="6" stroke="${c}" stroke-width="2" stroke-linecap="round"/><line x1="3" y1="10" x2="21" y2="10" stroke="${c}" stroke-width="2"/>`,
  globe:  (c="#60a5fa") => `<circle cx="12" cy="12" r="9" fill="none" stroke="${c}" stroke-width="2"/><ellipse cx="12" cy="12" rx="4" ry="9" fill="none" stroke="${c}" stroke-width="1.5"/><line x1="3" y1="12" x2="21" y2="12" stroke="${c}" stroke-width="1.5"/>`,
  pin:    (c="#f472b6") => `<path fill="${c}" d="M12 2C8.134 2 5 5.134 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.866-3.134-7-7-7zm0 9.5A2.5 2.5 0 1112 6.5a2.5 2.5 0 010 5z"/>`,
  fb:     ()            => `<rect x="1" y="1" width="22" height="22" rx="5" fill="#1877f2"/><path fill="#fff" d="M15.12 12H13v7h-3v-7H8.5V9.5H10V8c0-2.07 1.24-3.2 3.1-3.2.9 0 1.9.07 1.9.07V7.5h-1.06c-1.04 0-1.34.65-1.34 1.32V9.5h2.28L15.12 12z"/>`,
  gmail:  ()            => `<rect x="2" y="4" width="20" height="16" rx="2" fill="none" stroke="#EA4335" stroke-width="1.8"/><polyline points="2,5 12,13 22,5" fill="none" stroke="#EA4335" stroke-width="2.2" stroke-linejoin="round"/>`,
  heart:  (c="#ec4899") => `<path fill="${c}" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.27 2 8.5 2 5.41 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.08C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.41 22 8.5c0 3.77-3.4 6.86-8.55 11.53L12 21.35z"/>`,
  chat:   (c="#ec4899") => `<path fill="none" stroke="${c}" stroke-width="2" d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>`,
  pad:    (c="#10b981") => `<rect x="2" y="6" width="20" height="12" rx="5" fill="none" stroke="${c}" stroke-width="2"/><line x1="8" y1="9" x2="8" y2="15" stroke="${c}" stroke-width="2" stroke-linecap="round"/><line x1="5" y1="12" x2="11" y2="12" stroke="${c}" stroke-width="2" stroke-linecap="round"/><circle cx="15" cy="10" r="1.5" fill="${c}"/><circle cx="17" cy="13" r="1.5" fill="${c}"/>`,
  lap:    (c="#3b82f6") => `<rect x="2" y="4" width="20" height="14" rx="2" fill="none" stroke="${c}" stroke-width="2"/><line x1="1" y1="20" x2="23" y2="20" stroke="${c}" stroke-width="2" stroke-linecap="round"/><rect x="6" y="7" width="12" height="8" rx="1" fill="${c}" opacity="0.3"/>`,
  robot:  (c="#00d2ff") => `<rect x="5" y="8" width="14" height="11" rx="2" fill="none" stroke="${c}" stroke-width="2"/><rect x="9" y="3" width="6" height="4" rx="1" fill="none" stroke="${c}" stroke-width="1.8"/><line x1="12" y1="7" x2="12" y2="8" stroke="${c}" stroke-width="2"/><circle cx="9" cy="13" r="1.5" fill="${c}"/><circle cx="15" cy="13" r="1.5" fill="${c}"/><line x1="9" y1="16" x2="15" y2="16" stroke="${c}" stroke-width="1.5" stroke-linecap="round"/><line x1="2" y1="11" x2="5" y2="11" stroke="${c}" stroke-width="2" stroke-linecap="round"/><line x1="19" y1="11" x2="22" y2="11" stroke="${c}" stroke-width="2" stroke-linecap="round"/>`,
  bolt:   (c="#fbbf24") => `<polygon fill="${c}" points="13,2 4.5,13.5 11,13.5 11,22 19.5,10.5 13,10.5"/>`,
  shield: (c="#8b5cf6") => `<path fill="none" stroke="${c}" stroke-width="2" d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.5C16.5 22.15 20 17.25 20 12V6L12 2z"/><polyline points="8,12 11,15 16,9" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
  rocket: (c="#06b6d4") => `<path fill="${c}" d="M12 2C8 2 5 8 5 14l2 2 1-3h8l1 3 2-2c0-6-3-12-7-12z"/><path fill="${c}" opacity="0.6" d="M9 16l-2 4h10l-2-4H9z"/><circle cx="12" cy="10" r="2" fill="#fff" opacity="0.8"/>`,
  code:   (c="#fbbf24") => `<polyline points="16,18 22,12 16,6" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><polyline points="8,6 2,12 8,18" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
  inf:    (c="#10b981") => `<path fill="none" stroke="${c}" stroke-width="2.5" stroke-linecap="round" d="M12 12c-2-2.5-4-4-6-4a4 4 0 000 8c2 0 4-1.5 6-4zm0 0c2 2.5 4 4 6 4a4 4 0 000-8c-2 0-4 1.5-6 4z"/>`,
  check:  (c="#6ee7b7") => `<polyline points="20,6 9,17 4,12" fill="none" stroke="${c}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`,
  star:   (c="#fbbf24") => `<polygon fill="${c}" points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>`,
  fire:   ()            => `<path fill="#f97316" d="M12 2c0 3-3 5-3 8a3 3 0 006 0c0-3-3-5-3-8z"/><path fill="#fbbf24" d="M12 8c0 2-2 3.5-2 5a2 2 0 004 0c0-1.5-2-3-2-5z"/>`,
};

/* ════════════════════════════════════════════════
   DRAW UTILS
════════════════════════════════════════════════ */
function rr(ctx, x, y, w, h, r = CR) {
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath();
}
function T(ctx, s, x, y, font, color, align="left", base="alphabetic", glow=0) {
  ctx.save(); ctx.font=font; ctx.fillStyle=color; ctx.textAlign=align; ctx.textBaseline=base;
  if(glow){ctx.shadowColor=color; ctx.shadowBlur=glow;} ctx.fillText(s,x,y); ctx.restore();
}

/* ════════════════════════════════════════════════
   BACKGROUND
════════════════════════════════════════════════ */
function drawBg(ctx, H) {
  ctx.fillStyle="#07091a"; ctx.fillRect(0,0,W,H);
  const r1=ctx.createRadialGradient(W/2,100,0,W/2,100,320);
  r1.addColorStop(0,"rgba(90,20,200,0.26)"); r1.addColorStop(1,"transparent");
  ctx.fillStyle=r1; ctx.fillRect(0,0,W,H);
  const r2=ctx.createRadialGradient(W/2,H-60,0,W/2,H-60,240);
  r2.addColorStop(0,"rgba(0,200,255,0.12)"); r2.addColorStop(1,"transparent");
  ctx.fillStyle=r2; ctx.fillRect(0,0,W,H);
  ctx.save(); ctx.strokeStyle="rgba(80,40,180,0.07)"; ctx.lineWidth=0.7;
  const S=26;
  for(let row=0;row<Math.ceil(H/(S*1.5))+2;row++){
    for(let col=0;col<Math.ceil(W/(S*1.73))+2;col++){
      const cx=col*S*1.73+(row%2?S*0.87:0),cy=row*S*1.5;
      ctx.beginPath();
      for(let i=0;i<6;i++){const a=(Math.PI/3)*i-Math.PI/6;i===0?ctx.moveTo(cx+S*Math.cos(a),cy+S*Math.sin(a)):ctx.lineTo(cx+S*Math.cos(a),cy+S*Math.sin(a));}
      ctx.closePath(); ctx.stroke();
    }
  }
  ctx.restore();
}

/* ════════════════════════════════════════════════
   FRAME
════════════════════════════════════════════════ */
async function drawFrame(ctx, H) {
  const lg=ctx.createLinearGradient(0,0,W,H);
  lg.addColorStop(0,"#a020f0"); lg.addColorStop(0.5,"#00eeff"); lg.addColorStop(1,"#a020f0");
  ctx.save(); rr(ctx,5,5,W-10,H-10,16);
  ctx.strokeStyle=lg; ctx.lineWidth=2.5; ctx.shadowColor="#a020f0"; ctx.shadowBlur=18; ctx.stroke(); ctx.restore();
  ctx.save(); rr(ctx,9,9,W-18,H-18,13);
  ctx.strokeStyle="rgba(160,80,255,0.18)"; ctx.lineWidth=1; ctx.stroke(); ctx.restore();
  [[PAD+4,PAD+4,1,1],[W-PAD-4,PAD+4,-1,1],[PAD+4,H-PAD-4,1,-1],[W-PAD-4,H-PAD-4,-1,-1]].forEach(([cx,cy,sx,sy])=>{
    ctx.save(); ctx.strokeStyle="#ffd700"; ctx.lineWidth=2.5; ctx.shadowColor="#ffd700"; ctx.shadowBlur=12;
    ctx.beginPath(); ctx.moveTo(cx+sx*22,cy); ctx.lineTo(cx,cy); ctx.lineTo(cx,cy+sy*22); ctx.stroke(); ctx.restore();
  });
  const cW=42,cH=22,cR=4;
  for(const[cx,cy] of [[PAD+6,PAD+6],[W-PAD-6-cW,PAD+6]]){
    ctx.save(); rr(ctx,cx,cy,cW,cH,cR); ctx.fillStyle="rgba(255,215,0,0.12)"; ctx.fill();
    ctx.strokeStyle="#ffd700cc"; ctx.lineWidth=1; ctx.stroke(); ctx.restore();
    T(ctx,"01F",cx+cW/2,cy+8,"bold 8px monospace","#ffd700","center");
    T(ctx,"451",cx+cW/2,cy+17,"bold 8px monospace","#ffd700","center");
  }
  await ic(ctx,I.crown(),58,48,22);
  await ic(ctx,I.crown(),W-58,48,22);
}

/* ════════════════════════════════════════════════
   TITLE  — properly centered on one line
════════════════════════════════════════════════ */
function drawTitle(ctx) {
  const ty=PAD+26;
  ctx.save();
  ctx.font="bold 26px Arial";
  const w1=ctx.measureText("OWNER ").width;
  const w2=ctx.measureText("INFORMATION").width;
  const sx=(W-(w1+w2))/2;
  ctx.textAlign="left"; ctx.textBaseline="middle";
  ctx.fillStyle="#ffffff"; ctx.shadowColor="#a020f0"; ctx.shadowBlur=22;
  ctx.fillText("OWNER ",sx,ty);
  const ig=ctx.createLinearGradient(sx+w1,ty-14,sx+w1+w2,ty+14);
  ig.addColorStop(0,"#d946ef"); ig.addColorStop(1,"#06b6d4");
  ctx.fillStyle=ig; ctx.shadowColor="#d946ef"; ctx.shadowBlur=18;
  ctx.fillText("INFORMATION",sx+w1,ty);
  ctx.restore();
  T(ctx,"• • •  OFFICIAL OWNER PROFILE  • • •",W/2,ty+20,"10px Arial","rgba(140,160,200,0.7)","center");
}

/* ════════════════════════════════════════════════
   AVATAR BLOCK
════════════════════════════════════════════════ */
async function drawAvatarBlock(ctx, avatarImg) {
  const AR=54, ACX=PAD+14+AR, ACY=76+AR;
  // rings
  for(const[r,a,lw,col] of [[AR+22,0.10,1,"#a020f0"],[AR+14,0.28,1,"#00d2ff"],[AR+7,0.55,1.5,"#00d2ff"],[AR+2,0.90,2.5,"#00d2ff"]]){
    ctx.save(); ctx.beginPath(); ctx.arc(ACX,ACY,r,0,Math.PI*2);
    ctx.strokeStyle=col; ctx.globalAlpha=a; ctx.lineWidth=lw; ctx.shadowColor=col; ctx.shadowBlur=lw>2?14:5; ctx.stroke(); ctx.restore();
  }
  for(let i=0;i<8;i++){
    const a=(i/8)*Math.PI*2;
    ctx.save(); ctx.beginPath(); ctx.arc(ACX+Math.cos(a)*(AR+14),ACY+Math.sin(a)*(AR+14),3,0,Math.PI*2);
    ctx.fillStyle=i%2?"#a020f0":"#00d2ff"; ctx.shadowColor=i%2?"#a020f0":"#00d2ff"; ctx.shadowBlur=10; ctx.fill(); ctx.restore();
  }
  // avatar
  ctx.save(); ctx.beginPath(); ctx.arc(ACX,ACY,AR,0,Math.PI*2); ctx.clip();
  if(avatarImg){
    ctx.drawImage(avatarImg,ACX-AR,ACY-AR,AR*2,AR*2);
  } else {
    const g=ctx.createRadialGradient(ACX,ACY,0,ACX,ACY,AR);
    g.addColorStop(0,"#1e1060"); g.addColorStop(1,"#080420");
    ctx.fillStyle=g; ctx.fillRect(ACX-AR,ACY-AR,AR*2,AR*2);
    await ic(ctx,I.user("#7080c0"),ACX,ACY,60);
  }
  ctx.restore();
  // crown pill
  const pW=52,pH=22,pX=ACX-pW/2,pY=ACY+AR-4;
  ctx.save(); rr(ctx,pX,pY,pW,pH,11); ctx.fillStyle="#5800b8"; ctx.shadowColor="#a020f0"; ctx.shadowBlur=14; ctx.fill();
  ctx.strokeStyle="#b050ff"; ctx.lineWidth=1.5; ctx.stroke(); ctx.restore();
  await ic(ctx,I.crown(),ACX,pY+11,16);
  // name
  const NX=ACX+AR*2+24,NY=ACY-AR+4;
  ctx.save(); ctx.font="bold 22px Arial";
  const ng=ctx.createLinearGradient(NX,NY,NX+190,NY+50);
  ng.addColorStop(0,"#22d3ee"); ng.addColorStop(1,"#a5f3fc");
  ctx.fillStyle=ng; ctx.textAlign="left"; ctx.textBaseline="alphabetic"; ctx.shadowColor="#06b6d4"; ctx.shadowBlur=18;
  ctx.fillText("JAHIDUL ISLAM",NX,NY+22); ctx.fillText("SAGOR",NX,NY+48); ctx.restore();
  // role badge
  const rbX=NX,rbY=NY+54,rbW=198,rbH=22;
  ctx.save(); rr(ctx,rbX,rbY,rbW,rbH,11); ctx.fillStyle="rgba(100,0,200,0.55)"; ctx.fill();
  ctx.strokeStyle="#8020d0"; ctx.lineWidth=1.5; ctx.shadowColor="#a020f0"; ctx.shadowBlur=8; ctx.stroke(); ctx.restore();
  await ic(ctx,I.shield("#d0a0ff"),rbX+14,rbY+11,14);
  T(ctx,"BOT DEVELOPER & OWNER",rbX+26,rbY+11,"bold 9px Arial","#d0a0ff","left","middle");
  // info rows
  const rows=[
    {svg:I.user("#818cf8"),   label:"NAME",    val:OWNER.name,    col:"#818cf8"},
    {svg:I.cal("#34d399"),    label:"AGE",     val:OWNER.age,     col:"#34d399"},
    {svg:I.globe("#60a5fa"),  label:"COUNTRY", val:OWNER.country, col:"#60a5fa"},
    {svg:I.pin("#f472b6"),    label:"CITY",    val:OWNER.city,    col:"#f472b6"},
  ];
  const rX=NX,rY0=rbY+28,rW=W-NX-PAD-6,rH=31,rG=35;
  for(let i=0;i<rows.length;i++){
    const d=rows[i],ry=rY0+i*rG;
    ctx.save(); rr(ctx,rX,ry,rW,rH,7); ctx.fillStyle="rgba(255,255,255,0.04)"; ctx.fill();
    ctx.strokeStyle="rgba(255,255,255,0.09)"; ctx.lineWidth=1; ctx.stroke(); ctx.restore();
    ctx.save(); rr(ctx,rX+3,ry+3,25,25,5); ctx.fillStyle=d.col+"22"; ctx.fill(); ctx.restore();
    await ic(ctx,d.svg,rX+15,ry+15,14);
    ctx.fillStyle=d.col+"55"; ctx.fillRect(rX+31,ry+5,1.5,21);
    T(ctx,d.label,rX+37,ry+11,"bold 9px Arial",d.col);
    T(ctx,d.val,  rX+37,ry+24,"11px Arial","#d1d5db");
  }
  return rY0+rows.length*rG+4;
}

/* ════════════════════════════════════════════════
   DIVIDER
════════════════════════════════════════════════ */
function divider(ctx,y,label,c1="#a020f0",c2="#00d2ff"){
  const M=W/2;
  const gl=ctx.createLinearGradient(PAD+10,y,M-82,y); gl.addColorStop(0,"transparent"); gl.addColorStop(1,c1);
  ctx.save(); ctx.strokeStyle=gl; ctx.lineWidth=1.5; ctx.shadowColor=c1; ctx.shadowBlur=6;
  ctx.beginPath(); ctx.moveTo(PAD+10,y); ctx.lineTo(M-82,y); ctx.stroke();
  const gr=ctx.createLinearGradient(M+82,y,W-PAD-10,y); gr.addColorStop(0,c2); gr.addColorStop(1,"transparent");
  ctx.strokeStyle=gr; ctx.beginPath(); ctx.moveTo(M+82,y); ctx.lineTo(W-PAD-10,y); ctx.stroke(); ctx.restore();
  [M-82,M+82].forEach(dx=>{
    ctx.save(); ctx.translate(dx,y); ctx.rotate(Math.PI/4);
    ctx.fillStyle=c1; ctx.shadowColor=c1; ctx.shadowBlur=8; ctx.fillRect(-3,-3,6,6); ctx.restore();
  });
  const tg=ctx.createLinearGradient(M-70,y-8,M+70,y+8); tg.addColorStop(0,c1); tg.addColorStop(1,c2);
  T(ctx,`+ ${label} +`,M,y+4,"bold 11px Arial",tg,"center","middle",14);
}

/* ════════════════════════════════════════════════
   SOCIAL CARDS
════════════════════════════════════════════════ */
async function drawSocial(ctx,y){
  const cW=(W-PAD*2-10)/2,cH=52;
  const cards=[
    {x:PAD,       svg:I.fb(),    name:"FACEBOOK",handle:OWNER.facebook,col:"#2563eb"},
    {x:PAD+cW+10, svg:I.gmail(), name:"GMAIL",   handle:OWNER.gmail,   col:"#dc2626"},
  ];
  for(const c of cards){
    ctx.save(); rr(ctx,c.x,y,cW,cH,CR); ctx.fillStyle="rgba(255,255,255,0.04)"; ctx.fill();
    ctx.strokeStyle=c.col+"66"; ctx.lineWidth=1.5; ctx.shadowColor=c.col; ctx.shadowBlur=10; ctx.stroke(); ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.arc(c.x+28,y+cH/2,18,0,Math.PI*2);
    ctx.fillStyle=c.col+"22"; ctx.fill(); ctx.strokeStyle=c.col+"88"; ctx.lineWidth=1.5; ctx.shadowColor=c.col; ctx.shadowBlur=10; ctx.stroke(); ctx.restore();
    await ic(ctx,c.svg,c.x+28,y+cH/2,22);
    T(ctx,c.name,  c.x+53,y+cH/2-8, "bold 12px Arial",c.col,"left","middle",8);
    T(ctx,c.handle,c.x+53,y+cH/2+10,"10px Arial","rgba(180,200,240,0.8)","left","middle");
    await ic(ctx,I.check(),c.x+cW-18,y+cH/2,14);
  }
  return y+cH+10;
}

/* ════════════════════════════════════════════════
   STATUS BADGES
════════════════════════════════════════════════ */
async function drawStatus(ctx,y){
  const bW=(W-PAD*2-12)/3,bH=70;
  const b=[
    {svg:I.chat(),  label:"RELATIONSHIP",val:OWNER.relationship,col:"#ec4899"},
    {svg:I.pad(),   label:"HOBBY",        val:OWNER.hobby,       col:"#10b981"},
    {svg:I.lap(),   label:"PROFESSION",   val:OWNER.profession,  col:"#3b82f6"},
  ];
  for(let i=0;i<b.length;i++){
    const d=b[i],bx=PAD+i*(bW+6);
    ctx.save(); rr(ctx,bx,y,bW,bH,CR); ctx.fillStyle=d.col+"18"; ctx.fill();
    ctx.strokeStyle=d.col+"66"; ctx.lineWidth=1.5; ctx.shadowColor=d.col; ctx.shadowBlur=10; ctx.stroke(); ctx.restore();
    await ic(ctx,d.svg,bx+bW/2,y+20,24);
    T(ctx,d.label,bx+bW/2,y+37,"bold 9px Arial",d.col,"center","middle",8);
    const words=d.val.split(" ");
    if(words.length>1&&d.val.length>12){
      T(ctx,words[0],             bx+bW/2,y+51,"9px Arial","#cbd5e1","center","middle");
      T(ctx,words.slice(1).join(" "),bx+bW/2,y+62,"9px Arial","#cbd5e1","center","middle");
    } else {
      T(ctx,d.val,bx+bW/2,y+55,"9.5px Arial","#cbd5e1","center","middle");
    }
  }
  return y+bH+10;
}

/* ════════════════════════════════════════════════
   BOT INFO
════════════════════════════════════════════════ */
async function drawBotInfo(ctx,y){
  const bH=74,bW=W-PAD*2;
  ctx.save(); rr(ctx,PAD,y,bW,bH,CR);
  const bg=ctx.createLinearGradient(PAD,y,PAD+bW,y+bH);
  bg.addColorStop(0,"rgba(0,180,220,0.09)"); bg.addColorStop(1,"rgba(120,60,240,0.09)");
  ctx.fillStyle=bg; ctx.fill(); ctx.restore();
  const lg=ctx.createLinearGradient(PAD,y,PAD+bW,y+bH);
  lg.addColorStop(0,"#00d2ff"); lg.addColorStop(0.5,"#a020f0"); lg.addColorStop(1,"#00d2ff");
  ctx.save(); rr(ctx,PAD,y,bW,bH,CR); ctx.strokeStyle=lg; ctx.lineWidth=1.8; ctx.shadowColor="#00d2ff"; ctx.shadowBlur=12; ctx.stroke(); ctx.restore();
  ctx.save(); ctx.beginPath(); ctx.arc(PAD+36,y+bH/2,24,0,Math.PI*2);
  ctx.fillStyle="rgba(0,200,255,0.12)"; ctx.fill(); ctx.strokeStyle="#00d2ff"; ctx.lineWidth=1.5; ctx.shadowColor="#00d2ff"; ctx.shadowBlur=12; ctx.stroke(); ctx.restore();
  await ic(ctx,I.robot(),PAD+36,y+bH/2,28);
  T(ctx,"BOT NAME",PAD+66,y+20,"9px Arial","rgba(148,163,184,0.7)");
  const ng=ctx.createLinearGradient(PAD+66,y+28,PAD+220,y+56);
  ng.addColorStop(0,"#e0f2fe"); ng.addColorStop(1,"#38bdf8");
  ctx.save(); ctx.font="bold 20px Arial"; ctx.textAlign="left"; ctx.textBaseline="alphabetic";
  ctx.fillStyle=ng; ctx.shadowColor="#06b6d4"; ctx.shadowBlur=14; ctx.fillText("SAGOR BOT",PAD+66,y+58); ctx.restore();
  ctx.fillStyle="rgba(255,255,255,0.14)"; ctx.fillRect(W/2,y+10,1.5,bH-20);
  ctx.save(); ctx.beginPath(); ctx.arc(W/2+32,y+bH/2,22,0,Math.PI*2);
  ctx.fillStyle="rgba(251,191,36,0.12)"; ctx.fill(); ctx.strokeStyle="#fbbf24"; ctx.lineWidth=1.5; ctx.shadowColor="#fbbf24"; ctx.shadowBlur=12; ctx.stroke(); ctx.restore();
  await ic(ctx,I.bolt(),W/2+32,y+bH/2,22);
  T(ctx,"BOT VERSION",W/2+60,y+20,"9px Arial","rgba(148,163,184,0.7)");
  const vg=ctx.createLinearGradient(W/2+60,y+28,W-PAD-10,y+58);
  vg.addColorStop(0,"#fef9c3"); vg.addColorStop(1,"#fbbf24");
  ctx.save(); ctx.font="bold 22px Arial"; ctx.textAlign="left"; ctx.textBaseline="alphabetic";
  ctx.fillStyle=vg; ctx.shadowColor="#fbbf24"; ctx.shadowBlur=14; ctx.fillText("V5.0.0",W/2+60,y+58); ctx.restore();
  return y+bH+8;
}

/* ════════════════════════════════════════════════
   TRUST BADGES
════════════════════════════════════════════════ */
async function drawBadges(ctx,y){
  const bH=54,bW=(W-PAD*2-18)/4;
  const b=[
    {svg:I.shield(),top:"100%",bot:"TRUSTED",  col:"#8b5cf6"},
    {svg:I.rocket(),top:"24/7",bot:"ONLINE",   col:"#06b6d4"},
    {svg:I.code(),  top:"100%",bot:"DEDICATED",col:"#fbbf24"},
    {svg:I.inf(),   top:"∞",   bot:"SUPPORT",  col:"#10b981"},
  ];
  for(let i=0;i<b.length;i++){
    const d=b[i],bx=PAD+i*(bW+6);
    ctx.save(); rr(ctx,bx,y,bW,bH,CR); ctx.fillStyle="rgba(0,0,0,0.35)"; ctx.fill();
    ctx.strokeStyle=d.col+"99"; ctx.lineWidth=1.8; ctx.shadowColor=d.col; ctx.shadowBlur=10; ctx.stroke(); ctx.restore();
    await ic(ctx,d.svg,bx+bW/2,y+17,20);
    const tg=ctx.createLinearGradient(bx,y+30,bx+bW,y+42); tg.addColorStop(0,d.col); tg.addColorStop(1,"#ffffff");
    ctx.save(); ctx.font="bold 10px Arial"; ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.fillStyle=tg; ctx.shadowColor=d.col; ctx.shadowBlur=8; ctx.fillText(d.top,bx+bW/2,y+33); ctx.restore();
    T(ctx,d.bot,bx+bW/2,y+45,"8.5px Arial",d.col,"center","middle");
  }
  return y+bH+8;
}

/* ════════════════════════════════════════════════
   FOOTER
════════════════════════════════════════════════ */
async function drawFooter(ctx,y){
  await ic(ctx,I.heart("#f43f5e"),PAD+12,y+14,20);
  await ic(ctx,I.heart("#f43f5e"),W-PAD-12,y+14,20);
  await ic(ctx,I.star(),PAD+34,y+14,14);
  await ic(ctx,I.star(),W-PAD-34,y+14,14);
  const tg=ctx.createLinearGradient(W/2-140,y,W/2+140,y+28);
  tg.addColorStop(0,"#f9a8d4"); tg.addColorStop(0.25,"#c084fc"); tg.addColorStop(0.6,"#67e8f9"); tg.addColorStop(1,"#86efac");
  ctx.save(); ctx.font="bold 17px Arial"; ctx.textAlign="center"; ctx.textBaseline="middle";
  ctx.fillStyle=tg; ctx.shadowColor="#a855f7"; ctx.shadowBlur=20; ctx.fillText("THANKS FOR USING MY BOT",W/2,y+14); ctx.restore();
  const pwY=y+38;
  await ic(ctx,I.fire(),PAD+22,pwY,16); await ic(ctx,I.fire(),W-PAD-22,pwY,16);
  const pwW=80,pwH=16;
  ctx.save(); rr(ctx,W/2-78,pwY-8,pwW,pwH,4); ctx.fillStyle="rgba(60,60,100,0.7)"; ctx.fill();
  ctx.strokeStyle="#6060a0"; ctx.lineWidth=1; ctx.stroke(); ctx.restore();
  T(ctx,"POWERED BY",W/2-38,pwY,"bold 8px monospace","#9090c0","center","middle");
  const nwW=132,nwH=16;
  ctx.save(); rr(ctx,W/2+2,pwY-8,nwW,nwH,4); ctx.fillStyle="rgba(60,60,100,0.7)"; ctx.fill();
  ctx.strokeStyle="#6060a0"; ctx.lineWidth=1; ctx.stroke(); ctx.restore();
  const npg=ctx.createLinearGradient(W/2+2,pwY,W/2+2+nwW,pwY);
  npg.addColorStop(0,"#fbbf24"); npg.addColorStop(1,"#f97316");
  ctx.save(); ctx.font="bold 8px monospace"; ctx.textAlign="center"; ctx.textBaseline="middle";
  ctx.fillStyle=npg; ctx.shadowColor="#fbbf24"; ctx.shadowBlur=6;
  ctx.fillText("JAHIDUL ISLAM SAGOR",W/2+2+nwW/2,pwY); ctx.restore();
}

/* ════════════════════════════════════════════════
   MASTER BUILD — dynamic height, no empty space
════════════════════════════════════════════════ */
async function buildCard(avatarImg) {
  // measure pass
  const tmp=createCanvas(W,2000); const tc=tmp.getContext("2d");
  let cur=await drawAvatarBlock(tc,avatarImg);
  cur+=10; divider(tc,cur,"S&C"); cur+=14; cur=await drawSocial(tc,cur);
  cur+=4;  divider(tc,cur,"S&I"); cur+=14; cur=await drawStatus(tc,cur);
  cur+=4;  divider(tc,cur,"BOT"); cur+=14; cur=await drawBotInfo(tc,cur);
  cur=await drawBadges(tc,cur);
  const H=cur+58+16; // footer height + bottom padding

  // real render
  const canvas=createCanvas(W,H); const ctx=canvas.getContext("2d");
  drawBg(ctx,H);
  await drawFrame(ctx,H);
  drawTitle(ctx);

  let y=await drawAvatarBlock(ctx,avatarImg);
  y+=10; divider(ctx,y,"SOCIAL & CONNECTS","#7c3aed","#06b6d4"); y+=14; y=await drawSocial(ctx,y);
  y+=4;  divider(ctx,y,"STATUS & INTERESTS","#ec4899","#fbbf24"); y+=14; y=await drawStatus(ctx,y);
  y+=4;  divider(ctx,y,"BOT INFORMATION","#06b6d4","#8b5cf6");    y+=14; y=await drawBotInfo(ctx,y);
  y=await drawBadges(ctx,y);
  await drawFooter(ctx,y);

  return canvas.toBuffer("image/png");
}

/* ════════════════════════════════════════════════
   COMMAND ENTRY
════════════════════════════════════════════════ */
module.exports.run = async function ({ api, event }) {
  try {
    const avatarImg = await loadAvatar(OWNER.uid);
    const buf       = await buildCard(avatarImg);
    const tmpPath   = path.join(__dirname, `owner_${Date.now()}.png`);
    fs.writeFileSync(tmpPath, buf);
    await api.sendMessage({ attachment: fs.createReadStream(tmpPath) }, event.threadID, event.messageID);
    try { fs.unlinkSync(tmpPath); } catch (_) {}
  } catch (err) {
    api.sendMessage(`❌ owner card error:\n${err.message}`, event.threadID, event.messageID);
  }
};
