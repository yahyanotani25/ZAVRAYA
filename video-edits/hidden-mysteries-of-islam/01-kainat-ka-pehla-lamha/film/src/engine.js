// Deterministic film engine: every frame is a pure function of time.
// seek(t) -> activates scenes, seeks their GSAP timelines, runs procedural updates, awaits asset decodes.
import * as THREE from '/node_modules/three/build/three.module.js';
import { gsap } from '/node_modules/gsap/index.js';
import { CustomEase } from '/node_modules/gsap/CustomEase.js';
import { DrawSVGPlugin } from '/node_modules/gsap/DrawSVGPlugin.js';
import { SplitText } from '/node_modules/gsap/SplitText.js';
import { ScrambleTextPlugin } from '/node_modules/gsap/ScrambleTextPlugin.js';
import { MotionPathPlugin } from '/node_modules/gsap/MotionPathPlugin.js';

gsap.registerPlugin(CustomEase, DrawSVGPlugin, SplitText, ScrambleTextPlugin, MotionPathPlugin);
gsap.defaults({ lazy: false, overwrite: false, ease: 'power3.out' });
gsap.config({ force3D: false, nullTargetWarn: false });
gsap.ticker.lagSmoothing(0);

export { THREE, gsap, SplitText, CustomEase };
export const W = 1920, H = 1080, FPS = 30;
export const film = { scenes: [], sfx: [], t: 0, pending: [], cues: null, dur: 0 };

// ---------- utils ----------
export function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
export const remap = (x, a, b, c, d) => c + (d - c) * clamp((x - a) / (b - a));
export const ease = { out3: t => 1 - Math.pow(1 - t, 3), in3: t => t * t * t, io3: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2, out5: t => 1 - Math.pow(1 - t, 5), outBack: t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); }, outExpo: t => t >= 1 ? 1 : 1 - Math.pow(2, -10 * t) };
// smooth value noise 1D (deterministic) for camera drift / shake
export function noise1(x, seed = 0) { const i = Math.floor(x), f = x - i; const h = n => { const s = Math.sin((n + seed * 57.13) * 127.1) * 43758.5453; return s - Math.floor(s); }; const u = f * f * (3 - 2 * f); return lerp(h(i), h(i + 1), u) * 2 - 1; }

export function el(tag, cls, style, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (style) Object.assign(e.style, style);
  if (html != null) e.innerHTML = html;
  return e;
}
export function track(p) { film.pending.push(p.catch(e => console.log('asset error: ' + (e && e.message || e)))); return p; }
const imgCache = new Map();
export function image(src, style, cls) {
  const im = new Image(); im.decoding = 'sync'; im.src = src; if (cls) im.className = cls; if (style) Object.assign(im.style, style);
  track(im.decode ? im.decode() : new Promise(r => { im.onload = r; im.onerror = r; }));
  return im;
}

// ---------- scenes ----------
const stage = () => document.getElementById('scenes');
export function defScene(id, t0, t1, build, o = {}) {
  const s = {
    id, t0, t1, z: o.z || 0, fin: o.fin ?? 0, fout: o.fout ?? 0, build, built: false, shown: false, updates: [], o,
    el: el('div', 'scene ' + (o.cls || ''), { zIndex: String(o.z || 0) }), tl: gsap.timeline({ paused: true }),
    add(child) { this.el.appendChild(child); return child; },
    div(cls, style, html) { return this.add(el('div', cls, style, html)); },
    onUpdate(fn) { this.updates.push(fn); },
    sfx(name, lt, opts = {}) { film.sfx.push({ name, t: +(this.t0 + lt).toFixed(3), ...opts }); },
    L(t) { return t - this.t0; },   // absolute film time -> local time
  };
  s.el.id = 'sc-' + id; s.el.style.display = 'none';
  film.scenes.push(s); film.dur = Math.max(film.dur, t1);
  return s;
}
function ensureBuilt(s) {
  if (s.built) return;
  stage().appendChild(s.el);
  s.el.style.display = 'block'; s.shown = true;
  s.build(s);
  s.built = true;
}
function runScene(s, t) {
  const lt = t - s.t0;
  s.tl.time(Math.max(0, lt), false);
  let op = 1;
  if (s.fin > 0) op *= clamp(lt / s.fin);
  if (s.fout > 0) op *= clamp((s.t1 - t) / s.fout);
  s.el.style.opacity = op.toFixed(4);
  for (const fn of s.updates) fn(lt, s);
}
export async function seek(t) {
  film.t = t;
  const active = [];
  for (const s of film.scenes) {
    if (t >= s.t0 && t < s.t1) {
      ensureBuilt(s);
      if (!s.shown) { s.el.style.display = 'block'; s.shown = true; }
      active.push(s);
    } else if (s.shown) { s.el.style.display = 'none'; s.shown = false; }
  }
  for (const s of active) runScene(s, t);
  for (let guard = 0; guard < 6; guard++) {
    void document.body.offsetHeight;
    if (document.fonts.status !== 'loaded') film.pending.push(document.fonts.ready);
    if (!film.pending.length) break;
    const p = film.pending.splice(0); await Promise.all(p);
    for (const s of active) runScene(s, t);
  }
  return active.map(s => s.id);
}
// build every scene once to collect SFX cues etc. (used by the cue exporter)
export function buildAll() { for (const s of film.scenes) ensureBuilt(s); return film.sfx; }

