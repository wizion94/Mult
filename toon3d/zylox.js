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
  oc.textAlign = 'center'; oc.textBaseline = 'middle'; lines.forEach(([tx2, col, sz], i) => { let fsz = sz || 84; oc.font = `${fsz}px Lilita`; const lim = w * (i === 0 || i === lines.length - 1 ? 0.62 : 0.84); const mw0 = oc.measureText(tx2).width; if (mw0 > lim) { fsz = Math.floor(fsz * lim / mw0); oc.font = `${fsz}px Lilita`; } oc.fillStyle = col || '#111'; oc.fillText(tx2, w / 2, 35 + lh / 2 + i * lh); if (col === '#e3192b') { const mw = oc.measureText(tx2).width; oc.fillRect(w / 2 - mw / 2, 35 + lh / 2 + i * lh + 38, mw, 7); } }); oc.restore(); }
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
    mom.position.set(3.0, 1.32, -2.2); mom.rotation.y = -0.35; mom.visible = true; M.setFace({eyes: 'half', mouth: 'shout', open: talk(t, true), browL: 1.2, browR: 1.2}); M.pose({l: [-1.5, 0, 0.35], r: [-1.5, 0, -0.35], head: [0.04, 0, 0.05], legL: [0, 0, 0], legR: [0, 0, 0]});
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
// ================================================================ FULL VERSION: stages for 13-60.6 s
const sub = (p, o) => { p.add(o); return o; };
// ---- shop stage (x=120): dark neon backdrop + big UI panel
const shop = new THREE.Group(); shop.position.set(120, 0, 0); scene.add(shop);
const backT = canvasTex(512, 1024, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#2b1670'); gr.addColorStop(1, '#10072e'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(190,120,255,.18)'; g.lineWidth = 3; for (let x = 0; x < w; x += 64) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } for (let y = 0; y < h; y += 64) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); } });
put(shop, new THREE.Mesh(new THREE.PlaneGeometry(48, 30), new THREE.MeshBasicMaterial({map: backT})), 0, 8, -9);
const sFloor = new THREE.Mesh(new THREE.PlaneGeometry(40, 30), toon('#2a1a5a')); sFloor.rotation.x = -Math.PI / 2; sFloor.receiveShadow = true; shop.add(sFloor);
[[-6, '#c25cff'], [-2, '#ff5ec8'], [3, '#6a9cff'], [8, '#c25cff']].forEach(([x, c]) => put(shop, new THREE.Mesh(new THREE.BoxGeometry(0.1, 12, 0.06), neon(c)), x, 6, -8.9));
const shopCan = document.createElement('canvas'); shopCan.width = 700; shopCan.height = 960; const sg = shopCan.getContext('2d'); const shopTex = new THREE.CanvasTexture(shopCan); shopTex.colorSpace = THREE.SRGBColorSpace; shopTex.anisotropy = 8;
const panelG = new THREE.Group(); panelG.position.set(1.7, 3.5, -1.6); panelG.rotation.y = -0.3; shop.add(panelG);
panelG.add(mesh(rbox(3.7, 5.0, 0.16, 0.12), toon('#120a40'), {pos: [0, 0, -0.1], outline: 'thin', cast: false})); put(panelG, new THREE.Mesh(new THREE.PlaneGeometry(3.5, 4.8), new THREE.MeshBasicMaterial({map: shopTex})), 0, 0, 0.0);
function btn(g, x, y, w, h, label, cols, press) { g.save(); g.translate(x, y); const k = 1 - 0.07 * press; g.scale(k, k); const gr = g.createLinearGradient(0, -h / 2, 0, h / 2); gr.addColorStop(0, cols[0]); gr.addColorStop(1, cols[1]); g.beginPath(); g.roundRect(-w / 2, -h / 2, w, h, 26); g.fillStyle = gr; g.fill(); g.lineWidth = 8; g.strokeStyle = cols[2]; g.stroke(); g.font = '76px Lilita'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.lineWidth = 10; g.strokeStyle = 'rgba(0,0,0,.45)'; g.strokeText(label, 24, 6); g.fillText(label, 24, 6); g.beginPath(); g.arc(-w * 0.28, 4, 0, 0, 7); g.restore(); }
function cursorHand(g, x, y, press) { g.save(); g.translate(x, y); g.scale(1 - 0.12 * press, 1 - 0.12 * press); g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 80); g.lineTo(22, 62); g.lineTo(42, 104); g.lineTo(60, 96); g.lineTo(40, 56); g.lineTo(68, 54); g.closePath(); g.fillStyle = '#fff'; g.fill(); g.lineWidth = 8; g.strokeStyle = '#111'; g.stroke(); g.restore(); }
function priceChip(g, x, y, txt, red) { g.save(); g.translate(x, y); g.font = '58px Lilita'; const tw = g.measureText(txt).width, w = tw + 120; g.beginPath(); g.roundRect(-w / 2, -42, w, 84, 22); g.fillStyle = red ? 'rgba(90,10,30,.9)' : 'rgba(10,20,80,.9)'; g.fill(); g.lineWidth = 5; g.strokeStyle = red ? '#ff5a6a' : '#6aa0ff'; g.stroke(); zCoin(g, -w / 2 + 52, 0, 28); g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.fillText(txt, -w / 2 + 92, 4); g.restore(); }
function drawShop(mode, t, press = 0, cur = null) {
  const g = sg, w = 700, h = 960; g.clearRect(0, 0, w, h); const bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#2a1a78'); bg.addColorStop(1, '#0d0634'); g.fillStyle = bg; g.beginPath(); g.roundRect(0, 0, w, h, 54); g.fill();
  const old = mode === 'speed' || mode === 'magnet'; g.lineWidth = 14; g.strokeStyle = old ? '#ffb12b' : mode === 'nope' ? '#ff4a5a' : mode === 'done' ? '#3fe08a' : '#6aa0ff'; g.stroke();
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '56px Lilita'; g.fillStyle = '#e8e2ff';
  if (old) { g.fillText('🛒 SHOP', 350, 70);
    g.font = '88px Lilita'; g.lineWidth = 12; g.strokeStyle = '#2a0e5a'; const ttl = mode === 'speed' ? ['SPEED', 'BOOST'] : ['SUPER', 'MAGNET']; ttl.forEach((tx, i) => { g.strokeText(tx, 350, 190 + i * 90); g.fillStyle = '#fff'; g.fillText(tx, 350, 190 + i * 90); });
    g.save(); g.translate(350, 520); const gl = g.createRadialGradient(0, 0, 10, 0, 0, 220); gl.addColorStop(0, 'rgba(255,200,80,.5)'); gl.addColorStop(1, 'rgba(255,200,80,0)'); g.fillStyle = gl; g.fillRect(-250, -250, 500, 500);
    if (mode === 'speed') { g.beginPath(); g.moveTo(-170, 60); g.lineTo(-170, -60); g.quadraticCurveTo(-40, -90, 20, -10); g.lineTo(150, 20); g.quadraticCurveTo(190, 40, 180, 90); g.lineTo(-170, 90); g.closePath(); g.fillStyle = '#7a3cff'; g.fill(); g.lineWidth = 12; g.strokeStyle = '#1a0a50'; g.stroke(); g.fillStyle = '#fff'; g.fillRect(-176, 86, 360, 26); g.fillStyle = '#ffe14a'; g.beginPath(); g.moveTo(-20, -60); g.lineTo(-70, 20); g.lineTo(-30, 20); g.lineTo(-50, 70); g.lineTo(30, -10); g.lineTo(-10, -10); g.closePath(); g.fill(); [-1, 1].forEach(d => { g.beginPath(); g.moveTo(-170, -40 + d * 30); g.quadraticCurveTo(-230, -70 + d * 40, -250, -20 + d * 50); g.lineWidth = 10; g.strokeStyle = '#ffe14a'; g.stroke(); }); }
    else { g.lineCap = 'butt'; g.lineWidth = 78; g.strokeStyle = '#ff3b4e'; g.beginPath(); g.arc(0, -20, 120, Math.PI, 0); g.lineTo(120, 110); g.moveTo(-120, -20); g.lineTo(-120, 110); g.stroke(); g.lineWidth = 78; g.strokeStyle = '#e8ecff'; g.beginPath(); g.moveTo(-120, 70); g.lineTo(-120, 120); g.moveTo(120, 70); g.lineTo(120, 120); g.stroke(); g.lineWidth = 10; g.strokeStyle = '#1a0a50'; g.strokeRect(-160, 70, 80, 50); g.strokeRect(80, 70, 80, 50); g.fillStyle = '#ffe14a'; g.beginPath(); g.moveTo(10, -80); g.lineTo(-30, -10); g.lineTo(0, -10); g.lineTo(-20, 40); g.lineTo(40, -30); g.lineTo(10, -30); g.closePath(); g.fill(); }
    g.restore(); priceChip(g, 350, 700, mode === 'speed' ? '1,000' : '2,500'); btn(g, 350, 820, 460, 110, 'BUY', ['#49e86b', '#1aa33a', '#0a5a1f'], press); }
  else if (mode === 'inv') { g.fillText('INVENTORY', 350, 80); const items = [['#ffd23f', 0], ['#ff8aa0', 1], ['#6aa0ff', 2], ['#ff3b4e', 3], ['#b26bff', 4], ['#7fe8ff', 5]];
    items.forEach(([c, i]) => { const x = 130 + (i % 2) * 220 + 60, y = 230 + Math.floor(i / 2) * 190 + 40; g.beginPath(); g.roundRect(x - 85, y - 80, 170, 160, 24); g.fillStyle = 'rgba(80,60,200,.35)'; g.fill(); g.lineWidth = i === 3 ? 10 : 5; g.strokeStyle = i === 3 ? '#ffd23f' : '#6a5ad8'; g.stroke(); g.fillStyle = c; if (i === 3) { g.lineWidth = 30; g.strokeStyle = '#ff3b4e'; g.beginPath(); g.arc(x, y - 6, 38, Math.PI, 0); g.lineTo(x + 38, y + 38); g.moveTo(x - 38, y - 6); g.lineTo(x - 38, y + 38); g.stroke(); } else { g.beginPath(); g.arc(x, y, 38, 0, 7); g.fill(); } });
    g.font = '50px Lilita'; g.fillStyle = '#ffe14a'; g.fillText('SUPER MAGNET', 350, 830); g.beginPath(); g.roundRect(120, 870, 460, 56, 18); g.fillStyle = 'rgba(255,210,60,.2)'; g.fill(); g.font = '40px Lilita'; g.fillStyle = '#fff'; g.fillText('SELL  →  +2,500', 350, 898); }
  else { g.font = '50px Lilita'; g.fillStyle = '#ffd23f'; g.fillText('👑 SECRET SHOP', 350, 70);
    g.save(); g.translate(350, 290); const hg = g.createRadialGradient(0, 0, 20, 0, 0, 190); hg.addColorStop(0, 'rgba(90,200,255,.6)'); hg.addColorStop(1, 'rgba(90,200,255,0)'); g.fillStyle = hg; g.fillRect(-200, -200, 400, 400); g.beginPath(); g.roundRect(-70, -70, 140, 140, 28); g.fillStyle = '#9fe0ff'; g.fill(); g.lineWidth = 8; g.strokeStyle = '#1a3a8a'; g.stroke(); g.fillStyle = '#1d1d3a'; g.beginPath(); g.arc(-26, -10, 12, 0, 7); g.arc(26, -10, 12, 0, 7); g.fill(); g.beginPath(); g.arc(0, 22, 30, 0.15 * Math.PI, 0.85 * Math.PI); g.lineWidth = 8; g.strokeStyle = '#1d1d3a'; g.stroke(); g.restore();
    g.font = '66px Lilita'; g.lineWidth = 10; g.strokeStyle = '#1a0a50'; ['AUTO-PLAY', 'CLONE'].forEach((tx, i) => { g.strokeText(tx, 350, 470 + i * 70); g.fillStyle = i ? '#ffd23f' : '#fff'; g.fillText(tx, 350, 470 + i * 70); });
    g.font = '38px Lilita'; g.textAlign = 'left'; ['Plays for you', 'Earns coins 24/7', "Works while you're OFFLINE"].forEach((tx, i) => { g.fillStyle = '#3fe08a'; g.fillText('✔', 80, 640 + i * 52); g.fillStyle = '#e8e2ff'; g.fillText(tx, 130, 640 + i * 52); }); g.textAlign = 'center';
    if (mode === 'clone') { btn(g, 350, 850, 480, 110, 'BUY', ['#ffd23a', '#e89a10', '#7a4a06'], press); priceChip(g, 350, 925, '1,000,000'); }
    if (mode === 'nope') { g.beginPath(); g.roundRect(60, 810, 580, 110, 22); g.fillStyle = 'rgba(120,10,30,.9)'; g.fill(); g.lineWidth = 6; g.strokeStyle = '#ff4a5a'; g.stroke(); g.font = '58px Lilita'; g.fillStyle = '#fff'; g.fillText('⚠ NOT ENOUGH COINS!', 350, 866); priceChip(g, 350, 935, 'Required: 2,500,000', true); }
    if (mode === 'done') { g.beginPath(); g.roundRect(60, 800, 580, 100, 26); g.fillStyle = '#1aa33a'; g.fill(); g.lineWidth = 7; g.strokeStyle = '#7dffaa'; g.stroke(); g.font = '58px Lilita'; g.fillStyle = '#fff'; g.fillText('✔ PURCHASED!', 350, 850); g.font = '50px Lilita'; g.fillStyle = '#7dffaa'; g.fillText('CLONE ACTIVATED!', 350, 930); } }
  if (cur) cursorHand(g, cur[0], cur[1], press); shopTex.needsUpdate = true; }
