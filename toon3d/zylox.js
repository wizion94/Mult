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


const put = (p, o, x = 0, y = 0, z = 0) => { o.position.set(x, y, z); p.add(o); return o; };
// ================================================================ shared textures
const zHoodie = canvasTex(512, 512, (g, w) => { g.fillStyle = 'rgba(255,255,255,.07)'; for (let x = 0; x < w; x += 44) g.fillRect(x, 0, 18, w);
  g.font = '320px Lilita'; g.textAlign = 'center'; g.shadowColor = '#ff7bf2'; g.shadowBlur = 50; g.fillStyle = '#e9a6ff'; g.fillText('Z', w / 2, 380); g.shadowBlur = 0; g.lineWidth = 12; g.strokeStyle = INKC; g.strokeText('Z', w / 2, 380);
  g.strokeStyle = '#f2ecff'; g.lineWidth = 10; g.beginPath(); g.moveTo(205, 0); g.lineTo(205, 110); g.moveTo(307, 0); g.lineTo(307, 110); g.stroke(); });
const sweater = canvasTex(512, 512, (g, w) => { g.fillStyle = 'rgba(255,255,255,.1)'; for (let x = 0; x < w; x += 36) g.fillRect(x, 0, 14, w); g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(0, 470, w, 42); });
const zCoin = (g, x, y, r) => { g.fillStyle = '#ffcc33'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.lineWidth = r * 0.16; g.strokeStyle = '#b5761a'; g.stroke(); g.fillStyle = '#fff3b0'; g.beginPath(); g.arc(x, y, r * 0.72, 0, 7); g.fill(); g.font = `${r * 1.15}px Lilita`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#c2851f'; g.fillText('Z', x, y + r * 0.06); };

// ================================================================ characters (the channel's Zylox + Mom, rebuilt in the toon-blocky style)
const zylox = character({skin: '#f2c9a4', shirt: '#4a2a8c', cuff: '#3a1f72', torsoDecal: zHoodie, legs: '#3a1f72', shoe: '#1d1630',
  face: {eyes: 'normal', iris: '#5a3a28', brow: '#4a2412', mouth: 'smile', scar: 'l', fringe: {color: '#8a4417', style: 'wavy'}},
  hair(h) { const hm = toon('#8a4417');
    h.add(mesh(rbox(1.2, 0.36, 1.12, 0.14), hm, {pos: [0, 0.5, -0.02], outline: 'thick'}));
    const spikes = [[-0.45, 0.62, 0.25, 0.7, -0.5], [-0.15, 0.72, 0.3, 0.2, -0.2], [0.2, 0.74, 0.25, -0.2, 0.15], [0.48, 0.6, 0.2, -0.65, 0.4], [-0.3, 0.68, -0.35, 0.5, -0.9], [0.3, 0.7, -0.4, -0.4, -0.9], [0, 0.66, -0.5, 0, -1.1], [-0.62, 0.35, 0, 1.2, 0], [0.62, 0.35, 0, -1.2, 0]];
    spikes.forEach(([x, y, z, rz, rx]) => h.add(mesh(new THREE.ConeGeometry(0.24, 0.62, 5), hm, {pos: [x, y + 0.18, z], rot: [rx, 0, rz], outline: 'mid'})));
    // goggles pushed up on the forehead
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.05, 8, 40), toon('#2a2140')); band.rotation.x = Math.PI / 2; band.scale.set(1, 0.92, 1); band.position.y = 0.48; h.add(band);
    [-1, 1].forEach(d => { const lens = mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.16, 24), toon('#2a2140'), {pos: [d * 0.24, 0.62, 0.5], rot: [Math.PI / 2 - 0.35, 0, 0], outline: 'thin'}); put(lens, new THREE.Mesh(new THREE.CircleGeometry(0.14, 24), new THREE.MeshBasicMaterial({color: '#b26bff'})), 0, 0.085, 0); lens.children[1].rotation.x = -Math.PI / 2; h.add(lens); });
    // hood behind the neck
    h.add(mesh(rbox(1.1, 0.5, 0.45, 0.16), toon('#3a1f72'), {pos: [0, -0.55, -0.42], outline: 'mid'}));
  } });
// headphones resting around the neck
{ const hp = toon('#241a3a'); const ring = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.07, 10, 36), hp); ring.rotation.x = Math.PI / 2; ring.position.set(0, 1.36, 0.02); zylox.add(ring);
  [-1, 1].forEach(d => { const c = mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.16, 24), hp, {pos: [d * 0.62, 1.32, 0.12], rot: [0, 0, Math.PI / 2], outline: 'mid'}); const ztx = canvasTex(128, 128, g => { g.font = '100px Lilita'; g.textAlign = 'center'; g.fillStyle = '#d28bff'; g.fillText('Z', 64, 100); }); c.add(decal(ztx, 0.28, 0.28, {pos: [0, d * 0.085, 0], rot: [0, 0, d * -Math.PI / 2]})); c.children[c.children.length - 1].rotation.set(d * -Math.PI / 2, 0, d * Math.PI / 2); zylox.add(c); }); }
