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
// character: kind 'kid' | 'mom'. o: {x,y,s,face,look,rot,tx,open,sweat,crown,t}
function character(kind, o) {
  const s = o.s || 1, x = o.x, y = o.y, f = FACES[o.face || 'calm'], look = o.look || [0, 0], t = o.t || 0, bob = Math.sin(t * 3 + (o.ph || 0)) * 4 * s;
  ctx.save(); ctx.translate(x, y + bob); ctx.rotate((o.rot || 0) * Math.PI / 180);
  const skin = o.skin || C.skin;
  // torso
  if (o.body !== false) {
    const tc = kind === 'kid' ? '#6a2fe0' : '#2db3a0';
    ctx.beginPath(); ctx.roundRect(-150 * s, 150 * s, 300 * s, 330 * s, 40 * s); fs(tc, 11);
    if (kind === 'kid') { ctx.fillStyle = '#9a6bff'; for (let i = 0; i < 5; i++) { ctx.fillRect(-150 * s + i * 60 * s, 150 * s, 30 * s, 330 * s); } ctx.beginPath(); ctx.roundRect(-150 * s, 150 * s, 300 * s, 330 * s, 40 * s); ctx.lineWidth = 11; ctx.strokeStyle = C.ink; ctx.stroke(); glow(C.neon, 25); ctx.font = `${170 * s}px Lilita`; ctx.textAlign = 'center'; ctx.fillStyle = C.white; ctx.fillText('Z', 0, 400 * s); noglow(); ctx.lineWidth = 8; ctx.strokeStyle = C.ink; ctx.strokeText('Z', 0, 400 * s); }
    else { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(-50 * s, 150 * s); ctx.lineTo(0, 230 * s); ctx.lineTo(50 * s, 150 * s); ctx.closePath(); fs('#ffffff', 8); ctx.beginPath(); ctx.arc(0, 330 * s, 16 * s, 0, 7); fs(C.yellow, 7); }
    // neck
    ctx.beginPath(); ctx.roundRect(-45 * s, 118 * s, 90 * s, 50 * s, 12 * s); fs(skin, 9);
  }
  // hair back (mom)
  if (kind === 'mom') { ctx.beginPath(); ctx.roundRect(-190 * s, -150 * s, 380 * s, 400 * s, 90 * s); fs(C.hairM, 11); }
  // head
  ctx.beginPath(); ctx.roundRect(-135 * s, -130 * s, 270 * s, 260 * s, 54 * s); fs(skin, 12);
  // ears
  ctx.beginPath(); ctx.roundRect(-160 * s, -20 * s, 34 * s, 60 * s, 14 * s); fs(skin, 9); ctx.beginPath(); ctx.roundRect(126 * s, -20 * s, 34 * s, 60 * s, 14 * s); fs(skin, 9);
  if (kind === 'mom') { ctx.beginPath(); ctx.arc(-148 * s, 52 * s, 18 * s, 0, 7); fs(C.yellow, 7); ctx.beginPath(); ctx.arc(148 * s, 52 * s, 18 * s, 0, 7); fs(C.yellow, 7); }
  // hair front
  if (kind === 'kid') { ctx.beginPath(); ctx.moveTo(-142 * s, -40 * s); ctx.lineTo(-150 * s, -150 * s); ctx.lineTo(-100 * s, -120 * s); ctx.lineTo(-80 * s, -200 * s); ctx.lineTo(-30 * s, -140 * s); ctx.lineTo(10 * s, -215 * s); ctx.lineTo(50 * s, -140 * s); ctx.lineTo(100 * s, -195 * s); ctx.lineTo(112 * s, -120 * s); ctx.lineTo(150 * s, -140 * s); ctx.lineTo(142 * s, -40 * s); ctx.lineTo(90 * s, -80 * s); ctx.lineTo(0, -60 * s); ctx.lineTo(-90 * s, -85 * s); ctx.closePath(); fs(C.hairK, 11); }
  else { ctx.beginPath(); ctx.moveTo(-140 * s, -30 * s); ctx.quadraticCurveTo(-150 * s, -170 * s, 0, -165 * s); ctx.quadraticCurveTo(150 * s, -170 * s, 140 * s, -30 * s); ctx.quadraticCurveTo(80 * s, -110 * s, 0, -70 * s); ctx.quadraticCurveTo(-80 * s, -110 * s, -140 * s, -30 * s); ctx.closePath(); fs(C.hairM, 11); }
  // face
  const ex = 58 * s, ey = -8 * s;
  eye(-ex, ey, s, f.eye, look); eye(ex, ey, s, f.eye, look);
  const by = ey - 66 * s + f.by * s;
  ctx.lineWidth = 15 * s; ctx.strokeStyle = C.ink; ctx.lineCap = 'round';
  line([[-ex - 38 * s, by - f.bl * s * 0.8], [-ex + 38 * s, by + f.bl * s * 0.8]], 15 * s); line([[ex - 38 * s, by - f.br * s * 0.8], [ex + 38 * s, by + f.br * s * 0.8]], 15 * s);
  ctx.beginPath(); ctx.arc(-98 * s, 44 * s, 20 * s, 0, 7); ctx.fillStyle = 'rgba(255,90,120,.35)'; ctx.fill(); ctx.beginPath(); ctx.arc(98 * s, 44 * s, 20 * s, 0, 7); ctx.fill();
  mouth(0, 78 * s, s, f.mouth, o.open === undefined ? 0.5 + 0.5 * Math.sin(t * 22) : o.open);
  if (kind === 'kid') { // headphones
    ctx.lineWidth = 16 * s; ctx.strokeStyle = C.ink; ctx.beginPath(); ctx.arc(0, -10 * s, 168 * s, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
    ctx.lineWidth = 7 * s; ctx.strokeStyle = '#3b3b5c'; ctx.beginPath(); ctx.arc(0, -10 * s, 168 * s, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
    [-1, 1].forEach(d => { ctx.beginPath(); ctx.roundRect(d * 150 * s - 28 * s, -30 * s, 56 * s, 100 * s, 22 * s); fs('#2c2c4f', 10); glow(C.neon, 18); ctx.fillStyle = C.neon; ctx.fillRect(d * 150 * s - 8 * s, -4 * s, 16 * s, 46 * s); noglow(); });
  }
  if (o.crown) { ctx.beginPath(); ctx.moveTo(-90 * s, -150 * s); ctx.lineTo(-100 * s, -250 * s); ctx.lineTo(-45 * s, -205 * s); ctx.lineTo(0, -280 * s); ctx.lineTo(45 * s, -205 * s); ctx.lineTo(100 * s, -250 * s); ctx.lineTo(90 * s, -150 * s); ctx.closePath(); glow(C.yellow, 30); fs(C.yellow, 11); noglow(); [-55, 0, 55].forEach(px => { ctx.beginPath(); ctx.arc(px * s, -185 * s, 11 * s, 0, 7); fs(C.red, 5); }); }
  if (o.sweat) { for (let i = 0; i < o.sweat; i++) { const p = ((t * 1.6 + i / o.sweat) % 1), sx = (i % 2 ? 1 : -1) * (160 + p * 60) * s, sy = (-90 + p * 220) * s; ctx.save(); ctx.translate(sx, sy); ctx.beginPath(); ctx.moveTo(0, -26 * s); ctx.quadraticCurveTo(24 * s, 8 * s, 0, 22 * s); ctx.quadraticCurveTo(-24 * s, 8 * s, 0, -26 * s); ctx.fillStyle = '#7fd1ff'; ctx.globalAlpha = 1 - p * 0.6; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = C.ink; ctx.stroke(); ctx.restore(); } }
  ctx.restore();
}
function hand(x, y, s, rot, pointing) { ctx.save(); ctx.translate(x, y); ctx.rotate(rot * Math.PI / 180); ctx.beginPath(); ctx.roundRect(-40 * s, -45 * s, 80 * s, 90 * s, 22 * s); fs(C.skin, 10); if (pointing) { ctx.beginPath(); ctx.roundRect(-14 * s, -130 * s, 28 * s, 100 * s, 14 * s); fs(C.skin, 10); } ctx.restore(); }

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
  if (o.screen === 'game') { const g = ctx.createLinearGradient(0, -230, 0, 160); g.addColorStop(0, '#41d6ff'); g.addColorStop(1, '#5b2bd6'); ctx.fillStyle = g; ctx.fillRect(-280, -230, 560, 390);
    for (let i = 0; i < 6; i++) { const px = ((i * 170 + t * 120) % 760) - 340; ctx.fillStyle = ['#ff6bd6', '#ffd23f', '#3fe08a'][i % 3]; ctx.beginPath(); ctx.roundRect(px, 40 + (i % 3) * 36, 120, 26, 8); fs(ctx.fillStyle, 5); }
    const jy = -Math.abs(Math.sin(t * 5)) * 90; ctx.fillStyle = C.yellow; ctx.beginPath(); ctx.roundRect(-30, 0 + jy, 60, 60, 10); fs(C.yellow, 5); }
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

// ---------------------------------------------------------------- effects
function speedLines(t, cx, cy, n = 36, col = '#ffffff', a = 0.55) { ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = col; ctx.lineCap = 'round'; for (let i = 0; i < n; i++) { const ang = i / n * Math.PI * 2 + rnd(i) * 0.2, r0 = 380 + rnd(i + 3) * 260 + ((t * 900) % 200), r1 = r0 + 400 + rnd(i + 8) * 300; ctx.lineWidth = 6 + rnd(i + 11) * 10; ctx.beginPath(); ctx.moveTo(cx + Math.cos(ang) * r0, cy + Math.sin(ang) * r0); ctx.lineTo(cx + Math.cos(ang) * r1, cy + Math.sin(ang) * r1); ctx.stroke(); } ctx.restore(); }
function burst(x, y, r, col, rot = 0) { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.beginPath(); for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2, rr_ = i % 2 ? r * 0.62 : r; ctx.lineTo(Math.cos(a) * rr_, Math.sin(a) * rr_); } ctx.closePath(); fs(col, 10); ctx.restore(); }
function confetti(t, t0, n = 70) { const u = t - t0; if (u < 0) return; for (let i = 0; i < n; i++) { const vx = (rnd(i) - 0.5) * 1200, vy = -600 - rnd(i + 5) * 900, px = W / 2 + vx * u * 0.6, py = 900 + vy * u + 1500 * u * u, rot = rnd(i + 2) * 6 + u * 8; if (py > H + 50) continue; ctx.save(); ctx.translate(px, py); ctx.rotate(rot); ctx.fillStyle = [C.yellow, C.pink, C.green, C.blue, C.orange][i % 5]; ctx.fillRect(-14, -8, 28, 16); ctx.restore(); } }
function flash(a) { if (a > 0) { ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.fillRect(0, 0, W, H); } }
function ripple(cx, cy, u) { if (u < 0 || u > 1) return; ctx.beginPath(); ctx.arc(cx, cy, 60 + u * 420, 0, 7); ctx.lineWidth = 22 * (1 - u); ctx.strokeStyle = `rgba(255,255,255,${1 - u})`; ctx.stroke(); }

// ---------------------------------------------------------------- captions (kinetic, word by word)
const CAPS = [
  {t0: 0.05, t1: 1.15, w: [['I was just', 0.05, C.white], ['PLAYING', 0.6, C.yellow]]},
  {t0: 1.25, t1: 2.35, w: [['Then', 1.25, C.white], ['MOM', 1.55, C.orange], ['walked in', 1.85, C.white]]},
  {t0: 2.45, t1: 3.55, w: [["What's this", 2.5, C.white], ['button?', 2.95, C.red]]},
  {t0: 3.65, t1: 4.75, w: [['GIVE', 3.68, C.red], ['ADMIN', 4.05, C.yellow]]},
  {t0: 4.85, t1: 5.95, w: [['NO', 4.88, C.red], ['NO', 5.18, C.red], ['NO', 5.48, C.red]]},
  {t0: 6.05, t1: 7.15, w: [['CLICK.', 6.4, C.white]]},
  {t0: 7.25, t1: 8.35, w: [['She just became', 7.28, C.white], ['ADMIN', 7.9, C.green]]},
  {t0: 8.45, t1: 10.15, w: [['Now', 8.5, C.white], ['MOM', 8.85, C.yellow], ['rules', 9.2, C.white], ['the server', 9.55, C.white]]},
  {t0: 10.25, t1: 11.35, w: [['...send', 10.3, C.white], ['help', 10.8, C.red]]}
];
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

// ---------------------------------------------------------------- shots
function cam(z0, z1, u, cx, cy, shake = 0, t = 0) { const z = lerp(z0, z1, E.out(u)); const sx = (rnd(Math.floor(t * 60) * 2) - .5) * shake, sy = (rnd(Math.floor(t * 60) * 2 + 1) - .5) * shake; ctx.translate(W / 2 + sx, H / 2 + sy); ctx.scale(z, z); ctx.translate(-cx, -cy); }
const SHOTS = [
  {t0: 0.0, t1: 1.2, draw(t, u) { cam(1.0, 1.1, u, 540, 960, 0, t); room(t); monitor(t, {x: 760, y: 1010, s: 0.9, screen: 'game'}); keyboard(t, 420, 1500, 1); character('kid', {x: 330, y: 1000, s: 1.45, face: 'focus', look: [0.6, -0.3], t}); hand(250, 1560, 1.2, -8); hand(480, 1585, 1.2, 8); } },
  {t0: 1.2, t1: 2.4, draw(t, u) { cam(1.05, 1.12, u, 540, 960, 0, t); room(t); monitor(t, {x: 760, y: 1010, s: 0.9, screen: 'game'}); keyboard(t, 420, 1500, 1); const mx = lerp(1500, 840, E.back(clamp(u * 1.8))); character('mom', {x: mx, y: 780, s: 1.05, face: 'curious', look: [-0.8, 0.2], t, ph: 1.7}); character('kid', {x: 330, y: 1000, s: 1.45, face: 'focus', look: [0.6, -0.3], t}); hand(250, 1560, 1.2, -8); hand(480, 1585, 1.2, 8); } },
  {t0: 2.4, t1: 3.6, draw(t, u) { cam(1.2, 1.55, u, 600, 800, 0, t); room(t); character('mom', {x: 640, y: 820, s: 1.7, face: 'curious', look: [-0.8, 0.4], t, rot: lerp(-4, 4, u)}); hand(260, 1100, 1.6, 20, true); } },
  {t0: 3.6, t1: 4.8, draw(t, u) { cam(1.0, 1.75, u, 540, 900, 0, t); room(t); monitor(t, {x: 540, y: 980, s: 1.35, screen: 'admin', cursor: [lerp(-40, 70, E.out(u)), lerp(-20, 40, E.out(u))]}); speedLines(t, 540, 980, 28, '#ff9bb0', 0.35 * E.out(clamp(u * 3))); } },
  {t0: 4.8, t1: 5.9, draw(t, u) { cam(1.4, 1.2, u, 540, 880, 18 * (1 - u), t); room(t); character('kid', {x: 540, y: 850, s: 1.95, face: 'panic', look: [0.9, -0.2], t, sweat: 4, rot: Math.sin(t * 40) * 2.5}); } },
  {t0: 6.0, t1: 7.2, draw(t, u) { cam(1.35, 1.7, E.out(u), 560, 1050, 0, t); room(t); monitor(t, {x: 540, y: 980, s: 1.35, screen: 'admin', press: u > 0.333 ? 1 : 0, cursor: [70 + (u > 0.333 ? -4 : 0), 40 + (u > 0.333 ? 6 : 0)]}); hand(800, 1330 - (u > 0.333 ? 0 : 40 * (1 - E.out(u * 3))), 1.6, -12); ripple(540 + 70, 980 + 40, (u - 0.333) * 2.5); flash(clamp(1 - (u - 0.333) * 8) * (u > 0.333 ? 0.85 : 0)); } },
  {t0: 7.2, t1: 8.4, draw(t, u) { cam(1.0, 1.15, u, 540, 960, 10 * clamp(1 - u * 2), t); room(t); monitor(t, {x: 540, y: 880, s: 1.3, screen: 'given'}); character('kid', {x: 190, y: 1190, s: 0.85, face: 'shock', look: [0.9, -0.6], t, body: false}); confetti(t, 7.25); burst(850, 520, 120 + 30 * Math.sin(t * 10), C.yellow, t * 0.4); } },
  {t0: 8.4, t1: 10.2, draw(t, u) { cam(1.2, 1.35, u, 540, 880, 0, t); room(t); character('kid', {x: 170, y: 1130, s: 0.7, face: 'sad', look: [0.5, 0.5], t, rot: -8, body: false}); character('mom', {x: 620, y: 800, s: 1.75, face: 'grin', look: [0, 0], t, crown: true, rot: Math.sin(t * 6) * 2}); speedLines(t, 620, 800, 24, '#ffe36b', 0.3); } },
  {t0: 10.2, t1: 11.4, draw(t, u) { cam(1.5, 1.2, E.out(u), 540, 900, 0, t); room(t); character('kid', {x: 540, y: 860, s: 1.85, face: 'sad', look: [0, 0.6], t, sweat: 2, rot: lerp(0, -5, u)}); } }
];
const REWIND = {t0: 11.4, t1: 12.0};
function glitch(t, u) { // reverse-playback look: RGB split + scanlines + REWIND tag, fading out so the last frame equals the first
  const k = 1 - u; if (k <= 0.02) return;
  const img = ctx.getImageData(0, 0, W, H); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.5 * k; ctx.putImageData(img, Math.round(18 * k), 0); ctx.restore();
  ctx.fillStyle = `rgba(0,0,0,${0.2 * k})`; for (let y = 0; y < H; y += 8) ctx.fillRect(0, y, W, 3);
  for (let i = 0; i < 5; i++) { const gy = rnd(Math.floor(t * 30) + i * 7) * H; ctx.fillStyle = `rgba(${i % 2 ? '120,255,255' : '255,120,255'},${0.3 * k})`; ctx.fillRect(0, gy, W, 12 + rnd(i) * 30); }
  if (k > 0.1) { ctx.globalAlpha = Math.min(1, k * 2); ctx.font = '70px Lilita'; ctx.textAlign = 'left'; ctx.fillStyle = '#fff'; ctx.strokeStyle = C.ink; ctx.lineWidth = 12; ctx.strokeText('◀◀ REWIND', 60, 130); ctx.fillText('◀◀ REWIND', 60, 130); ctx.globalAlpha = 1; }
}
function frame(t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, W, H);
  const inRewind = t >= REWIND.t0;
  const st = inRewind ? 0.55 * (1 - (t - REWIND.t0) / (REWIND.t1 - REWIND.t0)) : t, sh = SHOTS.find(s => st >= s.t0 && st < s.t1) || SHOTS[SHOTS.length - 1];
  ctx.save(); const u = clamp((st - sh.t0) / (sh.t1 - sh.t0)); sh.draw(st, u); ctx.restore();
  // whip-in flash at each cut
  if (!inRewind) { const k = st - sh.t0; if (k < 0.1 && sh.t0 > 0) flash(0.35 * (1 - k / 0.1)); }
  if (!inRewind) captions(t);
  if (inRewind) glitch(t, (t - REWIND.t0) / (REWIND.t1 - REWIND.t0));
}
window.renderAt = t => { frame(t); return true; };
document.fonts.load('100px Lilita').then(() => document.fonts.ready).then(() => { window.ready = true; });
