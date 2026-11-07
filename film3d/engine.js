import * as THREE from 'three';
import {LineSegments2} from 'three/addons/lines/LineSegments2.js';
import {LineSegmentsGeometry} from 'three/addons/lines/LineSegmentsGeometry.js';
import {LineMaterial} from 'three/addons/lines/LineMaterial.js';

const W = 1280, H = 720;
const V3 = THREE.Vector3;
const sm = u => { u = Math.min(1, Math.max(0, u)); return u * u * (3 - 2 * u); };
const lerp = (a, b, u) => a + (b - a) * u;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const wrapPI = a => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };

// ============================================================ tracks
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
    const te = Math.max(t + dur, this.last() + 1e-3);
    this.t.push(te); this.v.push(target); this.e.push(ease);
  }
  init(v) { this.v[0] = v; }
}

// ============================================================ renderer / scene
export async function createStage(jsonUrl, canvasParent) {
  const data = await (await fetch(jsonUrl)).json();
  const PAL = data.set.palette;
  const col = h => new THREE.Color(h);
  const INK = col(PAL.ink);

  const renderer = new THREE.WebGLRenderer({antialias: true, preserveDrawingBuffer: true});
  renderer.setPixelRatio(1); renderer.setSize(W, H);
  canvasParent.appendChild(renderer.domElement);
  renderer.setClearColor(col(PAL.paper));
  const rt = new THREE.WebGLRenderTarget(W, H, {samples: 4, type: THREE.HalfFloatType});
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, W / H, 0.1, 80);

  const lineMats = [];
  const mkLine = (c, lw) => { const m = new LineMaterial({color: c, linewidth: lw, worldUnits: false}); m.resolution.set(W, H); lineMats.push(m); return m; };
  const fillMat = c => new THREE.MeshBasicMaterial({color: col(c), polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1});
  const edgeOf = (geo, lw = 3.4, c = INK, ang = 30) => new LineSegments2(new LineSegmentsGeometry().fromEdgesGeometry(new THREE.EdgesGeometry(geo, ang)), mkLine(c, lw));
  const segs = (pts, c = INK, lw = 3.4) => { const g = new LineSegmentsGeometry(); g.setPositions(pts.flat()); return new LineSegments2(g, mkLine(c, lw)); };
  function solid(w, h, d, color, lw = 3.4) {
    const g = new THREE.Group(), geo = new THREE.BoxGeometry(w, h, d);
    const m = new THREE.Mesh(geo, fillMat(color)); if (Math.min(w, h, d) >= 0.07) m.userData.ob = {k: 'b', h: [w / 2, h / 2, d / 2]};
    g.add(m); g.add(edgeOf(geo, lw)); return g;
  }
  function cyl(r, h, color, seg = 28, lw = 3.4) {
    const g = new THREE.Group(), geo = new THREE.CylinderGeometry(r, r, h, seg);
    const m = new THREE.Mesh(geo, fillMat(color)); if (r >= 0.15) m.userData.ob = {k: 'c', r, hh: h / 2};
    g.add(m); g.add(edgeOf(geo, lw, INK, 40)); return g;
  }
  function hullSphere(r, color, k = 1.08) {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.SphereGeometry(r, 28, 20), new THREE.MeshBasicMaterial({color: col(color)})));
    g.add(new THREE.Mesh(new THREE.SphereGeometry(r * k, 28, 20), new THREE.MeshBasicMaterial({color: INK, side: THREE.BackSide})));
    return g;
  }

  // ---------------------------------------------------------- world props
  const P = {};  // id -> object3d
  const alarmFx = {}; // id -> {grp(rays billboard), obj, base}
  const rays = (n, a0, a1, r0, r1, color = PAL.orange) => {
    const pts = [];
    for (let i = 0; i < n; i++) { const a = lerp(a0, a1, n > 1 ? i / (n - 1) : 0.5) * Math.PI / 180; pts.push([Math.cos(a) * r0, Math.sin(a) * r0, 0, Math.cos(a) * r1, Math.sin(a) * r1, 0]); }
    const g = new THREE.Group(); g.add(segs(pts, col(color), 5)); return g;
  };
  const addAlarm = (id, obj, rayPos, a0 = 20, a1 = 160) => {
    const rg = rays(9, a0, a1, 0.16, 0.34); rg.position.copy(rayPos); scene.add(rg);
    alarmFx[id] = {rays: rg, obj, base: obj.position.clone()};
  };

  for (const p of data.set.props) {
    let o = null;
    const at = p.at || [0, 0, 0];
    if (p.id === 'floor') {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshBasicMaterial({color: col('#f1ecdf')}));
      m.rotation.x = -Math.PI / 2; scene.add(m);
      const pl = []; for (let z = -2.6; z < 8; z += 0.6) pl.push([-12, 0.003, z, 14, 0.003, z]);
      scene.add(segs(pl, col('#e3dbc9'), 2));
    } else if (p.id === 'wall') {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(40, 8), new THREE.MeshBasicMaterial({color: col('#fcfaf4')}));
      m.position.set(0, 4, p.z); scene.add(m);
      scene.add(segs([[-12, 0.004, p.z + 0.001, 14, 0.004, p.z + 0.001]], col(PAL.ink), 3));
    } else if (p.type === 'couch') {
      o = new THREE.Group(); const c = PAL.couch;
      const seat = solid(0.8, 0.45, 1.9, c); seat.position.set(0.0, 0.225, 0);
      const back = solid(0.22, 0.85, 1.9, c); back.position.set(-0.36, 0.425, 0);
      const a1 = solid(0.8, 0.62, 0.2, c), a2 = solid(0.8, 0.62, 0.2, c);
      a1.position.set(0, 0.31, 0.85); a2.position.set(0, 0.31, -0.85);
      o.add(seat, back, a1, a2); o.position.set(at[0], 0, at[1]); o.rotation.y = p.yaw || 0;
    } else if (p.type === 'tv') {
      o = new THREE.Group();
      const st = solid(0.45, 0.55, 1.5, '#f6f1e6'); st.position.set(0, 0.275, 0);
      const tv = solid(0.08, 0.8, 1.35, '#ffffff'); tv.position.set(0, 0.55 + 0.45, 0);
      o.add(st, tv); o.position.set(at[0], 0, at[1]); o.rotation.y = p.yaw || 0;
    } else if (p.type === 'counter') {
      o = solid(2.4, 0.95, 0.7, '#f6f1e6'); o.position.set(at[0], 0.475, at[1]);
      const top = solid(2.5, 0.05, 0.78, '#ffffff'); top.position.set(0, 0.5, 0); o.add(top);
    } else if (p.type === 'mug') {
      o = new THREE.Group();
      const b = cyl(0.085, 0.13, PAL.orange, 24, 3); b.position.y = 0.065; o.add(b);
      const h = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.014, 8, 16), fillMat(PAL.orange)); h.position.set(0.09, 0.065, 0); o.add(h);
      o.position.set(at[0], at[1], at[2]);
    } else if (p.type === 'side_table') {
      o = cyl(0.32, 0.6, '#f6f1e6', 36); o.position.set(at[0], 0.3, at[1]);
    } else if (p.type === 'phone') {
      o = new THREE.Group();
      const b = solid(0.12, 0.02, 0.24, '#ffffff', 3); o.add(b);
      const e = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.045), fillMat(PAL.orange)); e.rotation.x = -Math.PI / 2; e.position.y = 0.0125; o.add(e);
      o.position.set(at[0], at[1], at[2]);
    } else if (p.type === 'door') {
      o = new THREE.Group();
      const d = solid(1.0, 2.1, 0.06, '#ffffff'); d.position.y = 1.05; o.add(d);
      const k = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 8), new THREE.MeshBasicMaterial({color: INK})); k.position.set(0.38, 1.0, 0.06); o.add(k);
      o.position.set(at[0], 0, at[1]);
    } else if (p.type === 'box') {
      o = new THREE.Group();
      const b = solid(0.62, 0.45, 0.5, '#ead9bd'); b.position.y = 0.225; o.add(b);
      const t = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.5), fillMat('#c9b48e')); t.rotation.x = -Math.PI / 2; t.position.y = 0.452; o.add(t);
      o.position.set(at[0], 0, at[1]);
    } else if (p.type === 'clock') {
      o = new THREE.Group();
      const disc = new THREE.Mesh(new THREE.CircleGeometry(0.33, 40), fillMat('#ffffff')); o.add(disc);
      const ring = []; for (let i = 0; i < 40; i++) { const a = i / 40 * 2 * Math.PI, b = (i + 1) / 40 * 2 * Math.PI; ring.push([Math.cos(a) * 0.33, Math.sin(a) * 0.33, 0.01, Math.cos(b) * 0.33, Math.sin(b) * 0.33, 0.01]); }
      o.add(segs(ring, INK, 4));
      const tk = []; for (let i = 0; i < 12; i++) { const a = i / 12 * 2 * Math.PI; tk.push([Math.sin(a) * 0.27, Math.cos(a) * 0.27, 0.012, Math.sin(a) * 0.31, Math.cos(a) * 0.31, 0.012]); }
      o.add(segs(tk, INK, 2.5));
      const [hh, mm] = (p.time || '9:40').split(':').map(Number);
      const ha = (hh % 12 + mm / 60) / 12 * 2 * Math.PI, ma = mm / 60 * 2 * Math.PI;
      o.add(segs([[0, 0, 0.014, Math.sin(ha) * 0.17, Math.cos(ha) * 0.17, 0.014]], INK, 5));
      o.add(segs([[0, 0, 0.016, Math.sin(ma) * 0.26, Math.cos(ma) * 0.26, 0.016]], col(PAL.orange), 4.5));
      o.position.set(at[0], at[1], at[2]);
    } else if (p.type === 'remote') {
      o = solid(0.05, 0.02, 0.17, '#ffffff', 2.6); o.position.set(at[0], at[1], at[2]); o.rotation.y = 0.5;
      
    }
    if (o) { scene.add(o); P[p.id] = o; o.traverse(m => { if (m.userData.ob) m.userData.pid = p.id; }); }
  }
  addAlarm('mug', P.mug, new V3(1.0, 1.35, -2.5));
  addAlarm('phone', P.phone, new V3(1.7, 1.0, 0.95));
  addAlarm('box', P.box, new V3(3.3, 0.95, -2.45));
  const couchDef = data.set.props.find(p => p.id === 'couch');
  const cy = couchDef.yaw || 0, cc = Math.cos(cy), cs = Math.sin(cy);
  const remDef = data.set.props.find(p => p.id === 'remote');
  if (remDef.local) { const [lx, ly, lz] = remDef.local; P.remote.position.set(couchDef.at[0] + lx * cc + lz * cs, ly, couchDef.at[1] - lx * cs + lz * cc); P.remote.rotation.y = cy + 0.4; }
  const REMOTE_HOME = P.remote.position.clone(), REMOTE_YAW = P.remote.rotation.y;

  // ---------------------------------------------------------- cloud
  const cloud = new THREE.Group();
  [[-0.22, 0, 0, 0.17], [0, 0.1, 0, 0.22], [0.22, 0, 0, 0.18], [0.08, -0.02, 0.12, 0.15]].forEach(([x, y, z, r]) => { const s = hullSphere(r, PAL.blue, 1.09); s.position.set(x, y, z); cloud.add(s); });
  scene.add(cloud);

  // ---------------------------------------------------------- diagram
  const diagram = new THREE.Group(); scene.add(diagram);
  function textPlane(txt, size, colr) {
    const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
    g.font = 'bold 220px "Comic Sans MS","Segoe Print","DejaVu Sans",sans-serif'; g.fillStyle = colr; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, 128, 140);
    const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace;
    return new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({map: tx, transparent: true}));
  }
  const qm = textPlane('?', 1.0, PAL.blue); qm.position.set(-1.05, 0, 0); diagram.add(qm);
  const ar = segs([[-0.5, 0, 0, 0.5, 0, 0], [0.5, 0, 0, 0.32, 0.16, 0], [0.5, 0, 0, 0.32, -0.16, 0]], col(PAL.blue), 6); diagram.add(ar);
  const bulb = new THREE.Group(); bulb.position.set(1.15, 0, 0);
  const bs = hullSphere(0.22, PAL.orange, 1.08); const bb = solid(0.16, 0.12, 0.16, '#ffffff', 3); bb.position.y = -0.3; bulb.add(bs, bb);
  const bulbRays = rays(8, 0, 360, 0.34, 0.5); bulb.add(bulbRays); diagram.add(bulb);
  diagram.visible = false;

  // ---------------------------------------------------------- Sam (rig meshes)
  const blk = new THREE.MeshBasicMaterial({color: INK});
  const orMat = new THREE.MeshBasicMaterial({color: col(PAL.orange)});
  const LIMB_R = 0.017;
  const limbUnit = new THREE.CylinderGeometry(1, 1, 1, 10);
  const jointGeo = new THREE.SphereGeometry(1, 10, 8);
  const sam = new THREE.Group(); scene.add(sam);
  const limbs = {};
  const mkLimb = (n, mat = blk, r = LIMB_R) => { const m = new THREE.Mesh(limbUnit, mat); m.userData.r = r; sam.add(m); limbs[n] = m; return m; };
  ['spine', 'thighL', 'shinL', 'thighR', 'shinR', 'footL', 'footR', 'uaL', 'faL', 'uaR', 'faR'].forEach(n => mkLimb(n));
  const joints = []; for (let i = 0; i < 10; i++) { const j = new THREE.Mesh(jointGeo, blk); j.scale.setScalar(LIMB_R * 1.05); sam.add(j); joints.push(j); }
  const head = new THREE.Group(); sam.add(head);
  const HR = 0.14; head.add(hullSphere(HR, '#ffffff', 1.07));
  const eyes = [0, 1].map(() => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 6), blk); head.add(e); return e; });
  let mouth = null, brows = [null, null];
  const sph = (alt, azi, r = HR * 1.005) => new V3(Math.cos(alt) * Math.cos(azi), Math.sin(alt), Math.cos(alt) * Math.sin(azi)).multiplyScalar(r);
  const scarfRing = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.03, 8, 20), orMat); sam.add(scarfRing);
  let scarfTail = null;
  function place(m, a, b, r) {
    const d = b.clone().sub(a), L = d.length(); m.position.copy(a).addScaledVector(d, 0.5);
    m.scale.set(r, Math.max(L, 1e-4), r); m.quaternion.setFromUnitVectors(new V3(0, 1, 0), d.normalize());
  }
  const tubeFrom = (pts, r, mat, seg = 24) => new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), seg, r, 6, false), mat);

  // ---------------------------------------------------------- remote handling
  const remote = P.remote;

  // ============================================================ timeline compile
  const T = {};
  const tr = (n, v = 0) => (T[n] = T[n] || new Tr(v));
  ['x', 'z', 'yaw', 'sit', 'lean', 'slump', 'lkw', 'lkx', 'lky', 'lkz', 'hw', 'hwx', 'hwy', 'hwz', 'attach', 'cloud', 'diag'].forEach(n => tr(n, 0));
  const POSE = {
    down: [0.02, -0.58, 0.10], on_knee: [0.40, -0.38, 0.04], wave_up: [0.12, 0.42, 0.34], point_up: [0.22, 0.56, 0.06],
    open: [0.42, -0.05, 0.30], hold_front: [0.36, -0.30, 0.06], limp: [0.12, -0.50, 0.10], head: [0.08, 0.30, 0.14], ears: [0.05, 0.30, 0.20], shrug: [0.12, 0.05, 0.30]
  };
  ['L', 'R'].forEach(s => ['x', 'y', 'z'].forEach((c, i) => tr('h' + s + c, POSE.down[i])));
  const FACE = {
    happy: {smile: 0.85, worry: 0, lift: 0.1, eye: 1}, calm: {smile: 0.3, worry: 0, lift: 0, eye: 1},
    worry: {smile: -0.35, worry: 0.9, lift: 0.3, eye: 1.05}, guilty: {smile: -0.8, worry: 0.7, lift: -0.1, eye: 0.8},
    curious: {smile: 0.35, worry: 0, lift: 0.6, eye: 1.1}, relief: {smile: 0.9, worry: 0, lift: 0, eye: 0.2}
  };
  ['smile', 'worry', 'lift', 'eye'].forEach(k => tr('f_' + k, FACE.happy[k]));
  ['mug', 'phone', 'box'].forEach(n => tr('alarm_' + n, 0));
  const anchors = data.set.anchors;
  let camKeys = [];
  const SIT_BACK = 0.75;
  const relPose = (name, side, tEnd) => {
    if (name === 'rest') { const s = T.sit.val(tEnd); const a = POSE.down, b = POSE.on_knee; return a.map((v, i) => lerp(v, b[i], s)); }
    return POSE[name];
  };
  const setArms = (t, dur, side, name) => { const v = relPose(name, side, t + dur); ['x', 'y', 'z'].forEach((c, i) => tr('h' + side + c).to(t, dur, v[i])); };
  const yawTo = (t, dur, target) => { const cur = T.yaw.val(t); T.yaw.to(t, dur, cur + wrapPI(target - cur)); };

  for (const a of data.timeline.slice().sort((p, q) => (p.t ?? 0) - (q.t ?? 0))) {
    const t = a.t ?? 0, d = a.dur ?? 0.001;
    if (a.who === 'CAMERA') { camKeys = a.keys; continue; }
    if (a.who === 'SAM') {
      switch (a.do) {
        case 'place': T.x.init(a.at[0]); T.z.init(a.at[1]); T.yaw.init(a.yaw || 0); break;
        case 'emote': { const f = FACE[a.face]; for (const k in f) tr('f_' + k).to(t, d, f[k]); break; }
        case 'arms': if (a.left) setArms(t, d, 'L', a.left); if (a.right) setArms(t, d, 'R', a.right); break;
        case 'look':
          if (a.at) { const p = Array.isArray(a.at) ? a.at : anchors[a.at]; ['x', 'y', 'z'].forEach((c, i) => tr('lk' + c).to(t, 0.001, p[i])); T.lkw.to(t, d, 1); }
          else T.lkw.to(t, d, 0);
          break;
        case 'walk_to': {
          const x0 = T.x.val(t), z0 = T.z.val(t), dx = a.to[0] - x0, dz = a.to[1] - z0;
          T.x.to(t, d, a.to[0]); T.z.to(t, d, a.to[1]);
          const wy = a.face !== undefined && a.face !== 'path' ? a.face : Math.atan2(-dz, dx);
          yawTo(t, Math.min(0.6, d * 0.4), wy); break;
        }
        case 'turn': yawTo(t, d, a.yaw); break;
        case 'sit': T.sit.to(t, d, 1); T.lean.to(t, d * 0.35, 0.28); T.lean.to(t + d * 0.35, d * 0.65, -0.10); break;
        case 'stand_up': T.sit.to(t, d, 0); T.lean.to(t, d * 0.35, 0.38); T.lean.to(t + d * 0.35, d * 0.65, 0); break;
        case 'slump': T.slump.to(t, d, a.to); break;
        case 'pick_up': {
          const p = REMOTE_HOME, rp = [p.x, p.y, p.z];
          ['x', 'y', 'z'].forEach((c, i) => tr('hw' + c).to(t, 0.001, rp[i]));
          const d1 = d * 0.55; T.hw.to(t, d1, 1);
          T.attach.to(t + d1 - 0.01, 0.01, 0); T.attach.to(t + d1, 0.01, 1);
          T.hw.to(t + d1 + 0.05, d - d1, 0); setArms(t + d1 + 0.05, d - d1, 'R', 'hold_front'); break;
        }
        case 'put_down': {
          const p = REMOTE_HOME, rp = [p.x, p.y, p.z];
          ['x', 'y', 'z'].forEach((c, i) => tr('hw' + c).to(t, 0.001, rp[i]));
          const d1 = d * 0.6; T.hw.to(t, d1, 1);
          T.attach.to(t + d1 - 0.01, 0.01, 1); T.attach.to(t + d1, 0.01, 0);
          T.hw.to(t + d1 + 0.05, d - d1, 0); setArms(t + d1 + 0.05, d - d1, 'R', 'rest'); break;
        }
      }
    } else if (a.who === 'cloud') T.cloud.to(t, d, a.to);
    else if (a.who === 'diagram') T.diag.to(t, d, 1);
    else if (['mug', 'phone', 'box'].includes(a.who) && a.do === 'alarm') T['alarm_' + a.who].to(t, d, a.to);
  }

  // gait tables
  const DT = 1 / 120, NT = Math.ceil(data.meta.duration / DT) + 120;
  const distT = new Float32Array(NT), wT = new Float32Array(NT);
  { let dist = 0, px = T.x.val(0), pz = T.z.val(0);
    for (let i = 0; i < NT; i++) { const t = i * DT, x = T.x.val(t), z = T.z.val(t); const sp = Math.hypot(x - px, z - pz) / DT; dist += Math.hypot(x - px, z - pz); distT[i] = dist; wT[i] = sm(sp / 0.55); px = x; pz = z; } }
  const gait = t => { const f = clamp(t / DT, 0, NT - 2), i = Math.floor(f), u = f - i; return {dist: lerp(distT[i], distT[i + 1], u), w: lerp(wT[i], wT[i + 1], u)}; };

  // ============================================================ rig evaluation
  const A_ = 0.45, B_ = 0.47, UA = 0.30, FA = 0.30, STRIDE = 1.3;
  function ik(Pp, Tp, a, b, pole) {
    const d = Tp.clone().sub(Pp); let L = d.length();
    const mx = a + b - 1e-3, mn = Math.abs(a - b) + 1e-3;
    if (L > mx) { d.setLength(mx); L = mx; } if (L < mn) { d.setLength(mn); L = mn; }
    const dir = d.clone().normalize(), al = (a * a - b * b + L * L) / (2 * L), h = Math.sqrt(Math.max(a * a - al * al, 0));
    const perp = pole.clone().sub(dir.clone().multiplyScalar(pole.dot(dir))); if (perp.lengthSq() < 1e-6) perp.set(0, 1, 0); perp.normalize();
    return [Pp.clone().addScaledVector(dir, al).addScaledVector(perp, h), Pp.clone().add(d)];
  }
  function rigAt(t) {
    const x = T.x.val(t), z = T.z.val(t), yaw = T.yaw.val(t), sit = T.sit.val(t), g = gait(t);
    const c = Math.cos(yaw), s = Math.sin(yaw);
    const Wp = (lx, ly, lz) => new V3(x + lx * c + lz * s, ly, z - lx * s + lz * c);
    const fwd = new V3(c, 0, -s), right = new V3(s, 0, c);
    const ph = 2 * Math.PI * g.dist / STRIDE;
    const bob = 0.022 * g.w * Math.abs(Math.sin(ph));
    const hip = Wp(-SIT_BACK * sit, 0.92 - 0.40 * sit + bob, 0);
    const lean = T.lean.val(t) + 0.42 * T.slump.val(t) + 0.04 * g.w;
    const spineDir = new V3(Math.sin(lean) * c, Math.cos(lean), -Math.sin(lean) * s);
    const neck = hip.clone().addScaledVector(spineDir, 0.5), shC = hip.clone().addScaledVector(spineDir, 0.44);
    // head
    const lkw = T.lkw.val(t), target = new V3(T.lkx.val(t), T.lky.val(t), T.lkz.val(t));
    const hc0 = neck.clone().addScaledVector(spineDir, 0.19);
    const dv = target.clone().sub(hc0);
    const tyaw = Math.atan2(-dv.z, dv.x), rel = clamp(wrapPI(tyaw - yaw), -1.4, 1.4);
    const tp = clamp(Math.atan2(dv.y, Math.hypot(dv.x, dv.z)), -0.6, 0.7);
    const hyaw = yaw + rel * lkw, hpitch = tp * lkw - 0.38 * T.slump.val(t) + 0.5 * (-lean) * 0 + lean * 0.5 * -1 * 0;
    const hc = neck.clone().addScaledVector(spineDir, 0.17).addScaledVector(new V3(Math.cos(hyaw), 0, -Math.sin(hyaw)), 0.03 + 0.03 * Math.max(0, T.slump.val(t)));
    // feet
    const foot = sgn => {
      const th = ph + (sgn > 0 ? 0 : Math.PI);
      let lx = g.w * (STRIDE / (2 * Math.PI)) * Math.sin(th), ly = g.w * 0.12 * Math.max(0, Math.cos(th));
      lx = lerp(lx, -0.20, sit); const lz = sgn * (0.10 + 0.04 * sit);
      const ank = Wp(lx, ly + 0.0, lz); const toe = ank.clone().addScaledVector(fwd, 0.11);
      const pole = fwd.clone().addScaledVector(right, sgn * 0.15);
      const [knee, ank2] = ik(hip, ank, A_, B_, pole);
      return {knee, ank: ank2, toe: ank2.clone().addScaledVector(fwd, 0.11)};
    };
    const fR = foot(1), fL = foot(-1);
    // arms
    const arm = (side, sgn) => {
      const sh = shC.clone().addScaledVector(right, sgn * 0.04);
      let rx = T['h' + side + 'x'].val(t), ry = T['h' + side + 'y'].val(t), rz = T['h' + side + 'z'].val(t);
      rx += (sgn > 0 ? -1 : 1) * 0.10 * g.w * Math.sin(ph);
      let hand = sh.clone().addScaledVector(fwd, rx).addScaledVector(right, sgn * rz); hand.y += ry;
      if (side === 'R') { const hw = T.hw.val(t); if (hw > 0) hand.lerp(new V3(T.hwx.val(t), T.hwy.val(t), T.hwz.val(t)), hw); }
      const pole = fwd.clone().multiplyScalar(-0.4).addScaledVector(right, sgn * 1).add(new V3(0, -0.35, 0));
      const [elb, h2] = ik(sh, hand, UA, FA, pole);
      return {sh, elb, hand: h2};
    };
    const aR = arm('R', 1), aL = arm('L', -1);
    return {x, z, yaw, sit, hip, neck, shC, hc, hyaw, hpitch, fR, fL, aR, aL, fwd, right, spineDir, lean};
  }

  // ============================================================ per-frame update
  function setFace(t) {
    const sm_ = T.f_smile.val(t), wr = T.f_worry.val(t), lf = T.f_lift.val(t), eye = T.f_eye.val(t);
    eyes.forEach((e, i) => { const az = (i ? 1 : -1) * 0.33; e.position.copy(sph(0.17, -az * -1 * 1, HR * 1.0)); e.position.copy(sph(0.17, (i ? 0.34 : -0.34))); e.scale.set(1, Math.max(0.12, eye), 1); });
    if (mouth) { head.remove(mouth); mouth.geometry.dispose(); }
    const pts = []; for (let k = -4; k <= 4; k++) { const u = k / 4; pts.push(sph(-0.40 - 0.12 * sm_ * (1 - u * u) + 0.03 * Math.abs(sm_) * 0, u * 0.30, HR * 1.01)); }
    mouth = tubeFrom(pts, 0.0065, blk, 16); head.add(mouth);
    for (let i = 0; i < 2; i++) {
      if (brows[i]) { head.remove(brows[i]); brows[i].geometry.dispose(); }
      const sg = i ? 1 : -1, bp = [];
      for (let k = 0; k <= 2; k++) { const u = k / 2; const inner = i ? (1 - u) : u; // inner end at u=1 for left (-)
        const innerness = i ? (1 - u) : u; bp.push(sph(0.50 + 0.08 * lf + 0.14 * wr * (i ? 1 - u : u) * 0 + 0.13 * wr * (i ? (1 - u) : u) * 0 + 0.14 * wr * innerness, sg * (0.52 - 0.30 * (i ? 1 - u : u) * 0 - 0.28 * innerness) , HR * 1.01)); }
      brows[i] = tubeFrom(bp, 0.0065, blk, 8); head.add(brows[i]);
    }
  }
  const neckAt = t => { const r = rigAt(t); return r.neck.clone().addScaledVector(r.spineDir, 0.0); };

  function update(t) {
    const r = rigAt(t);
    // body
    place(limbs.spine, r.hip, r.neck, LIMB_R);
    place(limbs.thighL, r.hip, r.fL.knee, LIMB_R); place(limbs.shinL, r.fL.knee, r.fL.ank, LIMB_R); place(limbs.footL, r.fL.ank, r.fL.toe, LIMB_R);
    place(limbs.thighR, r.hip, r.fR.knee, LIMB_R); place(limbs.shinR, r.fR.knee, r.fR.ank, LIMB_R); place(limbs.footR, r.fR.ank, r.fR.toe, LIMB_R);
    place(limbs.uaL, r.aL.sh, r.aL.elb, LIMB_R); place(limbs.faL, r.aL.elb, r.aL.hand, LIMB_R);
    place(limbs.uaR, r.aR.sh, r.aR.elb, LIMB_R); place(limbs.faR, r.aR.elb, r.aR.hand, LIMB_R);
    const jp = [r.hip, r.neck, r.fL.knee, r.fR.knee, r.fL.ank, r.fR.ank, r.aL.elb, r.aR.elb, r.aL.hand, r.aR.hand];
    joints.forEach((j, i) => j.position.copy(jp[i]));
    head.position.copy(r.hc); head.rotation.set(0, r.hyaw, r.hpitch, 'YZX');
    setFace(t);
    // scarf
    scarfRing.position.copy(r.neck); scarfRing.quaternion.setFromUnitVectors(new V3(0, 0, 1), r.spineDir);
    scarfRing.scale.set(1, 1, 1);
    const tp = [];
    for (let i = 0; i < 7; i++) {
      const tt = Math.max(0, t - i * 0.035), rr = rigAt(tt);
      const back = rr.fwd.clone().multiplyScalar(-(0.05 + i * 0.028)), sway = Math.sin(t * 3 + i * 0.9) * 0.02 * (i / 6 + 0.3);
      tp.push(rr.neck.clone().add(back).add(new V3(0, -0.03 - i * 0.055, 0)).addScaledVector(rr.right, sway + 0.015 * Math.sin(i * 1.3 + t * 2)));
    }
    if (scarfTail) { sam.remove(scarfTail); scarfTail.geometry.dispose(); }
    scarfTail = tubeFrom(tp, 0.028, orMat, 20); sam.add(scarfTail);
    // remote
    const att = T.attach.val(t);
    if (att > 0.5) { remote.position.copy(r.aR.hand).add(new V3(0, 0.0, 0)); remote.rotation.set(0, r.yaw + 1.2, 0.3); }
    else { remote.position.copy(REMOTE_HOME); remote.rotation.set(0, REMOTE_YAW, 0); }
    // cloud
    const cl = T.cloud.val(t); cloud.visible = cl > 0.01; cloud.scale.setScalar(Math.max(cl, 1e-3) * 0.8 * (1 + 0.03 * Math.sin(t * 2)));
    cloud.position.copy(r.hc).add(new V3(0, 0.55 + 0.04 * Math.sin(t * 1.6), 0));
    // diagram
    const dg = T.diag.val(t); diagram.visible = dg > 0.01;
    const pop = dg < 1 ? 1 + 0.15 * Math.sin(dg * Math.PI) : 1;
    diagram.scale.setScalar(Math.max(dg, 1e-3) * pop); const ap = anchors.diagram; diagram.position.set(ap[0], ap[1] + 0.04 * Math.sin(t * 1.5), ap[2]);
    bulbRays.quaternion.copy(camera.quaternion); bulbRays.scale.setScalar(1 + 0.2 * Math.sin(t * 8));
    // alarms
    for (const id in alarmFx) {
      const f = alarmFx[id], I = T['alarm_' + id].val(t);
      f.rays.visible = I > 0.02; f.rays.scale.setScalar(I * (1 + 0.28 * Math.sin(t * 9 + (id === 'box' ? 1 : 0))));
      f.rays.quaternion.copy(camera.quaternion);
      const shake = I * Math.sin(t * 34);
      if (id === 'mug') { f.obj.rotation.z = shake * 0.07; f.obj.position.copy(f.base); }
      if (id === 'phone') { f.obj.position.set(f.base.x + shake * 0.012, f.base.y, f.base.z + Math.cos(t * 41) * I * 0.01); }
      if (id === 'box') { f.obj.position.y = f.base.y + I * 0.04 * Math.abs(Math.sin(t * 6)); f.obj.rotation.y = shake * 0.03; }
    }
    // camera
    const k = camKeys; let i = 0; while (i < k.length - 2 && k[i + 1].t <= t) i++;
    const k0 = k[Math.max(0, i - 1)], k1 = k[i], k2 = k[Math.min(k.length - 1, i + 1)], k3 = k[Math.min(k.length - 1, i + 2)];
    const u = clamp((t - k1.t) / Math.max(1e-6, k2.t - k1.t), 0, 1);
    const cr = (a, b, c, d, u) => 0.5 * ((2 * b) + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u * u + (-a + 3 * b - 3 * c + d) * u * u * u);
    const cv = (key) => [0, 1, 2].map(j => cr(k0[key][j], k1[key][j], k2[key][j], k3[key][j], u));
    const pos = cv('pos'), lk = cv('look'); camera.fov = cr(k0.fov, k1.fov, k2.fov, k3.fov, u);
    camera.position.set(...pos); camera.lookAt(new V3(...lk)); camera.updateProjectionMatrix(); camera.updateMatrixWorld(true);
    // billboard orientation needs camera quaternion after lookAt: redo
    for (const id in alarmFx) alarmFx[id].rays.quaternion.copy(camera.quaternion);
    bulbRays.quaternion.copy(camera.quaternion).premultiply(diagram.quaternion.clone().invert());
  }

  // ============================================================ collision check
  let obstacles = null;
  let MARGIN = 0;
  const depthIn = (pt) => {  // returns [maxDepth, id] over obstacles
    let best = 0, id = null;
    for (const o of obstacles) {
      const q = pt.clone().applyMatrix4(o.inv), b = o.ob; let d;
      if (b.k === 'b') d = Math.min(b.h[0] - Math.abs(q.x), b.h[1] - Math.abs(q.y), b.h[2] - Math.abs(q.z));
      else d = Math.min(b.r - Math.hypot(q.x, q.z), b.hh - Math.abs(q.y));
      d += MARGIN;
      if (d > best) { best = d; id = o.pid; }
    }
    return [best, id];
  };
  function collide(t, margin = 0) {
    MARGIN = margin;
    if (!obstacles) { scene.updateMatrixWorld(true); obstacles = []; scene.traverse(m => { if (m.userData.ob) obstacles.push({ob: m.userData.ob, pid: m.userData.pid, inv: m.matrixWorld.clone().invert()}); }); }
    const r = rigAt(t), out = [];
    const seg = (name, a, b) => { for (let i = 0; i <= 6; i++) { const p = a.clone().lerp(b, i / 6), [d, id] = depthIn(p); if (d > 0.025) out.push({part: name, obstacle: id, depth: d}); if (p.y < -0.02) out.push({part: name, obstacle: 'floor', depth: -p.y}); } };
    seg('spine', r.hip, r.neck); seg('thighL', r.hip, r.fL.knee); seg('shinL', r.fL.knee, r.fL.ank); seg('footL', r.fL.ank, r.fL.toe);
    seg('thighR', r.hip, r.fR.knee); seg('shinR', r.fR.knee, r.fR.ank); seg('footR', r.fR.ank, r.fR.toe);
    seg('uaL', r.aL.sh, r.aL.elb); seg('faL', r.aL.elb, r.aL.hand); seg('uaR', r.aR.sh, r.aR.elb); seg('faR', r.aR.elb, r.aR.hand);
    for (const dv of [[0, 0, 0], [HR, 0, 0], [-HR, 0, 0], [0, HR, 0], [0, 0, HR], [0, 0, -HR]]) { const p = r.hc.clone().add(new V3(...dv)), [d, id] = depthIn(p); if (d > 0.025) out.push({part: 'head', obstacle: id, depth: d}); }
    return out;
  }

  // ============================================================ post pass
  const quadScene = new THREE.Scene(), quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quadMat = new THREE.ShaderMaterial({
    uniforms: {tex: {value: rt.texture}, time: {value: 0}},
    vertexShader: 'varying vec2 vUv; void main(){vUv=uv; gl_Position=vec4(position.xy,0.,1.);}',
    fragmentShader: `uniform sampler2D tex; uniform float time; varying vec2 vUv;
      float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
      void main(){ float tt=floor(time*8.); vec2 d=vec2(n(vUv*28.+tt*1.7),n(vUv*28.+7.3+tt*2.3))-.5;
        vec4 c=texture2D(tex,vUv+d*0.0032); c.rgb+=(h(vUv*vec2(1280.,720.)+tt)-.5)*0.012; gl_FragColor=vec4(c.rgb,1.);
        #include <colorspace_fragment>
      }`
  });
  quadScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), quadMat));

  function renderAt(t) {
    update(t);
    renderer.setRenderTarget(rt); renderer.clear(); renderer.render(scene, camera);
    renderer.setRenderTarget(null); quadMat.uniforms.time.value = t; renderer.render(quadScene, quadCam);
  }
  return {renderAt, collide, duration: data.meta.duration, fps: data.meta.fps};
}
