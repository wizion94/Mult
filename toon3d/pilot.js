// Pilot 0-10.4 s: toon-shaded blocky remake synced to the channel's own voice track.
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

const W = 1080, H = 1920;
await document.fonts.load('100px Lilita'); await document.fonts.load('700 100px Caveat'); await document.fonts.ready;
const wrap = document.getElementById('wrap');
const renderer = new THREE.WebGLRenderer({antialias: true, preserveDrawingBuffer: true});
renderer.setPixelRatio(1); renderer.setSize(W, H); wrap.appendChild(renderer.domElement);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const ov = document.createElement('canvas'); ov.width = W; ov.height = H; wrap.appendChild(ov); const oc = ov.getContext('2d');
const scene = new THREE.Scene(); scene.background = new THREE.Color('#f7dfa6');
const camera = new THREE.PerspectiveCamera(32, W / H, 0.1, 120);
const sm = u => { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); };
const lerp = (a, b, u) => a + (b - a) * u;
const rnd = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// ---------------------------------------------------------------- materials / helpers
const INK = new THREE.Color('#3a1f45'), INKC = '#3a1f45';
const ramp = (() => { const d = new Uint8Array([78, 78, 78, 255, 168, 168, 168, 255, 255, 255, 255, 255]); const t = new THREE.DataTexture(d, 3, 1, THREE.RGBAFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
const toon = (hex, o = {}) => new THREE.MeshToonMaterial({color: new THREE.Color(hex), gradientMap: ramp, ...o});
function outlineMat(thick) { const m = new THREE.MeshBasicMaterial({color: INK, side: THREE.BackSide}); m.onBeforeCompile = sh => { sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>\n transformed += normalize(normal) * ${thick.toFixed(4)};`); }; return m; }
const OL = {thin: outlineMat(0.022), mid: outlineMat(0.032), thick: outlineMat(0.045)};
function mesh(geo, mat, o = {}) { const m = new THREE.Mesh(geo, mat); m.castShadow = o.cast !== false; m.receiveShadow = true; if (o.outline !== false) { const l = new THREE.Mesh(geo, OL[o.outline || 'mid']); l.castShadow = false; m.add(l); } if (o.pos) m.position.set(...o.pos); if (o.rot) m.rotation.set(...o.rot); return m; }
const rbox = (w, h, d, r = 0.08, seg = 4) => new RoundedBoxGeometry(w, h, d, seg, Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001));
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); draw(g, w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
function decal(tex, w, h, o = {}) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({map: tex, transparent: true, alphaTest: 0.02, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2})); if (o.pos) m.position.set(...o.pos); if (o.rot) m.rotation.set(...o.rot); m.renderOrder = 2; return m; }

// ---------------------------------------------------------------- illustrated faces
// f: {eyes:'normal'|'half'|'wide'|'happy'|'big', look:[x,y], browL, browR (tilt, + = stern), raise, mouth:'flat'|'smirk'|'o'|'grin'|'wobble'|'shout'|'talk'|'smile', open, tears, tearT, glasses, glint, fringe, lid}
function drawFace(g, S, f) {
  g.clearRect(0, 0, S, S); g.lineCap = 'round'; g.lineJoin = 'round';
  const ey = S * 0.47, ex = S * 0.2, er = S * 0.112, lk = f.look || [0, 0];
  g.fillStyle = 'rgba(255,110,130,.33)'; [-1, 1].forEach(d => { g.beginPath(); g.ellipse(S / 2 + d * S * 0.32, S * 0.64, S * 0.07, S * 0.045, 0, 0, 7); g.fill(); });
  [-1, 1].forEach(d => {
    const x = S / 2 + d * ex;
    if (f.eyes === 'happy') { g.lineWidth = S * 0.03; g.strokeStyle = INKC; g.beginPath(); g.arc(x, ey + er * 0.4, er * 0.8, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); return; }
    const sy = f.eyes === 'wide' ? 1.3 : f.eyes === 'big' ? 1.25 : 1.0, sx = f.eyes === 'wide' ? 1.15 : 1.08;
    g.fillStyle = '#fff'; g.beginPath(); g.ellipse(x, ey, er * sx, er * sy, 0, 0, Math.PI * 2); g.fill(); g.lineWidth = S * 0.02; g.strokeStyle = INKC; g.stroke();
    const pr = f.eyes === 'wide' ? 0.36 : f.eyes === 'big' ? 0.64 : 0.55, px = x + lk[0] * er * 0.45, py = ey + lk[1] * er * 0.45 + (f.eyes === 'half' ? er * 0.25 : 0);
    g.fillStyle = f.iris || '#4a2a20'; g.beginPath(); g.arc(px, py, er * pr, 0, 7); g.fill(); g.fillStyle = INKC; g.beginPath(); g.arc(px, py, er * pr * 0.55, 0, 7); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(px - er * pr * 0.35, py - er * pr * 0.35, er * pr * 0.32, 0, 7); g.fill();
    if (f.eyes === 'big') { g.beginPath(); g.arc(px + er * 0.25, py + er * 0.3, er * 0.1, 0, 7); g.fill(); }
    if (f.eyes === 'half') { g.fillStyle = f.lid || '#d99a74'; g.beginPath(); g.ellipse(x, ey, er * sx * 1.06, er * sy * 1.06, 0, Math.PI, Math.PI * 2); g.fill(); g.lineWidth = S * 0.022; g.strokeStyle = INKC; g.beginPath(); g.moveTo(x - er * sx * 1.06, ey + er * 0.02); g.lineTo(x + er * sx * 1.06, ey + er * 0.02); g.stroke(); }
    if (f.lashes) { g.lineWidth = S * 0.012; g.strokeStyle = INKC; for (let i = 0; i < 3; i++) { const yy = f.eyes === 'half' ? ey : ey - er * sy * 0.7; g.beginPath(); g.moveTo(x + d * er * (0.65 + i * 0.2), yy); g.lineTo(x + d * er * (0.92 + i * 0.24), yy - er * 0.3); g.stroke(); } }
    if (f.tears) { const ph = ((f.tearT || 0) + (d > 0 ? 0.5 : 0)) % 1, dy = ph * er * 2.2; g.fillStyle = 'rgba(120,200,255,.9)'; g.beginPath(); g.ellipse(x, ey + er * sy * 0.98, er * 0.95, er * 0.22, 0, 0, 7); g.fill(); g.globalAlpha = 1 - ph * 0.7;
      g.beginPath(); g.moveTo(x + d * er * 0.75, ey + er * 1.1 + dy); g.quadraticCurveTo(x + d * er * 1.1, ey + er * 1.9 + dy, x + d * er * 0.8, ey + er * 2.4 + dy); g.quadraticCurveTo(x + d * er * 0.45, ey + er * 1.9 + dy, x + d * er * 0.75, ey + er * 1.1 + dy); g.fill(); g.globalAlpha = 1; }
  });
  if (f.glasses) { g.lineWidth = S * 0.03; g.strokeStyle = f.glasses; [-1, 1].forEach(d => { g.beginPath(); g.arc(S / 2 + d * ex, ey, er * 1.55, 0, 7); g.stroke(); }); g.beginPath(); g.moveTo(S / 2 - ex + er * 1.5, ey - er * 0.2); g.quadraticCurveTo(S / 2, ey - er * 0.6, S / 2 + ex - er * 1.5, ey - er * 0.2); g.stroke();
    if (f.glint) { g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = S * 0.018; [-1, 1].forEach(d => { const x = S / 2 + d * ex; g.beginPath(); g.moveTo(x - er * 0.9, ey - er * 0.3); g.lineTo(x - er * 0.3, ey - er * 0.95); g.stroke(); }); } }
  // brows
  g.lineWidth = S * 0.045; g.strokeStyle = f.brow || INKC;
  [[-1, f.browL || 0], [1, f.browR || 0]].forEach(([d, tilt]) => { const x = S / 2 + d * ex, y = ey - er * (f.glasses ? 1.85 : 1.6) - (f.raise || 0) * er * (d > 0 ? (f.raiseR ?? 1) : 1); const tt = tilt * er * 0.55; const xi = x - d * er * 0.95, xo = x + d * er * 0.95; g.beginPath(); g.moveTo(xi, y + tt); g.quadraticCurveTo(x, y - er * 0.28, xo, y - tt * 0.6); g.stroke(); });
  // fringe painted on face top
  if (f.fringe) { g.fillStyle = f.fringe.color; g.strokeStyle = INKC; g.lineWidth = S * 0.022; g.beginPath(); g.moveTo(-10, -10); g.lineTo(S + 10, -10);
    if (f.fringe.style === 'sweep') { g.lineTo(S + 10, S * 0.18); g.quadraticCurveTo(S * 0.7, S * 0.05, S * 0.42, S * 0.21); g.quadraticCurveTo(S * 0.2, S * 0.08, -10, S * 0.23); }
    else if (f.fringe.style === 'curls') { g.lineTo(S + 10, S * 0.16); for (let x = S; x > 0; x -= S / 5) g.arc(x - S / 10, S * 0.16, S / 10, 0, Math.PI, false); }
    else { g.lineTo(S + 10, S * 0.15); for (let x = S; x > 0; x -= S / 6) g.quadraticCurveTo(x - S / 12, S * 0.26, x - S / 6, S * 0.15); }
    g.closePath(); g.fill(); g.stroke(); }
  // mouth
  g.lineWidth = S * 0.022; g.strokeStyle = INKC; const my = S * 0.74, op = f.open ?? 0.6;
  const dark = '#7a1e34', tongue = '#ff7d8f';
  if (f.mouth === 'wobble') { g.beginPath(); g.moveTo(S * 0.4, my); for (let i = 1; i <= 6; i++) g.lineTo(S * 0.4 + i * S * 0.033, my + (i % 2 ? -1 : 1) * S * 0.018); g.stroke(); }
  else if (f.mouth === 'flat') { g.fillStyle = '#d96a7a'; g.beginPath(); g.roundRect(S * 0.43, my - S * 0.02, S * 0.14, S * 0.04, S * 0.02); g.fill(); g.stroke(); }
  else if (f.mouth === 'smirk') { g.beginPath(); g.moveTo(S * 0.4, my); g.quadraticCurveTo(S * 0.52, my + S * 0.06, S * 0.62, my - S * 0.04); g.stroke(); }
  else if (f.mouth === 'smile') { g.beginPath(); g.moveTo(S * 0.39, my - S * 0.02); g.quadraticCurveTo(S * 0.5, my + S * 0.07, S * 0.61, my - S * 0.02); g.stroke(); }
  else if (f.mouth === 'o') { g.fillStyle = dark; g.beginPath(); g.ellipse(S * 0.5, my + S * 0.01, S * 0.05, S * 0.065 * (0.7 + 0.3 * op), 0, 0, 7); g.fill(); g.stroke(); }
  else if (f.mouth === 'grin') { g.fillStyle = dark; g.beginPath(); g.moveTo(S * 0.36, my - S * 0.04); g.quadraticCurveTo(S * 0.5, my + S * 0.16, S * 0.64, my - S * 0.04); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(S * 0.38, my - S * 0.035); g.lineTo(S * 0.62, my - S * 0.035); g.lineTo(S * 0.6, my); g.lineTo(S * 0.4, my); g.closePath(); g.fill(); g.fillStyle = tongue; g.beginPath(); g.ellipse(S * 0.5, my + S * 0.06, S * 0.06, S * 0.025, 0, 0, 7); g.fill(); }
  else if (f.mouth === 'shout' || f.mouth === 'talk') { const h = f.mouth === 'shout' ? S * (0.07 + 0.05 * op) : S * (0.015 + 0.05 * op), w = f.mouth === 'shout' ? S * 0.085 : S * 0.07; g.fillStyle = dark; g.beginPath(); g.ellipse(S * 0.5, my + S * 0.01, w, h, 0, 0, 7); g.fill(); g.stroke(); if (h > S * 0.04) { g.fillStyle = tongue; g.beginPath(); g.ellipse(S * 0.5, my + h * 0.6, w * 0.6, h * 0.3, 0, 0, 7); g.fill(); } }
}

// ---------------------------------------------------------------- blocky characters
function character(o) {
  const grp = new THREE.Group(); const skin = toon(o.skin), shirt = toon(o.shirt), cuff = toon(o.cuff || o.shirt);
  const torso = mesh(rbox(1.3, 1.3, 0.66, 0.1), shirt, {pos: [0, 0.65, 0]}); grp.add(torso);
  if (o.torsoDecal) torso.add(decal(o.torsoDecal, 1.22, 1.22, {pos: [0, 0, 0.335]}));
  const head = new THREE.Group(); head.position.set(0, 1.86, 0); grp.add(head);
  head.add(mesh(rbox(1.08, 1.0, 1.0, 0.16, 5), skin, {outline: 'thick'}));
  const ftex = canvasTex(512, 512, () => {}); head.add(decal(ftex, 0.98, 0.98, {pos: [0, 0, 0.503]}));
  if (o.hair) o.hair(head);
  const arms = [];
  [-1, 1].forEach(d => { const a = new THREE.Group(); a.position.set(d * 0.98, 1.22, 0); a.add(mesh(rbox(0.62, 0.95, 0.62, 0.09), shirt, {pos: [0, -0.45, 0]}), mesh(rbox(0.66, 0.2, 0.66, 0.06), cuff, {pos: [0, -0.88, 0]})); const hand = mesh(rbox(0.6, 0.42, 0.6, 0.12), skin, {pos: [0, -1.18, 0]}); a.add(hand); a.userData.hand = hand; grp.add(a); arms.push(a); });
  const base = Object.assign({}, o.face);
  grp.userData = {head, arms, torso, setFace(p) { const f = Object.assign({}, base, p); const key = JSON.stringify(f); if (key !== this._k) { this._k = key; drawFace(ftex.image.getContext('2d'), 512, f); ftex.needsUpdate = true; } },
    pose(p) { const [l, r] = arms; if (p.l) l.rotation.set(...p.l); if (p.r) r.rotation.set(...p.r); if (p.head) head.rotation.set(...p.head); }};
  grp.userData.setFace({});
  return grp;
}

// ---------------------------------------------------------------- textures
const wallTex = canvasTex(1024, 1024, (g, w, h) => { g.fillStyle = '#f7dfa6'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(255,255,255,.2)'; for (let x = 0; x < w; x += 128) g.fillRect(x, 0, 52, h); });
wallTex.wrapS = wallTex.wrapT = THREE.RepeatWrapping; wallTex.repeat.set(6, 2);
const chalkTex = canvasTex(1400, 900, (g, w, h) => { g.fillStyle = '#2f6b52'; g.fillRect(0, 0, w, h); for (let i = 0; i < 1800; i++) { g.fillStyle = `rgba(255,255,255,${0.02 + rnd(i) * 0.05})`; g.fillRect(rnd(i + 1) * w, rnd(i + 2) * h, 3, 3); }
  g.fillStyle = 'rgba(255,255,255,.08)'; for (let i = 0; i < 6; i++) { g.save(); g.translate(rnd(i) * w, rnd(i + 7) * h); g.rotate(-0.2); g.fillRect(-160, -24, 320, 48); g.restore(); }
  const chalk = (txt, x, y, size, col) => { g.font = `700 ${size}px Caveat`; g.textAlign = 'center'; g.fillStyle = col; g.fillText(txt, x, y); g.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 2500; i++) { g.fillStyle = `rgba(0,0,0,${rnd(i * 3) * 0.6})`; g.fillRect(x - size * 2.5 + rnd(i * 5) * size * 5, y - size + rnd(i * 7) * size * 1.2, 2, 2); } g.globalCompositeOperation = 'source-over'; };
  chalk('NO GAMES', w / 2, 330, 210, '#f4f1e6'); chalk('IN CLASS!', w / 2, 560, 190, '#f4f1e6');
  g.strokeStyle = 'rgba(255,170,190,.9)'; g.lineWidth = 12; g.lineCap = 'round'; g.beginPath(); for (let x = 360; x < 1060; x += 20) g.lineTo(x, 625 + Math.sin(x / 26) * 12); g.stroke(); });
const alphaTex = canvasTex(2048, 160, (g, w, h) => { const L = 'AaBbCcDdEeFfGgHhIiJjKk'; const cols = ['#ff6b6b', '#ffd23f', '#3fe08a', '#3a86ff', '#c77dff']; for (let i = 0; i < 11; i++) { g.fillStyle = cols[i % 5]; g.fillRect(i * 186 + 6, 10, 174, 140); g.fillStyle = '#fff'; g.fillRect(i * 186 + 18, 22, 150, 116); g.font = '90px Lilita'; g.textAlign = 'center'; g.fillStyle = INKC; g.fillText(L[i * 2] + L[i * 2 + 1], i * 186 + 93, 112); } });
const winTex = canvasTex(600, 900, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#7fd3ff'); gr.addColorStop(1, '#d8f3ff'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; [[120, 160], [400, 260]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 50, 0, 7); g.arc(x + 50, y - 20, 55, 0, 7); g.arc(x + 100, y, 45, 0, 7); g.fill(); });
  g.fillStyle = '#7bc96f'; g.fillRect(0, 700, w, 200); g.fillStyle = '#6a4630'; g.fillRect(270, 520, 40, 260); g.fillStyle = '#4fb05c'; g.beginPath(); g.arc(290, 470, 150, 0, 7); g.fill(); g.fillStyle = '#ff6b6b'; [[240, 430], [340, 500], [300, 380], [220, 520]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 16, 0, 7); g.fill(); }); });
const clockTex = canvasTex(256, 256, (g, w) => { g.fillStyle = '#fff'; g.beginPath(); g.arc(128, 128, 120, 0, 7); g.fill(); g.lineWidth = 12; g.strokeStyle = INKC; g.stroke(); for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; g.lineWidth = 6; g.beginPath(); g.moveTo(128 + Math.sin(a) * 90, 128 - Math.cos(a) * 90); g.lineTo(128 + Math.sin(a) * 105, 128 - Math.cos(a) * 105); g.stroke(); } g.lineWidth = 9; g.beginPath(); g.moveTo(128, 128); g.lineTo(128 + 50, 128 - 30); g.moveTo(128, 128); g.lineTo(128 - 10, 128 - 85); g.stroke(); });
const zTex = canvasTex(512, 512, (g, w) => { g.fillStyle = 'rgba(255,255,255,.1)'; for (let x = 0; x < w; x += 64) g.fillRect(x, 0, 28, w); g.font = '330px Lilita'; g.textAlign = 'center'; g.shadowColor = '#e9b8ff'; g.shadowBlur = 40; g.fillStyle = '#fff'; g.fillText('Z', w / 2, 370); g.shadowBlur = 0; g.lineWidth = 12; g.strokeStyle = INKC; g.strokeText('Z', w / 2, 370); g.strokeStyle = '#f2ecff'; g.lineWidth = 10; g.beginPath(); g.moveTo(200, 0); g.lineTo(200, 120); g.moveTo(312, 0); g.lineTo(312, 120); g.stroke(); });
const cardiTex = canvasTex(512, 512, (g, w) => { g.fillStyle = '#fff'; g.beginPath(); g.moveTo(170, 0); g.lineTo(256, 150); g.lineTo(342, 0); g.closePath(); g.fill(); g.lineWidth = 8; g.strokeStyle = INKC; g.stroke(); g.strokeStyle = 'rgba(0,0,0,.18)'; g.lineWidth = 10; g.beginPath(); g.moveTo(256, 150); g.lineTo(256, 512); g.stroke(); g.fillStyle = '#fff6e0'; [210, 300, 390, 470].forEach(y => { g.beginPath(); g.arc(280, y, 16, 0, 7); g.fill(); g.lineWidth = 5; g.strokeStyle = INKC; g.stroke(); });
  g.fillStyle = '#ff5a5a'; g.beginPath(); g.arc(150, 260, 34, 0, 7); g.fill(); g.lineWidth = 6; g.stroke(); g.fillStyle = '#3fae52'; g.beginPath(); g.ellipse(166, 222, 16, 8, -0.5, 0, 7); g.fill(); });
// tablet game screen (drawn each frame)
const gameCan = document.createElement('canvas'); gameCan.width = 640; gameCan.height = 420; const gg = gameCan.getContext('2d'); const gameTex = new THREE.CanvasTexture(gameCan); gameTex.colorSpace = THREE.SRGBColorSpace;
function drawGame(t, k = 1) { const w = 640, h = 420, g = gg; const sky = g.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#ffb35c'); sky.addColorStop(0.55, '#ff7a3d'); sky.addColorStop(1, '#ff5a2a'); g.fillStyle = sky; g.fillRect(0, 0, w, h);
  g.fillStyle = '#ff3d1f'; g.fillRect(0, h * 0.7, w, h * 0.3); g.fillStyle = '#ffd23f'; for (let i = 0; i < 14; i++) { const x = (i * 97 + t * 40) % (w + 40) - 20, y = h * 0.74 + (i % 3) * 28; g.beginPath(); g.ellipse(x, y, 22, 7, 0, 0, 7); g.fill(); }
  const plats = [[60, 250, '#3a86ff'], [210, 220, '#ff6bd6'], [350, 240, '#3fe08a'], [500, 200, '#ffd23f']]; plats.forEach(([x, y, c], i) => { g.fillStyle = c; g.strokeStyle = INKC; g.lineWidth = 5; g.beginPath(); g.roundRect(x - 55, y, 110, 26, 8); g.fill(); g.stroke(); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x - 40, y + 26, 80, h * 0.7 - y - 26); });
  g.fillStyle = '#fff'; g.strokeStyle = INKC; g.lineWidth = 5; g.fillRect(560, 120, 8, 80); for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { g.fillStyle = (r + c) % 2 ? '#fff' : '#222'; g.fillRect(568 + c * 14, 120 + r * 12, 14, 12); }
  const jt = (t * 0.9) % 1, ax = 350 + (500 - 350) * jt, ay = 240 - Math.sin(jt * Math.PI) * 110 - 34;
  g.fillStyle = '#f6cf47'; g.beginPath(); g.roundRect(ax - 12, ay - 26, 24, 24, 5); g.fill(); g.stroke(); g.fillStyle = '#6a2fe0'; g.beginPath(); g.roundRect(ax - 15, ay - 2, 30, 30, 5); g.fill(); g.stroke();
  g.fillStyle = 'rgba(20,10,40,.7)'; g.beginPath(); g.roundRect(14, 12, 230, 44, 12); g.fill(); g.font = '30px Lilita'; g.fillStyle = '#fff'; g.textAlign = 'left'; g.fillText('STAGE 99/100', 28, 45);
  g.fillStyle = 'rgba(20,10,40,.7)'; g.beginPath(); g.roundRect(w - 170, 12, 156, 44, 12); g.fill(); g.fillStyle = '#ffd23f'; g.fillText('FINISH ▶', w - 156, 45);
  gameTex.needsUpdate = true; }

// ---------------------------------------------------------------- the classroom
const set = new THREE.Group(); scene.add(set);
const floorTex = canvasTex(1024, 1024, (g, w, h) => { g.fillStyle = '#d99a5c'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(110,55,30,.35)'; g.lineWidth = 6; for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(0, i * h / 8); g.lineTo(w, i * h / 8); g.stroke(); } for (let i = 0; i < 24; i++) { const y = Math.floor(i / 3) * h / 8, x = (i * 397) % w; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + h / 8); g.stroke(); } });
floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping; floorTex.repeat.set(3, 2);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 20), new THREE.MeshToonMaterial({map: floorTex, gradientMap: ramp})); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; set.add(floor);
const wall = new THREE.Mesh(new THREE.PlaneGeometry(40, 12), new THREE.MeshToonMaterial({map: wallTex, gradientMap: ramp})); wall.position.set(0, 6, -3); wall.receiveShadow = true; set.add(wall);
set.add(mesh(rbox(40, 0.4, 0.2, 0.04), toon('#e2a86e'), {pos: [0, 0.2, -2.85], outline: 'thin'}));
set.add(mesh(rbox(40, 1.9, 0.1, 0.02), toon('#f2c98c'), {pos: [0, 0.95, -2.93], outline: false}));
// chalkboard
const board = new THREE.Group(); board.position.set(-0.6, 4.75, -2.8); set.add(board);
board.add(mesh(rbox(5.2, 3.4, 0.16, 0.06), toon('#b9773f'), {outline: 'thin'})); board.add(decal(chalkTex, 4.8, 3.0, {pos: [0, 0, 0.09]}));
board.add(mesh(rbox(4.8, 0.14, 0.3, 0.04), toon('#b9773f'), {pos: [0, -1.75, 0.14], outline: 'thin'}));
// alphabet strip, clock, window
set.add(decal(alphaTex, 12, 0.94, {pos: [1.5, 7.35, -2.84]}));
const clock = new THREE.Group(); clock.position.set(3.6, 6.5, -2.8); set.add(clock); clock.add(mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.14, 32), toon('#3a86ff'), {rot: [Math.PI / 2, 0, 0], outline: 'thin'})); clock.add(decal(clockTex, 1.08, 1.08, {pos: [0, 0, 0.09]}));
const win = new THREE.Group(); win.position.set(3.6, 4.2, -2.8); set.add(win);
win.add(mesh(rbox(2.3, 3.2, 0.16, 0.06), toon('#ffffff'), {outline: 'thin'})); win.add(decal(winTex, 2.0, 2.9, {pos: [0, 0, 0.09]}));
win.add(mesh(rbox(0.12, 2.9, 0.16, 0.03), toon('#ffffff'), {pos: [0, 0, 0.1], outline: 'thin'})); win.add(mesh(rbox(2.0, 0.12, 0.16, 0.03), toon('#ffffff'), {pos: [0, 0.2, 0.1], outline: 'thin'}));
const awn = canvasTex(256, 128, (g, w) => { g.fillStyle = '#ff7a59'; g.beginPath(); g.moveTo(0, 0); g.lineTo(w, 0); g.lineTo(w, 70); for (let x = w; x >= 0; x -= 32) g.quadraticCurveTo(x - 16, 120, x - 32, 70); g.closePath(); g.fill(); g.strokeStyle = INKC; g.lineWidth = 6; g.stroke(); g.fillStyle = 'rgba(255,255,255,.55)'; for (let x = 0; x < w; x += 64) g.fillRect(x, 0, 32, 70); });
win.add(decal(awn, 2.7, 0.9, {pos: [0, 1.7, 0.2]}));
// teacher desk
const desk = new THREE.Group(); desk.position.set(0.4, 0, 0.8); set.add(desk);
const wood = toon('#c47a45'), woodD = toon('#a9643a'), TOP = 1.72;
desk.add(mesh(rbox(3.9, 0.2, 1.7, 0.06), wood, {pos: [0, 1.62, 0]})); desk.add(mesh(rbox(3.6, 1.5, 1.45, 0.06), woodD, {pos: [0, 0.78, -0.05]}));
[[-1.1, 1.15], [-1.1, 0.55], [1.1, 1.15], [1.1, 0.55]].forEach(([x, y]) => { desk.add(mesh(rbox(1.15, 0.48, 0.08, 0.05), wood, {pos: [x, y, 0.71], outline: 'thin'})); desk.add(mesh(rbox(0.28, 0.07, 0.08, 0.03), toon('#f2d38b'), {pos: [x, y, 0.78], outline: 'thin'})); });
desk.add(mesh(rbox(0.95, 1.1, 0.08, 0.06), wood, {pos: [0, 0.85, 0.71], outline: 'thin'}));
const starTex = canvasTex(256, 256, (g, w) => { g.translate(w / 2, w / 2); g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 48 : 112; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.fillStyle = '#ffd23f'; g.fill(); g.lineWidth = 12; g.strokeStyle = INKC; g.lineJoin = 'round'; g.stroke(); });
desk.add(decal(starTex, 0.62, 0.62, {pos: [0, 0.88, 0.76]}));
const apple = new THREE.Group(); apple.position.set(-1.45, TOP + 0.2, 0.3); desk.add(apple); apple.add(mesh(new THREE.SphereGeometry(0.22, 18, 14), toon('#ff4d4d'), {outline: 'thin'})); apple.add(mesh(rbox(0.04, 0.14, 0.04, 0.01), toon('#6a4630'), {pos: [0, 0.24, 0], outline: 'thin'})); apple.add(mesh(new THREE.SphereGeometry(0.07, 8, 6), toon('#3fae52'), {pos: [0.08, 0.25, 0], outline: 'thin'}));
const cup = new THREE.Group(); cup.position.set(-0.9, TOP + 0.25, -0.35); desk.add(cup); cup.add(mesh(new THREE.CylinderGeometry(0.2, 0.18, 0.46, 20), toon('#3a86ff'), {outline: 'thin'})); ['#ff5e7e', '#ffd23f', '#3fe08a'].forEach((c, i) => cup.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.55, 8), toon(c), {pos: [(i - 1) * 0.08, 0.35, 0], rot: [0, 0, (i - 1) * 0.15], outline: 'thin'})));
[['#ff5e7e', 0.0], ['#5bd28a', 0.12], ['#ffd23f', 0.24], ['#7a5bff', 0.36]].forEach(([c, y], i) => desk.add(mesh(rbox(0.95, 0.12, 0.62, 0.03), toon(c), {pos: [1.4 + (i % 2) * 0.05, TOP + 0.08 + y, -0.1], rot: [0, 0.1 * (i - 1.5), 0], outline: 'thin'})));
const papers = []; for (let i = 0; i < 5; i++) { const p = mesh(rbox(0.6, 0.02, 0.8, 0.01), toon('#ffffff'), {outline: 'thin'}); desk.add(p); papers.push(p); }
// student area (left part of the same room): blue desk + classmates
const sdesk = new THREE.Group(); sdesk.position.set(-8.5, 0, 0.6); set.add(sdesk);
sdesk.add(mesh(rbox(2.6, 0.16, 1.5, 0.05), toon('#3a86ff'), {pos: [0, 1.45, 0]})); [-1, 1].forEach(d => sdesk.add(mesh(rbox(0.16, 1.4, 1.2, 0.04), toon('#2a63c9'), {pos: [d * 1.1, 0.7, 0], outline: 'thin'})));
const boltTex = canvasTex(256, 256, (g) => { g.fillStyle = '#fff'; g.beginPath(); g.arc(128, 128, 100, 0, 7); g.fill(); g.lineWidth = 10; g.strokeStyle = INKC; g.stroke(); g.fillStyle = '#ff6b2b'; g.beginPath(); g.moveTo(140, 50); g.lineTo(90, 140); g.lineTo(125, 140); g.lineTo(110, 210); g.lineTo(170, 110); g.lineTo(135, 110); g.closePath(); g.fill(); g.lineWidth = 6; g.stroke(); });
sdesk.add(decal(boltTex, 0.5, 0.5, {pos: [0.95, 1.0, 0.75]}));
const poster = canvasTex(512, 640, (g, w, h) => { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.fillStyle = '#ffd23f'; g.fillRect(0, 0, w, 140); g.font = '110px Lilita'; g.textAlign = 'center'; g.fillStyle = INKC; g.fillText('READ!', w / 2, 110); g.fillStyle = '#3a86ff'; for (let i = 0; i < 4; i++) g.fillRect(70, 200 + i * 100, 370 - i * 50, 34); });
set.add(mesh(rbox(1.9, 2.4, 0.08, 0.04), toon('#ffffff'), {pos: [-10.5, 4.3, -2.85], outline: 'thin'})); set.add(decal(poster, 1.8, 2.25, {pos: [-10.5, 4.3, -2.8]}));
set.add(mesh(rbox(3.4, 2.4, 0.14, 0.05), toon('#c47a45'), {pos: [-6.6, 4.5, -2.85], outline: 'thin'})); set.add(decal(canvasTex(700, 480, (g, w, h) => { g.fillStyle = '#e8c08a'; g.fillRect(0, 0, w, h); const cs = ['#ff6b6b', '#3fe08a', '#3a86ff', '#ffd23f']; for (let i = 0; i < 6; i++) { g.save(); g.translate(80 + (i % 3) * 220, 110 + Math.floor(i / 3) * 220); g.rotate((rnd(i) - .5) * .3); g.fillStyle = '#fff'; g.fillRect(-80, -80, 160, 160); g.fillStyle = cs[i % 4]; g.fillRect(-60, -55, 120, 30); g.fillRect(-60, -10, 90, 18); g.fillRect(-60, 20, 110, 18); g.restore(); } }), 3.2, 2.2, {pos: [-6.6, 4.5, -2.77]}));
// tablet prop
const tablet = new THREE.Group(); set.add(tablet);
tablet.add(mesh(rbox(1.15, 0.08, 0.8, 0.06), toon('#2f5bd8'), {outline: 'thin'}));
tablet.add(decal(gameTex, 1.0, 0.66, {pos: [0, 0.045, 0], rot: [-Math.PI / 2, 0, 0]}));
const back = decal(boltTex, 0.42, 0.42, {pos: [0, -0.045, 0], rot: [Math.PI / 2, 0, 0]}); tablet.add(back);

// ---------------------------------------------------------------- characters (original designs)
const teacher = character({skin: '#c98b66', shirt: '#e0a53a', cuff: '#c98d2a', torsoDecal: cardiTex,
  face: {eyes: 'half', lid: '#b57656', iris: '#3a2418', brow: '#2e1a14', browL: 0.6, browR: 0.6, mouth: 'flat', lashes: true, glasses: '#2fb4a6', fringe: {color: '#3a2219', style: 'curls'}},
  hair(h) { const hm = toon('#3a2219'); h.add(mesh(rbox(1.2, 0.32, 1.1, 0.14), hm, {pos: [0, 0.5, -0.03], outline: 'thick'}));
    [-1, 1].forEach(d => h.add(mesh(rbox(0.34, 1.0, 1.0, 0.16), hm, {pos: [d * 0.66, 0.08, -0.04], outline: 'mid'})));
    for (let i = 0; i < 6; i++) { const a = i / 5 * Math.PI; h.add(mesh(new THREE.SphereGeometry(0.2, 12, 10), hm, {pos: [Math.cos(a) * 0.62, 0.55 + Math.sin(a) * 0.12, -0.25], outline: 'thin'})); }
    h.add(mesh(rbox(1.2, 1.1, 0.34, 0.15), hm, {pos: [0, 0.0, -0.6], outline: 'mid'})); } });
teacher.position.set(0.5, 1.42, -0.15); scene.add(teacher);
const kid = character({skin: '#f8e3c8', shirt: '#5a2fc2', cuff: '#4a24a8', torsoDecal: zTex,
  face: {eyes: 'normal', iris: '#5a3a28', brow: '#5a3020', mouth: 'smile', fringe: {color: '#8a4b26', style: 'wavy'}},
  hair(h) { const hk = toon('#8a4b26'); h.add(mesh(rbox(1.2, 0.32, 1.1, 0.14, 5), hk, {pos: [0, 0.5, 0], outline: 'thick'}));
    const hp = toon('#2c2c4f'), neon = new THREE.MeshBasicMaterial({color: '#d28bff'});
    h.add(mesh(new THREE.TorusGeometry(0.66, 0.06, 10, 30, Math.PI), hp, {pos: [0, 0.1, 0], outline: 'thin'}));
    [-1, 1].forEach(d => { const c = mesh(rbox(0.22, 0.48, 0.48, 0.08), hp, {pos: [d * 0.63, 0, 0], outline: 'mid'}); c.add(new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.3, 0.06), neon)).position.set(d * 0.12, 0, 0); h.add(c); }); } });
kid.position.set(-8.5, 1.05, -0.35); scene.add(kid);
const mates = [];
[['#ff6b6b', '#f1c27d', -10.6, -1.6], ['#3fe08a', '#8d5524', -6.4, -1.7], ['#ffd23f', '#e0ac69', -11.4, 0.2]].forEach(([shirt, skin, x, z], i) => { const m = character({skin, shirt, face: {eyes: 'normal', mouth: i === 1 ? 'o' : 'smile', fringe: {color: ['#2b1d14', '#1d1d1d', '#6b3a1e'][i], style: 'wavy'}},
  hair(h) { h.add(mesh(rbox(1.2, 0.32, 1.1, 0.14), toon(['#2b1d14', '#1d1d1d', '#6b3a1e'][i]), {pos: [0, 0.5, 0], outline: 'thick'})); } }); m.position.set(x, 0.95, z); m.rotation.y = i === 1 ? -0.4 : 0.35; scene.add(m); mates.push(m); });

// ---------------------------------------------------------------- lights
scene.add(new THREE.HemisphereLight('#fff6e8', '#9a6a4a', 1.3));
const sun = new THREE.DirectionalLight('#fff3e0', 2.0); sun.position.set(-3, 10, 8); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096);
Object.assign(sun.shadow.camera, {left: -15, right: 8, top: 9, bottom: -3, near: 0.5, far: 40}); sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.02; scene.add(sun); sun.target.position.set(-3, 0, 0); scene.add(sun.target);

// ---------------------------------------------------------------- captions (the channel's on-screen words and colours)
const CAPS = [
  [0.2, 0.7, 'What if', '#ffffff'], [0.7, 0.8, 'your', '#ffffff'], [0.8, 1.2, 'TEACHER', '#ffd23f'], [1.2, 1.6, 'played', '#ffffff'], [1.6, 2.3, 'Roblox?', '#57e389'],
  [2.3, 3.1, 'No Roblox', '#ff9d2e'], [3.1, 3.7, 'in MY', '#ffffff'], [3.7, 4.4, 'class.', '#ffffff'], [4.4, 5.1, 'Hand it over.', '#3fe0c8'], [5.3, 5.9, 'Noooo!', '#4fb8ff'],
  [5.9, 6.7, "I'm ONE", '#ffffff'], [6.7, 7.1, 'jump', '#57e389'], [7.1, 7.6, 'from the', '#ffffff'], [7.6, 8.3, 'end!', '#ffd23f'], [9.3, 9.7, 'she checks', '#ffffff'], [9.7, 10.4, 'your tablet...', '#ffffff']];
function captions(t) { oc.clearRect(0, 0, W, H); const c = CAPS.find(c => t >= c[0] && t < c[1]); if (!c) return; const u = Math.min(1, (t - c[0]) / 0.16); const k = 1 + 2.70158 * Math.pow(u - 1, 3) + 1.70158 * Math.pow(u - 1, 2);
  oc.save(); oc.translate(W / 2, H * 0.66); oc.scale(0.35 + 0.65 * k, 0.35 + 0.65 * k); oc.rotate((1 - k) * -0.12); oc.font = '138px Lilita'; oc.textAlign = 'center'; oc.textBaseline = 'middle'; oc.lineJoin = 'round';
  oc.lineWidth = 30; oc.strokeStyle = '#1a0d22'; oc.strokeText(c[2], 0, 0); oc.fillStyle = c[3]; oc.fillText(c[2], 0, 0); oc.restore(); }

// ---------------------------------------------------------------- shots
const talk = (t, on) => on ? 0.25 + 0.75 * Math.abs(Math.sin(t * 17)) : 0.15;
const deskPos = new THREE.Vector3(0.4, 0, 0.8);
function camShot(p0, l0, p1, l1, u, fov = 30) { const e = sm(u); camera.position.set(lerp(p0[0], p1[0], e), lerp(p0[1], p1[1], e), lerp(p0[2], p1[2], e)); camera.lookAt(lerp(l0[0], l1[0], e), lerp(l0[1], l1[1], e), lerp(l0[2], l1[2], e)); camera.fov = fov; camera.updateProjectionMatrix(); }
const T = teacher.userData, K = kid.userData;
function setTablet(p, r) { tablet.position.set(...p); tablet.rotation.set(...r); }
const SHOTS = [
  {t0: 0.0, t1: 0.82, run(t, u) { camShot([0.6, 3.5, 7.4], [0.4, 3.0, -0.4], [0.5, 3.45, 6.8], [0.4, 3.0, -0.4], u); // grading papers
    T.setFace({eyes: 'half', look: [0, 1], mouth: 'smirk', browL: 0.4, browR: 0.4}); T.pose({l: [-1.15, 0, 0.2], r: [-1.25 + Math.sin(t * 14) * 0.06, 0, -0.25 + Math.sin(t * 9) * 0.05], head: [0.18, 0, 0]}); setTablet([-20, 0, 0], [0, 0, 0]); } },
  {t0: 0.82, t1: 1.55, run(t, u) { camShot([0.9, 3.55, 5.6], [0.45, 3.25, -0.2], [0.8, 3.5, 5.1], [0.45, 3.25, -0.2], u, 30); // sly side-eye
    T.setFace({eyes: 'half', look: [1, 0], mouth: 'smirk', browL: 0.7, browR: -0.3, raise: 0.4}); T.pose({l: [-1.15, 0, 0.2], r: [-1.2, 0, -0.25], head: [0.03, -0.18, 0.06]}); } },
  {t0: 1.55, t1: 2.27, run(t, u) { camShot([0.5, 3.3, 6.2], [0.4, 3.0, -0.3], [0.5, 3.4, 5.2], [0.4, 3.1, -0.3], u, 31); // gasp: papers fly
    T.setFace({eyes: 'wide', look: [0, 0.3], mouth: 'o', open: 0.9, browL: -0.6, browR: -0.6, raise: 1.0, glint: true}); T.pose({l: [-1.6, 0, 0.5], r: [-1.6, 0, -0.5], head: [-0.06, 0, 0]});
    papers.forEach((p, i) => { const k = Math.max(0, (t - 1.6)) * 1.0; p.position.set(-0.4 + i * 0.3 + (rnd(i) - .5) * k * 1.4, TOP + 0.06 + k * (1.8 + rnd(i + 3)) - k * k * 1.2, 0.3 + (rnd(i + 5) - .5) * k); p.rotation.set(k * (2 + i), k * (1 + rnd(i)), k * 3 * (rnd(i + 9) - .5)); }); } },
  {t0: 2.27, t1: 2.53, run(t, u) { camShot([1.4, 2.6, 4.2], [0.4, 3.4, -0.2], [1.3, 2.6, 4.0], [0.4, 3.4, -0.2], u, 34); // low angle, pointing
    T.setFace({eyes: 'half', look: [0, -0.2], mouth: 'shout', open: talk(t, true), browL: 1.2, browR: 1.2}); T.pose({l: [-1.15, 0, 0.2], r: [-2.0, 0, -0.1], head: [-0.1, 0, 0]}); } },
  {t0: 2.53, t1: 4.35, run(t, u) { camShot([-8.0, 3.0, 6.0], [-8.5, 2.6, -0.2], [-8.1, 3.0, 5.4], [-8.5, 2.6, -0.2], u, 32); // kid caught, teacher's arm enters frame
    K.setFace({eyes: 'big', look: [0.6, -0.3], mouth: 'wobble', browL: -1.0, browR: -1.0, tears: false}); K.pose({l: [-0.9, 0, 0.35], r: [-0.9, 0, -0.35], head: [0.05, -0.15, 0]});
    setTablet([-8.5, 2.25, 0.65], [-0.9, 0, 0]);
    teacher.position.set(-5.9, 1.35, 1.6); teacher.rotation.y = -0.5; T.setFace({eyes: 'half', mouth: 'talk', open: talk(t, t > 2.3 && t < 4.3), browL: 1.1, browR: 1.1}); T.pose({l: [-0.2, 0, 0.1], r: [-1.65, 0.3, -0.4], head: [0, 0, 0]});
    mates.forEach((m, i) => m.userData.setFace({eyes: 'wide', mouth: 'o', look: [0.5, 0]})); } },
  {t0: 4.35, t1: 5.07, run(t, u) { camShot([-6.6, 3.4, 4.0], [-6.0, 3.0, 1.2], [-6.8, 3.35, 3.5], [-6.0, 3.05, 1.2], u, 32); // "Hand it over."
    T.setFace({eyes: 'half', look: [-0.6, 0.2], mouth: 'grin', browL: 0.8, browR: -0.2, raise: 0.3}); T.pose({l: [-0.2, 0, 0.1], r: [-1.45, 0.5, -0.2], head: [0.05, 0.25, 0.05]}); } },
  {t0: 5.07, t1: 5.9, run(t, u) { camShot([-8.5, 3.0, 4.2], [-8.5, 2.75, -0.3], [-8.5, 2.95, 3.7], [-8.5, 2.75, -0.3], u, 32); // "Noooo!" hugging the tablet
    K.setFace({eyes: 'big', look: [0, 0], mouth: 'shout', open: talk(t, true), browL: -1.2, browR: -1.2, tears: true, tearT: t}); K.pose({l: [-1.25, 0, 0.95], r: [-1.25, 0, -0.95], head: [0, Math.sin(t * 20) * 0.08, 0]});
    setTablet([-8.5, 1.95, 0.25], [-1.35, 0, 0]); teacher.position.set(-20, 0, 0); } },
  {t0: 5.9, t1: 7.08, run(t, u) { camShot([-8.5, 2.95, 2.05], [-8.5, 2.2, 0.65], [-8.5, 2.9, 1.8], [-8.5, 2.2, 0.65], u, 30); // the screen: one jump from the end
    K.pose({l: [-0.9, 0, 0.35], r: [-0.9, 0, -0.35], head: [0.25, 0, 0]}); setTablet([-8.5, 2.2, 0.65], [-0.62, 0, 0]); } },
  {t0: 7.08, t1: 7.62, run(t, u) { camShot([-8.5, 3.1, 3.2], [-8.5, 3.0, -0.3], [-8.5, 3.05, 2.9], [-8.5, 3.0, -0.3], u, 30); // pleading close-up
    K.setFace({eyes: 'big', look: [0.4, -0.5], mouth: 'talk', open: talk(t, true), browL: -1.3, browR: -1.3, tears: true, tearT: t}); K.pose({l: [-1.25, 0, 0.95], r: [-1.25, 0, -0.95], head: [-0.08, 0.12, 0]}); setTablet([-8.5, 1.95, 0.25], [-1.35, 0, 0]); } },
  {t0: 7.62, t1: 8.28, run(t, u) { camShot([-8.5, 3.0, 4.6], [-8.5, 2.9, -0.3], [-8.5, 3.0, 4.3], [-8.5, 2.95, -0.3], u, 32); // tablet yanked up and out
    const y = sm((t - 7.75) / 0.4); K.setFace({eyes: 'wide', look: [0, -1], mouth: 'shout', open: talk(t, true), browL: -1.3, browR: -1.3, tears: true, tearT: t, raise: 0.6}); K.pose({l: [-1.25 - y * 1.4, 0, 0.95 - y * 0.6], r: [-1.25 - y * 1.4, 0, -0.95 + y * 0.6], head: [-0.3 * y, 0, 0]});
    setTablet([-8.5 + y * 1.6, 1.95 + y * 3.2, 0.25 + y * 0.4], [-1.35 + y * 3, y * 2, y]); } },
  {t0: 8.28, t1: 9.28, run(t, u) { camShot([0.4, 3.6, 7.8], [0.2, 3.0, -0.5], [0.35, 3.55, 7.2], [0.2, 3.0, -0.5], u, 31); // back at her desk with the tablet
    teacher.position.set(0.5, 1.42, -0.15); teacher.rotation.y = 0; T.setFace({eyes: 'half', look: [0, 1], mouth: 'smirk', browL: 0.5, browR: 0.5}); T.pose({l: [-1.18, 0, 0.18], r: [-1.18, 0, -0.18], head: [0.12, 0, 0]});
    setTablet([0.4, TOP + 0.06, 0.95], [0, 0.15, 0]); papers.forEach((p, i) => { p.position.set(1.2 + i * 0.02, TOP + 0.05 + i * 0.025, 0.55); p.rotation.set(0, 0.2 * i, 0); });
    kid.position.set(-1.6, 1.05, -1.1); kid.rotation.y = 0.35; K.setFace({eyes: 'big', look: [0.7, 0.2], mouth: 'wobble', browL: -1.0, browR: -1.0, tears: true, tearT: t}); K.pose({l: [-0.15, 0, 0.1], r: [-0.15, 0, -0.1], head: [0.05, 0.15, -0.05]}); } },
  {t0: 9.28, t1: 10.4, run(t, u) { camShot([0.6, 3.25, 5.0], [0.4, 2.85, 0.1], [0.55, 3.2, 4.4], [0.4, 2.85, 0.1], u, 30); // she checks your tablet...
    T.setFace({eyes: 'normal', look: [0, 1], mouth: 'o', open: 0.3, browL: -0.3, browR: 0.3, raise: 0.5, glint: true}); T.pose({l: [-1.25, 0, 0.3], r: [-1.25, 0, -0.3], head: [0.28, 0, 0]});
    setTablet([0.5, TOP + 0.55, 0.65], [-0.9, 0, 0]); } }
];
window.renderAt = t => {
  drawGame(t);
  // defaults (reset positions each frame so every frame is a pure function of t)
  teacher.position.set(0.5, 1.42, -0.15); teacher.rotation.y = 0; kid.position.set(-8.5, 1.05, -0.35); kid.rotation.y = 0;
  papers.forEach((p, i) => { p.position.set(-0.4 + i * 0.3, TOP + 0.06, 0.3 + (i % 2) * 0.1); p.rotation.set(0, (i - 2) * 0.2, 0); });
  setTablet([-20, 0, 0], [0, 0, 0]); mates.forEach(m => m.userData.setFace({eyes: 'normal', mouth: 'smile'}));
  K.setFace({eyes: 'normal', mouth: 'smile', tears: false, browL: 0, browR: 0, raise: 0, look: [0, 0]});
  const sh = SHOTS.find(s => t >= s.t0 && t < s.t1) || SHOTS[SHOTS.length - 1]; sh.run(t, (t - sh.t0) / (sh.t1 - sh.t0));
  renderer.render(scene, camera); captions(t); return true;
};
window.renderAt(0); window.ready = true;
