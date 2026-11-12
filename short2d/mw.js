// 2D vector short engine: blocky characters, backgrounds, UI props, effects, kinetic captions. Everything is a pure function of time t (seconds).
const W = 1080, H = 1920, cv = document.getElementById('c'), ctx = cv.getContext('2d');
const C = {ink: '#24123f', deep: '#1b0d3a', purple: '#5b2bd6', violet: '#8a4dff', neon: '#d28bff', skin: '#ffc7a1', skin2: '#f0a77b', hairK: '#7a3b1b', hairM: '#a2451e', red: '#ff3b4e', yellow: '#ffd23f', green: '#3fe08a', blue: '#3aa7ff', white: '#ffffff', orange: '#ff8a2b', pink: '#ff6bd6'};
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const E = {out: t => 1 - (1 - t) * (1 - t), io: t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2, back: t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); }, in: t => t * t};
const lerp = (a, b, u) => a + (b - a) * u;
const rnd = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function fs(fill, lw = 10) { ctx.fillStyle = fill; ctx.fill(); if (lw) { ctx.lineWidth = lw; ctx.strokeStyle = C.ink; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke(); } }
function line(pts, lw = 10, col = C.ink) { ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.lineWidth = lw; ctx.strokeStyle = col; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(); }
function glow(col, blur) { ctx.shadowColor = col; ctx.shadowBlur = blur; }
function noglow() { ctx.shadowBlur = 0; ctx.shadowColor = 'transparent'; }