// ---- hologram clone + items
const ZOPT = {skin: '#bdeeff', shirt: '#2f6bff', cuff: '#2a58d6', torsoDecal: zHoodie, legs: '#2a58d6', shoe: '#1b2a6a', face: {eyes: 'normal', iris: '#2a3a8a', brow: '#1d2a6a', mouth: 'grin', scar: 'l', fringe: {color: '#6ac8ff', style: 'wavy'}},
  hair(h) { const hm = toon('#6ac8ff'); h.add(mesh(rbox(1.2, 0.36, 1.12, 0.14), hm, {pos: [0, 0.5, -0.02], outline: 'thick'})); [[-0.35, 0.3], [0, 0.2], [0.35, -0.2]].forEach(([x, rz]) => h.add(mesh(new THREE.ConeGeometry(0.24, 0.62, 5), hm, {pos: [x, 0.9, 0.1], rot: [0, 0, rz], outline: 'mid'}))); } };
const cloneC = character(ZOPT); cloneC.traverse(o => { if (o.material && o.material.isMeshToonMaterial) { o.material.emissive = new THREE.Color('#2fa0ff'); o.material.emissiveIntensity = 0.35; } }); scene.add(cloneC); const C1 = cloneC.userData;
const heroCrown = new THREE.Group(); heroCrown.position.set(0, 1.0, 0); zylox.userData.head.add(heroCrown); heroCrown.add(mesh(new THREE.CylinderGeometry(0.46, 0.4, 0.3, 8, 1, true), toon('#ffc93c'), {outline: 'mid'})); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; heroCrown.add(mesh(new THREE.ConeGeometry(0.1, 0.32, 4), toon('#ffc93c'), {pos: [Math.cos(a) * 0.43, 0.3, Math.sin(a) * 0.43], outline: 'thin'})); } heroCrown.visible = false;
// capsule with the clone (secret shop)
const capsule = new THREE.Group(); capsule.position.set(2.6, 0, -2.4); shop.add(capsule);
capsule.add(mesh(new THREE.CylinderGeometry(1.5, 1.7, 0.4, 28), toon('#ffcf3a'), {pos: [0, 0.2, 0], outline: 'mid'})); capsule.add(mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.3, 28), toon('#ffcf3a'), {pos: [0, 5.2, 0], outline: 'mid'}));
const glass = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.35, 4.8, 28, 1, true), new THREE.MeshBasicMaterial({color: '#7fe8ff', transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false})); glass.position.y = 2.7; capsule.add(glass);
[0, 1, 2, 3].forEach(i => { const a = i * Math.PI / 2 + Math.PI / 4; put(capsule, new THREE.Mesh(new THREE.BoxGeometry(0.07, 4.8, 0.07), neon('#aef0ff')), Math.cos(a) * 1.36, 2.7, Math.sin(a) * 1.36); });
for (let i = 0; i < 5; i++) { const sh = new THREE.Group(); sh.position.set(-5 + i * 2.5, 2.2 + (i % 2) * 2, -7.5); shop.add(sh); sh.add(mesh(rbox(1.8, 0.14, 0.9, 0.04), toon('#5a3aa8'), {outline: 'thin', cast: false})); sh.add(mesh(rbox(0.7, 0.55, 0.5, 0.1), toon(['#ffc93c', '#ff6bd6', '#6aa0ff', '#7fe8ff', '#ff8a4a'][i]), {pos: [0, 0.4, 0], outline: 'thin', cast: false})); }
// ---- cart of goodies
const cart = new THREE.Group(); cart.position.set(1.2, 0, -1.0); shop.add(cart);
cart.add(mesh(rbox(4.0, 0.25, 2.4, 0.06), toon('#ff5ec8'), {pos: [0, 0.9, 0], outline: 'mid'}));
[[-2.0, -1.2], [2.0, -1.2], [-2.0, 1.2], [2.0, 1.2]].forEach(([x, z]) => { put(cart, mesh(rbox(0.12, 1.5, 0.12, 0.04), toon('#ffd23f'), {outline: 'thin'}), x, 1.75, z); put(cart, mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.2, 14), toon('#2a2140'), {rot: [0, 0, Math.PI / 2], outline: 'thin'}), x, 0.3, z); });
[[0, 2.5, 1.2, 4.1, 0.1, 0.1], [0, 2.5, -1.2, 4.1, 0.1, 0.1], [-2.0, 2.5, 0, 0.1, 0.1, 2.5], [2.0, 2.5, 0, 0.1, 0.1, 2.5]].forEach(([x, y, z, w, h, d]) => put(cart, mesh(rbox(w, h, d, 0.03), toon('#ffd23f'), {outline: 'thin'}), x, y, z));
put(cart, mesh(rbox(0.12, 2.2, 0.12, 0.04), toon('#ffd23f'), {outline: 'thin'}), -2.4, 2.2, 0);
const duck = new THREE.Group(); duck.position.set(-0.6, 1.9, 0); cart.add(duck); duck.add(mesh(new THREE.SphereGeometry(0.8, 18, 14), toon('#ffd43a'), {outline: 'mid'})); duck.add(mesh(new THREE.SphereGeometry(0.5, 16, 12), toon('#ffd43a'), {pos: [0.4, 0.8, 0], outline: 'mid'})); duck.add(mesh(rbox(0.55, 0.18, 0.4, 0.08), toon('#ff9a2a'), {pos: [0.95, 0.75, 0], outline: 'thin'})); duck.add(mesh(rbox(0.7, 0.2, 0.18, 0.05), toon('#1a1a2a'), {pos: [0.65, 0.95, 0], outline: 'thin'}));
const cr2 = new THREE.Group(); cr2.position.set(1.1, 1.3, 0.4); cart.add(cr2); cr2.add(mesh(new THREE.CylinderGeometry(0.55, 0.45, 0.4, 8, 1, true), toon('#ffc93c'), {outline: 'mid'})); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; cr2.add(mesh(new THREE.ConeGeometry(0.13, 0.4, 4), toon('#ffc93c'), {pos: [Math.cos(a) * 0.52, 0.4, Math.sin(a) * 0.52], outline: 'thin'})); }
const disco = mesh(new THREE.SphereGeometry(0.55, 16, 12), toon('#c9d6ff'), {pos: [0.9, 1.7, -0.6], outline: 'mid'}); cart.add(disco);
const throne = new THREE.Group(); throne.position.set(-1.4, 1.2, -0.5); cart.add(throne); throne.add(mesh(rbox(0.8, 0.7, 0.7, 0.1), toon('#e8324a'), {pos: [0, 0.35, 0], outline: 'mid'})); throne.add(mesh(rbox(0.8, 1.2, 0.2, 0.1), toon('#e8324a'), {pos: [0, 1.0, -0.3], outline: 'mid'}));
// ---- golden gate for the door scene (world)
const gate = new THREE.Group(); gate.position.set(5.6, 0, -46.5); gate.rotation.y = -Math.PI / 2; world.add(gate);
const goldM = toon('#f2b632'); [-2.6, 2.6].forEach(x => put(gate, mesh(rbox(1.5, 7, 1.5, 0.12), toon('#b8862a'), {outline: 'mid'}), x, 3.5, 0)); put(gate, mesh(rbox(6.8, 1.2, 1.5, 0.12), toon('#b8862a'), {outline: 'mid'}), 0, 7.2, 0);
const qTex = canvasTex(256, 512, g => { g.fillStyle = '#b8862a'; g.fillRect(0, 0, 256, 512); g.strokeStyle = '#7a5410'; g.lineWidth = 10; g.strokeRect(20, 20, 216, 472); g.font = '230px Lilita'; g.textAlign = 'center'; g.fillStyle = '#ffe6a0'; g.shadowColor = '#fff'; g.shadowBlur = 40; g.fillText('?', 128, 330); });
const leaves = [-1, 1].map(d => { const l = new THREE.Group(); l.position.set(d * 1.3, 0, 0); gate.add(l); l.add(mesh(rbox(2.5, 6, 0.3, 0.1), goldM, {pos: [d * 1.25 * 0, 3, 0], outline: 'mid'})); l.children[0].position.x = d * 1.25 * 0; l.add(decal(qTex, 2.1, 5.4, {pos: [0, 3, 0.17]})); return l; });
put(gate, new THREE.Mesh(new THREE.PlaneGeometry(5, 6), new THREE.MeshBasicMaterial({color: '#fff6c0'})), 0, 3, -0.2);
[-1, 1].forEach(d => { const q = mesh(rbox(1.5, 2.2, 0.2, 0.08), toon('#6a3ac8'), {pos: [d * 5.0, 2.6, 0], outline: 'mid'}); gate.add(q); q.add(decal(canvasTex(128, 128, g => { g.font = '110px Lilita'; g.textAlign = 'center'; g.fillStyle = '#e8c8ff'; g.fillText('?', 64, 104); }), 1.1, 1.1, {pos: [0, 0, 0.12]})); });
// ---- vortex crystals
const vortex = []; for (let i = 0; i < 44; i++) { const c = mesh(new THREE.OctahedronGeometry(0.34, 0), crysM, {outline: 'thin', cast: false}); c.scale.set(0.8, 1.35, 0.8); world.add(c); vortex.push(c); }
const magnet3d = new THREE.Group(); world.add(magnet3d); magnet3d.add(mesh(new THREE.TorusGeometry(0.5, 0.2, 10, 24, Math.PI), toon('#ff3b4e'), {outline: 'mid'})); [-0.5, 0.5].forEach(x => { magnet3d.add(mesh(rbox(0.4, 0.5, 0.4, 0.05), toon('#e8ecff'), {pos: [x, -0.28, 0], outline: 'thin'})); });
// ---- monitor modes
function drawMon(t, mode) { const g = gctx, w = 640, h = 400;
  if (mode === 'shutdown') { g.fillStyle = '#0c1230'; g.fillRect(0, 0, w, h); g.strokeStyle = '#8fa8ff'; g.lineWidth = 12; g.lineCap = 'round'; for (let i = 0; i < 8; i++) { g.globalAlpha = 0.2 + 0.8 * (((i / 8) - t * 1.4) % 1 + 1) % 1; g.beginPath(); const a = i / 8 * Math.PI * 2; g.moveTo(w / 2 + Math.cos(a) * 36, 150 + Math.sin(a) * 36); g.lineTo(w / 2 + Math.cos(a) * 60, 150 + Math.sin(a) * 60); g.stroke(); } g.globalAlpha = 1; g.font = '50px Lilita'; g.textAlign = 'center'; g.fillStyle = '#cfd8ff'; g.fillText('SHUTTING DOWN...', w / 2, 290); }
  else if (mode === 'live') { drawMonitor(t); g.fillStyle = 'rgba(10,6,40,.75)'; g.beginPath(); g.roundRect(20, 16, 380, 70, 18); g.fill(); g.font = '34px Lilita'; g.textAlign = 'left'; g.fillStyle = '#fff'; g.fillText('MY CLONE (still playing!)', 34, 60); g.fillStyle = '#ff3b3b'; g.beginPath(); g.arc(w - 120, 52, 12, 0, 7); g.fill(); g.fillStyle = '#fff'; g.fillText('LIVE', w - 98, 62); }
  else if (mode === 'zero') { g.fillStyle = '#140a38'; g.fillRect(0, 0, w, h); g.beginPath(); g.roundRect(60, 50, 520, 120, 24); g.fillStyle = '#2a0a28'; g.fill(); g.lineWidth = 8; g.strokeStyle = '#ff4a5a'; g.stroke(); zCoin(g, 120, 110, 40); g.font = '80px Lilita'; g.textAlign = 'left'; g.fillStyle = '#ff6a7a'; g.fillText('0 COINS!', 190, 128); g.fillStyle = '#b89cff'; g.font = '36px Lilita'; g.fillText('-100,000   -250,000   -500,000', 60, 250); }
  else drawMonitor(t);
  gameTex.needsUpdate = true; }
