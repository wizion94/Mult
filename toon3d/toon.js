// Toon / cel-shaded 3D look test: blocky characters, 3-tone lighting, warm ink outlines, illustrated face textures.
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

const W = 1080, H = 1920;
await document.fonts.load('100px Lilita'); await document.fonts.load('700 100px Caveat'); await document.fonts.ready;
const renderer = new THREE.WebGLRenderer({antialias: true, preserveDrawingBuffer: true});
renderer.setPixelRatio(1); renderer.setSize(W, H); document.body.appendChild(renderer.domElement);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene(); scene.background = new THREE.Color('#2a1850');
const camera = new THREE.PerspectiveCamera(31, W / H, 0.1, 100);

// ---------------------------------------------------------------- materials
const INK = new THREE.Color('#3a1f45');
const ramp = (() => { const d = new Uint8Array([70, 70, 70, 255, 165, 165, 165, 255, 255, 255, 255, 255]); const t = new THREE.DataTexture(d, 3, 1, THREE.RGBAFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
const toon = (hex, o = {}) => new THREE.MeshToonMaterial({color: new THREE.Color(hex), gradientMap: ramp, ...o});
function outlineMat(thick, color = INK) {
  const m = new THREE.MeshBasicMaterial({color, side: THREE.BackSide});
  m.onBeforeCompile = sh => { sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>\n transformed += normalize(normal) * ${thick.toFixed(4)};`); };
  return m;
}
const OL = {thin: outlineMat(0.022), mid: outlineMat(0.032), thick: outlineMat(0.045)};
function mesh(geo, mat, o = {}) {
  const m = new THREE.Mesh(geo, mat); m.castShadow = o.cast !== false; m.receiveShadow = true;
  if (o.outline !== false) { const ol = new THREE.Mesh(geo, OL[o.outline || 'mid']); ol.castShadow = false; m.add(ol); }
  if (o.pos) m.position.set(...o.pos); if (o.rot) m.rotation.set(...o.rot); return m;
}
const rbox = (w, h, d, r = 0.08, seg = 4) => new RoundedBoxGeometry(w, h, d, seg, r);
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); draw(g, w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
function decal(tex, w, h, o = {}) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({map: tex, transparent: true, alphaTest: 0.02, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2})); if (o.pos) m.position.set(...o.pos); if (o.rot) m.rotation.set(...o.rot); m.renderOrder = 2; return m; }

// ---------------------------------------------------------------- illustrated faces (canvas)
const INKC = '#3a1f45';
function drawFace(g, S, f) {
  g.clearRect(0, 0, S, S); g.lineCap = 'round'; g.lineJoin = 'round';
  const ey = S * 0.45, ex = S * 0.2, er = S * 0.115;
  // blush
  g.fillStyle = 'rgba(255,110,130,.35)'; [-1, 1].forEach(d => { g.beginPath(); g.ellipse(S / 2 + d * S * 0.31, S * 0.62, S * 0.07, S * 0.045, 0, 0, 7); g.fill(); });
  [-1, 1].forEach(d => {
    const x = S / 2 + d * ex;
    if (f.eyes === 'tired') { // half-lidded, unimpressed
      g.fillStyle = '#fff'; g.beginPath(); g.ellipse(x, ey, er * 1.05, er * 0.95, 0, 0, Math.PI * 2); g.fill(); g.lineWidth = S * 0.018; g.strokeStyle = INKC; g.stroke();
      g.fillStyle = '#4a2a20'; g.beginPath(); g.arc(x + d * S * 0.005, ey + er * 0.25, er * 0.55, 0, 7); g.fill(); g.fillStyle = INKC; g.beginPath(); g.arc(x + d * S * 0.005, ey + er * 0.25, er * 0.3, 0, 7); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(x - er * 0.15, ey + er * 0.05, er * 0.14, 0, 7); g.fill();
      g.fillStyle = f.lid || '#c98a6a'; g.beginPath(); g.ellipse(x, ey, er * 1.12, er * 1.02, 0, Math.PI * 1.0, Math.PI * 2.0); g.fill(); g.lineWidth = S * 0.02; g.strokeStyle = INKC; g.beginPath(); g.moveTo(x - er * 1.12, ey); g.lineTo(x + er * 1.12, ey); g.stroke();
      // lashes
      g.lineWidth = S * 0.012; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(x + d * er * (0.6 + i * 0.22), ey - er * 0.05); g.lineTo(x + d * er * (0.85 + i * 0.25), ey - er * 0.35); g.stroke(); }
    } else { // big teary / worried eyes
      g.fillStyle = '#fff'; g.beginPath(); g.ellipse(x, ey, er * 1.1, er * 1.25, 0, 0, Math.PI * 2); g.fill(); g.lineWidth = S * 0.02; g.strokeStyle = INKC; g.stroke();
      g.fillStyle = INKC; g.beginPath(); g.arc(x + d * S * 0.012, ey + er * 0.25, er * 0.62, 0, 7); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(x - er * 0.1, ey, er * 0.24, 0, 7); g.fill(); g.beginPath(); g.arc(x + er * 0.28, ey + er * 0.55, er * 0.1, 0, 7); g.fill();
      if (f.tears) { g.fillStyle = 'rgba(120,200,255,.9)'; g.beginPath(); g.ellipse(x, ey + er * 1.18, er * 0.9, er * 0.22, 0, 0, 7); g.fill();
        const ph = ((f.tearT || 0) + (d > 0 ? 0.5 : 0)) % 1, dy = ph * er * 2.2; g.globalAlpha = 1 - ph * 0.7; g.beginPath(); g.moveTo(x + d * er * 0.75, ey + er * 1.1 + dy); g.quadraticCurveTo(x + d * er * 1.1, ey + er * 1.9 + dy, x + d * er * 0.8, ey + er * 2.4 + dy); g.quadraticCurveTo(x + d * er * 0.45, ey + er * 1.9 + dy, x + d * er * 0.75, ey + er * 1.1 + dy); g.fill(); g.globalAlpha = 1; }
    }
  });
  // brows (tilt > 0: inner ends down = stern; tilt < 0: inner ends up = worried)
  g.lineWidth = S * 0.045; g.strokeStyle = f.brow || INKC;
  [-1, 1].forEach(d => { const x = S / 2 + d * ex, y = ey - er * 1.6, tilt = (f.browTilt || 0) * er * 0.55;
    const xi = x - d * er * 0.95, xo = x + d * er * 0.95; g.beginPath(); g.moveTo(xi, y + tilt); g.quadraticCurveTo(x, y - er * 0.28 + (f.browArch || 0), xo, y - tilt * 0.6); g.stroke(); });
  // fringe painted on the face so it continues the hair cap seamlessly
  if (f.fringe) { g.fillStyle = f.fringe.color; g.strokeStyle = INKC; g.lineWidth = S * 0.022; g.beginPath(); g.moveTo(-10, -10); g.lineTo(S + 10, -10);
    if (f.fringe.style === 'sweep') { g.lineTo(S + 10, S * 0.2); g.quadraticCurveTo(S * 0.7, S * 0.06, S * 0.42, S * 0.24); g.quadraticCurveTo(S * 0.2, S * 0.1, -10, S * 0.26); }
    else { g.lineTo(S + 10, S * 0.16); for (let x = S; x > 0; x -= S / 6) g.quadraticCurveTo(x - S / 12, S * 0.27, x - S / 6, S * 0.16); }
    g.closePath(); g.fill(); g.stroke(); g.strokeStyle = 'rgba(255,220,190,.35)'; g.lineWidth = S * 0.014; g.beginPath(); g.moveTo(S * 0.18, S * 0.07); g.quadraticCurveTo(S * 0.3, S * 0.03, S * 0.42, S * 0.08); g.stroke(); }
  // mouth
  g.lineWidth = S * 0.022; g.strokeStyle = INKC; const my = S * 0.72;
  if (f.mouth === 'wobble') { g.beginPath(); g.moveTo(S * 0.4, my); for (let i = 1; i <= 6; i++) g.lineTo(S * 0.4 + i * S * 0.033, my + (i % 2 ? -1 : 1) * S * 0.018); g.stroke(); }
  else if (f.mouth === 'flat') { g.fillStyle = '#d96a7a'; g.beginPath(); g.roundRect(S * 0.43, my - S * 0.02, S * 0.14, S * 0.04, S * 0.02); g.fill(); g.stroke(); }
  else if (f.mouth === 'smirk') { g.beginPath(); g.moveTo(S * 0.42, my); g.quadraticCurveTo(S * 0.52, my + S * 0.05, S * 0.6, my - S * 0.03); g.stroke(); }
}
const faceTex = f => canvasTex(512, 512, (g, s) => drawFace(g, s, f));

// ---------------------------------------------------------------- blocky characters
function character(o) {
  const grp = new THREE.Group(); const skin = toon(o.skin), shirt = toon(o.shirt), cuff = toon(o.cuff || o.shirt);
  // torso
  const torso = mesh(rbox(1.3, 1.3, 0.66, 0.1), shirt, {pos: [0, 0.65, 0]}); grp.add(torso);
  if (o.torsoDecal) torso.add(decal(o.torsoDecal, 1.2, 1.2, {pos: [0, 0, 0.335]}));
  // head
  const head = new THREE.Group(); head.position.set(0, 1.85, 0); grp.add(head);
  head.add(mesh(rbox(1.08, 1.0, 1.0, 0.16, 5), skin, {outline: 'thick'}));
  const ftex = faceTex(o.face); const face = decal(ftex, 0.98, 0.98, {pos: [0, 0, 0.503]}); head.add(face);
  if (o.hair) o.hair(head);
  // arms: pivot at shoulder
  const arms = [];
  [-1, 1].forEach(d => { const a = new THREE.Group(); a.position.set(d * 0.98, 1.22, 0); const sleeve = mesh(rbox(0.62, 0.95, 0.62, 0.09), shirt, {pos: [0, -0.45, 0]}); const c = mesh(rbox(0.66, 0.2, 0.66, 0.06), cuff, {pos: [0, -0.88, 0]}); const hnd = mesh(rbox(0.6, 0.42, 0.6, 0.12), skin, {pos: [0, -1.18, 0]}); a.add(sleeve, c, hnd); grp.add(a); arms.push(a); });
  grp.userData = {head, arms, torso, ftex, fparams: o.face, redraw(p) { Object.assign(this.fparams, p); drawFace(ftex.image.getContext('2d'), 512, this.fparams); ftex.needsUpdate = true; }};
  return grp;
}
// ---------------------------------------------------------------- set dressing
const set = new THREE.Group(); scene.add(set);
// floor + wall
set.add(mesh(new THREE.BoxGeometry(14, 0.2, 10), toon('#c98a58'), {pos: [0, -0.1, 0], outline: false, cast: false}));
const floorLines = canvasTex(1024, 1024, (g, w, h) => { g.fillStyle = '#c98a58'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(90,40,30,.35)'; g.lineWidth = 6; for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(0, i * h / 8); g.lineTo(w, i * h / 8); g.stroke(); } for (let i = 0; i < 20; i++) { const y = Math.floor(i / 2.5) * h / 8, x = (i * 397) % w; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + h / 8); g.stroke(); } });
const fl = new THREE.Mesh(new THREE.PlaneGeometry(14, 10), new THREE.MeshToonMaterial({map: floorLines, gradientMap: ramp})); fl.rotation.x = -Math.PI / 2; fl.position.y = 0.005; fl.receiveShadow = true; set.add(fl);
const wallTex = canvasTex(1024, 1024, (g, w, h) => { g.fillStyle = '#f7d9a6'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(255,255,255,.22)'; for (let x = 0; x < w; x += 128) g.fillRect(x, 0, 48, h); g.fillStyle = 'rgba(214,140,90,.12)'; for (let y = 0; y < h; y += 128) for (let x = (y / 128 % 2) * 64; x < w; x += 128) { g.beginPath(); g.arc(x + 24, y + 64, 6, 0, 7); g.fill(); } });
wallTex.wrapS = wallTex.wrapT = THREE.RepeatWrapping; wallTex.repeat.set(3, 2);
const wall = new THREE.Mesh(new THREE.PlaneGeometry(14, 9), new THREE.MeshToonMaterial({map: wallTex, gradientMap: ramp})); wall.position.set(0, 4.5, -2.85); wall.receiveShadow = true; set.add(wall);
set.add(mesh(rbox(14, 0.35, 0.2, 0.04), toon('#e2a86e'), {pos: [0, 0.18, -2.75], outline: 'thin'}));
// whiteboard with marker text
const boardTex = canvasTex(1100, 760, (g, w, h) => { g.fillStyle = '#f7f4ef'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(160,170,200,.18)'; for (let i = 0; i < 6; i++) { g.save(); g.translate(120 + i * 170, 80); g.rotate(-0.4); g.fillRect(0, 0, 40, 700); g.restore(); }
  g.font = '700 150px Caveat'; g.textAlign = 'center'; g.fillStyle = '#e8384f'; g.fillText('NO GAMES', w / 2, 300); g.fillStyle = '#3b5bdb'; g.fillText('after 9 PM!', w / 2, 470);
  g.strokeStyle = '#3b5bdb'; g.lineWidth = 12; g.lineCap = 'round'; g.beginPath(); for (let x = 260; x < 860; x += 20) g.lineTo(x, 520 + Math.sin(x / 22) * 10); g.stroke();
  g.fillStyle = '#e8384f'; g.font = '700 70px Caveat'; g.fillText('- Mom', w * 0.78, 640); });
const board = new THREE.Group(); board.position.set(-1.05, 4.55, -2.7); set.add(board);
board.add(mesh(rbox(4.6, 3.2, 0.14, 0.06), toon('#e7e2f2'), {outline: 'thin'})); board.add(decal(boardTex, 4.2, 2.9, {pos: [0, 0, 0.08]}));
board.add(mesh(rbox(4.0, 0.12, 0.26, 0.04), toon('#cfc6e6'), {pos: [0, -1.68, 0.12], outline: 'thin'}));
[['#e8384f', -1.2], ['#3b5bdb', -0.9]].forEach(([c, x]) => board.add(mesh(rbox(0.45, 0.1, 0.1, 0.04), toon(c), {pos: [x, -1.58, 0.16], outline: 'thin'})));
// window with night sky, moon and tree
const winTex = canvasTex(600, 900, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#1d1f5c'); gr.addColorStop(1, '#5c4bb0'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = '#fff6c9'; g.beginPath(); g.arc(420, 180, 70, 0, 7); g.fill(); g.fillStyle = '#1d1f5c'; g.beginPath(); g.arc(450, 160, 62, 0, 7); g.fill();
  g.fillStyle = '#fff'; for (let i = 0; i < 26; i++) { g.globalAlpha = 0.4 + (i % 3) * 0.2; g.fillRect((i * 137) % w, (i * 89) % (h * 0.6), 5, 5); } g.globalAlpha = 1;
  g.fillStyle = '#2f2a7a'; [[0, 600, 160], [140, 540, 140], [260, 620, 180], [420, 560, 200]].forEach(([x, y, bw]) => g.fillRect(x, y, bw, h - y)); g.fillStyle = '#ffd86a'; for (let i = 0; i < 30; i++) if ((i * 7) % 3) g.fillRect(20 + (i * 53) % 560, 640 + ((i * 31) % 220), 16, 18);
  g.fillStyle = '#3c7d55'; g.beginPath(); g.arc(120, 520, 90, 0, 7); g.arc(60, 600, 70, 0, 7); g.arc(190, 590, 80, 0, 7); g.fill(); g.fillStyle = '#5a3a28'; g.fillRect(105, 590, 30, 310); });
const win = new THREE.Group(); win.position.set(3.15, 4.2, -2.8); set.add(win);
win.add(mesh(rbox(2.3, 3.4, 0.16, 0.06), toon('#f2ecff'), {outline: 'thin'})); win.add(decal(winTex, 2.0, 3.1, {pos: [0, 0, 0.09]}));
win.add(mesh(rbox(0.12, 3.1, 0.16, 0.03), toon('#f2ecff'), {pos: [0, 0, 0.1], outline: 'thin'})); win.add(mesh(rbox(2.0, 0.12, 0.16, 0.03), toon('#f2ecff'), {pos: [0, 0.2, 0.1], outline: 'thin'}));
const curtain = canvasTex(256, 128, (g, w, h) => { g.fillStyle = '#ff7a59'; g.beginPath(); g.moveTo(0, 0); g.lineTo(w, 0); g.lineTo(w, 70); for (let x = w; x >= 0; x -= 32) g.quadraticCurveTo(x - 16, 120, x - 32, 70); g.closePath(); g.fill(); g.strokeStyle = INKC; g.lineWidth = 6; g.stroke(); });
win.add(decal(curtain, 2.7, 0.9, {pos: [0, 1.75, 0.2]}));
// shelf with trophy and plant
const shelf = new THREE.Group(); shelf.position.set(3.15, 6.6, -2.65); set.add(shelf);
shelf.add(mesh(rbox(2.4, 0.14, 0.5, 0.04), toon('#c47a45'), {outline: 'thin'}));
const gold = toon('#ffc93c'); const cup = new THREE.Group(); cup.position.set(-0.55, 0.07, 0); shelf.add(cup);
cup.add(mesh(new THREE.CylinderGeometry(0.28, 0.14, 0.45, 20), gold, {pos: [0, 0.55, 0], outline: 'thin'})); cup.add(mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.25, 10), gold, {pos: [0, 0.22, 0], outline: 'thin'})); cup.add(mesh(rbox(0.4, 0.12, 0.3, 0.03), toon('#8a5bd6'), {pos: [0, 0.07, 0], outline: 'thin'}));
[-1, 1].forEach(d => cup.add(mesh(new THREE.TorusGeometry(0.11, 0.035, 8, 16), gold, {pos: [d * 0.3, 0.6, 0], rot: [0, 0, 0], outline: 'thin'})));
const pot = new THREE.Group(); pot.position.set(0.55, 0.07, 0); shelf.add(pot);
pot.add(mesh(new THREE.CylinderGeometry(0.22, 0.17, 0.32, 18), toon('#ff7a59'), {pos: [0, 0.16, 0], outline: 'thin'}));
[[0, 0.55, 0, 0.26], [-0.18, 0.45, 0.05, 0.2], [0.18, 0.47, -0.02, 0.2]].forEach(([x, y, z, r]) => pot.add(mesh(new THREE.SphereGeometry(r, 16, 12), toon('#3fb36a'), {pos: [x, y, z], outline: 'thin'})));
// desk (3/4 view comes from camera)
const desk = new THREE.Group(); desk.position.set(0.5, 0, 0.75); set.add(desk);
const wood = toon('#c47a45'), woodD = toon('#a9643a');
desk.add(mesh(rbox(3.9, 0.2, 1.7, 0.06), wood, {pos: [0, 1.62, 0], outline: 'mid'}));
desk.add(mesh(rbox(3.6, 1.5, 1.45, 0.06), woodD, {pos: [0, 0.78, -0.05], outline: 'mid'}));
[[-1.1, 1.15], [-1.1, 0.55], [1.1, 1.15], [1.1, 0.55]].forEach(([x, y]) => { desk.add(mesh(rbox(1.15, 0.48, 0.08, 0.05), wood, {pos: [x, y, 0.71], outline: 'thin'})); desk.add(mesh(rbox(0.28, 0.07, 0.08, 0.03), toon('#f2d38b'), {pos: [x, y, 0.78], outline: 'thin'})); });
desk.add(mesh(rbox(0.95, 1.1, 0.08, 0.06), wood, {pos: [0, 0.85, 0.71], outline: 'thin'}));
const starTex = canvasTex(256, 256, (g, w) => { g.translate(w / 2, w / 2); g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 48 : 112; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.fillStyle = '#ffd23f'; g.fill(); g.lineWidth = 12; g.strokeStyle = INKC; g.lineJoin = 'round'; g.stroke(); });
desk.add(decal(starTex, 0.62, 0.62, {pos: [0, 0.88, 0.76]}));
// props on desk: game controller, orange mug, book stack
const top = 1.72;
const pad = new THREE.Group(); pad.position.set(0.0, top + 0.08, 0.35); desk.add(pad);
pad.add(mesh(rbox(1.25, 0.16, 0.7, 0.12), toon('#3b5bdb'), {outline: 'thin'}));
const padTex = canvasTex(512, 256, (g, w, h) => { g.fillStyle = '#ffd23f'; g.beginPath(); g.ellipse(w / 2, h / 2, 70, 70, 0, 0, 7); g.fill(); g.lineWidth = 10; g.strokeStyle = INKC; g.stroke(); g.fillStyle = '#ff6b2b'; g.beginPath(); g.moveTo(268, 70); g.lineTo(226, 140); g.lineTo(258, 140); g.lineTo(240, 190); g.lineTo(290, 116); g.lineTo(258, 116); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#ff6bd6'; g.font = '80px Lilita'; g.fillText('★', 70, 160); });
pad.add(decal(padTex, 1.15, 0.58, {pos: [0, 0.085, 0], rot: [-Math.PI / 2, 0, 0]}));
const mugG = new THREE.Group(); mugG.position.set(-1.35, top + 0.25, 0.25); desk.add(mugG);
mugG.add(mesh(new THREE.CylinderGeometry(0.22, 0.2, 0.46, 24), toon('#f28c28'), {outline: 'thin'}));
mugG.add(mesh(new THREE.TorusGeometry(0.13, 0.045, 10, 20), toon('#f28c28'), {pos: [0.25, 0.02, 0], outline: 'thin'}));
[['#ff5e7e', 0.0], ['#5bd28a', 0.13], ['#ffd23f', 0.26], ['#7a5bff', 0.39]].forEach(([c, y], i) => desk.add(mesh(rbox(0.95, 0.12, 0.62, 0.03), toon(c), {pos: [1.35 + (i % 2) * 0.05, top + 0.08 + y, 0.1], rot: [0, 0.1 * (i - 1.5), 0], outline: 'thin'})));

// ---------------------------------------------------------------- the two characters
const heartTex = canvasTex(512, 512, (g, w) => { // mom sweater: knit ribs + gold heart necklace
  g.fillStyle = 'rgba(255,255,255,.07)'; for (let x = 0; x < w; x += 36) g.fillRect(x, 0, 14, w);
  g.strokeStyle = '#f2c14e'; g.lineWidth = 9; g.beginPath(); g.moveTo(150, 0); g.quadraticCurveTo(256, 190, 362, 0); g.stroke();
  g.translate(256, 205); g.fillStyle = '#ffd23f'; g.beginPath(); g.moveTo(0, 30); g.bezierCurveTo(-60, -10, -30, -55, 0, -25); g.bezierCurveTo(30, -55, 60, -10, 0, 30); g.fill(); g.lineWidth = 8; g.strokeStyle = INKC; g.stroke(); });
const mom = character({skin: '#f2b48e', shirt: '#8a4fd8', cuff: '#7440c0', torsoDecal: heartTex,
  face: {eyes: 'tired', lid: '#e09c78', brow: '#5a2a1a', browTilt: 0.9, browArch: 0, mouth: 'flat', fringe: {color: '#7a3a1e', style: 'sweep'}},
  hair(h) { const hm = toon('#7a3a1e'); h.add(mesh(rbox(1.18, 0.3, 1.08, 0.13), hm, {pos: [0, 0.5, -0.03], outline: 'thick'})); h.add(mesh(rbox(0.32, 1.25, 0.95, 0.14), hm, {pos: [-0.66, -0.05, -0.05], outline: 'mid'})); h.add(mesh(rbox(0.32, 1.25, 0.95, 0.14), hm, {pos: [0.66, -0.05, -0.05], outline: 'mid'})); h.add(mesh(rbox(1.25, 1.5, 0.35, 0.14), hm, {pos: [0, -0.2, -0.6], outline: 'mid'}));
    [-1, 1].forEach(d => { const e = mesh(new THREE.TorusGeometry(0.1, 0.03, 8, 20), toon('#ffcf3f'), {pos: [d * 0.56, -0.28, 0.1], rot: [0, Math.PI / 2, 0], outline: 'thin'}); h.add(e); }); }
});
mom.position.set(0.5, 1.42, -0.15); scene.add(mom);
// arms forward onto the desk (foreshortened toward camera), hands on the controller
mom.userData.arms.forEach((a, i) => { const d = i ? 1 : -1; a.rotation.set(-1.18, 0, d * -0.18); });
mom.userData.head.rotation.set(0.02, -0.06, 0.04);

const zTex = canvasTex(512, 512, (g, w) => { g.fillStyle = 'rgba(255,255,255,.1)'; for (let x = 0; x < w; x += 64) g.fillRect(x, 0, 28, w); g.font = '330px Lilita'; g.textAlign = 'center'; g.shadowColor = '#e9b8ff'; g.shadowBlur = 40; g.fillStyle = '#ffffff'; g.fillText('Z', w / 2, 370); g.shadowBlur = 0; g.lineWidth = 12; g.strokeStyle = INKC; g.strokeText('Z', w / 2, 370);
  g.strokeStyle = '#f2ecff'; g.lineWidth = 10; g.beginPath(); g.moveTo(200, 0); g.lineTo(200, 120); g.moveTo(312, 0); g.lineTo(312, 120); g.stroke(); });
const kid = character({skin: '#f8e3c8', shirt: '#5a2fc2', cuff: '#4a24a8', torsoDecal: zTex,
  face: {eyes: 'big', tears: true, brow: '#5a3020', browTilt: -1.0, browArch: 0, mouth: 'wobble', fringe: {color: '#8a4b26', style: 'wavy'}},
  hair(h) { const hk = toon('#8a4b26'); h.add(mesh(rbox(1.2, 0.32, 1.1, 0.14, 5), hk, {pos: [0, 0.5, 0], outline: 'thick'}));
    const hp = toon('#2c2c4f'), neon = new THREE.MeshBasicMaterial({color: '#d28bff'});
    h.add(mesh(new THREE.TorusGeometry(0.66, 0.06, 10, 30, Math.PI), hp, {pos: [0, 0.1, 0], outline: 'thin'}));
    [-1, 1].forEach(d => { const cup = mesh(rbox(0.22, 0.48, 0.48, 0.08), hp, {pos: [d * 0.63, 0.0, 0], outline: 'mid'}); cup.add(new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.3, 0.06), neon)).position.set(d * 0.12, 0, 0); h.add(cup); }); }
});
kid.position.set(-1.45, 1.12, -0.95); kid.rotation.y = 0.38; kid.scale.setScalar(1.04); scene.add(kid);
kid.userData.head.rotation.set(0.05, 0.12, -0.06);
kid.userData.arms.forEach((a, i) => a.rotation.set(-0.15, 0, i ? 0.08 : -0.08));

// ---------------------------------------------------------------- lights
scene.add(new THREE.HemisphereLight('#fff1e0', '#5b3c8a', 1.25));
const sun = new THREE.DirectionalLight('#fff4e6', 2.1); sun.position.set(-4, 9, 7); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, {left: -6, right: 6, top: 8, bottom: -2, near: 0.5, far: 30}); sun.shadow.bias = -0.0008; sun.shadow.normalBias = 0.02; scene.add(sun);
const rim = new THREE.DirectionalLight('#c9a4ff', 0.9); rim.position.set(5, 5, -4); scene.add(rim);

// ---------------------------------------------------------------- camera / render API
const sm = u => { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); };
const padHome = pad.position.clone();
window.renderAt = (t = 0) => {
  const push = sm(t / 4) * 0.9;
  camera.position.set(0.95 - push * 0.25, 3.75 - push * 0.08, 13.2 - push); camera.lookAt(-0.05 + push * 0.05, 3.05, -0.6); camera.updateProjectionMatrix();
  // kid sobbing: small rhythmic bob + head shake + dripping tears
  kid.position.y = 1.12 + Math.abs(Math.sin(t * 7.5)) * 0.035; kid.userData.head.rotation.z = -0.06 + Math.sin(t * 7.5) * 0.03;
  kid.userData.redraw({tearT: t * 0.9});
  // mom: raises brow, tilts head (1.0-1.6 s), then confiscates the controller (2.0-2.9 s)
  const brow = sm((t - 1.0) / 0.4); mom.userData.redraw({browTilt: 0.9 + 0.5 * brow, browArch: -10 * brow});
  mom.userData.head.rotation.set(0.02, -0.06 - 0.06 * brow, 0.04 + 0.06 * brow);
  const take = sm((t - 2.0) / 0.9);
  mom.userData.arms.forEach((a, i) => { const d = i ? 1 : -1; a.rotation.set(-1.18 + 0.42 * take, 0, d * (-0.18 + 0.05 * take)); });
  pad.position.set(padHome.x, padHome.y + 0.25 * Math.sin(take * Math.PI) + 0.02 * take, padHome.z - 0.75 * take);
  renderer.render(scene, camera); return true;
};
window.renderAt(0); window.ready = true;