// ---------------------------------------------------------------- faces
const FACES = { // eye: open|wide|squint|closed|up ; mouth: smile|grin|o|flat|worry|smirk|shout ; brow: tilt in/out, y
  calm: {eye: 'open', mouth: 'smile', bl: 0, br: 0, by: 0}, focus: {eye: 'squint', mouth: 'flat', bl: 8, br: -8, by: 4},
  curious: {eye: 'wide', mouth: 'o', bl: -10, br: 14, by: -14}, shock: {eye: 'wide', mouth: 'shout', bl: -14, br: 14, by: -22},
  panic: {eye: 'wide', mouth: 'worry', bl: -22, br: 22, by: -16}, grin: {eye: 'open', mouth: 'grin', bl: -8, br: 8, by: -8},
  smirk: {eye: 'squint', mouth: 'smirk', bl: 14, br: -8, by: 0}, sad: {eye: 'open', mouth: 'worry', bl: -22, br: 22, by: 0}, joy: {eye: 'closed', mouth: 'grin', bl: -6, br: 6, by: -10}
};
function eye(x, y, s, type, look, lbl) {
  const rx = 44 * s, ry = (type === 'wide' ? 54 : type === 'open' ? 44 : type === 'squint' ? 20 : type === 'up' ? 44 : 6) * s;
  if (type === 'closed') { ctx.beginPath(); ctx.arc(x, y + 6 * s, 30 * s, Math.PI * 1.1, Math.PI * 1.9); ctx.lineWidth = 11 * s; ctx.strokeStyle = C.ink; ctx.lineCap = 'round'; ctx.stroke(); return; }
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); fs('#ffffff', 8 * s);
  const px = x + look[0] * 18 * s, py = y + look[1] * 12 * s, pr = (type === 'wide' ? 17 : 21) * s;
  ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI * 2); ctx.fillStyle = C.ink; ctx.fill();
  ctx.beginPath(); ctx.arc(px + 6 * s, py - 6 * s, 6 * s, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill();
}
function mouth(x, y, s, type, open) {
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (type === 'smile') { ctx.beginPath(); ctx.arc(x, y - 30 * s, 52 * s, Math.PI * 0.18, Math.PI * 0.82); ctx.lineWidth = 11 * s; ctx.strokeStyle = C.ink; ctx.stroke(); }
  else if (type === 'flat') line([[x - 40 * s, y + 6 * s], [x + 40 * s, y + 6 * s]], 11 * s);
  else if (type === 'smirk') { ctx.beginPath(); ctx.moveTo(x - 40 * s, y + 10 * s); ctx.quadraticCurveTo(x + 10 * s, y + 36 * s, x + 50 * s, y - 18 * s); ctx.lineWidth = 11 * s; ctx.strokeStyle = C.ink; ctx.stroke(); }
  else if (type === 'worry') { ctx.beginPath(); ctx.moveTo(x - 50 * s, y + 26 * s); ctx.quadraticCurveTo(x - 20 * s, y - 14 * s, x, y + 14 * s); ctx.quadraticCurveTo(x + 20 * s, y - 14 * s, x + 50 * s, y + 26 * s); ctx.lineWidth = 11 * s; ctx.strokeStyle = C.ink; ctx.stroke(); }
  else if (type === 'o') { ctx.beginPath(); ctx.ellipse(x, y + 8 * s, 24 * s, 30 * s * (0.8 + 0.2 * open), 0, 0, Math.PI * 2); fs('#7a1530', 9 * s); }
  else if (type === 'grin') { ctx.beginPath(); ctx.moveTo(x - 62 * s, y - 10 * s); ctx.quadraticCurveTo(x, y + 80 * s, x + 62 * s, y - 10 * s); ctx.closePath(); fs('#7a1530', 9 * s); ctx.beginPath(); ctx.moveTo(x - 46 * s, y - 4 * s); ctx.quadraticCurveTo(x, y + 18 * s, x + 46 * s, y - 4 * s); ctx.lineTo(x + 40 * s, y + 8 * s); ctx.quadraticCurveTo(x, y + 28 * s, x - 40 * s, y + 8 * s); ctx.closePath(); ctx.fillStyle = '#fff'; ctx.fill(); }
  else if (type === 'shout') { ctx.beginPath(); ctx.ellipse(x, y + 20 * s, 46 * s, (44 + 24 * open) * s, 0, 0, Math.PI * 2); fs('#7a1530', 9 * s); ctx.beginPath(); ctx.ellipse(x, y + (50 + 14 * open) * s, 28 * s, 16 * s, 0, 0, Math.PI * 2); ctx.fillStyle = '#ff6b7d'; ctx.fill(); }
}
// ---------------------------------------------------------------- blocky avatar (Roblox-style proportions: cube head, 2x2 torso, 1x2 arms and legs)
function shade(hex, k) { const n = parseInt(hex.slice(1), 16); const r = clamp(((n >> 16) & 255) * k, 0, 255), g = clamp(((n >> 8) & 255) * k, 0, 255), b = clamp((n & 255) * k, 0, 255); return `rgb(${r | 0},${g | 0},${b | 0})`; }
function block(x, y, w, h, r, col, lw = 7) {
  const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, shade(col, 1.14)); g.addColorStop(1, shade(col, 0.84));
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fillStyle = g; ctx.fill();
  ctx.save(); ctx.clip(); ctx.fillStyle = 'rgba(255,255,255,.17)'; ctx.fillRect(x, y, w * 0.16, h); ctx.fillStyle = 'rgba(0,0,40,.12)'; ctx.fillRect(x + w * 0.84, y, w * 0.16, h); ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(x, y, w, h * 0.06); ctx.restore();
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.lineWidth = lw; ctx.strokeStyle = C.ink; ctx.lineJoin = 'round'; ctx.stroke();
}
function dotEye(x, y, s, ry) { ctx.beginPath(); ctx.ellipse(x, y, 17 * s, ry * s, 0, 0, Math.PI * 2); ctx.fillStyle = C.ink; ctx.fill(); ctx.beginPath(); ctx.arc(x + 5 * s, y - ry * 0.45 * s, 6 * s, 0, 7); ctx.fillStyle = '#fff'; ctx.fill(); }
// kind 'kid' | 'mom'. o: {x,y,s,face,look,rot,t,body,legs,armL,armR,crown,sweat,open}
function character(kind, o) {
  const s = o.s || 1, k = 1.7 * s, f = FACES[o.face || 'calm'], look = o.look || [0, 0], t = o.t || 0, bob = Math.sin(t * 3 + (o.ph || 0)) * 4 * s;
  const skin = o.skin || (kind === 'kid' ? '#f6cf47' : '#e9b087'), shirt = o.shirt || (kind === 'kid' ? '#6a2fe0' : '#2db3a0'), pants = kind === 'kid' ? '#2b2f6e' : '#3b4a8f';
  ctx.save(); ctx.translate(o.x, o.y + bob); ctx.rotate((o.rot || 0) * Math.PI / 180);
  if (o.body !== false) {
    if (o.legs) { const lo = [o.ll || 0, o.lr || 0], LH = o.sit ? 120 : 200; [-1, 1].forEach((d, i) => { const yo = lo[i] * k; block((d < 0 ? -100 : 0) * k, 290 * k + yo, 100 * k, LH * k, 14 * k, pants); block(d * 50 * k - 50 * k + (o.sit ? d * 14 * k : 0), (250 + LH) * k + yo, 100 * k, 40 * k, 10 * k, '#f2f2f7'); }); }
    // torso
    block(-100 * k, 92 * k, 200 * k, 200 * k, 18 * k, shirt);
    ctx.save(); ctx.beginPath(); ctx.roundRect(-100 * k, 92 * k, 200 * k, 200 * k, 18 * k); ctx.clip();
    if (kind === 'kid') { ctx.fillStyle = 'rgba(255,255,255,.14)'; for (let i = 0; i < 4; i++) ctx.fillRect(-100 * k + i * 56 * k, 92 * k, 26 * k, 200 * k); glow(C.neon, 20 * s); ctx.font = `${130 * k}px Lilita`; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillText(o.logo || 'Z', 0, 245 * k); noglow(); ctx.lineWidth = 7; ctx.strokeStyle = C.ink; ctx.strokeText('Z', 0, 245 * k); }
    else { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(-42 * k, 92 * k); ctx.lineTo(0, 150 * k); ctx.lineTo(42 * k, 92 * k); ctx.closePath(); ctx.fill(); ctx.fillStyle = C.yellow; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(0, (180 + i * 36) * k, 8 * k, 0, 7); ctx.fill(); } }
    ctx.restore(); ctx.beginPath(); ctx.roundRect(-100 * k, 92 * k, 200 * k, 200 * k, 18 * k); ctx.lineWidth = 7; ctx.strokeStyle = C.ink; ctx.stroke();
    // arms (rotate around shoulder)
    [[-1, o.armL === undefined ? 6 : o.armL], [1, o.armR === undefined ? -6 : o.armR]].forEach(([d, ang]) => { ctx.save(); ctx.translate(d * 150 * k, 100 * k); ctx.rotate(ang * Math.PI / 180); block(-50 * k, 0, 100 * k, 150 * k, 14 * k, shirt); block(-50 * k, 150 * k, 100 * k, 70 * k, 14 * k, skin); ctx.restore(); });
  }
  // hair (back)
  if (kind === 'mom') { block(-104 * k, -92 * k, 208 * k, 150 * k, 34 * k, C.hairM); }
  // head: cube with slightly rounded corners
  block(-80 * k, -80 * k, 160 * k, 160 * k, 30 * k, skin, 8);
  // hair (front)
  if (kind === 'kid') { [[-80, 62, 40], [-52, 100, 42], [-8, 80, 40], [28, 112, 42], [58, 70, 40]].forEach(([hx, hh, hw]) => block(hx * k, (-80 - hh * 0.55) * k, hw * k, hh * 0.9 * k, 8 * k, o.hair || C.hairK, 6)); block(-84 * k, -86 * k, 168 * k, 44 * k, 14 * k, o.hair || C.hairK, 7); }
  else { block(-84 * k, -92 * k, 168 * k, 56 * k, 18 * k, C.hairM, 7); block(60 * k, -60 * k, 34 * k, 110 * k, 14 * k, C.hairM, 6); block(-94 * k, -60 * k, 34 * k, 110 * k, 14 * k, C.hairM, 6); block(-30 * k, -150 * k, 60 * k, 56 * k, 18 * k, C.hairM, 7); ctx.beginPath(); ctx.roundRect(-30 * k, -112 * k, 60 * k, 14 * k, 6 * k); ctx.fillStyle = C.red; ctx.fill(); }
  // face decal
  const ex = 38 * s * 1.7, ey = -4 * s * 1.7, fe = 1.7 * s * 0.72;
  const dot = (f.eye === 'open' || f.eye === 'squint');
  if (dot) { const ry = f.eye === 'squint' ? 12 : 28; dotEye(-ex, ey, fe * 1.0, ry); dotEye(ex, ey, fe * 1.0, ry); } else { eye(-ex, ey, fe, f.eye, look); eye(ex, ey, fe, f.eye, look); }
  const by = ey - 58 * fe + f.by * fe * 0.9; ctx.lineCap = 'round';
  line([[-ex - 28 * fe, by - f.bl * fe * 0.8], [-ex + 28 * fe, by + f.bl * fe * 0.8]], 13 * fe); line([[ex - 28 * fe, by - f.br * fe * 0.8], [ex + 28 * fe, by + f.br * fe * 0.8]], 13 * fe);
  mouth(0, 52 * k, fe * 0.95, f.mouth, o.open === undefined ? 0.5 + 0.5 * Math.sin(t * 22) : o.open);
  if (kind === 'kid' && !o.nophones) { // headphones
    ctx.lineWidth = 15 * s; ctx.strokeStyle = C.ink; ctx.beginPath(); ctx.arc(0, -10 * k, 100 * k, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke(); ctx.lineWidth = 7 * s; ctx.strokeStyle = '#3b3b5c'; ctx.beginPath(); ctx.arc(0, -10 * k, 100 * k, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
    [-1, 1].forEach(d => { block(d * 92 * k - 20 * k, -34 * k, 40 * k, 74 * k, 12 * k, '#2c2c4f', 7); glow(C.neon, 18); ctx.fillStyle = C.neon; ctx.fillRect(d * 92 * k - 6 * k, -14 * k, 12 * k, 34 * k); noglow(); });
  }
  if (o.crown) { ctx.beginPath(); ctx.moveTo(-70 * k, -90 * k); ctx.lineTo(-76 * k, -165 * k); ctx.lineTo(-36 * k, -134 * k); ctx.lineTo(0, -190 * k); ctx.lineTo(36 * k, -134 * k); ctx.lineTo(76 * k, -165 * k); ctx.lineTo(70 * k, -90 * k); ctx.closePath(); glow(C.yellow, 30); ctx.fillStyle = C.yellow; ctx.fill(); noglow(); ctx.lineWidth = 9; ctx.strokeStyle = C.ink; ctx.lineJoin = 'round'; ctx.stroke(); [-40, 0, 40].forEach(px => { ctx.beginPath(); ctx.arc(px * k, -128 * k, 8 * k, 0, 7); ctx.fillStyle = C.red; ctx.fill(); }); }
  if (o.sweat) { for (let i = 0; i < o.sweat; i++) { const p = ((t * 1.6 + i / o.sweat) % 1), sx = (i % 2 ? 1 : -1) * (150 + p * 60) * s, sy = (-90 + p * 220) * s; ctx.save(); ctx.translate(sx, sy); ctx.beginPath(); ctx.moveTo(0, -26 * s); ctx.quadraticCurveTo(24 * s, 8 * s, 0, 22 * s); ctx.quadraticCurveTo(-24 * s, 8 * s, 0, -26 * s); ctx.fillStyle = '#7fd1ff'; ctx.globalAlpha = 1 - p * 0.6; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = C.ink; ctx.stroke(); ctx.restore(); } }
  ctx.restore();
}
function hand(x, y, s, rot, pointing) { ctx.save(); ctx.translate(x, y); ctx.rotate(rot * Math.PI / 180); block(-44 * s, -50 * s, 88 * s, 100 * s, 14 * s, '#e9b087', 7); if (pointing) block(-16 * s, -140 * s, 32 * s, 100 * s, 10 * s, '#e9b087', 7); ctx.restore(); }

// ---------------------------------------------------------------- backgrounds / props
function room(t, o = {}) {
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#2b1260'); g.addColorStop(1, '#17082f'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // window with night city
  ctx.beginPath(); ctx.roundRect(560, 120, 440, 520, 24); fs('#1c2a6e', 10);
  for (let i = 0; i < 14; i++) { const bx = 575 + (i % 7) * 60, bh = 80 + rnd(i) * 220; ctx.fillStyle = i % 2 ? '#26398f' : '#2f46a8'; ctx.fillRect(bx, 630 - bh, 54, bh); ctx.fillStyle = '#ffd86a'; for (let k = 0; k < 4; k++) if (rnd(i * 5 + k) > .5) ctx.fillRect(bx + 8 + (k % 2) * 24, 630 - bh + 14 + Math.floor(k / 2) * 28, 14, 14); }
  ctx.fillStyle = '#fff'; for (let i = 0; i < 8; i++) { const a = 0.5 + 0.5 * Math.sin(t * 2 + i); ctx.globalAlpha = a; ctx.fillRect(590 + rnd(i) * 380, 150 + rnd(i + 9) * 150, 5, 5); } ctx.globalAlpha = 1;
  line([[780, 120], [780, 640]], 10); line([[560, 380], [1000, 380]], 10);
  // shelf + neon sign
  ctx.beginPath(); ctx.roundRect(40, 380, 460, 22, 8); fs('#3b2380', 8);
  glow(C.neon, 40); ctx.font = '86px Lilita'; ctx.textAlign = 'left'; ctx.fillStyle = '#fff'; ctx.fillText('LEVEL UP', 50, 210); noglow(); ctx.lineWidth = 3; ctx.strokeStyle = C.neon; ctx.strokeText('LEVEL UP', 50, 210);
  // trophy + plant
  ctx.beginPath(); ctx.roundRect(110, 250, 120, 130, 14); fs(C.yellow, 8); ctx.beginPath(); ctx.arc(300, 340, 36, 0, 7); fs('#3dd68c', 8); ctx.beginPath(); ctx.roundRect(274, 340, 52, 50, 10); fs('#a0613a', 8);
  // desk
  ctx.beginPath(); ctx.roundRect(-20, 1330, W + 40, 620, 10); fs('#3a1d82', 12); glow(C.violet, 30); ctx.fillStyle = C.violet; ctx.fillRect(-10, 1336, W + 20, 10); noglow();
}
function monitor(t, o = {}) { // o: x,y,s, screen:'game'|'admin'|'given', press:0..1, cursor:[x,y]
  const s = o.s || 1; ctx.save(); ctx.translate(o.x, o.y); ctx.scale(s, s);
  ctx.beginPath(); ctx.roundRect(-300, -250, 600, 430, 26); fs('#2a2150', 14);
  ctx.beginPath(); ctx.roundRect(-280, -230, 560, 390, 14); ctx.fillStyle = '#0d0a22'; ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.roundRect(-280, -230, 560, 390, 14); ctx.clip();
  if (o.screen === 'game') { const g = ctx.createLinearGradient(0, -230, 0, -20); g.addColorStop(0, '#5cc8ff'); g.addColorStop(1, '#d8f3ff'); ctx.fillStyle = g; ctx.fillRect(-280, -230, 560, 210);
    ctx.fillStyle = '#4fb04d'; ctx.fillRect(-280, -20, 560, 180); for (let i = 0; i < 4; i++) for (let k = 0; k < 9; k++) { ctx.beginPath(); ctx.ellipse(-250 + k * 66 + (i % 2) * 30, -4 + i * 40, 20, 8, 0, 0, 7); ctx.fillStyle = '#8be07a'; ctx.fill(); }
    for (let i = 0; i < 3; i++) { const px = ((i * 260 + t * 100) % 760) - 340; ctx.fillStyle = ['#ff6bd6', '#ffd23f', '#3a86ff'][i % 3]; ctx.beginPath(); ctx.roundRect(px, 30 + (i % 2) * 30, 120, 34, 6); fs(ctx.fillStyle, 5); }
    const jy = -Math.abs(Math.sin(t * 5)) * 80; ctx.save(); ctx.translate(-10, 20 + jy); block(-18, -90, 36, 36, 6, '#f6cf47', 4); block(-24, -52, 48, 52, 5, '#6a2fe0', 4); block(-24, 0, 22, 44, 5, '#2b2f6e', 4); block(2, 0, 22, 44, 5, '#2b2f6e', 4); ctx.restore(); }
  else { ctx.fillStyle = '#1a1442'; ctx.fillRect(-280, -230, 560, 390); ctx.fillStyle = '#2a1f6b'; ctx.fillRect(-280, -230, 560, 70); ctx.font = '40px Lilita'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillText(o.screen === 'given' ? 'ADMIN PANEL  ✔' : 'ADMIN PANEL', 0, -180);
    if (o.screen === 'admin') { const p = o.press || 0, pul = 1 + 0.04 * Math.sin(t * 9), sc = pul * (1 - 0.1 * p); ctx.save(); ctx.translate(0, 0); ctx.scale(sc, sc); glow(C.red, 40 + 30 * Math.abs(Math.sin(t * 6))); ctx.beginPath(); ctx.roundRect(-210, -70, 420, 140, 30); fs(p > 0.5 ? '#c4172b' : C.red, 10); noglow(); ctx.font = '70px Lilita'; ctx.fillStyle = '#fff'; ctx.lineWidth = 8; ctx.strokeStyle = C.ink; ctx.strokeText('GIVE ADMIN', 0, 24); ctx.fillText('GIVE ADMIN', 0, 24); ctx.restore(); }
    else { ctx.font = '84px Lilita'; ctx.fillStyle = C.green; ctx.fillText('ADMIN', 0, -30); ctx.fillText('GIVEN!', 0, 60); ctx.beginPath(); ctx.arc(-200, 100, 22, 0, 7); fs(C.yellow, 6); } }
  ctx.restore();
  // stand
  ctx.beginPath(); ctx.roundRect(-40, 180, 80, 70, 8); fs('#2a2150', 12); ctx.beginPath(); ctx.roundRect(-150, 240, 300, 34, 14); fs('#2a2150', 12);
  if (o.cursor) { const [cx, cy] = o.cursor; ctx.save(); ctx.translate(cx, cy); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 78); ctx.lineTo(20, 60); ctx.lineTo(40, 100); ctx.lineTo(56, 92); ctx.lineTo(36, 54); ctx.lineTo(62, 52); ctx.closePath(); fs('#fff', 8); ctx.restore(); }
  ctx.restore();
}
function keyboard(t, x, y, s = 1) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.beginPath(); ctx.roundRect(-330, 0, 660, 150, 24); fs('#241a52', 12); for (let r = 0; r < 3; r++) for (let k = 0; k < 11; k++) { const h = (t * 120 + k * 33 + r * 70) % 360; ctx.fillStyle = `hsl(${h},95%,62%)`; glow(`hsl(${h},95%,62%)`, 14); ctx.beginPath(); ctx.roundRect(-300 + k * 55, 18 + r * 40, 44, 30, 8); ctx.fill(); noglow(); } ctx.restore(); }

