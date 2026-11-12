// Zylox block 1 (0-13 s): toon-shaded blocky remake of the channel's own short, synced to its voice track.
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

const W = 1080, H = 1920;
await document.fonts.load('100px Lilita'); await document.fonts.load('700 100px Caveat'); await document.fonts.ready;
const wrap = document.getElementById('wrap');
const renderer = new THREE.WebGLRenderer({antialias: true, preserveDrawingBuffer: true});
renderer.setPixelRatio(1); renderer.setSize(W, H); wrap.appendChild(renderer.domElement);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const ov = document.createElement('canvas'); ov.width = W; ov.height = H; wrap.appendChild(ov); const oc = ov.getContext('2d');
const scene = new THREE.Scene(); scene.background = new THREE.Color('#1c1036');
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
  if (f.scar) { g.strokeStyle = '#e0303f'; g.lineWidth = S * 0.02; const cx = S * (f.scar === 'r' ? 0.78 : 0.22), cy = S * 0.62; g.beginPath(); g.moveTo(cx - S * 0.04, cy - S * 0.04); g.lineTo(cx + S * 0.04, cy + S * 0.04); g.moveTo(cx + S * 0.04, cy - S * 0.04); g.lineTo(cx - S * 0.04, cy + S * 0.04); g.stroke(); }
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
  const legs = [];
  if (o.legs) [-1, 1].forEach(d => { const l = new THREE.Group(); l.position.set(d * 0.33, 0.02, 0); l.add(mesh(rbox(0.62, 1.15, 0.62, 0.09), toon(o.legs), {pos: [0, -0.58, 0]}), mesh(rbox(0.68, 0.3, 0.8, 0.1), toon(o.shoe || '#2a2a3a'), {pos: [0, -1.2, 0.08]})); grp.add(l); legs.push(l); });
  const base = Object.assign({}, o.face);
  grp.userData = {head, arms, legs, torso, setFace(p) { const f = Object.assign({}, base, p); const key = JSON.stringify(f); if (key !== this._k) { this._k = key; drawFace(ftex.image.getContext('2d'), 512, f); ftex.needsUpdate = true; } },
    pose(p) { const [l, r] = arms; if (p.l) l.rotation.set(...p.l); if (p.r) r.rotation.set(...p.r); if (p.head) head.rotation.set(...p.head); if (p.legL && legs[0]) legs[0].rotation.set(...p.legL); if (p.legR && legs[1]) legs[1].rotation.set(...p.legR); }};
  grp.userData.setFace({});
  return grp;
}



// ================================================================ MOM30: "What if MOM let you play Roblox ONLY while the microwave runs?!"
const D = await (await fetch('./dialogue.json')).json();
const put = (p, o, x = 0, y = 0, z = 0) => { o.position.set(x, y, z); p.add(o); return o; };
const neon = c => new THREE.MeshBasicMaterial({color: c});
const OX = 60, KX = 120; // obby / kitchen offsets
const clamp01 = u => Math.max(0, Math.min(1, u));

// ---- characters
const zHoodie = canvasTex(512, 512, (g, w) => { g.fillStyle = 'rgba(255,255,255,.07)'; for (let x = 0; x < w; x += 44) g.fillRect(x, 0, 18, w);
  g.font = '320px Lilita'; g.textAlign = 'center'; g.shadowColor = '#ff7bf2'; g.shadowBlur = 50; g.fillStyle = '#e9a6ff'; g.fillText('Z', w / 2, 380); g.shadowBlur = 0; g.lineWidth = 12; g.strokeStyle = INKC; g.strokeText('Z', w / 2, 380); });
const sweater = canvasTex(512, 512, (g, w) => { g.fillStyle = 'rgba(255,255,255,.1)'; for (let x = 0; x < w; x += 36) g.fillRect(x, 0, 14, w); });
const hero = character({skin: '#f2c9a4', shirt: '#4a2a8c', cuff: '#3a1f72', torsoDecal: zHoodie, legs: '#3a1f72', shoe: '#1d1630',
  face: {eyes: 'normal', iris: '#5a3a28', brow: '#4a2412', mouth: 'smile', fringe: {color: '#8a4417', style: 'wavy'}},
  hair(h) { const hm = toon('#8a4417'); h.add(mesh(rbox(1.2, 0.36, 1.12, 0.14), hm, {pos: [0, 0.5, -0.02], outline: 'thick'}));
    [[-0.45, 0.62, 0.25, 0.7, -0.5], [-0.15, 0.72, 0.3, 0.2, -0.2], [0.2, 0.74, 0.25, -0.2, 0.15], [0.48, 0.6, 0.2, -0.65, 0.4], [0, 0.66, -0.5, 0, -1.1], [-0.62, 0.35, 0, 1.2, 0], [0.62, 0.35, 0, -1.2, 0]].forEach(([x, y, z, rz, rx]) => h.add(mesh(new THREE.ConeGeometry(0.24, 0.62, 5), hm, {pos: [x, y + 0.18, z], rot: [rx, 0, rz], outline: 'mid'})));
    const hp = toon('#241a3a'); h.add(mesh(new THREE.TorusGeometry(0.66, 0.06, 10, 30, Math.PI), hp, {pos: [0, 0.1, 0], outline: 'thin'}));
    [-1, 1].forEach(d => h.add(mesh(rbox(0.22, 0.48, 0.48, 0.08), hp, {pos: [d * 0.63, 0.0, 0], outline: 'mid'}))); } });
scene.add(hero);
const mom = character({skin: '#e8b08a', shirt: '#f0782c', cuff: '#d9651f', torsoDecal: sweater, legs: '#3b5a9c', shoe: '#ffffff',
  face: {eyes: 'half', lid: '#cf9470', iris: '#4a2a1a', brow: '#4a2412', browL: 1.1, browR: 1.1, mouth: 'shout', lashes: true, fringe: {color: '#7a3d1c', style: 'sweep'}},
  hair(h) { const hm = toon('#7a3d1c'); h.add(mesh(rbox(1.2, 0.34, 1.1, 0.14), hm, {pos: [0, 0.5, -0.03], outline: 'thick'}));
    [-1, 1].forEach(d => h.add(mesh(rbox(0.3, 0.9, 0.9, 0.13), hm, {pos: [d * 0.66, 0.1, -0.05], outline: 'mid'})));
    h.add(mesh(new THREE.SphereGeometry(0.34, 16, 12), hm, {pos: [0.05, 0.9, -0.22], outline: 'mid'}));
    [-1, 1].forEach(d => h.add(mesh(new THREE.TorusGeometry(0.1, 0.03, 8, 20), toon('#ffcf3f'), {pos: [d * 0.56, -0.28, 0.1], rot: [0, Math.PI / 2, 0], outline: 'thin'}))); } });