scene.add(zylox);
const mom = character({skin: '#e8b08a', shirt: '#f0782c', cuff: '#d9651f', torsoDecal: sweater, legs: '#3b5a9c', shoe: '#ffffff',
  face: {eyes: 'half', lid: '#cf9470', iris: '#4a2a1a', brow: '#4a2412', browL: 1.1, browR: 1.1, mouth: 'shout', lashes: true, fringe: {color: '#7a3d1c', style: 'sweep'}},
  hair(h) { const hm = toon('#7a3d1c'); h.add(mesh(rbox(1.2, 0.34, 1.1, 0.14), hm, {pos: [0, 0.5, -0.03], outline: 'thick'}));
    [-1, 1].forEach(d => h.add(mesh(rbox(0.3, 0.9, 0.9, 0.13), hm, {pos: [d * 0.66, 0.1, -0.05], outline: 'mid'})));
    h.add(mesh(new THREE.SphereGeometry(0.34, 16, 12), hm, {pos: [0.05, 0.9, -0.22], outline: 'mid'}));
    [[0.3, 0.98, -0.1, 0.8], [-0.2, 1.02, -0.3, -0.6], [0.1, 1.15, -0.2, 0.2]].forEach(([x, y, z, r]) => h.add(mesh(rbox(0.12, 0.42, 0.12, 0.05), hm, {pos: [x, y, z], rot: [0, 0, r], outline: 'thin'})));
    [-1, 1].forEach(d => h.add(mesh(new THREE.TorusGeometry(0.1, 0.03, 8, 20), toon('#ffcf3f'), {pos: [d * 0.56, -0.28, 0.1], rot: [0, Math.PI / 2, 0], outline: 'thin'}))); } });
scene.add(mom);
const Z = zylox.userData, M = mom.userData;