// ---------------------------------------------------------------- in-game world (generic blocky-platform look: baseplate with studs, bricks, HUD)
function baseplate(t, hy = 760, sx = 0) {
  const sky = ctx.createLinearGradient(0, 0, 0, hy); sky.addColorStop(0, '#5cc8ff'); sky.addColorStop(1, '#d8f3ff'); ctx.fillStyle = sky; ctx.fillRect(0, 0, W, hy);
  // clouds (blocky) + far hills
  ctx.fillStyle = 'rgba(255,255,255,.9)'; [[120, 160, 260], [640, 110, 300], [880, 260, 200]].forEach(([cx, cy, w], i) => { const x = ((cx + t * 14 * (i + 1) + 200) % (W + 500)) - 250; ctx.beginPath(); ctx.roundRect(x, cy, w, 54, 27); ctx.roundRect(x + 50, cy - 34, w * 0.5, 50, 25); ctx.fill(); });
  ctx.fillStyle = '#7fcf8a'; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.roundRect(i * 190 - 40, hy - 70 - (i % 3) * 38, 220, 120, 14); ctx.fill(); }
  const gr = ctx.createLinearGradient(0, hy, 0, H); gr.addColorStop(0, '#6cc35a'); gr.addColorStop(1, '#3e9a3c'); ctx.fillStyle = gr; ctx.fillRect(0, hy, W, H - hy);
  for (let i = 0; i < 12; i++) { const p = Math.pow(i / 11, 1.75), y = hy + 20 + (H - hy) * p, sc = 0.28 + 1.0 * p, sp = 150 * sc; for (let x = -sp + ((sx * sc) % sp); x < W + sp; x += sp) { ctx.beginPath(); ctx.ellipse(x, y, 34 * sc, 13 * sc, 0, 0, Math.PI * 2); ctx.fillStyle = '#8be07a'; ctx.fill(); ctx.lineWidth = 3 * sc; ctx.strokeStyle = 'rgba(20,70,30,.55)'; ctx.stroke(); } }
}
function brickTower(x, y, s, cols) { cols.forEach((c, i) => { block(x - 90 * s, y - (i + 1) * 70 * s, 180 * s, 70 * s, 8 * s, c, 6); [-45, 45].forEach(d => { ctx.beginPath(); ctx.ellipse(x + d * s, y - (i + 1) * 70 * s + 4 * s, 22 * s, 8 * s, 0, 0, 7); ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fill(); }); }); }
function tree(x, y, s) { block(x - 30 * s, y - 200 * s, 60 * s, 200 * s, 8 * s, '#8a5a2e', 6); [[-70, -250], [10, -330], [-30, -400]].forEach(([dx, dy], i) => block(x + dx * s - 60 * s, y + dy * s, 150 * s, 120 * s, 16 * s, i === 1 ? '#3cae52' : '#34a04a', 6)); }
function nametag(x, y, text, col = '#fff') { ctx.save(); ctx.font = '54px Lilita'; const w = ctx.measureText(text).width + 56; ctx.beginPath(); ctx.roundRect(x - w / 2, y - 48, w, 80, 20); ctx.fillStyle = 'rgba(15,10,40,.72)'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = col === '#fff' ? 'rgba(255,255,255,.4)' : col; ctx.stroke(); ctx.textAlign = 'center'; ctx.fillStyle = col; ctx.fillText(text, x, 10); ctx.restore(); }
function hud(t, o = {}) { ctx.save();
  ctx.beginPath(); ctx.roundRect(690, 50, 340, 210, 22); ctx.fillStyle = 'rgba(15,10,40,.6)'; ctx.fill(); ctx.font = '38px Lilita'; ctx.textAlign = 'left'; ctx.fillStyle = '#fff'; ctx.fillText('PLAYERS', 716, 98); ctx.fillStyle = C.yellow; ctx.fillText('MOM ★', 716, 150); ctx.fillStyle = '#cfd2ff'; ctx.fillText('KID', 716, 196); ctx.fillText('12', 960, 196); ctx.fillStyle = C.yellow; ctx.fillText('999', 940, 150);
  const msgs = o.chat || []; msgs.forEach((m, i) => { const a = clamp((t - m[0]) / 0.15); if (a <= 0) return; ctx.globalAlpha = a; ctx.beginPath(); ctx.roundRect(40, 60 + i * 78, 620, 66, 14); ctx.fillStyle = 'rgba(15,10,40,.6)'; ctx.fill(); ctx.font = '34px Lilita'; ctx.fillStyle = m[2] || '#fff'; ctx.fillText(m[1], 60, 105 + i * 78); ctx.globalAlpha = 1; });
  for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.roundRect(190 + i * 140, 1800, 120, 90, 16); ctx.fillStyle = 'rgba(15,10,40,.6)'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = i === 0 ? C.yellow : 'rgba(255,255,255,.35)'; ctx.stroke(); ctx.font = '30px Lilita'; ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.fillText(String(i + 1), 202 + i * 140, 1830); }
  ctx.restore(); }