scene.add(mom);
const bro = character({skin: '#f6d2b0', shirt: '#2fa86a', cuff: '#238a55', legs: '#35466e', shoe: '#ffffff',
  face: {eyes: 'wide', iris: '#3a2a1a', brow: '#3a2010', mouth: 'grin', fringe: {color: '#2b2b4a', style: 'curls'}},
  hair(h) { const hm = toon('#2b2b4a'); h.add(mesh(rbox(1.2, 0.3, 1.1, 0.14), hm, {pos: [0, 0.5, 0], outline: 'thick'})); h.add(mesh(new THREE.SphereGeometry(0.3, 12, 10), hm, {pos: [0, 0.78, 0.05], outline: 'mid'})); } });
scene.add(bro);
const H_ = hero.userData, M_ = mom.userData, B_ = bro.userData;
const WHO = {mom: [mom, M_], hero: [hero, H_], bro: [bro, B_]};

// ---- props: pizza on plate
const pizza = new THREE.Group(); { pizza.add(mesh(new THREE.CylinderGeometry(0.78, 0.7, 0.08, 28), toon('#ffffff'), {outline: 'thin'}));
  pizza.add(mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.12, 28), toon('#f4b94a'), {pos: [0, 0.1, 0], outline: 'thin'}));
  pizza.add(mesh(new THREE.TorusGeometry(0.6, 0.07, 8, 28), toon('#d98a2b'), {pos: [0, 0.16, 0], rot: [Math.PI / 2, 0, 0], outline: 'thin'}));
  [[0.2, 0.15], [-0.25, 0.1], [0.05, -0.3], [-0.1, 0.38], [0.36, -0.2], [-0.38, -0.2]].forEach(([x, z]) => pizza.add(mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.03, 12), toon('#d8402f'), {pos: [x, 0.185, z], outline: 'thin'}))); }
scene.add(pizza);

// ================================================================ BEDROOM
const room = new THREE.Group(); scene.add(room);
const wallT = canvasTex(1024, 1024, (g, w, h) => { g.fillStyle = '#2b1a52'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(255,255,255,.035)'; for (let y = 0; y < h; y += 64) for (let x = (y / 64 % 2) * 64; x < w; x += 128) g.fillRect(x, y, 64, 64); });
wallT.wrapS = wallT.wrapT = THREE.RepeatWrapping; wallT.repeat.set(3, 2);
const rWall = new THREE.Mesh(new THREE.PlaneGeometry(16, 10), new THREE.MeshToonMaterial({map: wallT, gradientMap: ramp})); rWall.position.set(0, 5, -3); rWall.receiveShadow = true; room.add(rWall);
const rFloor = new THREE.Mesh(new THREE.PlaneGeometry(16, 12), toon('#3a2a5c')); rFloor.rotation.x = -Math.PI / 2; rFloor.receiveShadow = true; room.add(rFloor);
[[-4.5, '#c25cff'], [-1.2, '#ff5ec8'], [2.2, '#c25cff']].forEach(([x, c]) => put(room, new THREE.Mesh(new THREE.BoxGeometry(0.08, 8, 0.05), neon(c)), x, 4, -2.95));
put(room, new THREE.Mesh(new THREE.BoxGeometry(16, 0.08, 0.05), neon('#8a5cff')), 0, 7.6, -2.95);
const clockT = canvasTex(512, 256, g => { g.fillStyle = '#0d0818'; g.fillRect(0, 0, 512, 256); g.font = '170px Lilita'; g.textAlign = 'center'; g.shadowColor = '#ff3b3b'; g.shadowBlur = 30; g.fillStyle = '#ff5a5a'; g.fillText('3:00', 256, 190); });
const clock = new THREE.Group(); clock.position.set(-3.2, 5.6, -2.85); room.add(clock); clock.add(mesh(rbox(2.4, 1.3, 0.2, 0.08), toon('#15111f'), {outline: 'thin'})); clock.add(decal(clockT, 2.2, 1.1, {pos: [0, 0, 0.12]}));
const dTex = canvasTex(256, 128, g => { g.font = '70px Lilita'; g.fillStyle = '#ff9a9a'; g.fillText('AM', 70, 100); }); clock.add(decal(dTex, 0.7, 0.35, {pos: [0.8, -0.38, 0.13]}));
const door = new THREE.Group(); door.position.set(3.0, 0, -2.9); room.add(door);
put(door, new THREE.Mesh(new THREE.PlaneGeometry(2.2, 4.4), neon('#ffcf8a')), 0, 2.2, 0.02);
[[-1.18, 2.25, 0.16, 4.6], [1.18, 2.25, 0.16, 4.6]].forEach(([x, y, w, h]) => door.add(mesh(rbox(w, h, 0.3, 0.04), toon('#5a3a2a'), {pos: [x, y, 0.1], outline: 'thin'})));
door.add(mesh(rbox(2.5, 0.18, 0.3, 0.04), toon('#5a3a2a'), {pos: [0, 4.5, 0.1], outline: 'thin'}));
const desk = new THREE.Group(); desk.position.set(-0.6, 0, 0.2); room.add(desk);
desk.add(mesh(rbox(4.2, 0.18, 1.6, 0.05), toon('#2a2140'), {pos: [0, 1.6, 0]})); [-1.9, 1.9].forEach(x => desk.add(mesh(rbox(0.16, 1.55, 1.4, 0.04), toon('#221a36'), {pos: [x, 0.78, 0], outline: 'thin'})));
put(desk, new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.04, 0.04), neon('#c25cff')), 0, 1.5, 0.8);
const gameCanvas = document.createElement('canvas'); gameCanvas.width = 640; gameCanvas.height = 400; const gctx = gameCanvas.getContext('2d'); const gameTex = new THREE.CanvasTexture(gameCanvas); gameTex.colorSpace = THREE.SRGBColorSpace;
const monitor = new THREE.Group(); monitor.position.set(0.2, 1.7, -0.35); desk.add(monitor);
monitor.add(mesh(rbox(2.5, 1.55, 0.14, 0.05), toon('#15111f'), {pos: [0, 1.15, 0], outline: 'mid'})); put(monitor, new THREE.Mesh(new THREE.PlaneGeometry(2.32, 1.38), new THREE.MeshBasicMaterial({map: gameTex})), 0, 1.15, 0.075);
monitor.add(mesh(rbox(0.2, 0.4, 0.2, 0.04), toon('#15111f'), {pos: [0, 0.2, 0], outline: 'thin'})); monitor.add(mesh(rbox(0.9, 0.06, 0.5, 0.03), toon('#15111f'), {pos: [0, 0.03, 0], outline: 'thin'}));
const kbT = canvasTex(512, 160, (g, w, h) => { g.fillStyle = '#1a1428'; g.fillRect(0, 0, w, h); for (let r = 0; r < 4; r++) for (let k = 0; k < 14; k++) { g.fillStyle = `hsl(${(k * 24 + r * 40) % 360},95%,62%)`; g.fillRect(10 + k * 35, 10 + r * 36, 28, 28); } });
const kb = new THREE.Group(); kb.position.set(0.1, 1.73, 0.3); desk.add(kb); kb.add(mesh(rbox(1.7, 0.07, 0.55, 0.03), toon('#1a1428'), {outline: 'thin'})); kb.add(decal(kbT, 1.6, 0.48, {pos: [0, 0.04, 0], rot: [-Math.PI / 2, 0, 0]}));
const chair = new THREE.Group(); chair.position.set(-0.4, 0, 2.2); room.add(chair);
chair.add(mesh(rbox(1.5, 0.3, 1.3, 0.1), toon('#2a1f44'), {pos: [0, 1.1, 0]})); chair.add(mesh(rbox(1.5, 1.5, 0.32, 0.14), toon('#2a1f44'), {pos: [0, 1.95, 0.6]}));
function drawGame(t) { const g = gctx, w = 640, h = 400; const sky = g.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#5fc6ff'); sky.addColorStop(1, '#c9b3ff'); g.fillStyle = sky; g.fillRect(0, 0, w, h);
  g.fillStyle = '#ff6a2a'; g.fillRect(0, 300, w, 100);
  for (let i = 0; i < 5; i++) { const p = ((i / 5 + t * 0.35) % 1), y = 130 + p * 170, s = 40 + p * 120; g.fillStyle = `hsl(${i * 70},80%,60%)`; g.fillRect(w / 2 - s / 2, y, s, 14 + p * 20); }
  g.fillStyle = '#4a2a8c'; g.fillRect(w / 2 - 16, 205 + Math.abs(Math.sin(t * 6)) * -30, 32, 48); gameTex.needsUpdate = true; }