// ================================================================ bedroom (purple neon gaming room)
const room = new THREE.Group(); scene.add(room);
const wallT = canvasTex(1024, 1024, (g, w, h) => { g.fillStyle = '#2b1a52'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(255,255,255,.035)'; for (let y = 0; y < h; y += 64) for (let x = (y / 64 % 2) * 64; x < w; x += 128) g.fillRect(x, y, 64, 64); });
wallT.wrapS = wallT.wrapT = THREE.RepeatWrapping; wallT.repeat.set(3, 2);
const rWall = new THREE.Mesh(new THREE.PlaneGeometry(16, 10), new THREE.MeshToonMaterial({map: wallT, gradientMap: ramp})); rWall.position.set(0, 5, -3); rWall.receiveShadow = true; room.add(rWall);
const rWallR = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.MeshToonMaterial({map: wallT, gradientMap: ramp})); rWallR.position.set(5, 5, 2); rWallR.rotation.y = -Math.PI / 2; room.add(rWallR);
const rFloor = new THREE.Mesh(new THREE.PlaneGeometry(16, 12), toon('#3a2a5c')); rFloor.rotation.x = -Math.PI / 2; rFloor.receiveShadow = true; room.add(rFloor);
const neon = c => new THREE.MeshBasicMaterial({color: c});
[[-4.5, '#c25cff'], [-1.2, '#ff5ec8'], [2.2, '#c25cff']].forEach(([x, c]) => put(room, new THREE.Mesh(new THREE.BoxGeometry(0.08, 8, 0.05), neon(c)), x, 4, -2.95));
put(room, new THREE.Mesh(new THREE.BoxGeometry(16, 0.08, 0.05), neon('#8a5cff')), 0, 7.6, -2.95);
const sign = canvasTex(512, 256, g => { g.font = '200px Lilita'; g.textAlign = 'center'; g.shadowColor = '#ff6bf0'; g.shadowBlur = 40; g.fillStyle = '#ffd0ff'; g.fillText('ZYLOX', 256, 190); });
room.add(decal(sign, 2.6, 1.3, {pos: [-3.0, 5.8, -2.9]}));
const shelfR = new THREE.Group(); shelfR.position.set(-3.0, 4.6, -2.75); room.add(shelfR); shelfR.add(mesh(rbox(2.6, 0.12, 0.45, 0.04), toon('#4b2f86'), {outline: 'thin'}));
[[-0.8, '#ffc93c'], [0.0, '#d8d8e8'], [0.8, '#ffc93c']].forEach(([x, c]) => { const t = new THREE.Group(); t.position.set(x, 0.07, 0); shelfR.add(t); t.add(mesh(new THREE.CylinderGeometry(0.2, 0.1, 0.34, 16), toon(c), {pos: [0, 0.4, 0], outline: 'thin'}), mesh(rbox(0.3, 0.1, 0.24, 0.03), toon('#2a1a4a'), {pos: [0, 0.05, 0], outline: 'thin'}), mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.16, 8), toon(c), {pos: [0, 0.16, 0], outline: 'thin'})); });
// doorway with warm hall light (Mom stands here)
const door = new THREE.Group(); door.position.set(3.0, 0, -2.9); room.add(door);
put(door, new THREE.Mesh(new THREE.PlaneGeometry(2.2, 4.4), new THREE.MeshBasicMaterial({color: '#ffcf8a'})), 0, 2.2, 0.02);
[[-1.18, 2.25, 0.16, 4.6], [1.18, 2.25, 0.16, 4.6]].forEach(([x, y, w, h]) => door.add(mesh(rbox(w, h, 0.3, 0.04), toon('#5a3a2a'), {pos: [x, y, 0.1], outline: 'thin'})));
door.add(mesh(rbox(2.5, 0.18, 0.3, 0.04), toon('#5a3a2a'), {pos: [0, 4.5, 0.1], outline: 'thin'}));
// desk, monitor, keyboard, chair
const desk = new THREE.Group(); desk.position.set(-0.6, 0, 0.2); room.add(desk);
desk.add(mesh(rbox(4.2, 0.18, 1.6, 0.05), toon('#2a2140'), {pos: [0, 1.6, 0]})); [-1.9, 1.9].forEach(x => desk.add(mesh(rbox(0.16, 1.55, 1.4, 0.04), toon('#221a36'), {pos: [x, 0.78, 0], outline: 'thin'})));
put(desk, new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.04, 0.04), neon('#c25cff')), 0, 1.5, 0.8);
const gameCanvas = document.createElement('canvas'); gameCanvas.width = 640; gameCanvas.height = 400; const gctx = gameCanvas.getContext('2d'); const gameTex = new THREE.CanvasTexture(gameCanvas); gameTex.colorSpace = THREE.SRGBColorSpace;
const monitor = new THREE.Group(); monitor.position.set(0.2, 1.7, -0.35); desk.add(monitor);
monitor.add(mesh(rbox(2.5, 1.55, 0.14, 0.05), toon('#15111f'), {pos: [0, 1.15, 0], outline: 'mid'})); put(monitor, new THREE.Mesh(new THREE.PlaneGeometry(2.32, 1.38), new THREE.MeshBasicMaterial({map: gameTex})), 0, 1.15, 0.075);
monitor.add(mesh(rbox(0.2, 0.4, 0.2, 0.04), toon('#15111f'), {pos: [0, 0.2, 0], outline: 'thin'})); monitor.add(mesh(rbox(0.9, 0.06, 0.5, 0.03), toon('#15111f'), {pos: [0, 0.03, 0], outline: 'thin'}));
const kbT = canvasTex(512, 160, (g, w, h) => { g.fillStyle = '#1a1428'; g.fillRect(0, 0, w, h); for (let r = 0; r < 4; r++) for (let k = 0; k < 14; k++) { g.fillStyle = `hsl(${(k * 24 + r * 40) % 360},95%,62%)`; g.fillRect(10 + k * 35, 10 + r * 36, 28, 28); } });
const kb = new THREE.Group(); kb.position.set(0.1, 1.73, 0.3); desk.add(kb); kb.add(mesh(rbox(1.7, 0.07, 0.55, 0.03), toon('#1a1428'), {outline: 'thin'})); kb.add(decal(kbT, 1.6, 0.48, {pos: [0, 0.04, 0], rot: [-Math.PI / 2, 0, 0]}));
const mouse = mesh(rbox(0.22, 0.1, 0.34, 0.05), toon('#1a1428'), {pos: [1.25, 1.73, 0.35], outline: 'thin'}); desk.add(mouse); put(mouse, new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 0.2), neon('#c25cff')), 0, 0.06, 0);
const chair = new THREE.Group(); chair.position.set(-0.4, 0, 2.2); room.add(chair);
chair.add(mesh(rbox(1.5, 0.3, 1.3, 0.1), toon('#2a1f44'), {pos: [0, 1.1, 0]})); chair.add(mesh(rbox(1.5, 1.5, 0.32, 0.14), toon('#2a1f44'), {pos: [0, 1.95, 0.6]}));
put(chair, new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.3, 0.02), neon('#ff5ec8')), 0, 1.95, 0.77);
function drawMonitor(t) { const g = gctx, w = 640, h = 400; const sky = g.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#5fc6ff'); sky.addColorStop(1, '#c9b3ff'); g.fillStyle = sky; g.fillRect(0, 0, w, h);
  g.fillStyle = '#4b3a7a'; g.beginPath(); g.moveTo(w / 2 - 30, 150); g.lineTo(w / 2 + 30, 150); g.lineTo(w / 2 + 200, h); g.lineTo(w / 2 - 200, h); g.fill(); g.fillStyle = '#9fe8ff'; for (let i = 0; i < 6; i++) { const p = ((i / 6 + t * 0.4) % 1), y = 150 + p * 250, s = 6 + p * 20; g.beginPath(); g.moveTo(w / 2, y - s); g.lineTo(w / 2 + s * 0.6, y); g.lineTo(w / 2, y + s); g.lineTo(w / 2 - s * 0.6, y); g.fill(); }
  g.fillStyle = '#ffcc33'; g.fillRect(w / 2 - 22, 110, 44, 40); gameTex.needsUpdate = true; }