// ---------------------------------------------------------------- effects
function speedLines(t, cx, cy, n = 36, col = '#ffffff', a = 0.55) { ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = col; ctx.lineCap = 'round'; for (let i = 0; i < n; i++) { const ang = i / n * Math.PI * 2 + rnd(i) * 0.2, r0 = 380 + rnd(i + 3) * 260 + ((t * 900) % 200), r1 = r0 + 400 + rnd(i + 8) * 300; ctx.lineWidth = 6 + rnd(i + 11) * 10; ctx.beginPath(); ctx.moveTo(cx + Math.cos(ang) * r0, cy + Math.sin(ang) * r0); ctx.lineTo(cx + Math.cos(ang) * r1, cy + Math.sin(ang) * r1); ctx.stroke(); } ctx.restore(); }
function burst(x, y, r, col, rot = 0) { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.beginPath(); for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2, rr_ = i % 2 ? r * 0.62 : r; ctx.lineTo(Math.cos(a) * rr_, Math.sin(a) * rr_); } ctx.closePath(); fs(col, 10); ctx.restore(); }
function confetti(t, t0, n = 70) { const u = t - t0; if (u < 0) return; for (let i = 0; i < n; i++) { const vx = (rnd(i) - 0.5) * 1200, vy = -600 - rnd(i + 5) * 900, px = W / 2 + vx * u * 0.6, py = 900 + vy * u + 1500 * u * u, rot = rnd(i + 2) * 6 + u * 8; if (py > H + 50) continue; ctx.save(); ctx.translate(px, py); ctx.rotate(rot); ctx.fillStyle = [C.yellow, C.pink, C.green, C.blue, C.orange][i % 5]; ctx.fillRect(-14, -8, 28, 16); ctx.restore(); } }
function flash(a) { if (a > 0) { ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.fillRect(0, 0, W, H); } }
function ripple(cx, cy, u) { if (u < 0 || u > 1) return; ctx.beginPath(); ctx.arc(cx, cy, 60 + u * 420, 0, 7); ctx.lineWidth = 22 * (1 - u); ctx.strokeStyle = `rgba(255,255,255,${1 - u})`; ctx.stroke(); }