// ---- shared HUD pieces
const timerOf = t => 10 - Math.floor(Math.max(0, t - 1) / 5);
function timerHUD2(t) { if (t >= 49.0) return; const s = Math.max(1, timerOf(t)); const x = 640, y = 50, w = 400, h = 130;
  oc.save(); oc.shadowColor = '#ff2a2a'; oc.shadowBlur = 30; roundRect(x, y, w, h, 26); oc.fillStyle = '#1a0a12'; oc.fill(); oc.lineWidth = 9; oc.strokeStyle = '#ff3b3b'; oc.stroke(); oc.restore();
  oc.lineWidth = 7; oc.strokeStyle = '#fff'; oc.beginPath(); oc.arc(x + 70, y + 70, 30, 0, 7); oc.stroke(); oc.beginPath(); oc.moveTo(x + 70, y + 70); oc.lineTo(x + 70, y + 50); oc.moveTo(x + 70, y + 70); oc.lineTo(x + 84, y + 78); oc.stroke(); oc.fillStyle = '#fff'; oc.fillRect(x + 62, y + 28, 16, 10);
  oc.font = '100px Lilita'; oc.textAlign = 'left'; oc.textBaseline = 'middle'; oc.fillStyle = '#fff'; oc.fillText('00:', x + 120, y + 70); oc.fillStyle = '#ff4a4a'; oc.fillText(String(s).padStart(2, '0'), x + 268, y + 70); }