// ================================================================ game world: Crystal Rush
const world = new THREE.Group(); world.position.set(60, 0, 0); scene.add(world);
const skyT = canvasTex(512, 1024, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#2f7dff'); gr.addColorStop(0.55, '#8fd3ff'); gr.addColorStop(1, '#e3d4ff'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(255,255,255,.9)'; [[80, 420, 1], [330, 300, 1.3], [200, 620, 0.8]].forEach(([x, y, s]) => { g.beginPath(); g.arc(x, y, 50 * s, 0, 7); g.arc(x + 55 * s, y - 20 * s, 60 * s, 0, 7); g.arc(x + 110 * s, y, 45 * s, 0, 7); g.fill(); }); });
const skyM = new THREE.Mesh(new THREE.SphereGeometry(90, 32, 16), new THREE.MeshBasicMaterial({map: skyT, side: THREE.BackSide})); world.add(skyM);
const tileA = toon('#6c6f8f'), tileB = toon('#5a5c7a'), edge = neon('#c25cff');
const PATH_L = 60;
for (let i = 0; i < PATH_L; i++) { const z = -i * 1.2; world.add(mesh(rbox(3.0, 0.4, 1.15, 0.05), i % 2 ? tileA : tileB, {pos: [0, -0.2, z], outline: 'thin', cast: false})); }
[-1, 1].forEach(d => { const e = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, PATH_L * 1.2), edge); e.position.set(d * 1.55, 0.02, -PATH_L * 0.6 + 0.6); world.add(e); });
// floating islands
for (let i = 0; i < 12; i++) { const side = i % 2 ? 1 : -1, x = side * (7 + rnd(i) * 10), z = -8 - i * 6, y = -3 + rnd(i + 4) * 7; const isl = new THREE.Group(); isl.position.set(x, y, z); world.add(isl);
  isl.add(mesh(new THREE.CylinderGeometry(1.6 + rnd(i) * 1.2, 0.4, 2.0, 7), toon('#8a6a4a'), {outline: 'mid', cast: false})); isl.add(mesh(new THREE.CylinderGeometry(1.75 + rnd(i) * 1.2, 1.75 + rnd(i) * 1.2, 0.4, 7), toon('#59c46a'), {pos: [0, 1.15, 0], outline: 'mid', cast: false}));
  if (i % 3 === 0) isl.add(mesh(new THREE.ConeGeometry(0.9, 1.8, 6), toon('#3fae52'), {pos: [0.3, 2.3, 0], outline: 'mid', cast: false})); }
// castle gate with crown at the end of the path
const castle = new THREE.Group(); castle.position.set(0, 0, -PATH_L * 1.2 - 2); world.add(castle);
[-3.2, 3.2].forEach(x => { castle.add(mesh(rbox(2.2, 9, 2.2, 0.1), toon('#6a5a9a'), {pos: [x, 4.5, 0]})); castle.add(mesh(new THREE.ConeGeometry(1.6, 2.6, 4), toon('#8a4ddb'), {pos: [x, 10.3, 0], rot: [0, Math.PI / 4, 0]})); });
castle.add(mesh(rbox(8.6, 2, 2.2, 0.1), toon('#6a5a9a'), {pos: [0, 8, 0]}));
put(castle, new THREE.Mesh(new THREE.PlaneGeometry(4.2, 7), neon('#e07bff')), 0, 3.5, 1.15);
const crown = new THREE.Group(); crown.position.set(0, 10.4, 0.4); castle.add(crown); crown.add(mesh(new THREE.CylinderGeometry(1.4, 1.2, 1.0, 8, 1, true), toon('#ffc93c'), {outline: 'mid'}));
for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; crown.add(mesh(new THREE.ConeGeometry(0.3, 0.8, 4), toon('#ffc93c'), {pos: [Math.cos(a) * 1.3, 0.85, Math.sin(a) * 1.3], outline: 'thin'})); }
// crystals along the path
const crystals = []; const crysM = new THREE.MeshToonMaterial({color: '#7fe8ff', gradientMap: ramp, emissive: '#2fb8ff', emissiveIntensity: 0.6});
for (let i = 0; i < 30; i++) { const c = mesh(new THREE.OctahedronGeometry(0.42, 0), crysM, {outline: 'thin', cast: false}); c.scale.set(0.8, 1.35, 0.8); c.position.set((i % 3 - 1) * 0.9, 0.9, -6 - i * 2.4); world.add(c); crystals.push(c);
  const glow = new THREE.Mesh(new THREE.CircleGeometry(0.9, 24), new THREE.MeshBasicMaterial({color: '#9ff0ff', transparent: true, opacity: 0.35, depthWrite: false})); c.add(glow); glow.userData.billboard = true; }