let CAPS = [];
function captions(t) {
  const cap = CAPS.find(c => t >= c.t0 && t < c.t1); if (!cap) return;
  ctx.save(); ctx.font = '150px Lilita'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  const sp = 34, widths = cap.w.map(([w]) => ctx.measureText(w).width);
  let total = widths.reduce((a, b) => a + b, 0) + sp * (cap.w.length - 1), scale = Math.min(1, 980 / total), lines = [cap.w];
  if (total * scale < 700 && cap.w.length > 2) scale = 1;
  // wrap into two lines when too wide
  if (total > 980) { const half = Math.ceil(cap.w.length / 2); lines = [cap.w.slice(0, half), cap.w.slice(half)]; scale = 1; }
  let y = lines.length === 1 ? 1560 : 1470;
  lines.forEach(ln => {
    const wd = ln.map(([w]) => ctx.measureText(w).width), tw = wd.reduce((a, b) => a + b, 0) + sp * (ln.length - 1); let x = W / 2 - tw * scale / 2;
    ln.forEach(([w, tw0, col], i) => {
      const u = clamp((t - tw0) / 0.2), p = E.back(u), a = clamp((t - tw0) / 0.08), fade = clamp((cap.t1 - t) / 0.12);
      if (u > 0) { ctx.save(); ctx.globalAlpha = a * fade; ctx.translate(x + wd[i] * scale / 2, y - 55); ctx.rotate((1 - p) * -0.12); ctx.scale(scale * (0.3 + 0.7 * p), scale * (0.3 + 0.7 * p));
        ctx.lineWidth = 26; ctx.strokeStyle = C.ink; ctx.lineJoin = 'round'; ctx.textAlign = 'center'; ctx.strokeText(w, 0, 55); ctx.fillStyle = col; ctx.fillText(w, 0, 55); ctx.restore(); }
      x += (wd[i] + sp) * scale;
    });
    y += 160;
  });
  ctx.restore();
}

function cam(z0, z1, u, cx, cy, shake = 0, t = 0) { const z = lerp(z0, z1, E.out(u)); const sx = (rnd(Math.floor(t * 60) * 2) - .5) * shake, sy = (rnd(Math.floor(t * 60) * 2 + 1) - .5) * shake; ctx.translate(W / 2 + sx, H / 2 + sy); ctx.scale(z, z); ctx.translate(-cx, -cy); }

// ================================================================ MOM30 — "What if MOM let you play Roblox ONLY while the microwave runs?!"
let D = null;
const speaking = (who, t) => D.lines.some(L => L.who === who && t >= L.t0 && t <= L.t1);
const talkOpen = (who, t) => speaking(who, t) ? 0.5 + 0.5 * Math.sin(t * 22) : 0;
const sm01 = (t, a, b) => E.io(clamp((t - a) / (b - a)));
const TK = [[8.2, 30], [9.0, 29], [12, 24], [15, 20], [17.5, 18], [23.5, 12], [27, 7], [30, 4], [32.2, 0]];
function timerVal(t) { if (t <= TK[0][0]) return 30; for (let i = 1; i < TK.length; i++) if (t <= TK[i][0]) return lerp(TK[i - 1][1], TK[i][1], (t - TK[i - 1][0]) / (TK[i][0] - TK[i - 1][0])); return 0; }
function buildCaps() { const col = {mom: '#ffe0b8', hero: '#ffffff', bro: '#a8ffc0'}; CAPS = [];
  D.lines.forEach(L => { const words = L.text.split(' '), chunks = []; let cur = [];
    words.forEach(w => { const len = cur.join(' ').length + w.length; if (cur.length >= 3 || (cur.length && len > 17)) { chunks.push(cur); cur = []; } cur.push(w); }); if (cur.length) chunks.push(cur);
    const dur = L.t1 - L.t0 + 0.15, n = chunks.length;
    chunks.forEach((ch, j) => { const a = L.t0 + dur * j / n, b = j === n - 1 ? L.t1 + 0.25 : L.t0 + dur * (j + 1) / n - 0.02;
      CAPS.push({t0: a, t1: b, w: ch.map((w, i) => { const hot = /^[A-Z]{3,}[!?.,]*$/.test(w), clean = w.replace(/[!?.,]+$/, ''); return [w, a + i * Math.min(0.2, (b - a) / (ch.length + 0.5)), hot ? (clean === 'ONLY' || clean === 'FROZEN' || clean === 'SECONDS' ? C.red : C.yellow) : col[L.who]]; })}); }); }); }

// ---- props
function kitchen(t) {
  ctx.fillStyle = '#f3e3c1'; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(80,150,150,.35)'; ctx.lineWidth = 5; for (let x = 0; x < W + 100; x += 120) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 1330); ctx.stroke(); } for (let y = 0; y < 1330; y += 120) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  [[-20, 120], [340, 120], [700, 120]].forEach(([x, y]) => { ctx.beginPath(); ctx.roundRect(x, y, 330, 330, 18); fs('#3fa79f', 10); ctx.beginPath(); ctx.roundRect(x + 24, y + 24, 282, 282, 10); ctx.strokeStyle = 'rgba(0,0,0,.18)'; ctx.lineWidth = 6; ctx.stroke(); });
  ctx.beginPath(); ctx.arc(870, 610, 80, 0, 7); fs('#fff', 10); line([[870, 610], [870, 550]], 9); line([[870, 610], [915, 610]], 9);
  ctx.beginPath(); ctx.roundRect(-20, 1240, W + 40, 90, 10); fs('#f7f2e6', 10); ctx.beginPath(); ctx.roundRect(-20, 1330, W + 40, 360, 8); fs('#3fa79f', 12);
  [0, 1, 2].forEach(i => { ctx.beginPath(); ctx.roundRect(40 + i * 340, 1370, 300, 270, 14); ctx.fillStyle = '#379088'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = C.ink; ctx.stroke(); });
  const ck = ctx.createLinearGradient(0, 1690, 0, H); ctx.fillStyle = '#e8d8b4'; ctx.fillRect(0, 1690, W, H - 1690); for (let i = 0; i < 10; i++) for (let j = 0; j < 3; j++) if ((i + j) % 2) { ctx.fillStyle = '#b7d6d2'; ctx.fillRect(i * 120, 1690 + j * 80, 120, 80); } }
