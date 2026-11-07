import * as THREE from 'three';
import {LineSegments2} from 'three/addons/lines/LineSegments2.js';
import {LineSegmentsGeometry} from 'three/addons/lines/LineSegmentsGeometry.js';
import {LineMaterial} from 'three/addons/lines/LineMaterial.js';

const V3 = THREE.Vector3;
const sm = u => { u = Math.min(1, Math.max(0, u)); return u * u * (3 - 2 * u); };
const lerp = (a, b, u) => a + (b - a) * u;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const wrapPI = a => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
const P3 = a => a.length === 2 ? [a[0], 0, a[1]] : a;

class Tr {
  constructor(v) { this.t = [-1e9]; this.v = [v]; this.e = ['s']; }
  last() { return this.t[this.t.length - 1]; }
  val(t) {
    const T = this.t, V = this.v;
    if (t <= T[0]) return V[0];
    if (t >= this.last()) return V[V.length - 1];
    let i = T.length - 2; while (T[i] > t) i--;
    const u = (t - T[i]) / (T[i + 1] - T[i]);
    return V[i] + (V[i + 1] - V[i]) * (this.e[i + 1] === 'l' ? u : sm(u));
  }
  to(t, dur, target, ease = 's') {
    if (this.last() < t - 1e-9) { this.t.push(t); this.v.push(this.val(t)); this.e.push('l'); }
    this.t.push(Math.max(t + dur, this.last() + 1e-3)); this.v.push(target); this.e.push(ease);
  }
  init(v) { this.v[0] = v; }
}

const POSE = {
  down: [0.02, -0.58, 0.10], on_knee: [0.40, -0.38, 0.04], wave_up: [0.12, 0.42, 0.34], point_up: [0.22, 0.56, 0.06],
  open: [0.42, -0.05, 0.30], hold_front: [0.36, -0.30, 0.06], limp: [0.12, -0.50, 0.10], head: [0.08, 0.30, 0.14], ears: [0.05, 0.30, 0.20],
  shrug: [0.12, 0.05, 0.30], carry: [0.40, -0.22, 0.10], reach_up: [0.20, 0.60, 0.08], hips: [0.0, -0.30, 0.34], cross: [0.30, -0.20, -0.10]
};
const FACE = {
  happy: {smile: 0.85, worry: 0, lift: 0.1, eye: 1}, calm: {smile: 0.3, worry: 0, lift: 0, eye: 1}, neutral: {smile: 0.05, worry: 0, lift: 0, eye: 1},
  worry: {smile: -0.35, worry: 0.9, lift: 0.3, eye: 1.05}, guilty: {smile: -0.8, worry: 0.7, lift: -0.1, eye: 0.8},
  curious: {smile: 0.35, worry: 0, lift: 0.6, eye: 1.1}, relief: {smile: 0.9, worry: 0, lift: 0, eye: 0.15},
  wince: {smile: -0.3, worry: 0.8, lift: 0, eye: 0.15}, surprised: {smile: 0, worry: 0.2, lift: 0.9, eye: 1.4},
  tired: {smile: -0.15, worry: 0.2, lift: -0.3, eye: 0.5}, amused: {smile: 0.6, worry: 0, lift: 0.35, eye: 1}, focus: {smile: 0, worry: 0.2, lift: -0.1, eye: 0.85},
  sheepish: {smile: 0.2, worry: 0.55, lift: 0.1, eye: 1}, smile: {smile: 0.55, worry: 0, lift: 0.05, eye: 1}, puzzled: {smile: -0.15, worry: 0.35, lift: 0.5, eye: 1.05}
};