const CAPS2 = [[0.2, 1.2, [['ZYLOX!', '#fff']]], [1.2, 1.6, [['TEN SECONDS', '#fff']]], [1.6, 2.4, [['OF ROBLOX.', '#fff']]], [2.4, 3.2, [["THAT'S ", '#fff'], ['ALL!', '#ffd23f']]], [3.2, 3.8, [['TEN?!', '#ffd23f']]], [3.8, 4.4, [['I GOTTA', '#fff']]], [4.4, 4.8, [['GET RICH', '#fff']]], [4.8, 5.4, [['FAST!', '#ffd23f']]],
  [6.2, 7.0, [['CRYSTAL RUSH!', '#fff']]], [7.0, 7.6, [["LET'S GO!", '#fff']]], [7.6, 8.2, [['WAIT...', '#fff']]], [8.2, 8.6, [['EVERY CRYSTAL', '#fff']]], [8.6, 9.0, [['DOUBLES', '#ffd23f'], [' MY', '#fff']]], [9.0, 9.2, [['COINS?!', '#fff']]], [9.2, 9.4, [['TWO!', '#fff']]], [9.4, 9.8, [['FOUR!', '#fff']]], [9.8, 10.2, [['EIGHT!', '#fff']]], [10.2, 11.0, [['SIXTEEN!', '#ffd23f']]], [11.0, 11.8, [['A ', '#fff'], ['THOUSAND', '#ffd23f']]], [11.8, 13.0, [['ALREADY?!', '#fff']]],
  [13.0, 13.8, [['SPEED BOOST!', '#fff']]], [13.8, 15.9, [['BUY!', '#ffd23f']]], [16.0, 16.8, [['WHOA!', '#ffd23f']]], [16.8, 17.0, [["I'M SO", '#fff']]], [17.0, 17.95, [['FAST!', '#ffd23f']]], [18.2, 18.8, [['LOOK AT', '#fff']]], [18.8, 19.0, [['ALL THESE', '#fff']]], [19.0, 19.9, [['CRYSTALS!', '#fff']]],
  [21.2, 21.6, [['WAIT...', '#fff']]], [21.6, 21.8, [['A ', '#fff'], ['SUPER', '#ffd23f']]], [21.8, 22.5, [['MAGNET?!', '#ffd23f']]], [22.5, 22.6, [['IF THIS', '#fff']]], [22.6, 23.0, [['WORKS, YOU', '#fff']]], [23.0, 23.95, [['GOTTA SUBSCRIBE!', '#fff']]], [24.0, 24.5, [['BOOM!', '#ffd23f']]], [24.6, 25.0, [['EVERY ', '#ffd23f'], ['CRYSTAL', '#fff']]], [25.0, 25.9, [['IS ', '#fff'], ['MINE!', '#ffd23f']]],
  [26.2, 27.0, [['FIVE SECONDS,', '#fff']]], [27.0, 28.2, [['ZYLOX!', '#ffd23f']]], [28.2, 29.4, [['A MILLION?!', '#fff']]], [29.4, 31.0, [["I'M ", '#fff'], ['RICH!', '#ffd23f']]], [31.2, 31.8, [["WHAT'S THAT", '#fff']]], [31.8, 32.8, [['GOLDEN DOOR?!', '#ffd23f']]], [32.8, 33.2, [['A ', '#fff'], ['SECRET', '#ffd23f']]], [33.2, 34.0, [['SHOP?!', '#ffd23f']]],
  [36.2, 37.0, [['AN ', '#fff'], ['AUTO-PLAY', '#ffd23f']]], [37.2, 37.95, [['CLONE?!', '#ffd23f']]], [38.0, 38.2, [['IT CAN', '#fff']]], [38.2, 38.8, [['PLAY WHILE', '#fff']]], [38.8, 39.8, [["I'M ", '#fff'], ['GONE?!', '#ffd23f']]], [41.2, 42.5, [['BUY!', '#ffd23f']]], [42.6, 43.2, [['WHAT?!', '#ffd23f']]], [43.2, 43.6, [['NOT ENOUGH', '#ffd23f']]], [43.6, 44.3, [['COINS?!', '#ffd23f']]], [44.5, 45.2, [['SELL THE', '#fff']]], [45.2, 46.1, [['MAGNET!', '#ffd23f']]], [46.2, 46.6, [['NOW BUY', '#ffd23f']]], [46.6, 47.0, [['IT!', '#ffd23f']]], [47.0, 47.2, [['YES!', '#ffd23f']]], [47.2, 48.5, [['CLONE ACTIVATED!', '#ffd23f']]],
  [49.2, 50.0, [["TIME'S UP!", '#ffd23f']]], [50.0, 51.1, [['COMPUTER OFF!', '#ffd23f']]], [51.2, 51.8, [['HA!', '#fff']]], [51.8, 52.6, [["MY CLONE'S", '#fff']]], [52.6, 53.9, [['STILL PLAYING!', '#fff']]], [54.0, 54.2, [['WAIT...', '#fff']]], [54.2, 54.4, [['WHY IS', '#fff']]], [54.4, 54.8, [['IT SPENDING', '#fff']]], [54.8, 55.4, [['MY ', '#fff'], ['MONEY?!', '#ffd23f']]], [55.4, 56.0, [['NO!', '#fff']]], [56.0, 56.2, [['NOT MY', '#ffd23f']]], [56.2, 56.9, [['MILLION!', '#ffd23f']]]];