function microwave(t, o) { const s = o.s || 1; ctx.save(); ctx.translate(o.x, o.y); ctx.scale(s, s); const st = o.state, secs = Math.max(0, Math.ceil(o.secs || 0));
  if (st === 'run') { glow('#ffd23f', 50); } ctx.beginPath(); ctx.roundRect(-310, -200, 620, 400, 30); fs('#cfd5e3', 12); noglow();
  ctx.save(); ctx.beginPath(); ctx.roundRect(-270, -160, 400, 320, 18); ctx.clip();
  if (st === 'run') { const g = ctx.createRadialGradient(-70, 0, 20, -70, 0, 260); g.addColorStop(0, '#fff3a0'); g.addColorStop(1, '#ffa63a'); ctx.fillStyle = g; ctx.fillRect(-270, -160, 400, 320); }
  else if (st === 'open') { ctx.fillStyle = '#e8e2c8'; ctx.fillRect(-270, -160, 400, 320); } else { ctx.fillStyle = '#16202a'; ctx.fillRect(-270, -160, 400, 320); }
  if (st === 'run' || st === 'loaded') { ctx.beginPath(); ctx.ellipse(-70, 95, 160, 34, 0, 0, 7); ctx.fillStyle = '#fff'; ctx.fill(); ctx.beginPath(); ctx.ellipse(-70, 80, 128, 28, 0, 0, 7); ctx.fillStyle = '#f4b94a'; ctx.fill(); ctx.fillStyle = '#d8402f'; for (let i = 0; i < 6; i++) { const a = (st === 'run' ? t * 3 : 0) + i * 1.05; ctx.beginPath(); ctx.ellipse(-70 + Math.cos(a) * 78, 80 + Math.sin(a) * 12, 18, 6, 0, 0, 7); ctx.fill(); } }
  ctx.fillStyle = 'rgba(255,255,255,.14)'; ctx.beginPath(); ctx.moveTo(-250, -150); ctx.lineTo(-90, -150); ctx.lineTo(-190, 150); ctx.lineTo(-250, 150); ctx.fill(); ctx.restore(); ctx.beginPath(); ctx.roundRect(-270, -160, 400, 320, 18); ctx.lineWidth = 9; ctx.strokeStyle = C.ink; ctx.stroke();
  ctx.beginPath(); ctx.roundRect(160, -160, 130, 76, 10); fs('#0b1a10', 7); ctx.font = '60px Lilita'; ctx.textAlign = 'center'; ctx.fillStyle = st === 'run' ? '#5bff8a' : '#2f6a40'; ctx.fillText(st === 'done' ? 'END' : `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`, 225, -108);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) { ctx.beginPath(); ctx.roundRect(160 + c * 46, -60 + r * 52, 40, 42, 8); fs(o.press && r === 1 && c === 1 ? '#ff8a8a' : '#eef1f7', 5); }
  ctx.restore(); }
function pizza(x, y, s, rot = 0, frozen = false) { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); ctx.beginPath(); ctx.ellipse(0, 6, 150, 40, 0, 0, 7); fs('#fff', 8); ctx.beginPath(); ctx.ellipse(0, -2, 122, 32, 0, 0, 7); fs(frozen ? '#bfe9ff' : '#f4b94a', 8); ctx.fillStyle = '#d8402f'; [[-50, -4], [20, 6], [60, -8], [-10, -12], [-80, 4]].forEach(([px, py]) => { ctx.beginPath(); ctx.ellipse(px, py, 16, 6, 0, 0, 7); ctx.fill(); }); ctx.restore(); }
// obby (side-scroller, in-game look)
const NP = 14, PXW = i => i * 600, PTOP = i => 1180 + Math.sin(i * 1.7) * 50;
const obbyPath = s => { s = clamp(s, 0, NP - 1); let i = Math.floor(s), f = s - i; if (i >= NP - 1) { i = NP - 2; f = 1; } if (f < 0.3) return {x: PXW(i), y: PTOP(i), air: 0, f, i}; const u = (f - 0.3) / 0.7; return {x: lerp(PXW(i), PXW(i + 1), u), y: lerp(PTOP(i), PTOP(i + 1), u) - Math.sin(Math.PI * u) * 300, air: 1, f, i}; };
function obbyBG(t, camX, o = {}) {
  const sk = ctx.createLinearGradient(0, 0, 0, 1300); sk.addColorStop(0, '#3f86ff'); sk.addColorStop(1, '#ffd6b0'); ctx.fillStyle = sk; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(255,255,255,.9)'; [[100, 220, 260], [600, 150, 300], [900, 380, 200]].forEach(([cx, cy, w], i) => { const x = ((cx - camX * 0.1 * (i + 1) + 4000) % (W + 500)) - 250; ctx.beginPath(); ctx.roundRect(x, cy, w, 54, 27); ctx.roundRect(x + 50, cy - 34, w * 0.5, 50, 25); ctx.fill(); });
  for (let i = 0; i < 8; i++) { const x = ((i * 520 - camX * 0.4) % 4160 + 4160) % 4160 - 400, y = 520 + (i * 97) % 380; block(x, y, 260, 70, 14, '#59c46a', 6); block(x + 40, y + 70, 180, 90, 14, '#8a6a4a', 6); }
  // lava
  const lv = ctx.createLinearGradient(0, 1330, 0, H); lv.addColorStop(0, '#ff7a1a'); lv.addColorStop(1, '#c8201a'); ctx.fillStyle = lv; ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= W; x += 20) ctx.lineTo(x, 1330 + Math.sin(x * 0.02 + t * 3) * 16 + Math.sin(x * 0.05 - t * 2) * 8); ctx.lineTo(W, H); ctx.fill();
  ctx.fillStyle = '#ffd25a'; for (let i = 0; i < 12; i++) { const x = (i * 163 - camX * 0.9) % (W + 200); ctx.beginPath(); ctx.ellipse((x + W + 200) % (W + 200) - 100, 1420 + (i % 4) * 90 + Math.sin(t * 2 + i) * 10, 50, 14, 0, 0, 7); ctx.fill(); } }
function obbyWorld(t, camX, o = {}) { ctx.save(); ctx.translate(-camX, 0);
  for (let i = 0; i < NP; i++) { const last = i === NP - 1, w = last ? 520 : 340, x = PXW(i) - w / 2; if (x - camX > W + 100 || x + w - camX < -100) continue; block(x, PTOP(i), w, 70, 14, ['#ff5e7e', '#ffd23f', '#3fe08a', '#3a86ff', '#b06bff'][i % 5], 8); }
  [4, 8].forEach((i, k) => { ctx.save(); ctx.translate(PXW(i), PTOP(i) - 150); ctx.rotate(t * 2.6 + k); ctx.beginPath(); ctx.roundRect(-190, -16, 380, 32, 12); fs(C.red, 7); ctx.restore(); });
  if (o.hat) { const hx = PXW(6), hy = PTOP(6) - 330 + Math.sin(t * 4) * 16; ctx.save(); ctx.translate(hx, hy); glow(C.yellow, 40); ctx.beginPath(); ctx.moveTo(-50, 0); ctx.lineTo(-70, -60); ctx.lineTo(-24, -34); ctx.lineTo(0, -80); ctx.lineTo(24, -34); ctx.lineTo(70, -60); ctx.lineTo(50, 0); ctx.closePath(); fs(C.yellow, 7); noglow(); ctx.restore(); }
  if (o.chest) { const cx = PXW(NP - 1) + 120, cy = PTOP(NP - 1), op = o.chestOpen || 0; if (op > 0) { ctx.save(); ctx.globalAlpha = 0.5 * op; ctx.translate(cx, cy - 120); for (let i = 0; i < 12; i++) { ctx.rotate(Math.PI / 6); ctx.fillStyle = '#fff3a0'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-30, -420); ctx.lineTo(30, -420); ctx.fill(); } ctx.restore(); }
    block(cx - 110, cy - 130, 220, 130, 14, '#b8702a', 8); ctx.save(); ctx.translate(cx - 110, cy - 130); ctx.rotate(-op * 1.6); block(0, -60, 220, 60, 22, '#d08a38', 8); ctx.restore(); block(cx - 20, cy - 100, 40, 40, 8, C.yellow, 5); }
  ctx.restore(); }