export async function createStage(opts) {
  const W = opts.w || 1920, H = opts.h || Math.round(W * 9 / 16), FPS = opts.fps || 60, S = W / 1280;
  const data = await (await fetch(opts.scene)).json();
  const PAL = Object.assign({paper: '#faf7f0', ink: '#1c1c1c', orange: '#f28c28', blue: '#7fa8d8', couch: '#d6e4f5', grey: '#cfc9ba', floor: '#f1ecdf', wall: '#fcfaf4'}, data.set.palette || {});
  await document.fonts.load('700 100px Caveat'); await document.fonts.ready;
  const col = h => new THREE.Color(h);
  const INK = col(PAL.ink);
  const DUR = data.meta.duration, SHIFT = data.meta.shift ?? 0.075;

  const renderer = new THREE.WebGLRenderer({antialias: false, preserveDrawingBuffer: true});
  renderer.setPixelRatio(1); renderer.setSize(W, H);
  opts.parent.appendChild(renderer.domElement);
  renderer.setClearColor(col(PAL.paper));
  const MSAA = opts.msaa ?? 4;
  const mkRT = (depth) => { const r = new THREE.WebGLRenderTarget(W, H, {samples: depth ? MSAA : 0, type: THREE.HalfFloatType}); if (depth) { r.depthTexture = new THREE.DepthTexture(W, H); r.depthTexture.type = THREE.UnsignedIntType; } return r; };
  const rt = mkRT(true), acc = mkRT(false);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, W / H, 0.1, 150);

  // ------------------------------------------------------------------ line / fill helpers
  const lineMats = [];
  const mkLine = (c, lw) => { const m = new LineMaterial({color: c, linewidth: lw * S, worldUnits: false}); m.resolution.set(W, H); lineMats.push(m); return m; };
  const fillMat = c => new THREE.MeshBasicMaterial({color: col(c), polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1});
  const edgeOf = (geo, lw = 3.4, c = INK, ang = 30) => new LineSegments2(new LineSegmentsGeometry().fromEdgesGeometry(new THREE.EdgesGeometry(geo, ang)), mkLine(c, lw));
  const segs = (pts, c = INK, lw = 3.4) => { const g = new LineSegmentsGeometry(); g.setPositions(pts.flat()); return new LineSegments2(g, mkLine(c, lw)); };
  const poly = (pts, c = INK, lw = 3.4, closed = false) => { const a = []; for (let i = 0; i < pts.length - (closed ? 0 : 1); i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; a.push([p[0], p[1], p[2] || 0, q[0], q[1], q[2] || 0]); } return segs(a, c, lw); };
  function solid(w, h, d, color, lw = 3.4, ob = true) {
    const g = new THREE.Group(), geo = new THREE.BoxGeometry(w, h, d), m = new THREE.Mesh(geo, fillMat(color));
    if (ob && Math.min(w, h, d) >= 0.07) m.userData.ob = {k: 'b', h: [w / 2, h / 2, d / 2]};
    g.add(m); g.add(edgeOf(geo, lw)); g.userData.fill = m; return g;
  }
  function cyl(r, h, color, seg = 28, lw = 3.4, ob = true) {
    const g = new THREE.Group(), geo = new THREE.CylinderGeometry(r, r, h, seg), m = new THREE.Mesh(geo, fillMat(color));
    if (ob && r >= 0.15) m.userData.ob = {k: 'c', r, hh: h / 2};
    g.add(m); g.add(edgeOf(geo, lw, INK, 40)); g.userData.fill = m; return g;
  }
  function hullSphere(r, color, k = 1.08) {
    const g = new THREE.Group();
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 28, 20), new THREE.MeshBasicMaterial({color: col(color)}));
    g.add(m); g.add(new THREE.Mesh(new THREE.SphereGeometry(r * k, 28, 20), new THREE.MeshBasicMaterial({color: INK, side: THREE.BackSide}))); g.userData.fill = m; return g;
  }
  function flat(w, h, fill, lw = 3.4, z = 0) {  // flat paper card facing +z with outline
    const g = new THREE.Group();
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), fillMat(fill)); g.add(m);
    g.add(poly([[-w / 2, -h / 2, 0.002], [w / 2, -h / 2, 0.002], [w / 2, h / 2, 0.002], [-w / 2, h / 2, 0.002]], INK, lw, true)); g.userData.fill = m; return g;
  }
  function makeText(text, {size = 0.4, color = PAL.ink, weight = 700} = {}) {
    const c = document.createElement('canvas'), g = c.getContext('2d'), fs = 150;
    g.font = `${weight} ${fs}px Caveat, "Comic Sans MS", sans-serif`;
    c.width = Math.ceil(g.measureText(text).width + 70); c.height = Math.ceil(fs * 1.5);
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    let last = -1;
    const draw = r => {
      if (Math.abs(r - last) < 1e-3) return; last = r;
      g.clearRect(0, 0, c.width, c.height); g.save(); g.beginPath(); g.rect(0, 0, c.width * r, c.height); g.clip();
      g.font = `${weight} ${fs}px Caveat, "Comic Sans MS", sans-serif`; g.fillStyle = color; g.textBaseline = 'middle'; g.textAlign = 'left'; g.fillText(text, 35, c.height * 0.56); g.restore(); tex.needsUpdate = true;
    };
    draw(1);
    const hh = size * c.height / fs, mesh = new THREE.Mesh(new THREE.PlaneGeometry(hh * c.width / c.height, hh), new THREE.MeshBasicMaterial({map: tex, transparent: true, alphaTest: 0.35, alphaToCoverage: true}));
    mesh.userData.draw = draw; mesh.userData.w = hh * c.width / c.height; return mesh;
  }
  const rays = (n, a0, a1, r0, r1, color = PAL.orange, lw = 5) => {
    const pts = []; for (let i = 0; i < n; i++) { const a = lerp(a0, a1, n > 1 ? i / (n - 1) : 0.5) * Math.PI / 180; pts.push([Math.cos(a) * r0, Math.sin(a) * r0, 0, Math.cos(a) * r1, Math.sin(a) * r1, 0]); }
    const g = new THREE.Group(); g.add(segs(pts, col(color), lw)); return g;
  };

  // ------------------------------------------------------------------ prop library
  const REG = {};   // id -> record (props, including nested)
  const accents = [];
  const B = {};
  function build(def, parentRec) {
    const fn = B[def.type]; if (!fn) throw new Error('unknown prop type ' + def.type);
    const r = fn(def) || {}; r.def = def; r.obj = r.obj || new THREE.Group(); r.kids = []; r.T = {};
    const at = P3(def.at || [0, 0, 0]);
    const tk = (n, v) => (r.T[n] = new Tr(v));
    tk('px', at[0]); tk('py', at[1]); tk('pz', at[2]); tk('ry', def.yaw || 0); tk('rz', def.rz || 0); tk('rx', def.rx || 0);
    tk('sc', def.hidden ? 0 : (def.scale ?? 1)); tk('prog', def.prog ?? 0); tk('alarm', 0); tk('tone', def.tone ?? 1); tk('att', 0);
    r.obj.position.set(at[0], at[1], at[2]); r.obj.rotation.y = def.yaw || 0; r.obj.scale.setScalar(def.hidden ? 0 : (def.scale ?? 1)); if (def.id) r.obj.userData.rid = def.id;
    for (const k of (def.children || [])) { const c = build(k, r); r.kids.push(c); r.obj.add(c.obj); }
    if (def.alarm) { const rg = rays(9, 20, 160, 0.16, 0.34); rg.visible = false; scene.add(rg); r.rays = rg; }
    (r.acc || []).forEach(m => accents.push({m, r}));
    if (def.id) REG[def.id] = r;
    return r;
  }
  const edges = (o) => o;
  // furniture
  B.couch = d => { const o = new THREE.Group(), c = PAL.couch, tone = d.color || c;
    const seat = solid(0.8, 0.45, 1.9, tone); seat.position.set(0, 0.225, 0); const back = solid(0.22, 0.85, 1.9, tone); back.position.set(-0.36, 0.425, 0);
    const a1 = solid(0.8, 0.62, 0.2, tone), a2 = solid(0.8, 0.62, 0.2, tone); a1.position.set(0, 0.31, 0.85); a2.position.set(0, 0.31, -0.85); o.add(seat, back, a1, a2);
    return {obj: o, anch: {seat: [0.75, 0, 0]}}; };
  B.chair = d => { const o = new THREE.Group(), c = d.color || '#f1e6cf';
    const s = solid(0.5, 0.06, 0.55, c); s.position.y = 0.42; const bk = solid(0.06, 0.5, 0.55, c); bk.position.set(-0.24, 0.68, 0); o.add(s, bk);
    [[0.2, 0.2], [0.2, -0.2], [-0.2, 0.2], [-0.2, -0.2]].forEach(([x, z]) => { const l = solid(0.04, 0.4, 0.04, c, 2.5, false); l.position.set(x, 0.2, z); o.add(l); });
    return {obj: o, anch: {seat: [0.55, 0, 0]}}; };
  B.table = d => { const o = new THREE.Group(), w = d.w || 1.4, dp = d.d || 0.8, h = d.h || 0.75, c = d.color || '#f6f1e6';
    const t = solid(w, 0.06, dp, c); t.position.y = h; o.add(t); [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([a, b]) => { const l = solid(0.05, h, 0.05, c, 2.5, false); l.position.set(a * (w / 2 - 0.05), h / 2, b * (dp / 2 - 0.05)); o.add(l); });
    const ob = new THREE.Mesh(new THREE.BoxGeometry(w, h, dp), new THREE.MeshBasicMaterial({visible: false})); ob.position.y = h / 2; ob.userData.ob = {k: 'b', h: [w / 2, h / 2, dp / 2]}; o.add(ob);
    return {obj: o, anch: {top: [0, h + 0.03, 0]}}; };
  B.side_table = d => { const o = cyl(0.32, 0.6, '#f6f1e6', 36); o.position.y = 0; const g = new THREE.Group(); o.position.y = 0.3; g.add(o); return {obj: g, anch: {top: [0, 0.62, 0]}}; };
  B.tv = d => { const o = new THREE.Group(); const st = solid(0.45, 0.55, 1.5, '#f6f1e6'); st.position.y = 0.275; const tv = solid(0.08, 0.8, 1.35, '#ffffff'); tv.position.y = 1.0; o.add(st, tv);
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.66), new THREE.MeshBasicMaterial({color: col(PAL.paper)})); scr.rotation.y = Math.PI / 2; scr.position.set(0.045, 1.0, 0); o.add(scr);
    const play = new THREE.Mesh(new THREE.CircleGeometry(0.2, 3), new THREE.MeshBasicMaterial({color: col(PAL.orange)})); play.rotation.y = Math.PI / 2; play.position.set(0.05, 1.0, 0); play.rotation.z = 0; play.visible = false; o.add(play);
    return {obj: o, upd(t, v) { play.visible = v.prog > 0.5; play.scale.setScalar(0.6 + 0.4 * sm((v.prog - 0.5) * 4)); }}; };
  B.counter = d => { const o = new THREE.Group(); const b = solid(d.w || 2.4, 0.95, 0.7, '#f6f1e6'); b.position.y = 0.475; const top = solid((d.w || 2.4) + 0.1, 0.05, 0.78, '#ffffff'); top.position.y = 0.975; o.add(b, top);
    const an = {};
    if (d.sink) { const sx = d.sinkX ?? 0; const basin = flat(0.55, 0.38, '#e6e0d2', 3); basin.rotation.x = -Math.PI / 2; basin.position.set(sx, 1.003, 0.02); o.add(basin);
      const fz = -0.1; const fa = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.3, 8), new THREE.MeshBasicMaterial({color: INK})); fa.position.set(sx, 1.15, fz); o.add(fa);
      const ft = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.2, 8), new THREE.MeshBasicMaterial({color: INK})); ft.rotation.x = Math.PI / 2; ft.position.set(sx, 1.3, fz + 0.1); o.add(ft);
      an.faucet = [sx, 1.28, fz + 0.1]; an.basin = [sx, 1.0, 0.02]; an.mug = [sx + 0.7, 0.995, 0.02]; an.stand = [sx, 0, 0.66]; }
    an.top = [0, 1.0, 0]; return {obj: o, anch: an}; };
  B.door = d => { const o = new THREE.Group(); const dr = solid(d.w || 1.0, 2.1, 0.06, d.color || '#ffffff', 3.4, false); dr.position.y = 1.05; o.add(dr);
    const k = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 8), new THREE.MeshBasicMaterial({color: INK})); k.position.set((d.w || 1) * 0.38, 1.0, 0.06); o.add(k);
    const acc = []; if (d.lock) { const lk = solid(0.14, 0.12, 0.05, PAPER_ORANGE(), 3, false); lk.position.set((d.w || 1) * 0.38, 1.2, 0.06); o.add(lk); }
    return {obj: o, anch: {front: [0, 0, 0.9]}}; };
  const PAPER_ORANGE = () => PAL.orange;
  B.window_ = d => { const o = new THREE.Group(); const f = flat(d.w || 1.3, d.h || 1.5, PAL.blue + '', 3.4); f.userData.fill.material.color.set(col('#e9f1fb')); o.add(f); o.add(segs([[-(d.w || 1.3) / 2, 0, 0.003, (d.w || 1.3) / 2, 0, 0.003], [0, -(d.h || 1.5) / 2, 0.003, 0, (d.h || 1.5) / 2, 0.003]], INK, 3)); return {obj: o}; };
  B.clock = d => { const o = new THREE.Group(); const disc = new THREE.Mesh(new THREE.CircleGeometry(0.33, 40), fillMat('#ffffff')); o.add(disc);
    const ring = []; for (let i = 0; i < 40; i++) { const a = i / 40 * 2 * Math.PI, b = (i + 1) / 40 * 2 * Math.PI; ring.push([Math.cos(a) * 0.33, Math.sin(a) * 0.33, 0.01, Math.cos(b) * 0.33, Math.sin(b) * 0.33, 0.01]); } o.add(segs(ring, INK, 4));
    const tk = []; for (let i = 0; i < 12; i++) { const a = i / 12 * 2 * Math.PI; tk.push([Math.sin(a) * 0.27, Math.cos(a) * 0.27, 0.012, Math.sin(a) * 0.31, Math.cos(a) * 0.31, 0.012]); } o.add(segs(tk, INK, 2.5));
    const [hh, mm] = (d.time || '9:40').split(':').map(Number); const hand = (len, c, lw) => { const g = segs([[0, 0, 0, 0, len, 0]], c, lw); g.position.z = 0.014; o.add(g); return g; };
    const hH = hand(0.17, INK, 5), hM = hand(0.26, col(PAL.orange), 4.5);
    const set = (h, m) => { hH.rotation.z = -((h % 12 + m / 60) / 12) * 2 * Math.PI; hM.rotation.z = -(m / 60) * 2 * Math.PI; }; set(hh, mm);
    return {obj: o, upd(t, v) { if (d.run) set(hh, mm + v.prog * (d.run)); }}; };
  // small objects
  B.mug = d => { const o = new THREE.Group(); const bodyMat = fillMat(PAL.orange); const sc = d.size || 1;
    const b = cyl(0.085, 0.13, PAL.orange, 24, 3, false); b.position.y = 0.065; b.userData.fill.material = bodyMat; o.add(b);
    const h = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.014, 8, 16), bodyMat); h.position.set(0.09, 0.065, 0); o.add(h);
    const st = segs([[-0.05, 0.02, 0.086, -0.02, 0.05, 0.086], [-0.02, 0.05, 0.086, 0.01, 0.025, 0.086], [0.02, 0.1, 0.086, 0.05, 0.07, 0.086], [-0.06, 0.09, 0.086, -0.03, 0.115, 0.086]], col('#8a5a2b'), 3); st.visible = !!d.stains; o.add(st);
    o.scale.setScalar(sc); return {obj: o, acc: [bodyMat], upd(t, v) { st.visible = d.stains || v.prog > 0.5; }}; };
  B.phone = d => { const o = new THREE.Group(); const b = solid(0.12, 0.02, 0.24, '#ffffff', 3, false); o.add(b);
    const em = fillMat(PAL.orange); const e = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.045), em); e.rotation.x = -Math.PI / 2; e.position.y = 0.0125; o.add(e); return {obj: o, acc: [em]}; };
  B.box = d => { const o = new THREE.Group(); const sz = d.size || [0.62, 0.45, 0.5]; const b = solid(sz[0], sz[1], sz[2], '#ead9bd'); b.position.y = sz[1] / 2; o.add(b);
    const tm = fillMat('#c9b48e'); const t = new THREE.Mesh(new THREE.PlaneGeometry(0.1, sz[2]), tm); t.rotation.x = -Math.PI / 2; t.position.y = sz[1] + 0.002; o.add(t); return {obj: o, acc: [tm]}; };
  B.remote = d => { const o = solid(0.05, 0.02, 0.17, '#ffffff', 2.6, false); return {obj: o, hold: [0.03, 0, 0]}; };
  B.card = d => { const o = flat(d.w || 0.3, d.h || 0.4, d.fill || PAL.orange, 3); return {obj: o}; };
  B.label = d => { const t = makeText(d.text, {size: d.size || 0.4, color: d.color || PAL.ink}); const o = new THREE.Group(); o.add(t);
    return {obj: o, upd(tt, v) { t.userData.draw(d.reveal === false ? 1 : clamp(v.prog, 0, 1)); }, billboard: d.billboard, w: t.userData.w}; };
  B.panel = d => { const o = solid(d.w || 1, d.h || 1, d.d || 0.05, d.fill || '#ffffff', d.lw || 3.4, false); return {obj: o}; };
  B.flat = d => ({obj: flat(d.w || 1, d.h || 1, d.fill || '#ffffff', d.lw || 3.4)});
  B.group = d => ({obj: new THREE.Group()});
  // icons
  B.heart = d => { const sh = new THREE.Shape(); sh.moveTo(0, -0.5); sh.bezierCurveTo(-0.9, 0.0, -0.5, 0.8, 0, 0.35); sh.bezierCurveTo(0.5, 0.8, 0.9, 0.0, 0, -0.5);
    const dep = d.depth ?? 0.15; const geo = new THREE.ExtrudeGeometry(sh, {depth: dep, bevelEnabled: false}); geo.translate(0, 0, -dep / 2); const g = new THREE.Group(), o = new THREE.Group(); const m = fillMat(d.fill || PAL.orange); o.add(new THREE.Mesh(geo, m)); o.add(edgeOf(geo, 3.4, INK, 50));
    o.scale.setScalar(d.size || 0.3); g.add(o); return {obj: g, acc: d.accent ? [m] : null}; };
  B.cloud = d => { const o = new THREE.Group(); [[-0.22, 0, 0, 0.17], [0, 0.1, 0, 0.22], [0.22, 0, 0, 0.18], [0.08, -0.02, 0.12, 0.15]].forEach(([x, y, z, r]) => { const s = hullSphere(r, d.fill || PAL.blue, 1.09); s.position.set(x, y, z); o.add(s); }); return {obj: o}; };
  B.sun = d => { const o = new THREE.Group(); o.add(hullSphere(0.16, PAL.orange, 1.1)); const r = rays(10, 0, 360, 0.25, 0.4, PAL.orange, 4.5); o.add(r); return {obj: o, billboard: true, upd(t, v) { r.rotation.z = t * 0.5; }}; };
  B.moon = d => { const sh = new THREE.Shape(); sh.absarc(0, 0, 0.3, Math.PI * 0.5, Math.PI * 1.5, false); sh.absarc(0.12, 0, 0.24, Math.PI * 1.5, Math.PI * 0.5, true); const geo = new THREE.ExtrudeGeometry(sh, {depth: 0.05, bevelEnabled: false});
    const o = new THREE.Group(); o.add(new THREE.Mesh(geo, fillMat(PAL.blue))); o.add(edgeOf(geo, 3.2, INK, 40)); return {obj: o}; };
  B.envelope = d => { const o = new THREE.Group(); const m = fillMat(d.fill || PAL.orange); const f = flat(0.34, 0.24, d.fill || PAL.orange, 3); o.add(f); o.add(poly([[-0.17, 0.12, 0.004], [0, -0.02, 0.004], [0.17, 0.12, 0.004]], INK, 3)); return {obj: o}; };
  B.bubble = d => { const o = new THREE.Group(); const w = d.w || 0.9, h = d.h || 0.55; const sh = new THREE.Shape(); const r = Math.min(h / 2, 0.25);
    sh.moveTo(-w / 2 + r, -h / 2); sh.lineTo(w / 2 - r, -h / 2); sh.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r); sh.lineTo(w / 2, h / 2 - r); sh.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2); sh.lineTo(-w / 2 + r, h / 2); sh.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r); sh.lineTo(-w / 2, -h / 2 + r); sh.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
    const geo = new THREE.ExtrudeGeometry(sh, {depth: 0.03, bevelEnabled: false}); geo.translate(0, 0, -0.015);
    const m = new THREE.Mesh(geo, fillMat(d.fill || '#ffffff')); o.add(m); o.add(edgeOf(geo, 3.4, d.ink ? col(d.ink) : INK, 50));
    if (d.kind === 'thought') { for (let i = 1; i <= 3; i++) { const c = hullSphere(0.05 - i * 0.01, '#ffffff', 1.12); c.position.set(-w * 0.18 - i * 0.07, -h / 2 - i * 0.09, 0); o.add(c); } }
    else { const tail = new THREE.Shape(); tail.moveTo(-0.08, 0); tail.lineTo(0, -0.2); tail.lineTo(0.08, 0); const tg = new THREE.ExtrudeGeometry(tail, {depth: 0.03, bevelEnabled: false}); tg.translate(-w * 0.2, -h / 2, -0.015); o.add(new THREE.Mesh(tg, fillMat(d.fill || '#ffffff'))); }
    return {obj: o}; };
  B.arrow = d => { const L = d.len || 1, c = col(d.color || PAL.blue); const o = new THREE.Group(); o.add(segs([[0, 0, 0, L, 0, 0], [L, 0, 0, L - 0.16, 0.14, 0], [L, 0, 0, L - 0.16, -0.14, 0]], c, d.lw || 6)); return {obj: o}; };
  B.bulb = d => { const o = new THREE.Group(); o.add(hullSphere(0.22, PAL.orange, 1.08)); const b = solid(0.16, 0.12, 0.16, '#ffffff', 3, false); b.position.y = -0.3; o.add(b);
    const r = rays(8, 0, 360, 0.34, 0.5); o.add(r); return {obj: o, upd(t, v) { r.quaternion.copy(camera.quaternion); r.scale.setScalar(1 + 0.2 * Math.sin(t * 8)); }}; };
  B.hourglass = d => { const o = new THREE.Group(); const sh = new THREE.Shape(); sh.moveTo(-0.15, 0.25); sh.lineTo(0.15, 0.25); sh.lineTo(0, 0); sh.lineTo(0.15, -0.25); sh.lineTo(-0.15, -0.25); sh.lineTo(0, 0); sh.closePath();
    const geo = new THREE.ExtrudeGeometry(sh, {depth: 0.05, bevelEnabled: false}); o.add(new THREE.Mesh(geo, fillMat('#ffffff'))); o.add(edgeOf(geo, 3.2, INK, 40)); return {obj: o}; };
  B.star = d => { const pts = []; for (let i = 0; i < 10; i++) { const a = (i * 36 - 90) * Math.PI / 180, r = i % 2 ? 0.045 : 0.1; pts.push(new THREE.Vector2(Math.cos(a) * r * (d.size || 1) * 3, -Math.sin(a) * r * (d.size || 1) * 3)); }
    const geo = new THREE.ExtrudeGeometry(new THREE.Shape(pts), {depth: 0.04, bevelEnabled: false}); const o = new THREE.Group(); o.add(new THREE.Mesh(geo, fillMat('#f4c542'))); o.add(edgeOf(geo, 3.2, INK, 40)); return {obj: o}; };
  B.globe = d => { const o = new THREE.Group(); o.add(hullSphere(0.14, '#d6e4f5', 1.1)); const e = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.004, 6, 30), new THREE.MeshBasicMaterial({color: INK})); o.add(e); return {obj: o, upd(t) { o.rotation.y = t * 0.6; }}; };
  B.notepad = d => { const o = new THREE.Group(); const w = d.w || 0.35, h = d.h || 0.45; o.add(flat(w, h, PAL.couch, 3)); for (let i = 0; i < 3; i++) o.add(segs([[-w * 0.35, h * 0.2 - i * h * 0.22, 0.004, w * 0.35, h * 0.2 - i * h * 0.22, 0.004]], INK, 2.6)); return {obj: o}; };
  B.checkbox = d => { const o = new THREE.Group(); const s = d.size || 0.2; o.add(flat(s, s, '#ffffff', 3.2)); const c = col(d.color || PAL.ink); const mk = poly([[-s * 0.3, 0, 0.004], [-s * 0.08, -s * 0.28, 0.004], [s * 0.32, s * 0.3, 0.004]], c, 4.5); mk.visible = d.state === 1; o.add(mk);
    return {obj: o, upd(t, v) { mk.visible = d.state === 1 || (d.state === 'prog' && v.prog > 0.5); }}; };
  B.checklist = d => { const o = new THREE.Group(); const cbs = []; const rows = d.rows || [1, 1, 0], w = d.w || 1.6, rh = d.rh || 0.34; const h = rows.length * rh + 0.3;
    o.add(flat(w, h, '#ffffff', 3.6)); rows.forEach((s, i) => { const y = h / 2 - 0.25 - i * rh; const cb = build({type: 'checkbox', size: rh * 0.62, state: s === 'o' ? 0 : (s === 1 ? 'prog' : s), color: s === 'o' ? PAL.orange : PAL.ink, at: [-w / 2 + 0.3, y, 0.01]}); o.add(cb.obj); cbs.push(cb);
      o.add(segs([[-w / 2 + 0.55, y, 0.01, w / 2 - 0.2 - (i % 2) * 0.2, y, 0.01]], s === 'o' ? col(PAL.orange) : col('#9a9a9a'), 4)); });
    return {obj: o, hh: h, upd(t, v) { cbs.forEach((cb, i) => cb.upd && cb.upd(t, {prog: clamp(v.prog * rows.length - i * 0.9, 0, 1)})); }}; };
  B.bars = d => { const o = new THREE.Group(); const it = d.items || [{h: 1}, {h: 2}]; const gap = d.gap || 0.9; o.add(segs([[-0.5, 0, 0, gap * it.length - 0.2, 0, 0]], INK, 4)); const bs = [];
    it.forEach((b, i) => { const s = solid(0.6, 1, 0.3, b.color || '#ffffff', 3.4, false); s.position.set(i * gap + 0.15, 0, 0); o.add(s); bs.push(s); });
    return {obj: o, upd(t, v) { const k = d.grow ? sm(v.prog) : 1; bs.forEach((s, i) => { const hh = Math.max(0.001, it[i].h * k); s.scale.y = hh; s.position.y = hh / 2; }); }}; };
  B.browser = d => { const o = new THREE.Group(); const w = d.w || 3.2, h = d.h || 1.9; o.add(flat(w, h, '#ffffff', 4)); o.add(segs([[-w / 2, h / 2 - 0.3, 0.004, w / 2, h / 2 - 0.3, 0.004]], INK, 3.4));
    const n = d.tabs || 6, tw = Math.min(0.62, (w - 0.3) / n), tabs = [];
    for (let i = 0; i < n; i++) { const hl = i === d.hi; const t = flat(tw - 0.04, 0.22, hl ? PAL.orange : '#ffffff', 3); t.position.set(-w / 2 + 0.2 + tw * i + tw / 2, h / 2 - 0.14, 0.01); o.add(t); tabs.push(t); }
    for (let i = 0; i < 3; i++) o.add(segs([[-w / 2 + 0.3, h / 2 - 0.6 - i * 0.25, 0.004, w / 2 - 0.4 - i * 0.4, h / 2 - 0.6 - i * 0.25, 0.004]], col('#d8d2c4'), 3));
    return {obj: o, upd(t, v) { tabs.forEach((tb, i) => { const a = clamp(v.prog * (n + 1) - i, 0, 1); const e = sm(a); tb.visible = a > 0.01; tb.scale.setScalar(e); tb.position.y = h / 2 - 0.14 + (1 - e) * 0.35; }); }}; };
  B.tab = d => { const o = new THREE.Group(); const m = fillMat(d.fill || PAL.orange); const f = flat(d.w || 0.9, d.h || 0.45, d.fill || PAL.orange, 3.6); o.add(f); if (d.lock) { const lk = solid(0.12, 0.1, 0.03, '#ffffff', 2.6, false); lk.position.set(0, -0.02, 0.03); o.add(lk); const sh = poly([[-0.04, 0.03, 0.03], [-0.04, 0.09, 0.03], [0, 0.12, 0.03], [0.04, 0.09, 0.03], [0.04, 0.03, 0.03]], INK, 3); o.add(sh); }
    return {obj: o}; };
  B.timer = d => { const o = new THREE.Group(); const r = d.r || 0.22; const body = cyl(r, 0.1, '#ffffff', 36, 3.4, false); body.rotation.x = Math.PI / 2; o.add(body);
    const top = solid(0.07, 0.05, 0.05, INK, 2, false); top.position.y = r + 0.03; o.add(top);
    const labs = (d.labels || [d.label || '3:00']).map(tx => { const l = makeText(tx, {size: r * 0.9, color: PAL.orange}); l.position.z = 0.056; o.add(l); return l; });
    const fx = rays(10, -150, -30, r + 0.06, r + 0.16, PAL.orange, 4); fx.visible = false; o.add(fx);
    return {obj: o, upd(t, v) { const i = Math.min(labs.length - 1, Math.round(v.prog * (labs.length - 1))); labs.forEach((l, k) => l.visible = k === i); fx.visible = v.alarm > 0.1; fx.position.z = 0.06; fx.scale.setScalar(1 + 0.25 * Math.sin(t * 20)); o.rotation.z = v.alarm * Math.sin(t * 30) * 0.12; }}; };
  B.sandwich = d => { const o = new THREE.Group(); [['#e8cf9b', 0], [PAL.orange, 0.07], ['#e8cf9b', 0.14]].forEach(([c, y]) => { const l = solid(0.3, 0.06, 0.22, c, 3, false); l.position.y = y; o.add(l); }); return {obj: o}; };
  B.dot = d => { const o = hullSphere(d.r || 0.1, d.fill || PAL.orange, 1.12); return {obj: o}; };
  B.flag = d => { const o = new THREE.Group(); const p = solid(0.05, 1.0, 0.05, '#ffffff', 3, false); p.position.y = 0.5; o.add(p); const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(0.55, 0.2); sh.lineTo(0, 0.4); sh.closePath(); const geo = new THREE.ExtrudeGeometry(sh, {depth: 0.03, bevelEnabled: false}); const f = new THREE.Mesh(geo, fillMat(PAL.orange)); f.position.set(0.03, 0.6, 0); o.add(f); const e = edgeOf(geo, 3.2, INK, 40); e.position.copy(f.position); o.add(e); return {obj: o}; };
  B.wave = d => { const N = 60, W_ = d.w || 3, Hh = d.h || 1.2; const pts = []; for (let i = 0; i <= N; i++) { const q = i / N; pts.push(q * W_ - W_ / 2, Hh * Math.exp(-Math.pow((q - 0.38) * 4.2, 2)) * (q < 0.4 ? 1 : 0.995), 0); }
    const arr = []; for (let i = 0; i < N; i++) arr.push(pts[i * 3], pts[i * 3 + 1], pts[i * 3 + 2], pts[i * 3 + 3], pts[i * 3 + 4], pts[i * 3 + 5]);
    const g = new LineSegmentsGeometry(); g.setPositions(arr.flat()); const l = new LineSegments2(g, mkLine(col(PAL.orange), 8)); const base = segs([[-W_ / 2 - 0.1, -0.02, 0, W_ / 2 + 0.1, -0.02, 0]], col('#9a9a9a'), 3); const o = new THREE.Group(); o.add(base, l);
    return {obj: o, upd(t, v) { g.instanceCount = Math.max(1, Math.floor(clamp(v.prog, 0, 1) * N)); }}; };
  B.balloon = d => { const o = new THREE.Group(); o.add(hullSphere(0.2, PAL.blue, 1.08)); o.add(poly([[0, -0.2, 0], [0.03, -0.45, 0], [-0.02, -0.7, 0]], INK, 2.5)); return {obj: o}; };
  B.relief = d => { const o = new THREE.Group(); const n = d.n || 4; const lines = []; for (let i = 0; i < n; i++) { const l = poly([[0, 0, 0], [0.04, 0.08, 0], [-0.03, 0.16, 0], [0.03, 0.24, 0]], col(PAL.blue), 4); o.add(l); lines.push(l); }
    return {obj: o, upd(t, v) { lines.forEach((l, i) => { const p = ((t * 0.6 + i / n) % 1); l.position.set(-0.3 + i * 0.2, p * 0.7, 0); l.visible = v.alarm > 0.05; }); }}; };
  B.dust = d => { const o = new THREE.Group(); const dots = []; for (let i = 0; i < 12; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 4), new THREE.MeshBasicMaterial({color: INK})); o.add(s); dots.push(s); }
    return {obj: o, upd(t, v) { dots.forEach((s, i) => { const a = i * 2.4 + t * 0.3; s.position.set(Math.cos(a * 1.3) * 0.35, 0.1 + ((i * 0.37 + t * 0.1) % 1) * 0.4, Math.sin(a) * 0.3); s.visible = v.prog > 0.1; }); }}; };
  B.calendar = d => { const o = new THREE.Group(); o.add(flat(0.5, 0.58, '#ffffff', 3.4)); const hd = flat(0.5, 0.14, PAL.orange, 3.4); hd.position.y = 0.22; o.add(hd); const days = d.days || ['Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue']; const lab = []; days.forEach((x, i) => { const t = makeText(x, {size: 0.22}); t.position.set(0, -0.05, 0.01); o.add(t); lab.push(t); });
    return {obj: o, upd(t, v) { const i = Math.min(days.length - 1, Math.floor(v.prog * days.length)); lab.forEach((l, k) => { l.visible = k === i; }); }}; };
  B.signpost = d => { const o = new THREE.Group(); const pole = solid(0.08, d.h || 2.6, 0.08, '#ffffff', 3, false); pole.position.y = (d.h || 2.6) / 2; o.add(pole);
    const s = flat(d.w || 1.6, 0.5, '#ffffff', 3.6); s.position.set((d.dir || 1) * 0.7, (d.h || 2.6) - 0.35, 0.06); o.add(s); if (d.text) { const t = makeText(d.text, {size: 0.3}); t.position.set((d.dir || 1) * 0.7, (d.h || 2.6) - 0.35, 0.09); o.add(t); } return {obj: o}; };
  B.balance = d => { const o = new THREE.Group(); const st = solid(0.1, 1.6, 0.1, '#ffffff', 3, false); st.position.y = 0.8; o.add(st); const base = solid(0.9, 0.08, 0.5, '#ffffff', 3, false); base.position.y = 0.04; o.add(base);
    const beam = new THREE.Group(); beam.position.y = 1.6; const bm = solid(3.0, 0.07, 0.12, '#ffffff', 3.2, false); beam.add(bm); o.add(beam);
    const pl = (x) => { const g = new THREE.Group(); g.position.set(x, -0.45, 0); g.add(segs([[-0.4, 0.45, 0, -0.35, 0, 0], [0.4, 0.45, 0, 0.35, 0, 0]], INK, 2.6)); const p = solid(0.8, 0.05, 0.4, '#ffffff', 3, false); g.add(p); beam.add(g); return g; };
    const L = pl(-1.35), Rr = pl(1.35); const wt = build({type: 'weight', at: [0, 0.12, 0]}); L.add(wt.obj);
    return {obj: o, upd(t, v) { const a = (d.tilt ?? 0.14) * (1 - sm(v.prog)) * 0 + (d.tilt ?? 0.14) * Math.sin(t * 0.9) * 0.08 - (d.tilt ?? 0.14) * (1 - v.prog * 0.0); beam.rotation.z = (d.tilt ?? 0.14) + 0.01 * Math.sin(t); L.rotation.z = -beam.rotation.z; Rr.rotation.z = -beam.rotation.z; }}; };
  B.weight = d => { const o = new THREE.Group(); const sh = new THREE.Shape(); sh.moveTo(-0.3, 0); sh.lineTo(-0.18, 0.4); sh.lineTo(0.18, 0.4); sh.lineTo(0.3, 0); sh.closePath(); const geo = new THREE.ExtrudeGeometry(sh, {depth: 0.2, bevelEnabled: false}); geo.translate(0, 0, -0.1); o.add(new THREE.Mesh(geo, fillMat(PAL.blue))); o.add(edgeOf(geo, 3.4, INK, 40)); return {obj: o}; };
  B.gear = d => { const o = new THREE.Group(); const r = d.r || 0.45, n = d.n || 10; const pts = []; for (let i = 0; i < n * 2; i++) { const a = i / (n * 2) * Math.PI * 2, rr = i % 2 ? r : r * 1.18; pts.push(new THREE.Vector2(Math.cos(a - 0.12) * rr, Math.sin(a - 0.12) * rr), new THREE.Vector2(Math.cos(a + 0.12) * rr, Math.sin(a + 0.12) * rr)); }
    const sh = new THREE.Shape(pts); const hole = new THREE.Path(); hole.absarc(0, 0, r * 0.3, 0, Math.PI * 2, true); sh.holes.push(hole); const geo = new THREE.ExtrudeGeometry(sh, {depth: 0.12, bevelEnabled: false}); geo.translate(0, 0, -0.06);
    const g = new THREE.Group(); g.add(new THREE.Mesh(geo, fillMat('#ffffff'))); g.add(edgeOf(geo, 3.2, INK, 40)); o.add(g); return {obj: o, upd(t, v) { g.rotation.z = (d.speed || 1) * (v.prog); }}; };
  B.bell = d => { const o = new THREE.Group(); const sh = new THREE.Shape(); sh.moveTo(-0.3, 0); sh.bezierCurveTo(-0.3, 0.45, -0.18, 0.6, 0, 0.62); sh.bezierCurveTo(0.18, 0.6, 0.3, 0.45, 0.3, 0); sh.lineTo(0.38, -0.04); sh.lineTo(-0.38, -0.04); sh.closePath();
    const geo = new THREE.ExtrudeGeometry(sh, {depth: 0.2, bevelEnabled: false}); geo.translate(0, 0, -0.1); const bm = fillMat(PAL.orange); o.add(new THREE.Mesh(geo, bm)); o.add(edgeOf(geo, 3.4, INK, 40)); const cl = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), new THREE.MeshBasicMaterial({color: INK})); cl.position.set(0, -0.08, 0); o.add(cl);
    const fx = rays(9, 20, 160, 0.5, 0.78); fx.position.y = 0.4; o.add(fx); return {obj: o, upd(t, v) { o.rotation.z = v.alarm * Math.sin(t * 28) * 0.18; fx.visible = v.alarm > 0.1; fx.scale.setScalar(v.alarm * (1 + 0.25 * Math.sin(t * 10))); fx.quaternion.copy(camera.quaternion); fx.quaternion.premultiply(o.quaternion.clone().invert()); }}; };
  B.flame_x = d => { const o = new THREE.Group(); const sh = new THREE.Shape(); sh.moveTo(0, -0.2); sh.bezierCurveTo(-0.3, -0.15, -0.2, 0.2, 0, 0.35); sh.bezierCurveTo(0.05, 0.2, 0.25, 0.1, 0.22, -0.05); sh.bezierCurveTo(0.2, -0.17, 0.1, -0.2, 0, -0.2);
    const geo = new THREE.ExtrudeGeometry(sh, {depth: 0.04, bevelEnabled: false}); o.add(new THREE.Mesh(geo, fillMat(PAL.blue))); o.add(edgeOf(geo, 3, INK, 40)); o.add(segs([[-0.3, 0.4, 0.06, 0.3, -0.3, 0.06]], INK, 5)); return {obj: o}; };
  B.cushion = d => { const o = build({type: 'heart', fill: d.fill || PAL.blue, depth: 0.35, size: d.size || 0.9}); return {obj: o.obj, hold: null}; };
  B.puzzle = d => { const o = new THREE.Group(); const m = fillMat(PAL.orange); const b = solid(0.22, 0.22, 0.06, PAL.orange, 3, false); o.add(b); const k1 = cyl(0.06, 0.06, PAL.orange, 16, 3, false); k1.rotation.x = Math.PI / 2; k1.position.set(0, 0.16, 0); const k2 = cyl(0.06, 0.06, PAL.orange, 16, 3, false); k2.rotation.x = Math.PI / 2; k2.position.set(0.16, 0, 0); o.add(k1, k2); return {obj: o}; };
  B.head_profile = d => { const sh = new THREE.Shape(); const pts = [[-0.9, -1.4], [-0.9, 0.0], [-0.85, 0.6], [-0.5, 1.1], [0.1, 1.3], [0.7, 1.1], [0.95, 0.6], [1.0, 0.25], [1.25, 0.0], [1.0, -0.1], [1.05, -0.35], [0.95, -0.55], [0.6, -0.65], [0.5, -1.4]];
    sh.moveTo(...pts[0]); pts.slice(1).forEach(p => sh.lineTo(...p)); sh.closePath(); const geo = new THREE.ExtrudeGeometry(sh, {depth: 0.25, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 2}); geo.translate(0, 0, -0.12);
    const o = new THREE.Group(); const m = new THREE.Mesh(geo, fillMat('#ffffff')); o.add(m); o.add(edgeOf(geo, 3.6, INK, 35)); return {obj: o}; };
  B.bust = d => { const o = new THREE.Group(); o.add(hullSphere(0.3, '#ffffff', 1.07)); o.add(segs([[0, -0.3, 0, 0, -1.0, 0]], INK, 5)); const fx = new THREE.Group(); [-1, 1].forEach(s => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), new THREE.MeshBasicMaterial({color: INK})); e.position.set(s * 0.1, 0.04, 0.29); fx.add(e); }); fx.add(poly([[-0.08, -0.1, 0.285], [0, -0.14, 0.29], [0.08, -0.1, 0.285]], INK, 3)); o.add(fx); return {obj: o}; };
  B.scroll = d => { const o = new THREE.Group(); const L = d.len || 9, w = d.w || 1.5; const f = flat(L, w, '#ffffff', 3.6); f.position.x = L / 2; o.add(f); const r = cyl(0.14, w * 1.05, '#ffffff', 20, 3.2, false); r.rotation.x = Math.PI / 2; r.position.x = 0; o.add(r);
    const rows = Math.floor(w / 0.42); for (let i = 0; i < rows; i++) { const y = w / 2 - 0.3 - i * 0.4; const cb = build({type: 'checkbox', size: 0.25, state: i < 2 ? 1 : 0, at: [0.6, y, 0.01]}); o.add(cb.obj); o.add(segs([[0.95, y, 0.01, L - 0.4 - (i % 3) * 1.2, y, 0.01]], col('#9a9a9a'), 4)); }
    return {obj: o, upd(t, v) { f.scale.x = Math.max(0.001, v.prog); f.position.x = L * v.prog / 2; }}; };
  B.zigzag = d => { const o = new THREE.Group(); const pts = []; const n = d.n || 14, L = d.len || 14; for (let i = 0; i <= n; i++) pts.push([i / n * L, (i % 2 ? 1 : -1) * (d.amp || 0.25) * (d.flatEnds ? (i > 2 && i < n - 2 ? 1 : 0.2) : 1), 0]); const lines = poly(pts, col(d.color || PAL.blue), d.lw || 7); o.add(lines); return {obj: o}; };
  B.fork = d => { const o = new THREE.Group(); const m = fillMat('#e7e0cf'); const sh = new THREE.Shape(); sh.moveTo(-0.5, 0); sh.lineTo(0.5, 0); sh.lineTo(3, 6); sh.lineTo(1.6, 6); sh.lineTo(0, 1.5); sh.lineTo(-1.6, 6); sh.lineTo(-3, 6); sh.closePath();
    const geo = new THREE.ShapeGeometry(sh); const mesh = new THREE.Mesh(geo, m); mesh.rotation.x = -Math.PI / 2; mesh.position.y = 0.01; o.add(mesh); const pts = [[-0.5, 0, 0], [-3, 6, 0], [0.5, 0, 0], [3, 6, 0]]; const eg = new THREE.Group(); eg.rotation.x = -Math.PI / 2; eg.position.y = 0.012; eg.add(segs([[-0.5, 0, 0, -3, 6, 0], [0.5, 0, 0, 3, 6, 0], [-1.6, 6, 0, 0, 1.5, 0], [1.6, 6, 0, 0, 1.5, 0]], INK, 3.4)); o.add(eg); return {obj: o}; };
  B.grid = d => { const o = new THREE.Group(); const n = d.n || 4, s = 0.28; o.add(flat(n * s, n * s, '#ffffff', 3.6)); const a = []; for (let i = 1; i < n; i++) { a.push([-n * s / 2 + i * s, -n * s / 2, 0.004, -n * s / 2 + i * s, n * s / 2, 0.004], [-n * s / 2, -n * s / 2 + i * s, 0.004, n * s / 2, -n * s / 2 + i * s, 0.004]); } o.add(segs(a, INK, 2.4));
    ['A', 'R', 'T', 'M', 'E'].forEach((ch, i) => { const t = makeText(ch, {size: 0.16}); t.position.set(-n * s / 2 + (i % n + 0.5) * s, n * s / 2 - (Math.floor(i / n) * 2 + 0.5) * s, 0.01); o.add(t); }); return {obj: o}; };
  B.tv_icon = d => { const o = new THREE.Group(); o.add(flat(0.5, 0.34, '#ffffff', 3.4)); o.add(segs([[-0.12, -0.25, 0, 0.12, -0.25, 0]], INK, 3.4)); return {obj: o}; };
  B.face_icon = d => { const o = new THREE.Group(); o.add(hullSphere(0.17, '#ffffff', 1.1)); [-1, 1].forEach(s => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), new THREE.MeshBasicMaterial({color: INK})); e.position.set(s * 0.06, 0.04, 0.165); o.add(e); }); o.add(poly([[-0.07, -0.08, 0.165], [0, -0.04, 0.17], [0.07, -0.08, 0.165]], INK, 3)); return {obj: o}; };
  B.rug = d => { const o = new THREE.Mesh(new THREE.PlaneGeometry(d.w || 3, d.h || 2), new THREE.MeshBasicMaterial({color: col(d.fill || '#ece4d2')})); o.rotation.x = -Math.PI / 2; o.position.y = 0.006; return {obj: o}; };
  B.floor_patch = B.rug;
  B.lamp = d => { const o = new THREE.Group(); const p = solid(0.05, 1.5, 0.05, '#ffffff', 3, false); p.position.y = 0.75; const s = cyl(0.22, 0.28, '#fff3c9', 20, 3, false); s.position.y = 1.55; o.add(p, s); return {obj: o}; };
  B.whiteboard = d => { const o = new THREE.Group(); o.add(flat(d.w || 1.4, d.h || 0.9, '#ffffff', 4)); return {obj: o}; };
  B.book = d => { const o = solid(0.36, 0.05, 0.26, '#d6e4f5', 3, false); return {obj: o}; };
  B.tape = d => ({obj: new THREE.Group()});
  B.road = d => ({obj: new THREE.Group()});
  B.ground = d => { const o = new THREE.Mesh(new THREE.PlaneGeometry(d.w || 200, d.h || 200), new THREE.MeshBasicMaterial({color: col(d.fill || PAL.floor)})); o.rotation.x = -Math.PI / 2; o.position.y = -0.002; const g = new THREE.Group(); g.add(o);
    if (d.lines !== false) { const pl = []; const z0 = d.z0 ?? -20, z1 = d.z1 ?? 20; for (let z = z0; z < z1; z += (d.step || 0.6)) pl.push([-100, 0.003, z, 100, 0.003, z]); g.add(segs(pl, col(d.lineColor || '#e3dbc9'), 2)); } return {obj: g}; };
  B.wall = d => { const m = new THREE.Mesh(new THREE.PlaneGeometry(d.w || 200, 12), new THREE.MeshBasicMaterial({color: col(PAL.wall)})); m.position.set(0, 6, 0); const g = new THREE.Group(); g.add(m); const l = segs([[-100, 0.004, 0.001, 100, 0.004, 0.001]], INK, 3); g.add(l); return {obj: g}; };

  // build the set
  const ctx = {};
  const roots = [];
  for (const p of data.set.props) { const r = build(p); scene.add(r.obj); roots.push(r); }
  const allRecs = Object.values(REG);
  const walkRecs = (list, fn) => { for (const r of list) { fn(r); walkRecs(r.kids, fn); } };

  const tone0 = col(PAL.grey), tone1 = col(PAL.orange);
  function updRec(r, t, parentScaleOK = true) {
    const v = {}; for (const k in r.T) v[k] = r.T[k].val(t);
    let sc = v.sc; const pop = (sc > 0.001 && sc < 0.999) ? 1 + 0.16 * Math.sin(clamp(sc, 0, 1) * Math.PI) : 1;
    const bob = r.def.bob ? Math.sin(t * (r.def.bobSpeed || 1.6) + (r.def.bobPhase || 0)) * r.def.bob : 0;
    r.obj.position.set(v.px, v.py + bob, v.pz); r.obj.rotation.set(v.rx, v.ry, v.rz, 'YXZ');
    const shake = v.alarm * Math.sin(t * 34);
    if (r.def.alarm) {
      const st = r.def.shake || 'rot';
      if (st === 'rot') r.obj.rotation.z += shake * 0.07; if (st === 'buzz') { r.obj.position.x += shake * 0.012; r.obj.position.z += Math.cos(t * 41) * v.alarm * 0.01; } if (st === 'hop') { r.obj.position.y += v.alarm * 0.04 * Math.abs(Math.sin(t * 6)); r.obj.rotation.y += shake * 0.03; }
    }
    r.obj.scale.setScalar(Math.max(sc * pop, 1e-4)); r.obj.visible = sc > 0.004;
    if (r.billboard) r.obj.quaternion.copy(camera.quaternion);
    if (r.att !== undefined && v.att > 0.5) { /* handled by actors */ }
    if (r.upd) r.upd(t, v, r);
    r.v = v;
    for (const k of r.kids) updRec(k, t);
  }
  const updRays = (t) => { walkRecs(roots, r => { if (!r.rays) return; const I = r.v ? r.v.alarm : 0; r.rays.visible = I > 0.02 && r.obj.visible; const wp = new V3(); r.obj.getWorldPosition(wp); r.rays.position.copy(wp).add(new V3(0, r.def.rayY ?? 0.38, 0)); r.rays.scale.setScalar(Math.max(I, 1e-3) * (r.def.rayScale || 1) * (1 + 0.28 * Math.sin(t * 9))); r.rays.quaternion.copy(camera.quaternion); }); };

  // ------------------------------------------------------------------ actors
  const blk0 = new THREE.MeshBasicMaterial({color: INK});
  const orMat0 = new THREE.MeshBasicMaterial({color: col(PAL.orange)});
  let blk = blk0, orMat = orMat0;
  const limbUnit = new THREE.CylinderGeometry(1, 1, 1, 10), jointGeo = new THREE.SphereGeometry(1, 10, 8);
  const sph = (alt, azi, r) => new V3(Math.cos(alt) * Math.cos(azi), Math.sin(alt), Math.cos(alt) * Math.sin(azi)).multiplyScalar(r);
  const tubeFrom = (pts, r, mat, seg = 24) => new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), seg, r, 6, false), mat);
  const A_ = 0.45, B_ = 0.47, UA = 0.30, FA = 0.30, STRIDE = 1.3, HR = 0.14, SIT_BACK = 0.75;

  function ik(Pp, Tp, a, b, pole) {
    const d = Tp.clone().sub(Pp); let L = d.length(); const mx = a + b - 1e-3, mn = Math.abs(a - b) + 1e-3;
    if (L > mx) { d.setLength(mx); L = mx; } if (L < mn) { d.setLength(mn); L = mn; }
    const dir = d.clone().normalize(), al = (a * a - b * b + L * L) / (2 * L), h = Math.sqrt(Math.max(a * a - al * al, 0));
    const perp = pole.clone().sub(dir.clone().multiplyScalar(pole.dot(dir))); if (perp.lengthSq() < 1e-6) perp.set(0, 1, 0); perp.normalize();
    return [Pp.clone().addScaledVector(dir, al).addScaledVector(perp, h), Pp.clone().add(d)];
  }
  const ACTORS = {};
  let anchorAt;
  class Actor {
    constructor(id, def) {
      this.id = id; this.def = def; this.plain = !!def.plain; this.s = def.scale || 1; this.T = {}; this.heldBy = [];
      blk = blk0.clone(); orMat = orMat0.clone(); this.blk = blk; this.orMat = orMat;
      const T = n => this.T[n] = this.T[n] || new Tr(0);
      ['x', 'z', 'yaw', 'sit', 'lean', 'slump', 'lkw', 'lkx', 'lky', 'lkz', 'hw', 'hwx', 'hwy', 'hwz', 'lift', 'vis', 'nod', 'fade', 'elev'].forEach(n => T(n)); this.T.elev.init(def.y0 || 0);
      this.T.vis.init(def.hidden ? 0 : 1); this.T.fade.init(1);
      ['L', 'R'].forEach(s => ['x', 'y', 'z'].forEach((c, i) => this.T['h' + s + c] = new Tr(POSE.down[i])));
      ['smile', 'worry', 'lift', 'eye'].forEach(k => this.T['f_' + k] = new Tr((FACE[def.face || 'calm'])[k]));
      if (def.at) { this.T.x.init(def.at[0]); this.T.z.init(def.at[1]); }
      this.T.yaw.init(def.yaw || 0);
      this.g = new THREE.Group(); scene.add(this.g);
      const mkLimb = (r = 0.017) => { const m = new THREE.Mesh(limbUnit, blk); m.userData.r = r; this.g.add(m); return m; };
      this.limbs = {}; ['spine', 'thighL', 'shinL', 'thighR', 'shinR', 'footL', 'footR', 'uaL', 'faL', 'uaR', 'faR'].forEach(n => this.limbs[n] = mkLimb());
      this.joints = []; for (let i = 0; i < 10; i++) { const j = new THREE.Mesh(jointGeo, blk); j.scale.setScalar(0.018 * this.s); this.g.add(j); this.joints.push(j); }
      this.head = new THREE.Group(); this.g.add(this.head); this.head.add(hullSphere(HR, '#ffffff', 1.07));
      this.eyes = [0, 1].map(() => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 6), blk); this.head.add(e); return e; });
      this.mouth = null; this.brows = [null, null];
      if (!this.plain) { this.ring = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.03, 8, 20), orMat); this.g.add(this.ring); }
      this.tail = null; this.gaitReady = false;
    }
    tr(n, v = 0) { return this.T[n] = this.T[n] || new Tr(v); }
    finalize() {
      const DT = 1 / 120, NT = Math.ceil(DUR / DT) + 120; this.distT = new Float32Array(NT); this.wT = new Float32Array(NT); this.DT = DT; this.NT = NT;
      let dist = 0, px = this.T.x.val(0), pz = this.T.z.val(0);
      for (let i = 0; i < NT; i++) { const t = i * DT, x = this.T.x.val(t), z = this.T.z.val(t); const d = Math.hypot(x - px, z - pz); dist += d; this.distT[i] = dist; this.wT[i] = sm(d / DT / 0.55); px = x; pz = z; }
    }
    gait(t) { if (!this.distT) return {dist: 0, w: 0}; const f = clamp(t / this.DT, 0, this.NT - 2), i = Math.floor(f), u = f - i; return {dist: lerp(this.distT[i], this.distT[i + 1], u), w: lerp(this.wT[i], this.wT[i + 1], u)}; }
    rigAt(t) {
      const T = this.T, x = T.x.val(t), z = T.z.val(t), yaw = T.yaw.val(t), sit = T.sit.val(t), g = this.gait(t);
      const c = Math.cos(yaw), s = Math.sin(yaw);
      const Wp = (lx, ly, lz) => new V3(x + lx * c + lz * s, ly, z - lx * s + lz * c);
      const fwd = new V3(c, 0, -s), right = new V3(s, 0, c);
      const ph = 2 * Math.PI * g.dist / STRIDE, bob = 0.022 * g.w * Math.abs(Math.sin(ph));
      const hip = Wp(-SIT_BACK * sit, 0.92 - 0.40 * sit + bob + T.lift.val(t), 0);
      const lean = T.lean.val(t) + 0.42 * T.slump.val(t) + 0.04 * g.w;
      const spineDir = new V3(Math.sin(lean) * c, Math.cos(lean), -Math.sin(lean) * s);
      const neck = hip.clone().addScaledVector(spineDir, 0.5), shC = hip.clone().addScaledVector(spineDir, 0.44);
      const lkw = T.lkw.val(t), target = new V3(T.lkx.val(t), T.lky.val(t), T.lkz.val(t));
      const hc0 = neck.clone().addScaledVector(spineDir, 0.19), dv = target.clone().sub(hc0);
      const rel = clamp(wrapPI(Math.atan2(-dv.z, dv.x) - yaw), -1.4, 1.4), tp = clamp(Math.atan2(dv.y, Math.hypot(dv.x, dv.z)), -0.6, 0.7);
      const hyaw = yaw + rel * lkw, hpitch = tp * lkw - 0.38 * T.slump.val(t) - T.nod.val(t);
      const hc = neck.clone().addScaledVector(spineDir, 0.17).addScaledVector(new V3(Math.cos(hyaw), 0, -Math.sin(hyaw)), 0.03 + 0.03 * Math.max(0, T.slump.val(t)));
      const foot = sgn => {
        const th = ph + (sgn > 0 ? 0 : Math.PI);
        let lx = g.w * (STRIDE / (2 * Math.PI)) * Math.sin(th); const ly = g.w * 0.12 * Math.max(0, Math.cos(th));
        lx = lerp(lx, -0.20, sit); const lz = sgn * (0.10 + 0.04 * sit);
        const ank = Wp(lx, ly, lz), pole = fwd.clone().addScaledVector(right, sgn * 0.15);
        const [knee, ank2] = ik(hip, ank, A_, B_, pole); return {knee, ank: ank2, toe: ank2.clone().addScaledVector(fwd, 0.11)};
      };
      const fR = foot(1), fL = foot(-1);
      const arm = (side, sgn) => {
        const sh = shC.clone().addScaledVector(right, sgn * 0.04);
        let rx = T['h' + side + 'x'].val(t), ry = T['h' + side + 'y'].val(t), rz = T['h' + side + 'z'].val(t);
        rx += (sgn > 0 ? -1 : 1) * 0.10 * g.w * Math.sin(ph);
        const hand = sh.clone().addScaledVector(fwd, rx).addScaledVector(right, sgn * rz); hand.y += ry;
        if (side === 'R') { const hw = T.hw.val(t); if (hw > 0) hand.lerp(new V3(T.hwx.val(t), T.hwy.val(t), T.hwz.val(t)), hw); }
        const pole = fwd.clone().multiplyScalar(-0.12).addScaledVector(right, sgn).add(new V3(0, -0.35, 0));
        const [elb, h2] = ik(sh, hand, UA, FA, pole); return {sh, elb, hand: h2};
      };
      const aR = arm('R', 1), aL = arm('L', -1);
      const F = new V3(x, 0, z), k = this.s;
      const sc = p => { if (k !== 1) { p.sub(F).multiplyScalar(k).add(F); } return p; };
      if (k !== 1) { [hip, neck, shC, hc, fR.knee, fR.ank, fR.toe, fL.knee, fL.ank, fL.toe, aR.sh, aR.elb, aR.hand, aL.sh, aL.elb, aL.hand].forEach(sc); }
      return {x, z, yaw, sit, hip, neck, shC, hc, hyaw, hpitch, fR, fL, aR, aL, fwd, right, spineDir, lean};
    }
    setFace(t) {
      const T = this.T, sm_ = T.f_smile.val(t), wr = T.f_worry.val(t), lf = T.f_lift.val(t), eye = T.f_eye.val(t), k = this.s;
      this.head.scale.setScalar(k);
      this.eyes.forEach((e, i) => { e.position.copy(sph(0.17, i ? 0.34 : -0.34, HR)); e.scale.set(1, Math.max(0.12, eye), 1); });
      if (this.mouth) { this.head.remove(this.mouth); this.mouth.geometry.dispose(); }
      const pts = []; for (let q = -4; q <= 4; q++) { const u = q / 4; pts.push(sph(-0.40 - 0.12 * sm_ * (1 - u * u), u * 0.30, HR * 1.01)); }
      this.mouth = tubeFrom(pts, 0.0065, blk, 16); this.head.add(this.mouth);
      for (let i = 0; i < 2; i++) {
        if (this.brows[i]) { this.head.remove(this.brows[i]); this.brows[i].geometry.dispose(); }
        const sg = i ? 1 : -1, bp = [];
        for (let q = 0; q <= 2; q++) { const u = q / 2, inner = i ? (1 - u) : u; bp.push(sph(0.50 + 0.08 * lf + 0.14 * wr * inner, sg * (0.52 - 0.28 * inner), HR * 1.01)); }
        this.brows[i] = tubeFrom(bp, 0.0065, blk, 8); this.head.add(this.brows[i]);
      }
    }
    update(t) {
      const vis = this.T.vis.val(t); this.g.visible = vis > 0.01; if (vis <= 0.01) return;
      const r = this.rigAt(t), k = this.s; this.g.scale.setScalar(1); this.g.position.y = this.T.elev.val(t);
      const L = (m, a, b) => { const d = b.clone().sub(a), len = d.length(); m.position.copy(a).addScaledVector(d, 0.5); m.scale.set(m.userData.r * k, Math.max(len, 1e-4), m.userData.r * k); m.quaternion.setFromUnitVectors(new V3(0, 1, 0), d.normalize()); };
      const lb = this.limbs;
      L(lb.spine, r.hip, r.neck); L(lb.thighL, r.hip, r.fL.knee); L(lb.shinL, r.fL.knee, r.fL.ank); L(lb.footL, r.fL.ank, r.fL.toe);
      L(lb.thighR, r.hip, r.fR.knee); L(lb.shinR, r.fR.knee, r.fR.ank); L(lb.footR, r.fR.ank, r.fR.toe);
      L(lb.uaL, r.aL.sh, r.aL.elb); L(lb.faL, r.aL.elb, r.aL.hand); L(lb.uaR, r.aR.sh, r.aR.elb); L(lb.faR, r.aR.elb, r.aR.hand);
      [r.hip, r.neck, r.fL.knee, r.fR.knee, r.fL.ank, r.fR.ank, r.aL.elb, r.aR.elb, r.aL.hand, r.aR.hand].forEach((p, i) => this.joints[i].position.copy(p));
      this.head.position.copy(r.hc); this.head.rotation.set(0, r.hyaw, r.hpitch, 'YZX'); this.setFace(t);
      if (!this.plain) {
        this.ring.position.copy(r.neck); this.ring.quaternion.setFromUnitVectors(new V3(0, 0, 1), r.spineDir); this.ring.scale.setScalar(k);
        const tp = [];
        for (let i = 0; i < 7; i++) {
          const tt = Math.max(0, t - i * 0.035), rr = i ? this.rigAt(tt) : r;
          const back = rr.fwd.clone().multiplyScalar(-(0.05 + i * 0.028) * k), sway = Math.sin(t * 3 + i * 0.9) * 0.02 * (i / 6 + 0.3);
          tp.push(rr.neck.clone().add(back).add(new V3(0, (-0.03 - i * 0.055) * k, 0)).addScaledVector(rr.right, sway + 0.015 * Math.sin(i * 1.3 + t * 2)));
        }
        if (this.tail) { this.g.remove(this.tail); this.tail.geometry.dispose(); }
        this.tail = tubeFrom(tp, 0.028 * k, orMat, 20); this.g.add(this.tail);
      }
      const fd = this.T.fade.val(t); if (Math.abs(fd - (this._fd ?? 1)) > 1e-4 || this._fd === undefined) { this._fd = fd; this.g.traverse(o => { if (o.material) { const ms = Array.isArray(o.material) ? o.material : [o.material]; ms.forEach(m => { m.transparent = fd < 0.999; m.opacity = fd; m.depthWrite = fd > 0.98; }); } }); }
      this.cur = r;
    }
    compile(a) {
      const T = this.T, t = a.t ?? 0, d = a.dur ?? 0.001, tr = n => this.tr(n);
      const setArms = (side, name) => { let v = POSE[name]; if (name === 'rest') { const s = T.sit.val(t + d); v = POSE.down.map((q, i) => lerp(q, POSE.on_knee[i], s)); } ['x', 'y', 'z'].forEach((c, i) => tr('h' + side + c).to(t, d, v[i])); };
      const yawTo = (dd, target) => { const cur = T.yaw.val(t); T.yaw.to(t, dd, cur + wrapPI(target - cur)); };
      switch (a.do) {
        case 'place': if (a.at) { T.x.init(a.at[0]); T.z.init(a.at[1]); } if (a.yaw !== undefined) T.yaw.init(a.yaw); break;
        case 'show': T.vis.to(t, d, 1); break; case 'hide': T.vis.to(t, d, 0); break;
        case 'emote': { const f = FACE[a.face]; for (const k in f) tr('f_' + k).to(t, d, f[k]); break; }
        case 'arms': if (a.left) setArms('L', a.left); if (a.right) setArms('R', a.right); break;
        case 'look': if (a.at) { const p = anchorAt(a.at, t); ['x', 'y', 'z'].forEach((c, i) => tr('lk' + c).to(t, 0.001, [p.x, p.y, p.z][i])); T.lkw.to(t, d, 1); } else T.lkw.to(t, d, 0); break;
        case 'walk_to': {
          let to = a.to, face = a.face;
          if (typeof to === 'string') { const [id, an] = to.split('.'); const rec = REG[id]; const p = rec.obj.localToWorld(new V3(...rec.anch[an || 'seat'])); to = [p.x, p.z]; if (face === undefined || face === 'seat') face = rec.obj.rotation.y; }
          const x0 = T.x.val(t), z0 = T.z.val(t), dx = to[0] - x0, dz = to[1] - z0; T.x.to(t, d, to[0]); T.z.to(t, d, to[1]);
          yawTo(Math.min(0.6, d * 0.4), face !== undefined && face !== 'path' ? face : Math.atan2(-dz, dx)); break; }
        case 'turn': yawTo(d, a.yaw); break;
        case 'sit': T.sit.to(t, d, 1); T.lean.to(t, d * 0.35, 0.28); T.lean.to(t + d * 0.35, d * 0.65, -0.10); break;
        case 'stand_up': T.sit.to(t, d, 0); T.lean.to(t, d * 0.35, 0.38); T.lean.to(t + d * 0.35, d * 0.65, 0); break;
        case 'slump': T.slump.to(t, d, a.to); break;
        case 'lean': T.lean.to(t, d, a.to); break;
        case 'hop': T.lift.to(t, d * 0.5, a.h ?? 0.3, 's'); T.lift.to(t + d * 0.5, d * 0.5, 0, 's'); break;
        case 'reach': { const p = a.at ? anchorAt(a.at, t) : new V3(...a.pos); ['x', 'y', 'z'].forEach((c, i) => tr('hw' + c).to(t, 0.001, [p.x, p.y, p.z][i])); T.hw.to(t, d, 1); break; }
        case 'unreach': T.hw.to(t, d, 0); break;
        case 'elev': T.elev.to(t, d, a.to); break;
        case 'nod': T.nod.to(t, d * 0.4, 0.32); T.nod.to(t + d * 0.4, d * 0.6, 0); break;
        case 'fade': T.fade.to(t, d, a.to); break;
        case 'warp': { const e = 0.002; ['x', 'z'].forEach((c, i) => { T[c].to(t - e, e, T[c].val(t - e)); T[c].to(t, e, a.to[i]); }); if (a.yaw !== undefined) { T.yaw.to(t - e, e, T.yaw.val(t - e)); T.yaw.to(t, e, a.yaw); } if (a.sit !== undefined) { T.sit.to(t - e, e, T.sit.val(t - e)); T.sit.to(t, e, a.sit); } break; }
      }
    }
  }
  for (const [id, def] of Object.entries(data.actors || {})) ACTORS[id] = new Actor(id, def);

  // ------------------------------------------------------------------ anchors
  anchorAt = (spec, t) => {
    if (Array.isArray(spec)) return new V3(...spec);
    if (typeof spec === 'object' && spec.at) return anchorAt(spec.at, t).add(new V3(...(spec.off || [0, 0, 0])));
    const [id, part] = String(spec).split('.');
    if (ACTORS[id]) { const r = ACTORS[id].rigAt(t); return ({head: r.hc, neck: r.neck, hip: r.hip, handR: r.aR.hand, handL: r.aL.hand, foot: r.fR.ank, chest: r.shC})[part || 'chest'].clone(); }
    const rec = REG[id]; if (!rec) throw new Error('unknown anchor ' + spec);
    if (part && rec.anch && rec.anch[part]) { const q = rec.obj.localToWorld(new V3(...rec.anch[part])); return q; }
    return propPos(rec, t).add(new V3(...(rec.def.look || [0, 0.2, 0])));
  };
  function propPos(rec, t) {
    const f = rec.def.follow;
    if (f) { const p = anchorAt(f.at, t).add(new V3(...(f.off || [0, 0, 0]))); if (f.vel) p.addScaledVector(new V3(...f.vel), Math.max(0, t - (f.t0 || 0))); return p; }
    if (rec.attach && rec.T.att.val(t) > 0.5) { const [aid, hand] = rec.attach.split('.'); const rg = ACTORS[aid].rigAt(t); return (hand === 'L' ? rg.aL.hand : rg.aR.hand).clone(); }
    return new V3(rec.T.px.val(t), rec.T.py.val(t), rec.T.pz.val(t));
  }
  // ------------------------------------------------------------------ compile timeline
  let camKeys = []; const GT = {sat: new Tr(1)};
  const propTr = (id, n) => { const r = REG[id]; if (!r) throw new Error('unknown prop ' + id); return r.T[n] = r.T[n] || new Tr(0); };
  for (const a of data.timeline.slice().sort((p, q) => (p.t ?? 0) - (q.t ?? 0))) {
    const t = a.t ?? 0, d = a.dur ?? 0.001;
    if (a.who === 'CAMERA') { camKeys = a.keys; continue; }
    if (a.who === 'POST') { GT[a.do].to(t, d, a.to); continue; }
    if (ACTORS[a.who]) { ACTORS[a.who].compile(a); continue; }
    const r = REG[a.who]; if (!r) throw new Error('timeline target not found: ' + a.who);
    switch (a.do) {
      case 'appear': r.T.sc.to(t, d, a.to ?? (r.def.scale ?? 1)); break;
      case 'disappear': r.T.sc.to(t, d, 0); break;
      case 'scale': r.T.sc.to(t, d, a.to); break;
      case 'move': { const p = P3(a.to); r.T.px.to(t, d, p[0]); r.T.py.to(t, d, p[1]); r.T.pz.to(t, d, p[2]); break; }
      case 'rotate': r.T.ry.to(t, d, a.to); break; case 'tilt': r.T.rz.to(t, d, a.to); break;
      case 'alarm': r.T.alarm.to(t, d, a.to); break;
      case 'tone': r.T.tone.to(t, d, a.to); break;
      case 'prog': r.T.prog.to(t, d, a.to, a.ease === 'linear' ? 'l' : 's'); break;
      case 'attach': r.attach = a.to; r.T.att.to(t, 0.001, 1); break;
      case 'detach': r.T.att.to(t, 0.001, 0); break;
    }
  }
  Object.values(ACTORS).forEach(a => a.finalize());
  // attached props follow actor hand
  const attachUpd = (t) => { for (const r of allRecs) { if (!r.attach) continue; if (r.T.att.val(t) > 0.5) { const [id, hand] = r.attach.split('.'); const A = ACTORS[id]; const rg = A.rigAt(t); const hp = hand === 'L' ? rg.aL.hand : rg.aR.hand; r.obj.position.copy(hp); if (r.def.holdOff) r.obj.position.add(new V3(...r.def.holdOff)); r.obj.rotation.set(0, (r.def.holdAbs ? 0 : rg.yaw) + (r.def.holdYaw ?? 1.2), r.def.holdTilt ?? 0.3, 'YXZ'); r.obj.visible = true; r.obj.scale.setScalar(r.T.sc.val(t)); } } };

  // obstacles (furniture only)
  scene.updateMatrixWorld(true);
  const obstacles = []; scene.traverse(m => { if (m.userData.ob) { let p = m, rid = null; while (p) { if (p.userData.rid) { rid = p.userData.rid; break; } p = p.parent; } obstacles.push({ob: m.userData.ob, pid: rid || 'prop', inv: m.matrixWorld.clone().invert()}); } });
  let MARGIN = 0;
  const depthIn = pt => { let best = 0, id = null; for (const o of obstacles) { const q = pt.clone().applyMatrix4(o.inv), b = o.ob; let d; if (b.k === 'b') d = Math.min(b.h[0] - Math.abs(q.x), b.h[1] - Math.abs(q.y), b.h[2] - Math.abs(q.z)); else d = Math.min(b.r - Math.hypot(q.x, q.z), b.hh - Math.abs(q.y)); d += MARGIN; if (d > best) { best = d; id = o.pid; } } return [best, id]; };
  function collide(t, margin = 0) {
    MARGIN = margin; const out = [];
    for (const A of Object.values(ACTORS)) {
      if (A.T.vis.val(t) < 0.5) continue; const r = A.rigAt(t);
      const seg = (name, a, b) => { for (let i = 0; i <= 6; i++) { const p = a.clone().lerp(b, i / 6), [d, id] = depthIn(p); if (d > 0.025) out.push({part: A.id + ':' + name, obstacle: id, depth: d}); } };
      seg('spine', r.hip, r.neck); seg('thighL', r.hip, r.fL.knee); seg('shinL', r.fL.knee, r.fL.ank); seg('thighR', r.hip, r.fR.knee); seg('shinR', r.fR.knee, r.fR.ank);
      seg('uaL', r.aL.sh, r.aL.elb); seg('faL', r.aL.elb, r.aL.hand); seg('uaR', r.aR.sh, r.aR.elb); seg('faR', r.aR.elb, r.aR.hand);
      for (const dv of [[0, 0, 0], [HR, 0, 0], [-HR, 0, 0], [0, HR, 0], [0, 0, HR], [0, 0, -HR]]) { const p = r.hc.clone().add(new V3(...dv)), [d, id] = depthIn(p); if (d > 0.025) out.push({part: A.id + ':head', obstacle: id, depth: d}); }
    }
    return out;
  }

  // ------------------------------------------------------------------ camera
  const cr = (a, b, c, d, u) => 0.5 * ((2 * b) + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u * u + (-a + 3 * b - 3 * c + d) * u * u * u);
  function camAt(t) {
    const k = camKeys; let i = 0; while (i < k.length - 2 && k[i + 1].t <= t) i++;
    const ks = [k[Math.max(0, i - 1)], k[i], k[Math.min(k.length - 1, i + 1)], k[Math.min(k.length - 1, i + 2)]];
    const u = clamp((t - ks[1].t) / Math.max(1e-6, ks[2].t - ks[1].t), 0, 1);
    const vec = key => { const pts = ks.map(q => anchorAt(q[key], t)); return new V3(cr(pts[0].x, pts[1].x, pts[2].x, pts[3].x, u), cr(pts[0].y, pts[1].y, pts[2].y, pts[3].y, u), cr(pts[0].z, pts[1].z, pts[2].z, pts[3].z, u)); };
    const pos = vec('pos'), look = vec('look'), fov = cr(...ks.map(q => q.fov ?? 34), u);
    const num = (key, def) => cr(...ks.map(q => q[key] ?? def), u);
    const roll = num('roll', 0);
    return {pos, look, fov, ap: num('ap', 0), focus: ks.some(q => q.focus !== undefined) ? num('focus', 5) : null, roll};
  }
  function applyCam(c) { camera.position.copy(c.pos); camera.up.set(Math.sin(c.roll), Math.cos(c.roll), 0); camera.lookAt(c.look); camera.fov = c.fov; camera.setViewOffset(W, H, 0, SHIFT * H, W, H); camera.updateProjectionMatrix(); camera.updateMatrixWorld(true); }

  // ------------------------------------------------------------------ captions (DOM)
  const capEl = document.createElement('div'); capEl.id = 'cap'; opts.parent.appendChild(capEl);
  const cues = (data.captions || []).map(c => { const words = c.text.split(/\s+/); const tot = words.reduce((s, w) => s + w.length + 1, 0); let tt = c.start; const span = (c.end - c.start) * 0.9;
    const ws = words.map(w => { const key = /^\*.*\*[.,!?]*$/.test(w) || w.startsWith('*'); const clean = w.replace(/\*/g, ''); const t0 = tt; tt += span * (w.length + 1) / tot; return {w: clean, key, t0}; }); return {...c, ws}; });
  let capCur = -1;
  function updateCaps(t) {
    const idx = cues.findIndex(c => t >= c.start - 0.05 && t < c.end + 0.25);
    if (idx !== capCur) { capCur = idx; capEl.innerHTML = idx < 0 ? '' : cues[idx].ws.map((w, i) => `<span class="w${w.key ? ' k' : ''}" data-i="${i}">${w.w}</span>`).join(' '); }
    if (idx < 0) { capEl.style.opacity = 0; return; }
    const c = cues[idx]; const fade = 1 - clamp((t - c.end) / 0.25, 0, 1); capEl.style.opacity = fade;
    capEl.childNodes.forEach(n => { if (n.nodeType !== 1) return; const w = c.ws[+n.dataset.i]; const p = sm((t - w.t0) / 0.22); const o = (1 - p);
      n.style.opacity = p; n.style.transform = `translateY(${o * 0.35}em) rotate(${(w.key ? -3 : 0) * o + o * 2}deg) scale(${1 + 0.18 * o + (w.key ? 0.08 * Math.sin(p * Math.PI) : 0)})`; });
  }
  capEl.style.cssText = `position:absolute;left:0;right:0;bottom:${H * 0.045}px;text-align:center;font-family:Caveat,sans-serif;font-weight:700;font-size:${H * 0.056}px;color:${PAL.ink};line-height:1.05;padding:0 ${W * 0.12}px;pointer-events:none;`;
  const st = document.createElement('style'); st.textContent = `#cap .w{display:inline-block;-webkit-text-stroke:${H * 0.0125}px ${PAL.paper};paint-order:stroke fill;} #cap .w.k{color:${PAL.orange}}`; document.head.appendChild(st);

  const badgeEl = document.createElement('div'); opts.parent.appendChild(badgeEl);
  badgeEl.style.cssText = `position:absolute;left:${W * 0.045}px;top:${H * 0.06}px;width:${H * 0.095}px;height:${H * 0.095}px;border-radius:50%;border:${H * 0.006}px solid ${PAL.ink};background:${PAL.paper};color:${PAL.orange};font-family:Caveat,sans-serif;font-weight:700;font-size:${H * 0.075}px;line-height:${H * 0.085}px;text-align:center;opacity:0;pointer-events:none;`;
  const badges = data.badges || [];
  function updateBadge(t) { const b = badges.find(x => t >= x.start && t < x.end); if (!b) { badgeEl.style.opacity = 0; return; } if (badgeEl.textContent !== b.text) badgeEl.textContent = b.text; const p = sm((t - b.start) / 0.3), q = 1 - sm((t - (b.end - 0.3)) / 0.3); badgeEl.style.opacity = Math.min(p, q); badgeEl.style.transform = `scale(${0.6 + 0.4 * p + 0.15 * Math.sin(p * Math.PI)}) rotate(${(1 - p) * -25}deg)`; }
  // ------------------------------------------------------------------ post
  const quadScene = new THREE.Scene(), quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const addMat = new THREE.ShaderMaterial({ uniforms: {tex: {value: rt.texture}, w: {value: 1}}, vertexShader: 'varying vec2 vUv; void main(){vUv=uv; gl_Position=vec4(position.xy,0.,1.);}',
    fragmentShader: 'uniform sampler2D tex; uniform float w; varying vec2 vUv; void main(){gl_FragColor=vec4(texture2D(tex,vUv).rgb*w,1.);}', blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, depthTest: false, depthWrite: false });
  const mkNoise = (n, linear) => { const d = new Uint8Array(n * n * 4); let x = 123456789; for (let i = 0; i < d.length; i++) { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; d[i] = (x >>> 0) & 255; } const t = new THREE.DataTexture(d, n, n, THREE.RGBAFormat); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = t.minFilter = linear ? THREE.LinearFilter : THREE.NearestFilter; t.needsUpdate = true; return t; };
  const noiseS = mkNoise(64, true), noiseG = mkNoise(256, false);
  const dofRT = new THREE.WebGLRenderTarget(W >> 1, H >> 1, {type: THREE.HalfFloatType});
  const VERT = 'varying vec2 vUv; void main(){vUv=uv; gl_Position=vec4(position.xy,0.,1.);}';
  const dofMat = new THREE.ShaderMaterial({
    uniforms: {tex: {value: acc.texture}, dtex: {value: rt.depthTexture}, res: {value: new THREE.Vector2(W, H)}, focus: {value: 5}, ap: {value: 0}, near: {value: camera.near}, far: {value: camera.far}, maxR: {value: 16 * S}},
    vertexShader: VERT,
    fragmentShader: `uniform sampler2D tex; uniform sampler2D dtex; uniform vec2 res; uniform float focus,ap,near,far,maxR; varying vec2 vUv;
      float lin(float d){float z=d*2.-1.;return 2.*near*far/(far+near-z*(far-near));}
      float coc(float dp){return clamp(ap*abs(dp-focus)/max(dp,.1),0.,maxR);}
      void main(){ vec3 col=texture2D(tex,vUv).rgb; float d0=lin(texture2D(dtex,vUv).x); float c0=coc(d0);
        if(c0>0.6){ vec3 sum=col; float ws=1.;
          for(int i=0;i<16;i++){ float fi=float(i); float r=sqrt((fi+.5)/16.); float a=fi*2.39996; vec2 o=vec2(cos(a),sin(a))*r;
            vec2 u2=vUv+o*c0/res; float dt=lin(texture2D(dtex,u2).x); float ct=coc(dt); float w=(ct>=r*c0*0.85||dt>d0)?1.:0.; sum+=texture2D(tex,u2).rgb*w; ws+=w; }
          col=sum/ws; }
        gl_FragColor=vec4(col,c0); }` });
  const postMat = new THREE.ShaderMaterial({
    uniforms: {nS: {value: noiseS}, nG: {value: noiseG}, tex: {value: acc.texture}, dof: {value: dofRT.texture}, res: {value: new THREE.Vector2(W, H)}, time: {value: 0}, useDof: {value: 0}, sat: {value: 1}, dip: {value: 0}, paper: {value: col(PAL.paper)}},
    vertexShader: VERT,
    fragmentShader: `uniform sampler2D tex; uniform sampler2D dof; uniform sampler2D nS; uniform sampler2D nG; uniform vec2 res; uniform float time,useDof,sat,dip; uniform vec3 paper; varying vec2 vUv;
      void main(){
        float tt=floor(time*8.); vec2 wob=(texture2D(nS,vUv*0.4375+vec2(tt*0.371,tt*0.713)).rg-.5)*0.0064; vec2 uv=vUv+wob;
        vec3 col=texture2D(tex,uv).rgb;
        if(useDof>0.5){ vec4 b=texture2D(dof,uv); col=mix(col,b.rgb,smoothstep(0.5,2.5,b.a)); }
        float lum=dot(col,vec3(.299,.587,.114)); col=mix(vec3(lum),col,sat); col=mix(col,paper,dip);
        col+=(texture2D(nG,vUv*res/256.+vec2(tt*0.137,tt*0.291)).r-.5)*0.012; gl_FragColor=vec4(col,1.);
        #include <colorspace_fragment>
      }` });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), addMat); quadScene.add(quad);

  // motion score: max pixel displacement per frame of tracked points
  const proj = new THREE.PerspectiveCamera();
  function screenPts(t) {
    const c = camAt(t); proj.position.copy(c.pos); proj.up.set(0, 1, 0); proj.lookAt(c.look); proj.fov = c.fov; proj.aspect = W / H; proj.updateProjectionMatrix(); proj.updateMatrixWorld(true);
    const pts = [new V3(0, 1, -2), new V3(3, 1.2, -1), new V3(-3, 1, 1)]; for (const A of Object.values(ACTORS)) { const r = A.rigAt(t); pts.push(r.hc, r.aR.hand, r.fR.ank); }
    return pts.map(p => { const q = p.clone().project(proj); return [q.x * W / 2, q.y * H / 2]; });
  }
  function motionPx(t) { const a = screenPts(t - 0.5 / FPS), b = screenPts(t + 0.5 / FPS); let m = 0; for (let i = 0; i < a.length; i++) m = Math.max(m, Math.hypot(a[i][0] - b[i][0], a[i][1] - b[i][1])); return m; }

  function setupAt(tt) {
    applyCam(camAt(tt)); for (const r of roots) updRec(r, tt); attachUpd(tt); updRays(tt); for (const A of Object.values(ACTORS)) A.update(tt);
    // props that track actors (e.g. thought bubble over head): def.follow {actor, part, off}
    walkRecs(roots, r => { const f = r.def.follow; if (f) { const p = anchorAt(f.at, tt).add(new V3(...(f.off || [0, 0, 0]))); if (f.vel) p.addScaledVector(new V3(...f.vel), Math.max(0, tt - (f.t0 || 0))); r.obj.position.copy(p); } });
    // tone-driven accents
    for (const {m, r} of accents) m.color.lerpColors(tone0, tone1, clamp(r.v ? r.v.tone : 1, 0, 1));
  }
  const stats = {sub: 0, frames: 0};
  function renderAt(t, opt = {}) {
    const mp = opt.noblur ? 0 : motionPx(t), N = opt.noblur ? 1 : clamp(Math.ceil(mp / 6) + 1, 1, 4);
    const shutter = 0.5 / FPS * 1.5; // 270deg shutter
    renderer.setRenderTarget(acc); renderer.setClearColor(0x000000, 1); renderer.clear(); renderer.setClearColor(col(PAL.paper));
    const offs = []; for (let i = 0; i < N; i++) offs.push(N === 1 ? 0 : (i / (N - 1) - 0.5) * shutter); offs.sort((a, b) => Math.abs(b) - Math.abs(a));
    const gl = renderer.getContext(), prof = opt.profile ? {setup: 0, scene: 0, add: 0, post: 0} : null; const px = new Uint16Array(4); const tick = (tgt) => { if (tgt) renderer.readRenderTargetPixels(tgt, 0, 0, 1, 1, px); else { const u = new Uint8Array(4); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, u); } return performance.now(); };
    for (const o of offs) {
      let a = prof && performance.now(); setupAt(clamp(t + o, 0, DUR)); if (prof) { const b = performance.now(); prof.setup += b - a; a = b; }
      renderer.setRenderTarget(rt); renderer.setClearColor(col(PAL.paper)); renderer.clear(); renderer.render(scene, camera); if (prof) { const b = tick(rt); prof.scene += b - a; a = b; }
      renderer.setRenderTarget(acc); addMat.uniforms.w.value = 1 / N; quad.material = addMat; renderer.autoClear = false; renderer.render(quadScene, quadCam); renderer.autoClear = true; if (prof) { const b = tick(acc); prof.add += b - a; }
    }
    stats.sub += N; stats.frames++;
    const c = camAt(t); const useDof = c.ap > 0.05;
    if (useDof) { dofMat.uniforms.ap.value = c.ap * S; dofMat.uniforms.focus.value = c.focus ?? c.pos.distanceTo(c.look); dofMat.uniforms.near.value = camera.near; dofMat.uniforms.far.value = camera.far; quad.material = dofMat; renderer.setRenderTarget(dofRT); renderer.render(quadScene, quadCam); }
    postMat.uniforms.time.value = t; postMat.uniforms.sat.value = GT.sat.val(t); { const fi = data.meta.fade_in || 0, fo = data.meta.fade_out || 0; postMat.uniforms.dip.value = Math.max(fi > 0 ? 1 - sm(t / fi) : 0, fo > 0 ? 1 - sm((DUR - t) / fo) : 0); } postMat.uniforms.useDof.value = useDof ? 1 : 0; const pt0 = prof ? performance.now() : 0; quad.material = postMat; renderer.setRenderTarget(null); renderer.render(quadScene, quadCam); if (prof) prof._p = pt0;
    updateCaps(t); updateBadge(t);
    if (prof) { prof.post = tick(null) - (prof._p || 0); }
    return {N, mp, prof};
  }
  setupAt(0);
  return {renderAt, collide, meta: {duration: DUR, fps: FPS, w: W, h: H}, stats, actors: ACTORS, reg: REG};
}