// ================================================================ lights
const hemi = new THREE.HemisphereLight('#efe4ff', '#3a2a5c', 1.15); scene.add(hemi);
const key = new THREE.DirectionalLight('#fff0e0', 2.0); key.position.set(4, 9, 7); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, {left: -7, right: 7, top: 9, bottom: -2, near: 0.5, far: 40}); key.shadow.bias = -0.0006; key.shadow.normalBias = 0.02; scene.add(key); scene.add(key.target);
const rim = new THREE.DirectionalLight('#b88bff', 1.1); rim.position.set(-6, 5, -4); scene.add(rim);
const monGlow = new THREE.PointLight('#8fd8ff', 6, 8, 2); monGlow.position.set(-0.4, 3.0, 0.4); scene.add(monGlow);

// ================================================================ HUD overlay (timer, speech bubble, captions, coin chips, badges)
function roundRect(x, y, w, h, r) { oc.beginPath(); oc.roundRect(x, y, w, h, r); }
function timerHUD(t) { const s = t < 6.0 ? 10 : t < 11.0 ? 9 : t < 16.0 ? 8 : 7; const x = 640, y = 50, w = 400, h = 130;
  oc.save(); oc.shadowColor = '#ff2a2a'; oc.shadowBlur = 30; roundRect(x, y, w, h, 26); oc.fillStyle = '#1a0a12'; oc.fill(); oc.lineWidth = 9; oc.strokeStyle = '#ff3b3b'; oc.stroke(); oc.restore();
  oc.lineWidth = 7; oc.strokeStyle = '#ffffff'; oc.beginPath(); oc.arc(x + 70, y + 70, 30, 0, 7); oc.stroke(); oc.beginPath(); oc.moveTo(x + 70, y + 70); oc.lineTo(x + 70, y + 50); oc.moveTo(x + 70, y + 70); oc.lineTo(x + 84, y + 78); oc.stroke(); oc.fillStyle = '#fff'; oc.fillRect(x + 62, y + 28, 16, 10);
  oc.font = '100px Lilita'; oc.textAlign = 'left'; oc.textBaseline = 'middle'; oc.fillStyle = '#fff'; oc.fillText('00:', x + 120, y + 70); oc.fillStyle = '#ff4a4a'; oc.fillText(String(s).padStart(2, '0'), x + 268, y + 70); }
// bubble lines: array of [text, colour]; tail side 'l'|'r'
function bubble(t, t0, lines, x, y, w, tail = 'l') { const u = Math.min(1, (t - t0) / 0.18); if (u <= 0) return; const k = 1 + 2.70158 * Math.pow(u - 1, 3) + 1.70158 * Math.pow(u - 1, 2), lh = 92, h = lines.length * lh + 70;
  oc.save(); oc.translate(x + w / 2, y + h / 2); oc.scale(k, k); oc.translate(-w / 2, -h / 2);
  oc.beginPath(); oc.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, 7); oc.fillStyle = '#fff'; oc.fill(); oc.lineWidth = 10; oc.strokeStyle = '#111'; oc.stroke();
  oc.beginPath(); const tx = tail === 'l' ? w * 0.28 : w * 0.72; oc.moveTo(tx - 40, h - 20); oc.lineTo(tx + (tail === 'l' ? 70 : -70), h + 80); oc.lineTo(tx + 40, h - 14); oc.closePath(); oc.fill(); oc.stroke(); oc.beginPath(); oc.ellipse(w / 2, h / 2, w / 2 - 6, h / 2 - 6, 0, 0, 7); oc.fillStyle = '#fff'; oc.fill();
  oc.textAlign = 'center'; oc.textBaseline = 'middle'; lines.forEach(([tx2, col, sz], i) => { oc.font = `${sz || 84}px Lilita`; oc.fillStyle = col || '#111'; oc.fillText(tx2, w / 2, 35 + lh / 2 + i * lh); if (col === '#e3192b') { const mw = oc.measureText(tx2).width; oc.fillRect(w / 2 - mw / 2, 35 + lh / 2 + i * lh + 38, mw, 7); } }); oc.restore(); }