function heroAt(t, p, o = {}) { const k = 0.55 * 1.7, ph = t * 14, run = !p.air; return character('kid', Object.assign({x: o.x ?? 360, y: p.y - 490 * k, s: 0.55, legs: true, t, rot: run ? Math.sin(ph) * 3 : -6, armL: run ? Math.sin(ph) * 60 : 150, armR: run ? -Math.sin(ph) * 60 : -150, ll: run ? Math.max(0, Math.sin(ph)) * -60 : -30, lr: run ? Math.max(0, -Math.sin(ph)) * -60 : 20}, o)); }

// ---- screen overlays
function outlined(txt, x, y, size, fill, lw = 24) { ctx.font = `${size}px Lilita`; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.lineJoin = 'round'; ctx.lineWidth = lw; ctx.strokeStyle = C.ink; ctx.strokeText(txt, x, y); ctx.fillStyle = fill; ctx.fillText(txt, x, y); }
const pop = (t, t0, d = 0.2) => { const u = clamp((t - t0) / d); return u <= 0 ? 0 : E.back(u); };
function timerHUD(t) { if (t < 8.2 || t > 32.8) return; const v = Math.max(0, Math.ceil(timerVal(t))), low = v <= 5, k = pop(t, 8.2, 0.25) * (low ? 1 + 0.06 * Math.sin(t * 18) : 1);
  ctx.save(); ctx.translate(W / 2, 175); ctx.scale(k, k); glow('#ff2a2a', 30); ctx.beginPath(); ctx.roundRect(-250, -85, 500, 170, 34); fs('#1a0a12', 0); ctx.lineWidth = 11; ctx.strokeStyle = low ? '#ff2a2a' : '#ff6a6a'; ctx.stroke(); noglow(); ctx.font = '150px Lilita'; ctx.textAlign = 'center'; ctx.fillStyle = low ? '#ff4a4a' : '#fff'; ctx.fillText('00:' + String(v).padStart(2, '0'), 0, 52); ctx.restore(); }
function hookText(t) { if (t > 4.4) return; const k = pop(t, 0.0, 0.25); const bg = ctx.createLinearGradient(0, 0, 0, 400); bg.addColorStop(0, 'rgba(20,8,50,.85)'); bg.addColorStop(1, 'rgba(20,8,50,0)'); ctx.fillStyle = bg; ctx.fillRect(0, 0, W, 400); ctx.save(); ctx.translate(W / 2, 190); ctx.scale(k, k); outlined('MOM CAUGHT ME', 0, -60, 100, '#fff'); outlined('PLAYING ROBLOX', 0, 40, 100, '#fff'); outlined('AT 3 AM!', 0, 150, 124, C.yellow); ctx.restore(); }
function comic(t, t0, t1, txt, x, y, col, size = 150, rot = -0.12) { if (t < t0 || t > t1) return; const k = pop(t, t0, 0.15); ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(k, k); outlined(txt, 0, 0, size, col, 28); ctx.restore(); }
function coinBurst(t, t0) { const u = t - t0; if (u < 0 || u > 2.4) return; for (let i = 0; i < 26; i++) { const a = rnd(i) * 6.28, sp = 450 + rnd(i + 3) * 700, x = W / 2 + Math.cos(a) * sp * u, y = 800 + Math.sin(a) * sp * u * 0.7 + 700 * u * u, r = 34 + rnd(i + 7) * 28; if (y > H + 80) continue; ctx.save(); ctx.translate(x, y); ctx.scale(Math.abs(Math.cos(u * 6 + i)) * 0.8 + 0.2, 1); ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); fs('#ffcc33', 7); ctx.restore(); }
  const k = pop(t, t0, 0.25); ctx.save(); ctx.translate(W / 2, 520); ctx.scale(k, k); ctx.beginPath(); ctx.roundRect(-380, -100, 760, 200, 50); fs('#ffc928', 10); outlined('+VALKYRIE HAT!', 0, 28, 90, '#fff', 16); ctx.restore(); }
function frozenCard(t, t0, t1) { if (t < t0 || t > t1) return; const u = pop(t, t0, 0.25); ctx.save(); ctx.translate(W / 2, 1180); ctx.scale(u * 0.6, u * 0.6); ctx.rotate(-0.05); ctx.beginPath(); ctx.roundRect(-420, -330, 840, 660, 50); fs('#10305a', 14); ctx.strokeStyle = '#7fd4ff'; ctx.lineWidth = 14; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-300, 200); ctx.lineTo(300, 200); ctx.lineTo(0, -240); ctx.closePath(); fs('#e9b25a', 12); ctx.beginPath(); ctx.moveTo(-230, 150); ctx.lineTo(230, 150); ctx.lineTo(0, -150); ctx.closePath(); fs('#cfefff', 10);
  ctx.fillStyle = '#d8402f'; [[-60, 0], [70, 30], [0, -80]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 28, 0, 7); ctx.fill(); }); ctx.strokeStyle = '#6ab8f0'; ctx.lineWidth = 8; for (let i = 0; i < 5; i++) { const a = i * 1.26 + t * 0.6; line([[-10, 40], [-10 + Math.cos(a) * 60, 40 + Math.sin(a) * 60]], 8, '#6ab8f0'); }
  outlined('FROZEN!', 0, 310, 110, '#9fe4ff', 20); ctx.restore(); }
function endText(t) { if (t < 44.7) return; const k = pop(t, 44.7, 0.3); ctx.save(); ctx.translate(W / 2, 1450); ctx.scale(k, k); outlined("Type 'PIZZA' letter by", 0, -60, 70, '#fff', 18); outlined('letter in comments if your', 0, 20, 70, '#fff', 18); outlined('microwave does this!', 0, 100, 78, C.yellow, 18); ctx.restore(); }