function captions2(t) { const c = CAPS2.find(c => t >= c[0] && t < c[1]); if (!c) return; const u = Math.min(1, (t - c[0]) / 0.12), k = 0.6 + 0.4 * u;
  oc.save(); oc.font = '96px Lilita'; oc.textBaseline = 'middle'; oc.lineJoin = 'round'; const wsum = c[2].reduce((s, [w]) => s + oc.measureText(w).width, 0); oc.translate(W / 2, H * 0.735); oc.scale(k * Math.min(1, 980 / wsum), k * Math.min(1, 980 / wsum)); let x = -wsum / 2;
  c[2].forEach(([w, col]) => { oc.textAlign = 'left'; oc.lineWidth = 22; oc.strokeStyle = '#120a1c'; oc.strokeText(w, x, 0); oc.fillStyle = col; oc.fillText(w, x, 0); x += oc.measureText(w).width; }); oc.restore(); }
function counter(x, y, txt, sub2) { oc.save(); oc.translate(x, y); oc.font = '96px Lilita'; const tw = oc.measureText(txt).width, w = tw + 190; oc.shadowColor = '#ffcc33'; oc.shadowBlur = 30; roundRect(-w / 2, -66, w, 132, 36); oc.fillStyle = 'rgba(40,24,6,.9)'; oc.fill(); oc.shadowBlur = 0; oc.lineWidth = 8; oc.strokeStyle = '#ffcc33'; oc.stroke(); zCoin(oc, -w / 2 + 80, 0, 48); oc.textAlign = 'left'; oc.textBaseline = 'middle'; oc.fillStyle = '#fff'; oc.fillText(txt, -w / 2 + 150, 6); if (sub2) { oc.font = '52px Lilita'; oc.fillStyle = '#5dff8e'; oc.fillText(sub2, -w / 2 + 150, 84); } oc.restore(); }
function pill(t, t0) { const u = Math.min(1, (t - t0) / 0.25), k = 1 + 2.70158 * Math.pow(u - 1, 3) + 1.70158 * Math.pow(u - 1, 2); oc.save(); oc.translate(W / 2 - 40, 1700); oc.scale(k, k); roundRect(-300, -62, 600, 124, 62); oc.fillStyle = '#ff2a2a'; oc.fill(); oc.lineWidth = 8; oc.strokeStyle = '#fff'; oc.stroke(); oc.fillStyle = '#fff'; oc.beginPath(); oc.moveTo(-250, -30); oc.lineTo(-250, 30); oc.lineTo(-198, 0); oc.closePath(); oc.fill(); oc.font = '70px Lilita'; oc.textAlign = 'left'; oc.textBaseline = 'middle'; oc.fillText('SUBSCRIBE', -170, 4); oc.restore(); }
function banner(t, t0, txt, col, x, y) { const u = Math.min(1, Math.max(0, (t - t0) / 0.25)); if (u <= 0) return; const k = 1 + 2.70158 * Math.pow(u - 1, 3) + 1.70158 * Math.pow(u - 1, 2); oc.save(); oc.translate(x, y); oc.scale(k, k); oc.font = '64px Lilita'; const w = oc.measureText(txt).width + 100; roundRect(-w / 2, -50, w, 100, 30); oc.fillStyle = col[0]; oc.fill(); oc.lineWidth = 8; oc.strokeStyle = col[1]; oc.stroke(); oc.textAlign = 'center'; oc.textBaseline = 'middle'; oc.fillStyle = '#fff'; oc.fillText(txt, 0, 4); oc.restore(); }
function coinRain(t, t0, n = 36) { const u = t - t0; if (u < 0) return; for (let i = 0; i < n; i++) { const x = rnd(i) * W, y = -100 + ((u * (500 + rnd(i + 3) * 500) + rnd(i + 5) * 2000) % (H + 200)), r = 34 + rnd(i + 7) * 30; oc.save(); oc.translate(x, y); oc.scale(Math.abs(Math.cos(u * 5 + i)) * 0.8 + 0.2, 1); zCoin(oc, 0, 0, r); oc.restore(); } }
function floatTxt(t, t0, txt, x, y, col) { const u = t - t0; if (u < 0 || u > 1.6) return; const k = Math.min(1, u / 0.15); oc.save(); oc.translate(x, y - u * 80); oc.scale(0.5 + 0.5 * k, 0.5 + 0.5 * k); oc.globalAlpha = 1 - Math.max(0, (u - 1.1) / 0.5); oc.font = '100px Lilita'; oc.textAlign = 'center'; oc.lineWidth = 20; oc.strokeStyle = '#1a0a12'; oc.strokeText(txt, 0, 0); oc.fillStyle = col; oc.fillText(txt, 0, 0); oc.restore(); }
function flashO(a) { if (a > 0) { oc.fillStyle = `rgba(255,248,210,${Math.min(1, a)})`; oc.fillRect(0, 0, W, H); } }
function slate(t) { const u = Math.min(1, Math.max(0, (t - 57.0) / 0.3)); if (u <= 0) return; const k = 1 + 2.70158 * Math.pow(u - 1, 3) + 1.70158 * Math.pow(u - 1, 2);
  oc.save(); oc.translate(W / 2, 1480); oc.scale(k, k); oc.beginPath(); for (let i = 0; i < 28; i++) { const a = i / 28 * Math.PI * 2, rr = i % 2 ? 330 : 520; oc.lineTo(Math.cos(a) * rr * 1.05, Math.sin(a) * rr * 0.5); } oc.closePath(); oc.fillStyle = '#1b3cff'; oc.fill(); oc.lineWidth = 10; oc.strokeStyle = '#7ad0ff'; oc.stroke();
  oc.font = '140px Lilita'; oc.textAlign = 'center'; oc.textBaseline = 'middle'; oc.lineJoin = 'round'; const lines = [['WHAT WOULD', '#fff', -170], ['YOU DO', '#ffd23f', -10], ['WITH TEN SECONDS?', '#fff', 150]]; lines.forEach(([tx, c, y], i) => { oc.font = i === 2 ? '110px Lilita' : '160px Lilita'; oc.lineWidth = 28; oc.strokeStyle = '#0a1260'; oc.strokeText(tx, 0, y); oc.fillStyle = c; oc.fillText(tx, 0, y); }); oc.restore(); }