const CAPS = [[0.2, 1.2, [['ZYLOX!', '#fff']]], [1.2, 1.6, [['TEN SECONDS', '#fff']]], [1.6, 2.4, [['OF ROBLOX.', '#fff']]], [2.4, 3.2, [["THAT'S ", '#fff'], ['ALL!', '#ffd23f']]], [3.2, 3.8, [['TEN?!', '#ffd23f']]], [3.8, 4.4, [['I GOTTA', '#fff']]], [4.4, 4.8, [['GET RICH', '#fff']]], [4.8, 5.4, [['FAST!', '#ffd23f']]],
  [6.2, 7.0, [['CRYSTAL RUSH!', '#fff']]], [7.0, 7.6, [["LET'S GO!", '#fff']]], [7.6, 8.2, [['WAIT...', '#fff']]], [8.2, 8.6, [['EVERY CRYSTAL', '#fff']]], [8.6, 9.0, [['DOUBLES', '#ffd23f'], [' MY', '#fff']]], [9.0, 9.2, [['COINS?!', '#fff']]], [9.2, 9.4, [['TWO!', '#fff']]], [9.4, 9.8, [['FOUR!', '#fff']]], [9.8, 10.2, [['EIGHT!', '#fff']]], [10.2, 11.0, [['SIXTEEN!', '#ffd23f']]], [11.0, 11.8, [['A ', '#fff'], ['THOUSAND', '#ffd23f']]], [11.8, 13.0, [['ALREADY?!', '#fff']]]];
function captions(t) { const c = CAPS.find(c => t >= c[0] && t < c[1]); if (!c) return; const u = Math.min(1, (t - c[0]) / 0.12), k = 0.6 + 0.4 * u;
  oc.save(); oc.font = '96px Lilita'; oc.textBaseline = 'middle'; oc.lineJoin = 'round'; const wsum = c[2].reduce((s, [w]) => s + oc.measureText(w).width, 0); oc.translate(W / 2, H * 0.735); oc.scale(k, k); let x = -wsum / 2;
  c[2].forEach(([w, col]) => { oc.textAlign = 'left'; oc.lineWidth = 22; oc.strokeStyle = '#120a1c'; oc.strokeText(w, x, 0); oc.fillStyle = col; oc.fillText(w, x, 0); x += oc.measureText(w).width; }); oc.restore(); }
function chip(x, y, txt, t0, t, big = false) { const u = Math.min(1, Math.max(0, (t - t0) / 0.2)); if (u <= 0) return; const k = 1 + 2.70158 * Math.pow(u - 1, 3) + 1.70158 * Math.pow(u - 1, 2);
  oc.save(); oc.translate(x, y); oc.scale(k, k); oc.font = `${big ? 90 : 64}px Lilita`; const tw = oc.measureText(txt).width, w = tw + (big ? 150 : 110), h = big ? 120 : 88; roundRect(-w / 2, -h / 2, w, h, 22); oc.fillStyle = 'rgba(22,26,70,.88)'; oc.fill(); oc.lineWidth = 6; oc.strokeStyle = '#7fb4ff'; oc.stroke(); zCoin(oc, -w / 2 + h / 2 + 4, 0, h * 0.34); oc.textAlign = 'left'; oc.textBaseline = 'middle'; oc.fillStyle = '#fff'; oc.fillText(txt, -w / 2 + h - 2, 4); oc.restore(); }
function badge(x, y, lines, col) { oc.save(); oc.translate(x, y); roundRect(-150, -90, 300, 180, 30); oc.fillStyle = 'rgba(20,24,80,.9)'; oc.fill(); oc.lineWidth = 7; oc.strokeStyle = col; oc.stroke(); oc.textAlign = 'center'; lines.forEach(([tx, sz, c], i) => { oc.font = `${sz}px Lilita`; oc.fillStyle = c; oc.fillText(tx, 0, -30 + i * (sz * 0.95)); }); oc.restore(); }
function coinBurst(t, t0) { const u = t - t0; if (u < 0) return; for (let i = 0; i < 22; i++) { const a = rnd(i) * Math.PI * 2, sp = 500 + rnd(i + 3) * 700, x = W / 2 + Math.cos(a) * sp * u, y = 700 + Math.sin(a) * sp * u * 0.7 + 600 * u * u, r = 40 + rnd(i + 7) * 30; if (y > H + 80) continue; oc.save(); oc.translate(x, y); oc.scale(Math.abs(Math.cos(u * 6 + i)) * 0.8 + 0.2, 1); zCoin(oc, 0, 0, r); oc.restore(); }
  const k = Math.min(1, u / 0.2); oc.save(); oc.translate(W / 2, 640); oc.scale(k, k); oc.shadowColor = '#ffe066'; oc.shadowBlur = 60; roundRect(-330, -110, 660, 220, 50); oc.fillStyle = 'rgba(255,200,40,.92)'; oc.fill(); oc.shadowBlur = 0; oc.lineWidth = 10; oc.strokeStyle = '#a5640f'; oc.stroke(); zCoin(oc, -230, 0, 80); oc.font = '120px Lilita'; oc.textAlign = 'left'; oc.textBaseline = 'middle'; oc.lineWidth = 16; oc.strokeStyle = '#7a3e08'; oc.strokeText('+1,000', -130, -18); oc.fillStyle = '#fff'; oc.fillText('+1,000', -130, -18); oc.font = '70px Lilita'; oc.strokeText('COINS!', -60, 66); oc.fillText('COINS!', -60, 66); oc.restore(); }