// ---- shots
const MOMX = 300, KIDX = 300, MY = 850;
function chairBack(x, y, s) { block(x - 130 * s, y - 20 * s, 260 * s, 420 * s, 30 * s, '#2a1f44', 8); }
function seat(t, o) { monitor(t, {x: 790, y: 1010, s: 0.8, screen: 'game'}); keyboard(t, 700, 1390, 0.6); }
const SHOTS = [
 {t0: 0, t1: 2.85, draw(t, u) { cam(1.0, 1.1, u, 540, 960, 0, t); room(t); seat(t); const mx = lerp(1500, 830, E.back(clamp(u * 2.2)));
    chairBack(KIDX, 1000, 1.0); character('kid', {x: KIDX, y: 930, s: 1.0, legs: true, sit: true, face: 'shock', look: [0.8, -0.2], t, armL: 30, armR: -30}); character('mom', {x: mx, y: 850, s: 1.0, legs: true, ll: Math.max(0, Math.sin(t * 9)) * -50 * (1 - clamp(u * 2.2)), lr: Math.max(0, -Math.sin(t * 9)) * -50 * (1 - clamp(u * 2.2)), face: 'shock', look: [-0.8, 0.2], t, ph: 1.7, open: talkOpen('mom', t), armL: -25, armR: 25}); } },
 {t0: 2.85, t1: 4.4, draw(t, u) { cam(1.0, 1.12, u, 540, 960, 0, t); room(t); character('mom', {x: 900, y: 850, s: 1.0, legs: true, face: 'smirk', look: [-1, 0.2], t, open: 0}); chairBack(440, 960, 1.25); character('kid', {x: 440, y: 820, s: 1.25, legs: true, sit: true, face: speaking('hero', t) ? 'panic' : 'sad', look: [0, 0.5], t, sweat: 4, open: talkOpen('hero', t), armL: 40, armR: -40}); } },
 {t0: 4.4, t1: 9.0, draw(t, u) { cam(1.0, 1.08, u, 540, 960, 0, t); kitchen(t); const slide = E.io(clamp((t - 5.0) / 0.5)), reach = E.io(clamp((t - 4.8) / 0.4)), press = t > 6.2 && t < 8.2 && Math.floor(t * 4) % 2 === 0;
    const state = t < 5.0 ? 'idle' : t < 5.8 ? 'open' : t < 8.2 ? 'loaded' : 'run'; microwave(t, {x: 740, y: 1000, s: 0.95, state, secs: 30, press});
    character('mom', {x: MOMX, y: MY, s: 1.0, legs: true, face: speaking('mom', t) ? 'smirk' : 'focus', look: [0.7, 0.1], t, open: talkOpen('mom', t), armL: 8, armR: -90 * reach}); const k = 1.7, hx = MOMX + 150 * k + 220 * k * 0.95, hy = MY + 100 * k;
    if (t < 5.7) pizza(lerp(hx, 680, slide), lerp(hy - 30, 1060, slide), 1.05 - 0.2 * slide); if (t > 6.1 && t < 8.3) ripple(740 + 48, 1000 - 8, ((t - 6.1) * 3) % 1); } },
 {t0: 9.0, t1: 15.5, draw(t, u) { const p = obbyPath(sm01(t, 9.0, 15.5) * 6.5); const camX = p.x - 360; obbyBG(t, camX); obbyWorld(t, camX, {hat: true}); heroAt(t, p, {face: speaking('hero', t) ? 'shock' : 'grin', open: talkOpen('hero', t)}); } },
 {t0: 15.5, t1: 17.5, draw(t, u) { const p = obbyPath(6.5 + (t - 15.5) * 0.75); const camX = p.x - 360; obbyBG(t, camX); obbyWorld(t, camX, {hat: false}); speedLines(t, 540, 900, 24, '#ffffff', 0.3); heroAt(t, p, {face: 'panic', sweat: 2}); } },
 {t0: 17.5, t1: 23.5, draw(t, u) { cam(1.0, 1.06, u, 560, 960, 0, t); room(t); seat(t); const push = t > 21.6, away = E.out(clamp((t - 21.9) / 0.9));
    chairBack(KIDX, 1000, 1.0); character('kid', {x: KIDX, y: 930, s: 1.0, legs: true, sit: true, face: t < 20.2 ? 'curious' : 'smirk', look: [0.8, 0], t, open: talkOpen('hero', t), armL: 20, armR: push ? -100 : -20});
    const bx = lerp(760, 1500, away), by = lerp(900, 500, away); character('kid', {x: bx, y: by, s: 0.85, legs: true, ll: away ? -40 : 0, lr: away ? 30 : 0, shirt: '#2fa86a', hair: '#2b2b4a', logo: 'B', nophones: true, skin: '#f6d2b0', face: away > 0 ? 'shock' : (speaking('bro', t) ? 'grin' : 'smirk'), t, open: talkOpen('bro', t), rot: away * 600 + Math.sin(t * 8) * 2, armL: 150, armR: -150 + Math.sin(t * 9) * 15}); } },
 {t0: 23.5, t1: 32.8, draw(t, u) { const arrive = t > 30.2; const p = arrive ? {x: PXW(NP - 1) - 100, y: PTOP(NP - 1), air: 0} : obbyPath(8 + sm01(t, 23.5, 30.2) * (NP - 1 - 8)); const camX = arrive ? PXW(NP - 1) - 340 : p.x - 360; obbyBG(t, camX); obbyWorld(t, camX, {chest: true, chestOpen: sm01(t, 30.4, 30.8)});
    if (arrive) { character('kid', {x: 360 + (PXW(NP - 1) - 100 - (PXW(NP - 1) - 340 + 360)) , y: PTOP(NP - 1) - 490 * 0.935, s: 0.55, legs: true, t, face: speaking('hero', t) ? 'grin' : 'joy', open: talkOpen('hero', t), armL: 160, armR: -160, rot: Math.sin(t * 9) * 3}); } else heroAt(t, p, {face: 'grin'}); } },
 {t0: 32.8, t1: 38.2, draw(t, u) { cam(1.0, 1.06, u, 540, 960, 0, t); kitchen(t); const take = E.io(clamp((t - 33.1) / 0.5)), ouch = t >= 34.7, state = t < 33.0 ? 'done' : t < 33.5 ? 'open' : 'idle'; microwave(t, {x: 740, y: 1000, s: 0.95, state, secs: 0});
    character('mom', {x: MOMX, y: MY, s: 1.0, legs: true, face: t < 34.2 ? 'focus' : (ouch ? (speaking('mom', t) ? 'shock' : 'panic') : 'curious'), look: [0.7, 0.1], t, open: talkOpen('mom', t), armL: 8, armR: ouch ? -80 + Math.sin(t * 30) * 14 : -90 * (1 - take * 0.3), rot: ouch ? Math.sin(t * 25) * 2 : 0}); const k = 1.7, hx = MOMX + 150 * k + 220 * k * 0.95;
    if (t > 33.0) pizza(lerp(680, hx - 120, take), lerp(1060, MY + 100 * k - 40, take), 1.05, 0, t > 35.6); } },
 {t0: 38.2, t1: 41.0, draw(t, u) { cam(1.0, 1.06, u, 540, 960, 0, t); kitchen(t); const back = E.io(clamp((t - 38.3) / 0.4)), k = 1.7, hx = MOMX + 150 * k + 220 * k * 0.95; microwave(t, {x: 740, y: 1000, s: 0.95, state: t < 39.0 ? 'open' : 'run', secs: t < 39.0 ? 0 : 120, press: t > 38.6 && t < 39.0});
    character('mom', {x: MOMX, y: MY, s: 1.0, legs: true, face: speaking('mom', t) ? 'smirk' : 'focus', look: [0.7, 0.1], t, open: talkOpen('mom', t), armL: 8, armR: -90}); if (t < 39.0) pizza(lerp(hx - 120, 680, back), lerp(MY + 100 * k - 40, 1060, back), 1.05); } },
 {t0: 41.0, t1: 47.5, draw(t, u) { cam(1.0, 1.08, u, 540, 960, 0, t); room(t); chairBack(470, 1000, 1.3); character('kid', {x: 470, y: 840, s: 1.3, legs: true, sit: true, face: speaking('hero', t) ? 'grin' : 'smirk', look: [0.2, 0.1], t, open: talkOpen('hero', t), armL: 40, armR: -20}); } }
];
function frame(t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, W, H);
  const sh = SHOTS.find(s => t >= s.t0 && t < s.t1) || SHOTS[SHOTS.length - 1]; ctx.save(); sh.draw(t, clamp((t - sh.t0) / (sh.t1 - sh.t0))); ctx.restore();
  const k = t - sh.t0; if (k < 0.1 && sh.t0 > 0) flash(0.35 * (1 - k / 0.1));
  hookText(t); timerHUD(t); captions(t); frozenCard(t, 35.6, 37.9); if (t > 30.5 && t < 33) coinBurst(t, 30.6); comic(t, 22.0, 23.2, 'BONK!', 800, 760, C.yellow, 120); comic(t, 31.9, 32.8, 'DING!', 840, 1100, '#7dffaa', 160, 0.1); flash(t > 32.0 && t < 32.35 ? 1 - (t - 32.0) / 0.35 : 0); endText(t);
}
window.renderAt = t => { frame(t); return true; };
fetch('dialogue.json').then(r => r.json()).then(d => { D = d; buildCaps(); return document.fonts.load('100px Lilita'); }).then(() => document.fonts.ready).then(() => { window.ready = true; });