// ---------- 3D: one shared WebGL renderer, copied into per-scene 2D canvases ----------
let _renderer = null;
export function renderer() {
  if (_renderer) return _renderer;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  _renderer = new THREE.WebGLRenderer({ canvas: c, antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  _renderer.setPixelRatio(1); _renderer.setSize(W, H, false);
  _renderer.outputColorSpace = THREE.SRGBColorSpace;
  _renderer.toneMapping = THREE.ACESFilmicToneMapping; _renderer.toneMappingExposure = 1.0;
  return _renderer;
}
// stage3d(scene, {fov, bg}) -> {scene, camera, canvas, frame(fn)}
export function stage3d(s, o = {}) {
  const canvas = el('canvas', 'gl', o.style || null); canvas.width = W; canvas.height = H;
  s.add(canvas);
  const ctx = canvas.getContext('2d');
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(o.fov || 45, W / H, o.near || 0.05, o.far || 4000);
  camera.position.set(0, 0, 10);
  const st = { scene, camera, canvas, ctx, frame: null, bg: o.bg ?? null, exposure: o.exposure ?? 1, tone: o.tone ?? THREE.ACESFilmicToneMapping };
  s.onUpdate((lt) => {
    if (st.frame) st.frame(lt);
    const r = renderer();
    r.toneMapping = st.tone; r.toneMappingExposure = st.exposure;
    if (st.bg == null) r.setClearColor(0x000000, 0); else r.setClearColor(st.bg, 1);
    r.render(scene, camera);
    ctx.clearRect(0, 0, W, H); ctx.drawImage(r.domElement, 0, 0);
  });
  return st;
}
const texLoader = new THREE.TextureLoader();
export function texture(url, o = {}) {
  let done; const p = new Promise((res) => { done = res; });
  const tex = texLoader.load(url, () => done(), undefined, () => { console.log('asset error: texture ' + url); done(); });
  track(p);                                   // seek() waits until THIS texture's image is ready
  tex.colorSpace = o.linear ? THREE.NoColorSpace : THREE.SRGBColorSpace;
  if (o.repeat) { tex.wrapS = tex.wrapT = THREE.RepeatWrapping; }
  tex.anisotropy = 8;
  return tex;
}
// canvas-generated soft glow texture
const glowCache = new Map();
export function glowTexture(inner = 0.0, power = 2.2, size = 256) {
  const key = inner + '_' + power + '_' + size; if (glowCache.has(key)) return glowCache.get(key);
  const c = document.createElement('canvas'); c.width = c.height = size; const x = c.getContext('2d');
  const id = x.createImageData(size, size);
  for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) {
    const dx = (i + .5) / size * 2 - 1, dy = (j + .5) / size * 2 - 1; const r = Math.sqrt(dx * dx + dy * dy);
    let a = r < inner ? 1 : Math.pow(clamp(1 - (r - inner) / (1 - inner)), power);
    const k = (j * size + i) * 4; id.data[k] = id.data[k + 1] = id.data[k + 2] = 255; id.data[k + 3] = Math.round(a * 255);
  }
  x.putImageData(id, 0, 0);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; glowCache.set(key, t); return t;
}
export function glow(color = 0xffffff, size = 1, opacity = 1, inner = 0, power = 2.2) {
  const m = new THREE.SpriteMaterial({ map: glowTexture(inner, power), color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false });
  const sp = new THREE.Sprite(m); sp.scale.set(size, size, 1); return sp;
}
// star points with per-star size / colour / twinkle
export function starfield(o = {}) {
  const N = o.count || 6000, R = o.radius || 400, rnd = rng(o.seed || 1);
  const pos = new Float32Array(N * 3), col = new Float32Array(N * 3), siz = new Float32Array(N), ph = new Float32Array(N);
  const tints = [[1, 1, 1], [0.8, 0.88, 1], [1, 0.92, 0.8], [1, 0.82, 0.7], [0.75, 0.82, 1]];
  for (let i = 0; i < N; i++) {
    let x, y, z;
    if (o.box) { x = (rnd() - .5) * o.box[0]; y = (rnd() - .5) * o.box[1]; z = (rnd() - .5) * o.box[2]; }
    else { const u = rnd() * 2 - 1, th = rnd() * Math.PI * 2, r = R * (o.shell ? 1 : Math.cbrt(rnd())); const q = Math.sqrt(1 - u * u); x = r * q * Math.cos(th); y = r * u; z = r * q * Math.sin(th); }
    pos.set([x, y, z], i * 3);
    const tcol = tints[Math.floor(rnd() * tints.length)]; const b = 0.35 + 0.65 * Math.pow(rnd(), 2.2);
    col.set([tcol[0] * b, tcol[1] * b, tcol[2] * b], i * 3);
    siz[i] = (o.size || 1) * (0.5 + 2.6 * Math.pow(rnd(), 5)); ph[i] = rnd() * 6.283;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setAttribute('size', new THREE.BufferAttribute(siz, 1)); g.setAttribute('phase', new THREE.BufferAttribute(ph, 1));
  const m = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, scale: { value: o.px || 2.2 }, opacity: { value: o.opacity ?? 1 }, atten: { value: o.atten ? 1 : 0 }, redshift: { value: 0 } },
    vertexShader: `attribute float size; attribute float phase; attribute vec3 color; varying vec3 vC; varying float vT; uniform float time, scale, atten, redshift;
      void main(){ vC = mix(color, vec3(1.0, 0.25, 0.12) * dot(color, vec3(0.5)), redshift); vT = 0.75 + 0.25 * sin(time * 1.7 + phase);
        vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv;
        float a = mix(1.0, 300.0 / max(1.0, -mv.z), atten); gl_PointSize = max(1.6, size * scale * a); }`,
    fragmentShader: `varying vec3 vC; varying float vT; uniform float opacity; void main(){ vec2 d = gl_PointCoord - 0.5; float r = length(d) * 2.0; float a = pow(clamp(1.0 - r, 0.0, 1.0), 1.25); gl_FragColor = vec4(vC * vT * 1.7, a * opacity); }`,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const p = new THREE.Points(g, m); p.frustumCulled = false; return p;
}

// ---------- boot ----------
export async function boot(register) {
  try { film.cues = await (await fetch('/cues.json')).json(); } catch (e) { film.cues = { s: {}, a: {} }; }
  await register();
  film.scenes.sort((a, b) => a.t0 - b.t0);
  // warm all fonts used (latin + arabic) so the first frames are stable
  const warm = el('div', null, { position: 'absolute', left: '-9999px', top: '0', opacity: '0' });
  const fams = ['Bebas Neue', 'Oswald', 'Montserrat', 'Cinzel', 'Playfair Display', 'Space Mono', 'Amiri Quran', 'Amiri', 'Reem Kufi', 'Aref Ruqaa', 'Anton', 'Archivo Black', 'Cormorant Garamond', 'Noto Naskh Arabic', 'Scheherazade New'];
  for (const f of fams) for (const w of [400, 500, 600, 700, 800, 900]) for (const it of ['normal', 'italic'])
    warm.appendChild(el('span', null, { fontFamily: `'${f}'`, fontWeight: w, fontStyle: it }, 'Aa 0123 — é “ ” ’ … ﷺ وَإِنَّا لَمُوسِعُونَ'));
  document.body.appendChild(warm); void warm.offsetHeight;
  await document.fonts.ready;
  window.film = film; window.seek = seek; window.buildAll = buildAll; window.ready = true;
}
// cue helpers: T('12') start of spoken sentence 12, T('12e') its end, T('12', 0.5) half-way; A('name') named anchor
export function T(id, frac) {
  const c = film.cues && film.cues.s && film.cues.s[String(id).replace(/e$/, '')];
  if (!c) { console.log('missing cue ' + id); return 0; }
  if (String(id).endsWith('e')) return c[1];
  return frac == null ? c[0] : lerp(c[0], c[1], frac);
}
// time at which the n-th word (0-based) of sentence id starts
export function TW(id, n) { const c = film.cues && film.cues.w && film.cues.w[String(id)]; if (!c || !c.length) return T(id); return c[Math.min(n, c.length - 1)][0]; }