// ================================================================ shots (block 1: 0-13 s)
const talk = (t, on) => on ? 0.25 + 0.75 * Math.abs(Math.sin(t * 17)) : 0.15;
function camShot(p0, l0, p1, l1, u, fov = 32) { const e = sm(u); camera.position.set(lerp(p0[0], p1[0], e), lerp(p0[1], p1[1], e), lerp(p0[2], p1[2], e)); camera.lookAt(lerp(l0[0], l1[0], e), lerp(l0[1], l1[1], e), lerp(l0[2], l1[2], e)); camera.fov = fov; camera.updateProjectionMatrix(); }
function seatZylox() { zylox.position.set(-0.4, 1.35, 1.75); zylox.rotation.y = Math.PI; Z.pose({l: [-1.25, 0, 0.25], r: [-1.25, 0, -0.25], legL: [-1.5, 0, 0], legR: [-1.5, 0, 0], head: [0, 0, 0]}); }
function run(t, speed = 9) { const ph = t * speed; Z.pose({l: [Math.sin(ph) * 0.9, 0, 0.12], r: [-Math.sin(ph) * 0.9, 0, -0.12], legL: [-Math.sin(ph) * 0.8, 0, 0], legR: [Math.sin(ph) * 0.8, 0, 0], head: [0.05, 0, 0]}); return Math.abs(Math.sin(ph)) * 0.12; }
const SHOTS = [
  {t0: 0, t1: 3.2, run(t, u) { // Mom in the doorway: ten seconds, that's all
    camShot([-3.0, 3.9, 9.8], [1.0, 2.9, -1.0], [-2.6, 3.8, 9.0], [1.1, 2.9, -1.2], u, 36); seatZylox(); zylox.rotation.y = Math.PI - 0.5; Z.pose({head: [0, 0.6, 0]}); Z.setFace({eyes: 'wide', look: [0.8, -0.2], mouth: 'o', open: 0.5, raise: 0.6});
    mom.position.set(3.0, 1.32, -2.2); mom.rotation.y = -0.35; M.setFace({eyes: 'half', mouth: 'shout', open: talk(t, true), browL: 1.2, browR: 1.2}); M.pose({l: [-1.5, 0, 0.35], r: [-1.5, 0, -0.35], head: [0.04, 0, 0.05], legL: [0, 0, 0], legR: [0, 0, 0]});
    bubble(t, 0.15, [['Zylox!'], ['Ten seconds'], ['of Roblox.'], ["That's ", '#111'], ['ALL!', '#e3192b']], 40, 70, 560, 'r'); } },
  {t0: 3.2, t1: 4.77, run(t, u) { // TEN?! close-up
    camShot([0.3, 3.35, 7.4], [-0.4, 3.15, 1.75], [0.2, 3.3, 6.9], [-0.4, 3.15, 1.75], u, 30); seatZylox(); zylox.rotation.y = 0.15; chair.visible = false; Z.pose({head: [-0.05, 0.1, Math.sin(t * 30) * 0.03], l: [-0.6, 0, 0.6], r: [-1.9, 0, -0.4]});
    Z.setFace({eyes: 'wide', look: [0.3, 0], mouth: 'shout', open: talk(t, true), browL: -1.0, browR: -1.0, raise: 1.0}); mom.position.set(30, 0, 0);
    bubble(t, 3.25, [['TEN?!', '#e3192b', 100], ['I gotta get'], ['rich ', '#111'], ['FAST!', '#e3192b', 100]], 470, 300, 570, 'l'); } },
  {t0: 4.77, t1: 6.07, run(t, u) { // determined grin, fist
    camShot([1.0, 3.3, 7.0], [-0.4, 3.1, 1.75], [0.8, 3.25, 6.6], [-0.4, 3.1, 1.75], u, 30); seatZylox(); zylox.rotation.y = 0.25; chair.visible = false; Z.pose({head: [0.0, 0.2, -0.05], l: [-1.25, 0, 0.25], r: [-2.4 + Math.sin(t * 8) * 0.1, 0, -0.2]});
    Z.setFace({eyes: 'half', lid: '#e0ad87', look: [0.2, -0.1], mouth: 'grin', browL: 1.0, browR: 1.0}); mom.position.set(30, 0, 0); } },
  {t0: 6.07, t1: 7.63, run(t, u) { // Crystal Rush! Let's go! (from behind)
    const z = -(t - 6.07) * 7; zylox.position.set(60, 1.25 + run(t), z); zylox.rotation.y = Math.PI; camShot([60.6, 4.6, z + 10.5], [60, 2.1, z - 8], [60.4, 4.5, z + 10.2], [60, 2.1, z - 8], u, 42); Z.setFace({eyes: 'normal', mouth: 'grin'});
    bubble(t, 6.15, [['Crystal'], ['Rush!'], ["Let's GO!", '#e3192b']], 50, 70, 480, 'r'); badge(250, 1250, [['CRYSTAL RUSH!', 44, '#fff'], ['1', 70, '#ffd23f']], '#7fb4ff'); badge(880, 1250, [['x2', 100, '#ffd23f'], ['PER CRYSTAL!', 36, '#fff']], '#ffd23f'); } },
  {t0: 7.63, t1: 10.53, run(t, u) { // every crystal doubles (3/4 front)
    const z = -10 - (t - 7.63) * 7; zylox.position.set(60.2, 1.25 + run(t), z); zylox.rotation.y = Math.PI; camShot([62.2, 3.1, z - 8.5], [60.2, 2.3, z], [61.9, 3.0, z - 8.2], [60.2, 2.3, z], u, 38); Z.setFace({eyes: 'wide', look: [0.6, -0.2], mouth: 'o', open: 0.7, raise: 0.8});
    crystals.forEach((c, i) => { const cz = c.position.z; c.visible = !(cz > z - 1.0 && cz < z + 0.6 && Math.abs(c.position.x - 0.2) < 0.7) || i % 3 === 1 ? true : true; });
    bubble(t, 7.7, [['Wait...'], ['every crystal'], ['DOUBLES', '#e3192b'], ['my coins?!'], ['SIXTEEN!', '#e3192b']], 30, 50, 540, 'r');
    [[8.0, '1', 330, 1500], [9.2, '2', 380, 1320], [9.4, '4', 470, 1150], [9.8, '8', 560, 980], [10.2, '16', 650, 810]].forEach(([t0, s, x, y]) => chip(x + 220, y - 180, s, t0, t)); } },
  {t0: 10.53, t1: 11.47, run(t, u) { // still collecting, from behind
    const z = -32 - (t - 10.53) * 7; zylox.position.set(60, 1.25 + run(t), z); zylox.rotation.y = Math.PI; camShot([61.0, 4.5, z + 10.0], [60, 2.1, z - 8], [60.8, 4.4, z + 9.7], [60, 2.1, z - 8], u, 42); Z.setFace({eyes: 'wide', mouth: 'grin'});
    chip(800, 520, '20', 10.6, t); chip(820, 700, '20', 10.75, t); } },
  {t0: 11.47, t1: 13.0, run(t, u) { // A THOUSAND already?! Speed Boost! BUY!
    const z = -40; zylox.position.set(60, 1.25, z); zylox.rotation.y = 0; camShot([60.4, 3.5, z + 7.6], [60, 3.0, z], [60.3, 3.4, z + 7.2], [60, 3.0, z], u, 32);
    Z.pose({l: [-0.4, 0, 0.5], r: [-2.5 + Math.sin(t * 10) * 0.15, 0, -0.3], legL: [0, 0, 0], legR: [0, 0, 0], head: [-0.08, 0, 0.05]}); Z.setFace({eyes: 'happy', mouth: 'grin', browL: -0.4, browR: -0.4});
    coinBurst(t, 11.55); bubble(t, 11.5, [['A THOUSAND'], ['already?!'], ['Speed Boost!'], ['BUY!', '#e3192b']], 40, 50, 520, 'r'); } }
];
window.renderAt = t => {
  oc.clearRect(0, 0, W, H); drawMonitor(t);
  zylox.position.set(-0.4, 1.35, 1.75); zylox.rotation.y = Math.PI; mom.position.set(30, 0, 0); chair.visible = true;
  crystals.forEach((c, i) => { c.rotation.y = t * 2 + i; c.children.forEach(ch => { if (ch.userData.billboard) ch.quaternion.copy(camera.quaternion); }); });
  const sh = SHOTS.find(s => t >= s.t0 && t < s.t1) || SHOTS[SHOTS.length - 1]; sh.run(t, (t - sh.t0) / (sh.t1 - sh.t0));
  crystals.forEach(c => c.children.forEach(ch => { if (ch.userData.billboard) ch.quaternion.copy(camera.quaternion); }));
  key.position.set(camera.position.x + 4, 9, camera.position.z + 6); key.target.position.set(camera.position.x, 0, camera.position.z - 6);
  renderer.render(scene, camera); timerHUD(t); captions(t); return true;
};
window.dbg = {skyM, room, world, scene, camera, castle, crystals}; window.renderAt(0); window.ready = true;