// ================================================================ shots 13 -> 60.6
const ENV = {room: [room], world: [world, skyM], shop: [shop]};
function setEnv(name) { [room, world, shop].forEach(g => g.visible = false); skyM.visible = false; if (name === 'room') room.visible = true; else if (name === 'world') { world.visible = true; skyM.visible = true; } else if (name === 'shop') shop.visible = true; }
function seatedAt(x, y, z, yaw) { zylox.position.set(x, y, z); zylox.rotation.y = yaw; Z.pose({l: [-1.25, 0, 0.25], r: [-1.25, 0, -0.25], legL: [-1.5, 0, 0], legR: [-1.5, 0, 0], head: [0, 0, 0]}); }
const SX = 120;
function camS(p0, l0, p1, l1, u, fov = 34) { camShot([p0[0] + SX, p0[1], p0[2]], [l0[0] + SX, l0[1], l0[2]], [p1[0] + SX, p1[1], p1[2]], [l1[0] + SX, l1[1], l1[2]], u, fov); }
function shopHero(yaw = 1.2) { zylox.position.set(SX - 1.0, 1.25, 0.8); zylox.rotation.y = yaw; Z.pose({legL: [0, 0, 0], legR: [0, 0, 0], l: [-0.1, 0, 0.1], r: [-0.1, 0, -0.1]}); }
const clickAt = (t, a) => Math.max(0, 1 - Math.abs(t - a) / 0.12);
const B = (t, t0, lines, x, y, w, tail) => bubble(t, t0, lines, x, y, w, tail);
const point = (tt) => Z.pose({l: [-0.15, 0, 0.1], r: [-1.75 + Math.sin(tt * 7) * 0.05, -0.55, -0.1], head: [0, 0.2, 0]});
const curs = (t, a, from, to) => { const u = sm((t - a) / 0.7); return [lerp(from[0], to[0], u), lerp(from[1], to[1], u)]; };
const NEW = [
  {t0: 13.0, t1: 16.0, env: 'shop', run(t, u) { shopHero(1.15); point(t); Z.setFace({eyes: 'happy', mouth: 'grin', browL: -0.3, browR: -0.3}); camS([0.0, 3.6, 12.4], [1.0, 3.3, -0.4], [0.1, 3.6, 11.6], [1.1, 3.3, -0.4], u, 40);
    const p = clickAt(t, 15.4); drawShop('speed', t, p, curs(t, 13.2, [560, 560], [380, 850])); B(t, 13.1, [['Speed Boost!'], ['BUY!', '#e3192b', 100]], 30, 60, 500, 'r'); } },
  {t0: 16.0, t1: 18.0, env: 'world', run(t, u) { const z = -12 - (t - 16) * 10; zylox.position.set(60, 1.25 + run(t, 14), z); zylox.rotation.y = Math.PI; Z.setFace({eyes: 'wide', mouth: 'grin'}); camShot([60.7, 1.5, z + 3.6], [60, 1.1, z - 2], [60.5, 1.3, z + 3.2], [60, 1.1, z - 2], u, 62);
    oc.save(); oc.globalAlpha = 0.5; for (let i = 0; i < 6; i++) { const a = rnd(Math.floor(t * 20) + i) * 6.28, r = 300 + rnd(i) * 400; oc.strokeStyle = '#c9a0ff'; oc.lineWidth = 8; oc.beginPath(); oc.moveTo(W / 2 + Math.cos(a) * r, 1000 + Math.sin(a) * r); oc.lineTo(W / 2 + Math.cos(a) * (r + 300), 1000 + Math.sin(a) * (r + 300)); oc.stroke(); } oc.restore();
    [[0.28, 0.1, '#e8e0ff'], [0.6, 0.12, '#ffe14a']].forEach(([x, y, c]) => { oc.save(); oc.translate(W * (0.2 + x), H * 0.5); oc.fillStyle = c; oc.beginPath(); oc.moveTo(40, -150); oc.lineTo(-60, 20); oc.lineTo(0, 20); oc.lineTo(-40, 160); oc.lineTo(80, -40); oc.lineTo(10, -40); oc.closePath(); oc.fill(); oc.lineWidth = 8; oc.strokeStyle = '#2a0e5a'; oc.stroke(); oc.restore(); });
    B(t, 16.1, [['WHOA!', '#e3192b', 90], ["I'm SO"], ['FAST!', '#e3192b', 90], ['Look at all'], ['these crystals!']], 430, 60, 600, 'l'); } },
  {t0: 18.0, t1: 21.0, env: 'world', run(t, u) { const z = -34 - (t - 18) * 7; zylox.position.set(60, 1.25 + run(t, 14), z); zylox.rotation.y = Math.PI; Z.setFace({eyes: 'wide', mouth: 'grin'}); camShot([61.0, 4.2, z + 9.5], [60, 2.0, z - 8], [60.8, 4.1, z + 9.2], [60, 2.0, z - 8], u, 42);
    counter(540, 1620, Math.round(lerp(1016, 2047, sm((t - 18) / 2.8))).toLocaleString('en-US')); [[18.1, '+16', 740, 760], [18.6, '+32', 780, 660], [19.1, '+64', 820, 560], [19.6, '+128', 860, 460]].forEach(([t0, tx, x, y]) => floatTxt(t, t0, tx, x, y, '#ffd23f')); } },
  {t0: 21.0, t1: 24.0, env: 'shop', run(t, u) { shopHero(1.15); point(t); Z.setFace({eyes: 'wide', mouth: 'o', open: 0.7, browL: -0.6, browR: -0.6, raise: 0.8}); camS([0.0, 3.6, 12.4], [1.0, 3.3, -0.4], [0.1, 3.6, 11.6], [1.1, 3.3, -0.4], u, 40);
    drawShop('magnet', t, clickAt(t, 23.4), curs(t, 21.4, [560, 560], [380, 850])); B(t, 21.1, [['Wait... a'], ['SUPER', '#e3192b', 90], ['MAGNET?!', '#e3192b', 90], ['If this works,'], ['you gotta'], ['SUBSCRIBE!', '#e3192b', 84]], 30, 40, 560, 'r'); if (t >= 23.0) pill(t, 23.0); } },
  {t0: 24.0, t1: 26.0, env: 'world', run(t, u) { const base = [60, 1.25, -30]; zylox.position.set(...base); zylox.rotation.y = 0; Z.pose({l: [-2.9, 0, 0.9], r: [-2.9, 0, -0.9], legL: [0, 0, 0.15], legR: [0, 0, -0.15], head: [-0.15, 0, 0]}); Z.setFace({eyes: 'happy', mouth: 'shout', open: 0.8, browL: -0.5, browR: -0.5});
    camShot([60.4, 3.6, -19.5], [60, 3.1, -30], [60.2, 3.7, -20.2], [60, 3.2, -30], u, 40); vortex.forEach((c, i) => { c.visible = true; const a = i * 0.7 + t * (3 + (i % 5) * 0.4), r = 0.9 + (i % 11) * 0.33 + 0.25 * Math.sin(t * 2 + i), y = 0.5 + (i % 9) * 0.5; c.position.set(Math.cos(a) * r, y, -30 + Math.sin(a) * r); c.rotation.set(t * 2, a, 0); });
    magnet3d.visible = true; magnet3d.position.set(0, 4.7 + Math.sin(t * 3) * 0.1, -30); magnet3d.rotation.y = t * 2; counter(540, 330, Math.round(lerp(2400, 25600, sm((t - 24.0) / 1.2))).toLocaleString('en-US'), t > 24.5 ? '+24,584' : null); pill(t, 23.0); } },
  {t0: 26.0, t1: 28.2, env: 'room', run(t, u) { camShot([-3.0, 3.9, 9.8], [1.0, 2.9, -1.0], [-2.6, 3.8, 9.2], [1.1, 2.9, -1.2], u, 36); seatedAt(-0.4, 1.35, 1.75, Math.PI - 0.5); Z.pose({head: [0, 0.6, 0]}); Z.setFace({eyes: 'wide', look: [0.8, -0.2], mouth: 'o', open: 0.5, raise: 0.6});
    mom.visible = true; mom.position.set(3.0, 1.32, -2.2); mom.rotation.y = -0.35; M.setFace({eyes: 'half', mouth: 'shout', open: talk(t, true), browL: 1.2, browR: 1.2}); M.pose({l: [-2.6, 0, 0.5], r: [-2.6, 0, -0.5], head: [0.04, 0, 0.05], legL: [0, 0, 0], legR: [0, 0, 0]}); B(t, 26.15, [['FIVE', '#e3192b', 100], ['SECONDS,'], ['ZYLOX!', '#e3192b', 100]], 40, 80, 520, 'r'); } },
  {t0: 28.2, t1: 31.0, env: 'room', run(t, u) { camShot([0.3, 3.35, 7.4], [-0.4, 3.15, 1.75], [0.2, 3.3, 6.9], [-0.4, 3.15, 1.75], u, 30); seatedAt(-0.4, 1.35, 1.75, 0.15); chair.visible = false; Z.pose({head: [-0.1, 0.1, Math.sin(t * 12) * 0.04], l: [-2.8, 0, 0.7], r: [-2.8, 0, -0.7]}); Z.setFace({eyes: 'happy', mouth: 'grin', browL: -0.5, browR: -0.5});
    coinRain(t, 28.2); counter(540, 330, '1,000,000'); B(t, 28.3, [['A MILLION?!', '#e3192b', 84], ["I'm RICH!", '#111', 90]], 500, 520, 520, 'l'); } },
  {t0: 31.0, t1: 34.0, env: 'world', run(t, u) { zylox.position.set(60.8, 1.25, -45.2); zylox.rotation.y = 1.3; Z.pose({legL: [0, 0, 0], legR: [0, 0, 0], l: [-0.15, 0, 0.1], r: [-1.65, 0.0, -0.1], head: [0, -0.1, 0]}); Z.setFace({eyes: 'wide', mouth: 'o', open: 0.6, raise: 0.8, browL: -0.6, browR: -0.6});
    camShot([58.0, 3.1, -41.4], [62.6, 3.3, -46.3], [58.4, 3.2, -41.8], [63.0, 3.3, -46.3], u, 56); B(t, 31.1, [["What's that"], ['GOLDEN DOOR?!', '#e3192b', 80], ['A SECRET', '#e3192b', 80], ['SHOP?!', '#e3192b', 90]], 30, 50, 560, 'r'); } },
  {t0: 34.0, t1: 36.0, env: 'world', run(t, u) { zylox.position.set(60.8, 1.25, -45.2); zylox.rotation.y = 1.3; Z.pose({legL: [0, 0, 0], legR: [0, 0, 0], l: [-0.15, 0, 0.1], r: [-1.65, 0, -0.1], head: [0, -0.1, 0]}); Z.setFace({eyes: 'wide', mouth: 'o', open: 0.8, raise: 0.9});
    camShot([58.4, 3.2, -41.8], [63.0, 3.3, -46.3], [60.4, 3.0, -43.4], [65.4, 3.2, -46.3], u, 50); const o = sm((t - 34.0) / 1.2) * 1.35; leaves[0].rotation.y = -o; leaves[1].rotation.y = o; flashO(Math.min(1, (t - 34.0) / 0.9) * (t < 35.4 ? 1 : Math.max(0, 1 - (t - 35.4) / 0.6))); banner(t, 34.4, 'SECRET SHOP UNLOCKED!', ['#5a1ea8', '#ffd23f'], W / 2, 560); } },
  {t0: 36.0, t1: 39.8, env: 'shop', run(t, u) { shopHero(1.0); Z.pose({l: [-0.2, 0, 0.1], r: [-1.1, -0.5, -0.1], head: [0, 0.2, 0]}); Z.setFace({eyes: 'wide', look: [0.8, 0], mouth: 'o', open: 0.6, raise: 0.8, browL: -0.6, browR: -0.6}); capsule.visible = true; panelG.visible = false;
    cloneC.visible = true; cloneC.position.set(SX + 2.6, 1.75, -2.4); cloneC.scale.setScalar(0.85); cloneC.rotation.y = Math.sin(t * 1.2) * 0.4; C1.pose({l: [0, 0, 0.12], r: [0, 0, -0.12], legL: [0, 0, 0], legR: [0, 0, 0]}); camS([-0.2, 3.7, 12.0], [1.8, 3.1, -1.6], [0.0, 3.65, 11.3], [2.0, 3.1, -1.6], u, 40);
    B(t, 36.1, [['An'], ['AUTO-PLAY', '#e3192b', 80], ['CLONE?!', '#e3192b', 84], ['It can play'], ["while I'm GONE?!", '#111', 70]], 30, 40, 560, 'r'); } },
  {t0: 39.8, t1: 44.5, env: 'shop', run(t, u) { shopHero(1.15); point(t); Z.setFace(t < 42.6 ? {eyes: 'wide', mouth: 'grin', raise: 0.6} : {eyes: 'wide', mouth: 'shout', open: 0.6, browL: -1.0, browR: -1.0, raise: 0.9}); camS([0.0, 3.6, 12.4], [1.0, 3.3, -0.4], [0.1, 3.6, 11.6], [1.1, 3.3, -0.4], u, 40);
    drawShop(t < 42.6 ? 'clone' : 'nope', t, clickAt(t, 41.2), curs(t, 39.9, [560, 560], [380, 850])); if (t >= 41.3) B(t, 41.3, [['BUY!', '#e3192b', 90], ['WHAT?!', '#e3192b', 84], ['NOT ENOUGH', '#e3192b', 70], ['COINS?!', '#e3192b', 84]], 30, 40, 520, 'r'); } },
  {t0: 44.5, t1: 46.2, env: 'shop', run(t, u) { shopHero(1.15); Z.pose({legL: [0, 0, 0], legR: [0, 0, 0], l: [-2.7, 0, 0.9], r: [-2.7, 0, -0.9], head: [-0.1, 0.1, Math.sin(t * 14) * 0.04]}); Z.setFace({eyes: 'wide', mouth: 'shout', open: 0.7, browL: -1.2, browR: -1.2, raise: 1.0});
    camS([0.0, 3.6, 12.4], [1.0, 3.3, -0.4], [0.1, 3.6, 11.7], [1.1, 3.3, -0.4], u, 40); drawShop('inv', t, 0, null); B(t, 44.6, [['SELL the'], ['MAGNET!', '#e3192b', 100]], 30, 60, 480, 'r'); } },
  {t0: 46.2, t1: 48.2, env: 'shop', run(t, u) { shopHero(1.15); if (t < 47.2) point(t); else Z.pose({legL: [0, 0, 0], legR: [0, 0, 0], l: [-0.2, 0, 0.1], r: [-2.4, 0, -0.5], head: [0, 0.1, 0]}); Z.setFace({eyes: t < 47.0 ? 'wide' : 'happy', mouth: 'grin', browL: t < 47 ? 0.6 : -0.3, browR: t < 47 ? 0.6 : -0.3});
    camS([0.0, 3.6, 12.4], [1.0, 3.3, -0.4], [0.1, 3.6, 11.6], [1.1, 3.3, -0.4], u, 40); drawShop(t < 47.2 ? 'clone' : 'done', t, clickAt(t, 46.9), t < 47.2 ? curs(t, 46.2, [560, 560], [380, 850]) : null); B(t, 46.25, [['NOW BUY IT!', '#e3192b', 70], ['YES!', '#111', 90], ['CLONE', '#e3192b', 70], ['ACTIVATED!', '#e3192b', 70]], 30, 40, 540, 'r'); } },
  {t0: 48.2, t1: 49.0, env: 'world', run(t, u) { zylox.visible = false; const z = -14 - (t - 48.2) * 12; cloneC.visible = true; cloneC.position.set(60, 1.25 + run2(t), z); cloneC.rotation.y = Math.PI; cloneC.scale.setScalar(1); const ph = t * 14; C1.pose({l: [Math.sin(ph) * 0.9, 0, 0.12], r: [-Math.sin(ph) * 0.9, 0, -0.12], legL: [-Math.sin(ph) * 0.8, 0, 0], legR: [Math.sin(ph) * 0.8, 0, 0]});
    camShot([60.8, 3.8, z + 8.5], [60, 2.0, z - 6], [60.6, 3.7, z + 8.2], [60, 2.0, z - 6], u, 42); banner(t, 48.2, '✔ CLONE ACTIVATED!', ['#14803a', '#7dffaa'], 360, 250); floatTxt(t, 48.3, '+1,000', 700, 900, '#ffd23f'); floatTxt(t, 48.6, '+1,000', 820, 760, '#ffd23f'); } },
  {t0: 49.0, t1: 51.0, env: 'room', run(t, u) { camShot([3.6, 3.9, 10.2], [-1.0, 2.9, 0.4], [3.2, 3.8, 9.6], [-0.9, 2.9, 0.4], u, 40); seatedAt(-0.4, 1.35, 1.75, Math.PI); Z.pose({head: [0, 0.3, 0]}); Z.setFace({eyes: 'wide', mouth: 'o', open: 0.6, raise: 0.8, browL: -0.8, browR: -0.8});
    mom.visible = true; mom.position.set(-3.4, 1.32, -0.2); mom.rotation.y = 1.2; M.setFace({eyes: 'half', mouth: 'shout', open: talk(t, true), browL: 1.3, browR: 1.3}); M.pose({l: [-0.2, 0, 0.1], r: [-1.55, 0, -0.1], head: [0, 0, 0.05], legL: [0, 0, 0], legR: [0, 0, 0]}); monMode = 'shutdown'; B(t, 49.1, [["TIME'S UP!", '#e3192b', 84], ['COMPUTER', '#111', 80], ['OFF!', '#e3192b', 100]], 30, 60, 520, 'r'); } },
  {t0: 51.0, t1: 54.0, env: 'room', run(t, u) { camShot([0.8, 3.5, 9.8], [-0.7, 3.0, 0.9], [0.9, 3.45, 9.2], [-0.6, 3.0, 0.9], u, 38); seatedAt(-1.6, 1.35, 1.75, 0.0); chair.visible = false; Z.pose({l: [-2.95, 0.4, 0.9], r: [-2.95, -0.4, -0.9], head: [-0.15, 0, Math.sin(t * 14) * 0.04]}); Z.setFace({eyes: 'happy', mouth: 'grin', browL: -0.5, browR: -0.5}); monMode = 'live';
    B(t, 51.2, [['HA!', '#111', 100], ["MY CLONE'S"], ['STILL PLAYING!', '#e3192b', 70]], 30, 60, 560, 'r'); } },
  {t0: 54.0, t1: 57.0, env: 'shop', run(t, u) { zylox.position.set(SX - 2.2, 1.25, 1.2); zylox.rotation.y = 0.55; heroCrown.visible = t < 54.3; Z.pose({legL: [0, 0, 0], legR: [0, 0, 0], l: [-0.2, 0, 0.1], r: [-2.8, 0, -0.5], head: [0, 0, 0]}); Z.setFace(t < 54.3 ? {eyes: 'happy', mouth: 'grin'} : {eyes: 'wide', mouth: 'shout', open: 0.8, browL: -1.2, browR: -1.2, raise: 1.0});
    cart.visible = true; panelG.visible = false; duck.position.y = 1.9 + Math.sin(t * 3) * 0.06; cr2.rotation.y = t; disco.rotation.y = t * 2; camS([0.2, 3.5, 12.4], [0.0, 2.7, -0.6], [0.3, 3.4, 11.8], [0.0, 2.7, -0.6], u, 44);
    banner(t, 54.0, '1,000,000  ➜  0 COINS!', ['#5a0a28', '#ff4a5a'], W / 2, 1640); [[54.1, '-100K', 330, 700], [54.8, '-250K', 640, 560], [55.5, '-500K', 360, 480]].forEach(([t0, tx, x, y]) => floatTxt(t, t0, tx, x, y, '#ff4a5a')); B(t, 54.0, [['WAIT...'], ['WHY IS IT', '#111', 70], ['SPENDING', '#e3192b', 70], ['MY MONEY?!', '#e3192b', 70]], 30, 40, 520, 'r'); } },
  {t0: 57.0, t1: 61.0, env: 'room', run(t, u) { camShot([-0.4, 3.35, 7.2], [-0.4, 3.15, 1.75], [-0.4, 3.3, 6.6], [-0.4, 3.15, 1.75], u, 32); seatedAt(-0.4, 1.35, 1.75, 0.0); chair.visible = false; Z.pose({head: [-0.05, 0, Math.sin(t * 25) * 0.05], l: [-1.8, 0, 1.55], r: [-1.8, 0, -1.55]}); Z.setFace({eyes: 'wide', mouth: 'shout', open: 0.9, browL: -1.4, browR: -1.4, raise: 1.2}); monMode = 'zero'; } }
];
SHOTS.push(...NEW);
function run2(t) { return Math.abs(Math.sin(t * 14)) * 0.12; }
let monMode = 'game';
window.renderAt = t => {
  oc.clearRect(0, 0, W, H);
  zylox.visible = true; mom.visible = false; mom.position.set(30, 0, 0); cloneC.visible = false; heroCrown.visible = false; chair.visible = true; magnet3d.visible = false; vortex.forEach(c => c.visible = false); capsule.visible = false; panelG.visible = true; cart.visible = false; leaves[0].rotation.y = 0; leaves[1].rotation.y = 0; monMode = 'game';
  Z.setFace({});
  const sh = SHOTS.find(s => t >= s.t0 && t < s.t1) || SHOTS[SHOTS.length - 1]; setEnv(sh.env || (sh.t0 < 6.07 ? 'room' : 'world'));
  crystals.forEach((c, i) => { c.rotation.y = t * 2 + i; });
  sh.run(t, (t - sh.t0) / (sh.t1 - sh.t0));
  drawMon(t, monMode); if (sh.env === 'shop' && sh.t0 < 13.0) {}
  crystals.forEach(c => c.children.forEach(ch => { if (ch.userData.billboard) ch.quaternion.copy(camera.quaternion); }));
  key.position.set(camera.position.x + 4, 9, camera.position.z + 6); key.target.position.set(camera.position.x, 0, camera.position.z - 6);
  monGlow.position.set(room.visible ? -0.4 : camera.position.x, 3.0, room.visible ? 0.4 : camera.position.z - 2);
  renderer.render(scene, camera); timerHUD2(t); captions2(t); slate(t); return true;
};
window.dbg = {skyM, room, world, shop, scene, camera};
window.renderAt(0); window.ready = true;