// ================================================================ KITCHEN (local coords, offset KX)
const kit = new THREE.Group(); kit.position.set(KX, 0, 0); scene.add(kit);
const tileT = canvasTex(1024, 1024, (g, w, h) => { g.fillStyle = '#f3ead2'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(90,150,150,.35)'; g.lineWidth = 6; for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(0, i * h / 8); g.lineTo(w, i * h / 8); g.stroke(); g.beginPath(); g.moveTo(i * w / 8, 0); g.lineTo(i * w / 8, h); g.stroke(); } });
tileT.wrapS = tileT.wrapT = THREE.RepeatWrapping; tileT.repeat.set(3, 2);
const kWall = new THREE.Mesh(new THREE.PlaneGeometry(18, 10), new THREE.MeshToonMaterial({map: tileT, gradientMap: ramp})); kWall.position.set(0, 5, -2.2); kWall.receiveShadow = true; kit.add(kWall);
const chk = canvasTex(512, 512, (g, w, h) => { for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { g.fillStyle = (x + y) % 2 ? '#e8d8b4' : '#b7d6d2'; g.fillRect(x * w / 8, y * h / 8, w / 8, h / 8); } }); chk.wrapS = chk.wrapT = THREE.RepeatWrapping; chk.repeat.set(3, 2);
const kFloor = new THREE.Mesh(new THREE.PlaneGeometry(18, 12), new THREE.MeshToonMaterial({map: chk, gradientMap: ramp})); kFloor.rotation.x = -Math.PI / 2; kFloor.receiveShadow = true; kit.add(kFloor);
kit.add(mesh(rbox(9, 1.9, 1.8, 0.06), toon('#4aa6a0'), {pos: [0.5, 0.95, -1.3], outline: 'mid'})); kit.add(mesh(rbox(9.3, 0.2, 2.0, 0.05), toon('#f7f2e6'), {pos: [0.5, 1.95, -1.3], outline: 'thin'}));
[-2.6, -0.9, 0.8, 2.5, 4.2].forEach(x => kit.add(mesh(rbox(1.5, 1.3, 0.06, 0.04), toon('#3b8a85'), {pos: [x, 0.95, -0.38], outline: 'thin'})));
[-3.4, -1.0, 3.4].forEach(x => kit.add(mesh(rbox(2.0, 2.0, 1.0, 0.06), toon('#4aa6a0'), {pos: [x, 7.2, -1.7], outline: 'mid'})));
kit.add(mesh(rbox(2.4, 6.4, 1.8, 0.1), toon('#e8eef5'), {pos: [-5.4, 3.2, -1.4], outline: 'mid'})); kit.add(mesh(rbox(0.1, 1.2, 0.1, 0.03), toon('#9aa6b5'), {pos: [-4.15, 4.2, -0.5], outline: 'thin'}));
const kClock = canvasTex(256, 256, g => { g.fillStyle = '#fff'; g.beginPath(); g.arc(128, 128, 118, 0, 7); g.fill(); g.lineWidth = 12; g.strokeStyle = INKC; g.stroke(); g.lineWidth = 10; g.beginPath(); g.moveTo(128, 128); g.lineTo(128, 50); g.moveTo(128, 128); g.lineTo(180, 128); g.stroke(); });
kit.add(decal(kClock, 1.3, 1.3, {pos: [2.2, 5.6, -2.1]}));
// microwave
const mw = new THREE.Group(); mw.position.set(1.0, 2.85, -1.05); kit.add(mw);
mw.add(mesh(rbox(3.4, 1.8, 1.5, 0.1), toon('#cfd5df'), {outline: 'mid'}));
const mwC = document.createElement('canvas'); mwC.width = 640; mwC.height = 340; const mg = mwC.getContext('2d'); const mwTex = new THREE.CanvasTexture(mwC); mwTex.colorSpace = THREE.SRGBColorSpace; mwTex.anisotropy = 8;
mw.add(decal(mwTex, 3.2, 1.7, {pos: [0, 0, 0.76]}));
function drawMW(t, st, secs) { const g = mg, w = 640, h = 340; g.clearRect(0, 0, w, h); g.fillStyle = '#b9c0cc'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#2a2f3a'; g.beginPath(); g.roundRect(24, 24, 400, 292, 20); g.fill();
  if (st === 'open') { g.fillStyle = '#e8e2c8'; g.beginPath(); g.roundRect(34, 34, 380, 272, 14); g.fill(); g.fillStyle = '#d4cdb0'; g.beginPath(); g.ellipse(224, 270, 150, 22, 0, 0, 7); g.fill(); }
  else if (st === 'run') { const gr = g.createRadialGradient(224, 170, 20, 224, 170, 220); gr.addColorStop(0, '#fff3a0'); gr.addColorStop(1, '#ffa63a'); g.fillStyle = gr; g.beginPath(); g.roundRect(34, 34, 380, 272, 14); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.ellipse(224, 262, 130, 24, 0, 0, 7); g.fill(); g.fillStyle = '#f4b94a'; g.beginPath(); g.ellipse(224, 250, 105, 20, 0, 0, 7); g.fill(); g.fillStyle = '#d8402f'; for (let i = 0; i < 6; i++) { const a = t * 3 + i * 1.05; g.beginPath(); g.ellipse(224 + Math.cos(a) * 62, 250 + Math.sin(a) * 9, 14, 4, 0, 0, 7); g.fill(); } }
  else if (st === 'loaded') { g.fillStyle = '#16202a'; g.beginPath(); g.roundRect(34, 34, 380, 272, 14); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.ellipse(224, 262, 130, 24, 0, 0, 7); g.fill(); g.fillStyle = '#f4b94a'; g.beginPath(); g.ellipse(224, 250, 105, 20, 0, 0, 7); g.fill(); }
  else { g.fillStyle = '#16202a'; g.beginPath(); g.roundRect(34, 34, 380, 272, 14); g.fill(); }
  g.fillStyle = 'rgba(255,255,255,.12)'; g.beginPath(); g.moveTo(50, 50); g.lineTo(190, 50); g.lineTo(90, 290); g.lineTo(50, 290); g.fill();
  g.fillStyle = '#0b1a10'; g.beginPath(); g.roundRect(450, 30, 164, 80, 10); g.fill(); g.font = '60px Lilita'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = st === 'run' ? '#5bff8a' : '#2f6a40'; const s = Math.max(0, Math.ceil(secs)); g.fillText(st === 'done' ? 'END' : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`, 532, 72);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) { g.fillStyle = '#e8ecf3'; g.beginPath(); g.roundRect(452 + c * 54, 130 + r * 48, 46, 38, 8); g.fill(); g.lineWidth = 3; g.strokeStyle = '#7a8394'; g.stroke(); }
  mwTex.needsUpdate = true; }

// ================================================================ OBBY (local coords, offset OX)
const obby = new THREE.Group(); obby.position.set(OX, 0, 0); scene.add(obby);
const skyT = canvasTex(512, 1024, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#2f7dff'); gr.addColorStop(0.55, '#8fd3ff'); gr.addColorStop(1, '#ffd6b0'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(255,255,255,.9)'; [[80, 420, 1], [330, 300, 1.3], [200, 620, 0.8]].forEach(([x, y, s]) => { g.beginPath(); g.arc(x, y, 50 * s, 0, 7); g.arc(x + 55 * s, y - 20 * s, 60 * s, 0, 7); g.arc(x + 110 * s, y, 45 * s, 0, 7); g.fill(); }); });
obby.add(new THREE.Mesh(new THREE.SphereGeometry(120, 32, 16), new THREE.MeshBasicMaterial({map: skyT, side: THREE.BackSide})));
const lavaT = canvasTex(512, 512, (g, w, h) => { g.fillStyle = '#ff5a1a'; g.fillRect(0, 0, w, h); for (let i = 0; i < 60; i++) { g.fillStyle = i % 2 ? '#ffb02e' : '#ff3a10'; g.beginPath(); g.ellipse((i * 97) % w, (i * 61) % h, 30 + (i % 5) * 12, 14 + (i % 3) * 6, 0, 0, 7); g.fill(); } });
lavaT.wrapS = lavaT.wrapT = THREE.RepeatWrapping; lavaT.repeat.set(12, 20);
const lava = new THREE.Mesh(new THREE.PlaneGeometry(120, 160), new THREE.MeshBasicMaterial({map: lavaT})); lava.rotation.x = -Math.PI / 2; lava.position.set(0, -1.6, -30); obby.add(lava);
const NP = 14, PZ = i => -i * 4.3, PX = i => Math.sin(i * 1.7) * 1.5; const bars = [];
for (let i = 0; i < NP; i++) { const last = i === NP - 1; const col = ['#ff5e7e', '#ffd23f', '#5bd28a', '#5ab4ff', '#b06bff'][i % 5];
  obby.add(mesh(rbox(last ? 5 : 2.5, 0.5, last ? 5 : 2.3, 0.08), toon(col), {pos: [PX(i), -0.25, PZ(i)], outline: 'mid', cast: false}));
  if (i === 4 || i === 8) { const b = mesh(rbox(5.0, 0.28, 0.28, 0.06), toon('#e3192b'), {pos: [PX(i), 0.7, PZ(i)], outline: 'thin', cast: false}); obby.add(b); bars.push(b); } }
const chest = new THREE.Group(); chest.position.set(PX(NP - 1), 0, PZ(NP - 1)); obby.add(chest);
chest.add(mesh(rbox(1.5, 0.8, 1.0, 0.1), toon('#b8702a'), {pos: [0, 0.4, 0]}));
const lid = new THREE.Group(); lid.position.set(0, 0.8, -0.5); chest.add(lid); lid.add(mesh(rbox(1.5, 0.45, 1.0, 0.18), toon('#d08a38'), {pos: [0, 0.2, 0.5]}));
chest.add(mesh(rbox(0.3, 0.3, 0.1, 0.04), toon('#ffd23f'), {pos: [0, 0.6, 0.52], outline: 'thin'}));
const chestGlow = new THREE.Mesh(new THREE.CircleGeometry(1.5, 32), new THREE.MeshBasicMaterial({color: '#fff3a0', transparent: true, opacity: 0.0, depthWrite: false})); chestGlow.position.set(0, 1.2, 0.6); chest.add(chestGlow);
for (let i = 0; i < 10; i++) { const a = i * 0.9, isl = new THREE.Group(); isl.position.set((i % 2 ? 1 : -1) * (9 + (i * 37 % 7)), 2 + (i * 13 % 6), -6 - i * 6); obby.add(isl); isl.add(mesh(new THREE.CylinderGeometry(1.8, 0.5, 1.6, 7), toon('#8a6a4a'), {outline: 'mid', cast: false})); isl.add(mesh(new THREE.CylinderGeometry(2.0, 2.0, 0.4, 7), toon('#59c46a'), {pos: [0, 0.9, 0], outline: 'mid', cast: false})); }
const hatBob = mesh(new THREE.ConeGeometry(0.4, 0.7, 4), toon('#ffd23f'), {pos: [PX(6), 2.6, PZ(6)], outline: 'thin', cast: false}); obby.add(hatBob);

// ================================================================ lights
scene.add(new THREE.HemisphereLight('#efe4ff', '#3a2a5c', 1.15));
const key = new THREE.DirectionalLight('#fff0e0', 2.0); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, {left: -9, right: 9, top: 11, bottom: -3, near: 0.5, far: 50}); key.shadow.bias = -0.0006; key.shadow.normalBias = 0.02; scene.add(key); scene.add(key.target);
const rimL = new THREE.DirectionalLight('#b88bff', 1.0); rimL.position.set(-6, 5, -4); scene.add(rimL);
const monGlow = new THREE.PointLight('#8fd8ff', 5, 8, 2); scene.add(monGlow);

// ================================================================ timer, HUD
const TK = [[8.2, 30], [9.0, 29], [12, 24], [15, 20], [17.5, 18], [23.5, 12], [27, 7], [30, 4], [32.2, 0]];
function timerVal(t) { if (t <= TK[0][0]) return 30; for (let i = 1; i < TK.length; i++) if (t <= TK[i][0]) return lerp(TK[i - 1][1], TK[i][1], (t - TK[i - 1][0]) / (TK[i][0] - TK[i - 1][0])); return 0; }
function roundRect(x, y, w, h, r) { oc.beginPath(); oc.roundRect(x, y, w, h, r); }
function timerHUD(t) { if (t < 8.2 || t > 32.8) return; const v = Math.max(0, Math.ceil(timerVal(t))), low = v <= 5, pulse = low ? 1 + 0.06 * Math.sin(t * 18) : 1, u = Math.min(1, (t - 8.2) / 0.25), k = (1 + 2.7 * Math.pow(u - 1, 3) + 1.7 * Math.pow(u - 1, 2)) * pulse;
  oc.save(); oc.translate(W / 2, 175); oc.scale(k, k); oc.shadowColor = '#ff2a2a'; oc.shadowBlur = 30; roundRect(-250, -85, 500, 170, 34); oc.fillStyle = '#1a0a12'; oc.fill(); oc.lineWidth = 11; oc.strokeStyle = low ? '#ff2a2a' : '#ff6a6a'; oc.stroke(); oc.shadowBlur = 0;
  oc.font = '150px Lilita'; oc.textAlign = 'center'; oc.textBaseline = 'middle'; oc.fillStyle = low ? '#ff4a4a' : '#fff'; oc.fillText('00:' + String(v).padStart(2, '0'), 0, 8); oc.restore(); }
function outlinedText(txt, x, y, size, fill, stroke = '#120a1c', lw = 22) { oc.font = `${size}px Lilita`; oc.textAlign = 'center'; oc.textBaseline = 'middle'; oc.lineJoin = 'round'; oc.lineWidth = lw; oc.strokeStyle = stroke; oc.strokeText(txt, x, y); oc.fillStyle = fill; oc.fillText(txt, x, y); }
function pop(t, t0, d = 0.2) { const u = clamp01((t - t0) / d); return u <= 0 ? 0 : 1 + 2.70158 * Math.pow(u - 1, 3) + 1.70158 * Math.pow(u - 1, 2); }
function hook(t) { if (t > 4.4) return; const k = pop(t, 0.0, 0.25); oc.save(); oc.translate(W / 2, 200); oc.scale(k, k); outlinedText('MOM CAUGHT ME', 0, -85, 92, '#fff'); outlinedText('PLAYING ROBLOX', 0, 10, 92, '#fff'); outlinedText('AT 3 AM!', 0, 115, 112, '#ffd23f'); oc.restore(); }
function wrapTxt(txt, maxW, size) { oc.font = `${size}px Lilita`; const words = txt.split(' '), lines = []; let cur = ''; words.forEach(w => { const test = cur ? cur + ' ' + w : w; if (oc.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; } else cur = test; }); lines.push(cur); return lines; }
function bubbles(t, yOverride) { D.lines.forEach(L => { if (t < L.t0 || t > L.t1) return; const [obj] = WHO[L.who]; const hp = new THREE.Vector3(); obj.userData.head.updateWorldMatrix(true, false); obj.userData.head.getWorldPosition(hp); hp.project(camera); const sx = (hp.x * 0.5 + 0.5) * W, sy = (-hp.y * 0.5 + 0.5) * H;
  const size = 78, lines = wrapTxt(L.text, 640, size), lh = size * 1.08, mw = Math.max(...lines.map(s => oc.measureText(s).width)), w = mw + 150, h = lines.length * lh + 90; const k = pop(t, L.t0, 0.2);
  const cx = Math.max(w / 2 + 30, Math.min(W - w / 2 - 30, sx)); const topLim = t < 4.4 ? 400 : (t > 8.2 && t < 32.8 ? 330 : 40); const cy = yOverride ?? Math.max(h / 2 + topLim, sy - 260 - h / 2);
  oc.save(); oc.translate(cx, cy); oc.scale(k, k); oc.fillStyle = '#fff'; oc.strokeStyle = '#111'; oc.lineWidth = 10;
  const tx = Math.max(-w / 2 + 90, Math.min(w / 2 - 90, sx - cx)); oc.beginPath(); oc.ellipse(0, 0, w / 2, h / 2, 0, 0, 7); oc.fill(); oc.stroke();
  oc.beginPath(); oc.moveTo(tx - 45, h / 2 - 22); oc.lineTo(sx - cx, Math.max(h / 2 + 30, sy - cy - 120)); oc.lineTo(tx + 45, h / 2 - 22); oc.closePath(); oc.fill(); oc.stroke(); oc.beginPath(); oc.ellipse(0, 0, w / 2 - 5, h / 2 - 5, 0, 0, 7); oc.fillStyle = '#fff'; oc.fill();
  oc.fillRect(tx - 40, h / 2 - 30, 80, 14);
  oc.textAlign = 'center'; oc.textBaseline = 'middle'; lines.forEach((ln, i) => { const y = -h / 2 + 45 + lh / 2 + i * lh; const ws = ln.split(' '); const total = oc.measureText(ln).width; let x = -total / 2; oc.textAlign = 'left'; ws.forEach((wd, j) => { const word = wd + (j < ws.length - 1 ? ' ' : ''); const hot = /^[A-Z]{3,}[!?.,]*$/.test(wd); oc.font = `${size}px Lilita`; oc.fillStyle = hot ? '#e3192b' : '#111'; oc.fillText(word, x, y); x += oc.measureText(word).width; }); }); oc.restore(); }); }
function comic(t, t0, t1, txt, x, y, col, size = 150, rot = -0.12) { if (t < t0 || t > t1) return; const k = pop(t, t0, 0.15); oc.save(); oc.translate(x, y); oc.rotate(rot); oc.scale(k, k); outlinedText(txt, 0, 0, size, col, '#2a0a10', 26); oc.restore(); }
function flash(a) { if (a <= 0) return; oc.fillStyle = `rgba(255,255,255,${a})`; oc.fillRect(0, 0, W, H); }
function frozenCard(t, t0, t1) { if (t < t0 || t > t1) return; const u = pop(t, t0, 0.25); oc.save(); oc.translate(W / 2, 1400); oc.scale(u * 0.62, u * 0.62); oc.rotate(-0.05);
  roundRect(-420, -330, 840, 660, 50); oc.fillStyle = '#10305a'; oc.fill(); oc.lineWidth = 14; oc.strokeStyle = '#7fd4ff'; oc.stroke();
  oc.fillStyle = '#e9b25a'; oc.beginPath(); oc.moveTo(-300, 200); oc.lineTo(300, 200); oc.lineTo(0, -240); oc.closePath(); oc.fill(); oc.lineWidth = 12; oc.strokeStyle = '#3a1f45'; oc.stroke();
  oc.fillStyle = '#cfefff'; oc.beginPath(); oc.moveTo(-230, 150); oc.lineTo(230, 150); oc.lineTo(0, -150); oc.closePath(); oc.fill(); oc.stroke();
  oc.fillStyle = '#d8402f'; [[-60, 60], [70, 90], [0, -20]].forEach(([x, y]) => { oc.beginPath(); oc.arc(x, y - 60, 28, 0, 7); oc.fill(); });
  oc.strokeStyle = '#6ab8f0'; oc.lineWidth = 8; for (let i = 0; i < 5; i++) { const a = i * 1.26 + t * 0.6, r = 60; oc.beginPath(); oc.moveTo(-10 + Math.cos(a) * 0, 40 + Math.sin(a) * 0); oc.lineTo(-10 + Math.cos(a) * r, 40 + Math.sin(a) * r); oc.stroke(); }
  oc.font = '110px Lilita'; oc.textAlign = 'center'; oc.fillStyle = '#9fe4ff'; oc.lineWidth = 20; oc.strokeStyle = '#062040'; oc.strokeText('FROZEN!', 0, 290); oc.fillText('FROZEN!', 0, 290); oc.restore(); }
function endText(t) { if (t < 44.7) return; const k = pop(t, 44.7, 0.3); oc.save(); oc.translate(W / 2, 1500); oc.scale(k, k); outlinedText("Type 'PIZZA' letter by", 0, -75, 70, '#fff'); outlinedText('letter in comments if your', 0, 5, 70, '#fff'); outlinedText('microwave does this!', 0, 85, 78, '#ffd23f'); oc.restore(); }
function coinBurst(t, t0) { const u = t - t0; if (u < 0 || u > 2.4) return; for (let i = 0; i < 26; i++) { const a = rnd(i) * Math.PI * 2, sp = 450 + rnd(i + 3) * 700, x = W / 2 + Math.cos(a) * sp * u, y = 800 + Math.sin(a) * sp * u * 0.7 + 700 * u * u, r = 34 + rnd(i + 7) * 28; if (y > H + 80) continue; oc.save(); oc.translate(x, y); oc.scale(Math.abs(Math.cos(u * 6 + i)) * 0.8 + 0.2, 1); oc.fillStyle = '#ffcc33'; oc.beginPath(); oc.arc(0, 0, r, 0, 7); oc.fill(); oc.lineWidth = r * 0.16; oc.strokeStyle = '#b5761a'; oc.stroke(); oc.restore(); }
  const k = pop(t, t0, 0.25); oc.save(); oc.translate(W / 2, 560); oc.scale(k, k); roundRect(-380, -100, 760, 200, 50); oc.fillStyle = 'rgba(255,200,40,.95)'; oc.fill(); oc.lineWidth = 10; oc.strokeStyle = '#a5640f'; oc.stroke(); outlinedText('+VALKYRIE HAT!', 0, 0, 92, '#fff', '#7a3e08', 16); oc.restore(); }

// ================================================================ staging helpers
const talkAmt = (t, on) => on ? 0.25 + 0.75 * Math.abs(Math.sin(t * 17)) : 0.12;
const speaking = (who, t) => D.lines.some(L => L.who === who && t >= L.t0 && t <= L.t1);
function camShot(p0, l0, p1, l1, u, fov = 32) { const e = sm(u); camera.position.set(lerp(p0[0], p1[0], e), lerp(p0[1], p1[1], e), lerp(p0[2], p1[2], e)); camera.lookAt(lerp(l0[0], l1[0], e), lerp(l0[1], l1[1], e), lerp(l0[2], l1[2], e)); camera.fov = fov; camera.updateProjectionMatrix(); }
const IDLE = {legL: [0, 0, 0], legR: [0, 0, 0]};
function seatHero(yaw = Math.PI) { hero.position.set(-0.4, 1.35, 1.75); hero.rotation.y = yaw; H_.pose({l: [-1.25, 0, 0.25], r: [-1.25, 0, -0.25], legL: [-1.5, 0, 0], legR: [-1.5, 0, 0], head: [0, 0, 0]}); chair.rotation.y = yaw - Math.PI; chair.position.set(-0.4, 0, 2.2); }
function runPose(t, speed = 12) { const ph = t * speed; H_.pose({l: [Math.sin(ph) * 0.9, 0, 0.12], r: [-Math.sin(ph) * 0.9, 0, -0.12], legL: [-Math.sin(ph) * 0.8, 0, 0], legR: [Math.sin(ph) * 0.8, 0, 0], head: [0.05, 0, 0]}); return Math.abs(Math.sin(ph)) * 0.12; }
function obbyPos(s) { s = Math.max(0, Math.min(NP - 1, s)); let i = Math.floor(s), f = s - i; if (i >= NP - 1) { i = NP - 2; f = 1; } const a = [PX(i), PZ(i)], b = [PX(i + 1), PZ(i + 1)];
  if (f < 0.3) return {x: a[0], z: a[1], y: 0, air: 0, f}; const u = (f - 0.3) / 0.7; return {x: lerp(a[0], b[0], u), z: lerp(a[1], b[1], u), y: Math.sin(Math.PI * u) * 1.7, air: 1, f}; }
function obbyHero(t, s) { const p = obbyPos(s); hero.position.set(OX + p.x, 1.25 + p.y, p.z); hero.rotation.y = Math.PI;
  if (p.air) H_.pose({l: [-2.7, 0, 0.5], r: [-2.7, 0, -0.5], legL: [-0.6, 0, 0], legR: [0.5, 0, 0], head: [-0.1, 0, 0]}); else hero.position.y += runPose(t, 14); return p; }
function obbyCam(p, fov = 38, dx = 0.9) { camera.position.set(OX + p.x + dx, 4.8, p.z + 11.5); camera.lookAt(OX + p.x - dx * 0.3, 1.6, p.z - 6); camera.fov = fov; camera.updateProjectionMatrix(); }
const KY = 1.32;
function momKitchen(x, yaw = 0.1) { mom.position.set(KX + x, KY, 1.0); mom.rotation.y = yaw; }

// ================================================================ shots
let env = 'room', mwState = 'idle', mwSecs = 30;
const SHOTS = [
 {t0: 0, t1: 2.85, run(t, u) { camShot([-3.2, 4.2, 12.6], [0.6, 2.9, -0.2], [-2.8, 4.1, 11.8], [0.7, 2.9, -0.2], u, 36); seatHero(0.95); H_.pose({head: [0, 0, 0]}); H_.setFace({eyes: 'wide', look: [0.8, -0.2], mouth: 'o', open: 0.5, raise: 0.6});
    const w = sm(u * 2.2); mom.visible = true; mom.position.set(lerp(3.0, 1.7, w), KY + Math.abs(Math.sin(t * 9)) * 0.08 * (1 - w), lerp(-2.2, 0.4, w)); mom.rotation.y = -0.45; M_.setFace({eyes: 'half', mouth: 'shout', open: talkAmt(t, speaking('mom', t)), browL: 1.4, browR: 1.4}); M_.pose({l: [-1.5, 0, 0.35], r: [-1.5, 0, -0.35], head: [0.04, 0, 0.05], legL: [Math.sin(t * 9) * 0.5 * (1 - w), 0, 0], legR: [-Math.sin(t * 9) * 0.5 * (1 - w), 0, 0]}); } },
 {t0: 2.85, t1: 4.4, run(t, u) { camShot([-1.2, 3.4, 9.6], [-0.4, 3.1, 1.75], [-0.9, 3.4, 8.6], [-0.4, 3.1, 1.75], u, 34); const w = sm(u * 2.5); seatHero(lerp(0.95, 0.1, w)); H_.pose({head: [0.05, 0, 0]}); H_.setFace({eyes: 'big', tears: true, tearT: t * 1.2, mouth: 'talk', open: talkAmt(t, true), browL: -1.3, browR: -1.3});
    mom.visible = true; mom.position.set(1.7, KY, 0.4); mom.rotation.y = -0.45; M_.setFace({eyes: 'half', mouth: 'shout', open: 0.15, browL: 1.4, browR: 1.4}); M_.pose({l: [-1.5, 0, 0.35], r: [-1.5, 0, -0.35], legL: [0, 0, 0], legR: [0, 0, 0]}); } },
 {t0: 4.4, t1: 9.0, env: 'kitchen', run(t, u) { camShot([KX + 0.1, 4.3, 16.0], [KX + 0.3, 2.8, 0], [KX + 0.3, 4.1, 14.8], [KX + 0.3, 2.8, 0], u, 36); mom.visible = true; momKitchen(-1.3, 0.15);
    const talk = speaking('mom', t); M_.setFace({eyes: 'half', mouth: talk ? 'talk' : 'flat', open: talkAmt(t, talk), browL: 1.0, browR: 1.0}); const reach = sm((t - 5.0) / 0.4);
    M_.pose({l: [-0.2, 0, 0.1], r: [-0.5 - 0.3 * reach, 0, 1.45 * reach], head: [0, 0.1, 0], legL: [0, 0, 0], legR: [0, 0, 0]});
    // pizza: held (4.4-5.2), then slides into the microwave, door open during load
    pizza.visible = t < 5.7; const slide = sm((t - 5.0) / 0.5); pizza.position.set(lerp(KX - 0.8, KX + 0.5, slide), lerp(3.1, 3.0, slide), lerp(1.4, 0.1, slide)); pizza.scale.setScalar(0.9);
    mwState = t < 5.0 ? 'idle' : t < 5.8 ? 'open' : t < 8.2 ? 'loaded' : 'run'; mwSecs = 30; if (t > 6.2 && t < 8.2) { M_.pose({r: [-0.9, 0, 1.45]}); } } },
 {t0: 9.0, t1: 15.5, env: 'obby', run(t, u) { const s = sm01(t, 9.0, 15.5) * 6.5; const p = obbyHero(t, s); obbyCam(p); H_.setFace({eyes: 'wide', mouth: speaking('hero', t) ? 'talk' : 'grin', open: talkAmt(t, speaking('hero', t)), raise: 0.5, browL: 0.4, browR: 0.4}); } },
 {t0: 15.5, t1: 17.5, env: 'obby', run(t, u) { const p = obbyHero(t, 6.5 + (t - 15.5) * 0.75); obbyCam(p, 44, 1.4); H_.setFace({eyes: 'wide', mouth: 'o', open: 0.7, raise: 0.9, browL: -0.6, browR: -0.6}); } },
 {t0: 17.5, t1: 23.5, run(t, u) { camShot([2.0, 3.9, 12.0], [0.5, 2.9, 1.0], [1.4, 3.8, 11.0], [0.5, 2.9, 1.0], u, 38); drawG = true;
    const bt = t - 17.5; seatHero(t < 20.2 ? 0.95 : lerp(0.95, 0.35, sm((t - 20.2) / 0.3))); H_.pose({head: [0, 0, 0], l: t > 21.6 ? [-1.9, 0, -0.9 + 0.3] : [-1.25, 0, 0.25]}); if (t > 21.6) H_.pose({r: [-1.6, -0.4, -1.2]});
    H_.setFace(t < 20.2 ? {eyes: 'wide', look: [0.8, -0.1], mouth: 'o', open: 0.4, raise: 0.4} : {eyes: 'half', mouth: speaking('hero', t) ? 'shout' : 'flat', open: talkAmt(t, speaking('hero', t)), browL: 1.3, browR: 1.3});
    bro.visible = true; const away = sm((t - 21.9) / 0.9); const sx = lerp(0.9, 8, away); bro.scale.setScalar(0.78); bro.position.set(sx, 1.0 + Math.abs(Math.sin(t * 8)) * 0.05 + away * 1.2, lerp(0.2, -1, away) + 1.0); bro.rotation.y = 0.15 + away * 8; B_.setFace({eyes: away > 0 ? 'wide' : 'wide', mouth: away > 0 ? 'o' : (speaking('bro', t) ? 'talk' : 'grin'), open: talkAmt(t, speaking('bro', t)), raise: 0.3});
    B_.pose({l: [-2.4, 0, 0.5], r: [-1.3 + Math.sin(t * 9) * 0.2, 0, -0.4], legL: [0, 0, 0], legR: [0, 0, 0]}); comic(t, 22.0, 23.2, 'BONK!', 800, 900, '#ffd23f', 120); } },
 {t0: 23.5, t1: 32.8, env: 'obby', run(t, u) { const s = 6.5 + 1.5 + sm01(t, 23.5, 30.2) * (NP - 1 - 8); const p = obbyHero(t, s); obbyCam(p, 40);
    const arrive = t > 30.2; if (arrive) { hero.position.set(OX + PX(NP - 1) - 0.8, 1.25, PZ(NP - 1) + 1.6); hero.rotation.y = 0.35 + Math.sin(t * 9) * 0.05 + 0.4; H_.pose({l: [-2.8, 0, 0.9], r: [-2.8, 0, -0.9], legL: [0, 0, 0], legR: [0, 0, 0], head: [0, 0, 0]}); camera.position.set(OX + PX(NP - 1) + 1.0, 3.8, PZ(NP - 1) + 11.0); camera.lookAt(OX + PX(NP - 1) - 0.3, 2.0, PZ(NP - 1)); camera.updateProjectionMatrix(); }
    H_.setFace(arrive ? {eyes: 'happy', mouth: 'grin'} : {eyes: 'wide', mouth: 'grin', raise: 0.5, browL: 0.4, browR: 0.4}); lid.rotation.x = -sm((t - 30.4) / 0.4) * 1.9; chestGlow.material.opacity = clamp01((t - 30.5) / 0.4) * 0.55; chestGlow.quaternion.copy(camera.quaternion); } },
 {t0: 32.8, t1: 38.2, env: 'kitchen', run(t, u) { camShot([KX + 0.1, 4.3, 15.5], [KX + 0.3, 2.8, 0], [KX + 0.1, 4.1, 14.3], [KX + 0.2, 2.8, 0], u, 36); mom.visible = true; momKitchen(-1.3, 0.15); const open = t > 33.0, take = sm((t - 33.1) / 0.5);
    mwState = t < 33.0 ? 'done' : t < 33.5 ? 'open' : 'idle'; pizza.visible = t > 33.0; pizza.position.set(lerp(KX + 0.5, KX - 0.4, take), lerp(3.0, 3.3, take) + Math.sin(take * 3) * 0.1, lerp(0.1, 1.6, take)); pizza.scale.setScalar(0.9);
    const bite = t > 34.2 && t < 34.7, ouch = t >= 34.7; M_.pose({l: [-0.2, 0, 0.1], r: [-0.8, 0, ouch ? 1.2 + Math.sin(t * 30) * 0.2 : 1.45 * (1 - take * 0.2)], head: [bite ? 0.3 : 0, 0.05, 0.05 * Math.sin(t * 25) * (ouch ? 1 : 0)], legL: [0, 0, 0], legR: [0, 0, 0]});
    M_.setFace(t < 34.2 ? {eyes: 'half', mouth: 'flat', browL: 0.9, browR: 0.9} : ouch ? {eyes: 'wide', mouth: speaking('mom', t) ? 'shout' : 'o', open: talkAmt(t, true), browL: -1.0, browR: -1.0, raise: 1.0} : {eyes: 'half', mouth: 'o', open: 0.3}); mwSecs = 0; comic(t, 32.8, 33.6, 'DING!', 840, 640, '#7dffaa', 160, 0.1); } },
 {t0: 38.2, t1: 41.0, env: 'kitchen', run(t, u) { camShot([KX + 0.1, 4.3, 15.5], [KX + 0.3, 2.8, 0], [KX + 0.2, 4.1, 14.3], [KX + 0.3, 2.8, 0], u, 36); mom.visible = true; momKitchen(-1.3, 0.15); const back = sm((t - 38.3) / 0.4);
    pizza.visible = t < 39.0; pizza.position.set(lerp(KX - 0.4, KX + 0.5, back), 3.1, lerp(1.6, 0.1, back)); pizza.scale.setScalar(0.9); mwState = t < 39.0 ? 'open' : 'run'; mwSecs = t < 39.0 ? 0 : 120 - (t - 39.0) * 0;
    M_.pose({l: [-0.2, 0, 0.1], r: [-0.8, 0, 1.45], head: [0, 0.1, 0], legL: [0, 0, 0], legR: [0, 0, 0]}); M_.setFace({eyes: 'half', mouth: speaking('mom', t) ? 'talk' : 'flat', open: talkAmt(t, speaking('mom', t)), browL: 1.3, browR: 1.3}); } },
 {t0: 41.0, t1: 47.5, run(t, u) { camShot([-1.2, 3.5, 10.4], [-0.4, 3.1, 1.75], [-0.9, 3.5, 9.4], [-0.4, 3.1, 1.75], u, 34); drawG = true; seatHero(0.1); H_.pose({head: [0, 0, 0.06 * Math.sin(t * 3)], l: [-1.0, 0, 0.5], r: [-1.25, 0, -0.25]}); const talk = speaking('hero', t); H_.setFace({eyes: t < 41.6 ? 'happy' : 'half', mouth: talk ? 'talk' : 'grin', open: talkAmt(t, talk), browL: -0.3, browR: 0.6, raise: 0.2, glint: true}); } }
];
function sm01(t, a, b) { return sm((t - a) / (b - a)); }
let drawG = false;
window.renderAt = t => {
  oc.clearRect(0, 0, W, H); drawG = false;
  hero.visible = true; mom.visible = false; bro.visible = false; pizza.visible = false; chair.rotation.y = 0; chair.position.set(-0.4, 0, 2.2); lid.rotation.x = 0; chestGlow.material.opacity = 0; mwState = 'idle'; mwSecs = 30;
  H_.setFace({}); M_.setFace({}); B_.setFace({}); [H_, M_, B_].forEach(U => U.pose({l: [0, 0, 0.1], r: [0, 0, -0.1], legL: [0, 0, 0], legR: [0, 0, 0], head: [0, 0, 0]}));
  const sh = SHOTS.find(s => t >= s.t0 && t < s.t1) || SHOTS[SHOTS.length - 1]; env = sh.env || 'room'; room.visible = env === 'room'; kit.visible = env === 'kitchen'; obby.visible = env === 'obby';
  hero.scale.setScalar(1); mom.scale.setScalar(1); bro.scale.setScalar(1); hero.rotation.set(0, 0, 0); mom.rotation.set(0, 0, 0); bro.rotation.set(0, 0, 0);
  if (env !== 'kitchen') { /* keep chars in sync */ }
  sh.run(t, (t - sh.t0) / (sh.t1 - sh.t0));
  if (env === 'obby') { bars.forEach((b, i) => { b.rotation.y = t * 2.5 + i; }); lavaT.offset.y = t * 0.1; lava.visible = true; hatBob.rotation.y = t * 3; hatBob.visible = t < 15.5; }
  if (env === 'room') { monGlow.position.set(-0.4, 3.0, 0.4); monGlow.visible = true; drawGame(t); } else monGlow.visible = false;
  if (env === 'kitchen') { const sec = (t >= 8.2 && t <= 32.2) ? timerVal(t) : mwSecs; drawMW(t, mwState, (mwState === 'run' && t >= 8.2 && t <= 32.8) ? timerVal(t) : mwSecs); }
  key.position.set(camera.position.x + 4, 9, camera.position.z + 6); key.target.position.set(camera.position.x, 0, camera.position.z - 6);
  scene.updateMatrixWorld(); camera.updateMatrixWorld();
  renderer.render(scene, camera);
  hook(t); timerHUD(t); bubbles(t); frozenCard(t, 35.6, 37.9); if (t > 30.5 && t < 33) coinBurst(t, 30.6); comic(t, 31.9, 32.8, 'DING!', 840, 1500, '#7dffaa', 160, 0.1); flash(t > 32.0 && t < 32.35 ? 1 - (t - 32.0) / 0.35 : 0); endText(t); return true;
};
window.renderAt(0); window.ready = true;
