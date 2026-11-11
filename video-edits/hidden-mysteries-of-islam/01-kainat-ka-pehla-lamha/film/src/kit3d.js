// 3D building blocks (three.js). Everything is driven by explicit time parameters -> deterministic.
import { THREE, texture, glow, glowTexture, starfield, rng, clamp, lerp } from './engine.js';

// ---- Milky Way sky dome (ESO/S. Brunier panorama, equirectangular) ----
export function skydome(o = {}) {
  const tex = texture(o.url || '/gfx/tex/milkyway_4k.jpg');
  const m = new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, depthWrite: false, color: new THREE.Color(o.tint ?? 0xffffff).multiplyScalar(o.gain ?? 1), toneMapped: false, transparent: true, opacity: o.opacity ?? 1 });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(o.radius || 1500, 64, 40), m);
  mesh.rotation.set(o.rx ?? 1.05, o.ry ?? 0, o.rz ?? 0.3); mesh.renderOrder = -10;
  return mesh;
}

// ---- Earth ----
export function earth(o = {}) {
  const g = new THREE.Group();
  const day = texture(o.day || '/gfx/tex/earth_day_4k.jpg'), night = texture(o.night || '/gfx/tex/earth_night_4k.jpg');
  const mat = new THREE.ShaderMaterial({
    uniforms: { dayT: { value: day }, nightT: { value: night }, sun: { value: new THREE.Vector3(1, 0.35, 0.6).normalize() }, nightGain: { value: o.nightGain ?? 1.6 } },
    vertexShader: `varying vec2 vUv; varying vec3 vN; varying vec3 vP; void main(){ vUv = uv; vN = normalize(mat3(modelMatrix) * normal); vec4 wp = modelMatrix * vec4(position,1.0); vP = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragmentShader: `uniform sampler2D dayT, nightT; uniform vec3 sun; uniform float nightGain; varying vec2 vUv; varying vec3 vN; varying vec3 vP;
      void main(){ vec3 n = normalize(vN); float d = dot(n, normalize(sun)); float k = smoothstep(-0.18, 0.28, d);
        vec3 dc = texture2D(dayT, vUv).rgb; vec3 nc = texture2D(nightT, vUv).rgb;
        vec3 col = dc * (0.04 + 1.12 * max(d, 0.0)) * k + nc * nightGain * (1.0 - k) + dc * 0.025;
        vec3 v = normalize(cameraPosition - vP); float fr = pow(1.0 - max(dot(n, v), 0.0), 3.0);
        col += vec3(0.25, 0.55, 1.0) * fr * (0.25 + 0.75 * k) * 0.9;
        gl_FragColor = vec4(col, 1.0); }`,
  });
  const globe = new THREE.Mesh(new THREE.SphereGeometry(1, 128, 96), mat); g.add(globe);
  const atm = new THREE.Mesh(new THREE.SphereGeometry(1.045, 96, 64), new THREE.ShaderMaterial({
    uniforms: { sun: mat.uniforms.sun }, transparent: true, side: THREE.BackSide, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `varying vec3 vN; varying vec3 vP; void main(){ vN = normalize(mat3(modelMatrix) * normal); vec4 wp = modelMatrix * vec4(position,1.0); vP = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragmentShader: `uniform vec3 sun; varying vec3 vN; varying vec3 vP; void main(){ vec3 v = normalize(cameraPosition - vP); float rim = pow(clamp(0.72 + dot(normalize(vN), v), 0.0, 1.0), 5.0); float lit = 0.35 + 0.65 * smoothstep(-0.3, 0.5, dot(normalize(-vN), normalize(sun)) * -1.0);
      gl_FragColor = vec4(vec3(0.3, 0.6, 1.0) * rim * 1.6 * lit, rim); }`,
  }));
  g.add(atm);
  g.userData = { globe, mat, sun: mat.uniforms.sun.value };
  return g;
}
// unit vector for lat/lon on the globe mesh (three SphereGeometry uv convention)
export function latLon(lat, lon, r = 1) {
  const phi = (90 - lat) * Math.PI / 180, theta = (lon + 180) * Math.PI / 180;
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
}
// location marker: glowing dot + pulsing ring, as a child of the globe group
export function pin(color = 0x6fd8ff, size = 0.05) {
  const g = new THREE.Group();
  const dot = glow(color, size * 2.2, 1, 0.25, 2.0); g.add(dot);
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.92, 1.0, 64), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
  g.add(ring); g.userData = { ring, dot, size };
  g.userData.update = (t) => { const k = (t * 0.9) % 1; ring.scale.setScalar(size * (0.6 + 3.2 * k)); ring.material.opacity = 0.9 * (1 - k); };
  return g;
}

// ---- procedural galaxy sprite atlas ----
let _gal = null;
function galaxyTextures() {
  if (_gal) return _gal; _gal = [];
  const R = rng(77);
  for (let v = 0; v < 8; v++) {
    const S = 256, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d');
    x.globalCompositeOperation = 'lighter';
    const arms = v % 4 === 3 ? 0 : 2 + (v % 2), tight = 0.28 + R() * 0.25, hueCore = [255, 232, 190], hueArm = v % 3 === 0 ? [150, 190, 255] : v % 3 === 1 ? [200, 215, 255] : [255, 210, 190];
    const g0 = x.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S * 0.5); g0.addColorStop(0, 'rgba(255,255,255,0.36)'); g0.addColorStop(0.35, 'rgba(180,200,255,0.13)'); g0.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g0; x.fillRect(0, 0, S, S);
    if (arms) for (let i = 0; i < 2600; i++) {
      const a = Math.floor(R() * arms), t = Math.pow(R(), 0.7) * 4.2, r = 6 + 26 * Math.exp(tight * t) * 0.42, th = t + a * (Math.PI * 2 / arms) + (R() - 0.5) * 0.55, rr = r + (R() - 0.5) * 9;
      if (rr > S * 0.47) continue;
      const px = S / 2 + Math.cos(th) * rr, py = S / 2 + Math.sin(th) * rr, s = 0.7 + R() * 1.9, al = 0.10 + R() * 0.26;
      x.fillStyle = `rgba(${hueArm[0]},${hueArm[1]},${hueArm[2]},${al})`; x.beginPath(); x.arc(px, py, s, 0, 6.283); x.fill();
    } else for (let i = 0; i < 1500; i++) { const r = Math.pow(R(), 1.8) * S * 0.42, th = R() * 6.283; x.fillStyle = `rgba(255,225,190,${0.04 + R() * 0.08})`; x.beginPath(); x.arc(S / 2 + Math.cos(th) * r, S / 2 + Math.sin(th) * r * 0.75, 0.8 + R() * 1.4, 0, 6.283); x.fill(); }
    const g1 = x.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S * 0.16); g1.addColorStop(0, `rgba(${hueCore[0]},${hueCore[1]},${hueCore[2]},0.95)`); g1.addColorStop(0.4, `rgba(${hueCore[0]},${hueCore[1]},${hueCore[2]},0.35)`); g1.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g1; x.fillRect(0, 0, S, S);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; _gal.push(t);
  }
  return _gal;
}
// field of galaxies; call .userData.update({scale, redshift, time}) each frame.  positions = base * scale (Hubble flow)
export function galaxyField(o = {}) {
  const N = o.count || 260, R = rng(o.seed || 5), texs = galaxyTextures(), g = new THREE.Group(), items = [];
  const rad = o.radius || 60;
  for (let i = 0; i < N; i++) {
    const u = R() * 2 - 1, th = R() * 6.283, r = rad * Math.cbrt(R()) * (o.minR ? Math.max(o.minR / rad, 1) : 1), q = Math.sqrt(1 - u * u);
    const base = new THREE.Vector3(r * q * Math.cos(th), r * u * (o.flat ?? 1), r * q * Math.sin(th));
    const m = new THREE.SpriteMaterial({ map: texs[Math.floor(R() * texs.length)], transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, rotation: R() * 6.283, color: 0xffffff, opacity: 0.75 + 0.25 * R() });
    const sp = new THREE.Sprite(m); const s = (o.size || 3) * (0.5 + 1.6 * Math.pow(R(), 2)); const tilt = 0.35 + 0.65 * R();
    sp.scale.set(s, s * tilt, 1); sp.position.copy(base); g.add(sp); items.push({ sp, base, s, tilt, dist: base.length(), op: m.opacity });
  }
  const white = new THREE.Color(1, 1, 1), red = new THREE.Color(1.0, 0.32, 0.18);
  g.userData.items = items;
  g.userData.update = ({ scale = 1, redshift = 0, sizeK = 1, opacity = 1 }) => {
    for (const it of items) {
      it.sp.position.copy(it.base).multiplyScalar(scale);
      const z = clamp(redshift * (it.dist / rad));
      it.sp.material.color.copy(white).lerp(red, z);
      it.sp.material.opacity = it.op * opacity;
      it.sp.scale.set(it.s * sizeK, it.s * it.tilt * sizeK, 1);
    }
  };
  return g;
}

// ---- hot dense "fireball" (early universe): animated noise sphere + glows ----
export function fireball(o = {}) {
  const g = new THREE.Group();
  const mat = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, heat: { value: 1 }, colA: { value: new THREE.Color(o.colA ?? 0xfff2c0) }, colB: { value: new THREE.Color(o.colB ?? 0xff5a10) }, colC: { value: new THREE.Color(o.colC ?? 0x5a0a00) } },
    vertexShader: `varying vec3 vP; varying vec3 vN; void main(){ vP = position; vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform float time, heat; uniform vec3 colA, colB, colC; varying vec3 vP; varying vec3 vN;
      float h(vec3 p){ return fract(sin(dot(p, vec3(127.1,311.7,74.7))) * 43758.5453); }
      float n(vec3 p){ vec3 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
        return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x), mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x), f.y), mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x), mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x), f.y), f.z); }
      float fbm(vec3 p){ float a = 0.5, s = 0.0; for(int i=0;i<4;i++){ s += a*n(p); p = p*2.03 + 11.7; a *= 0.5; } return s; }
      void main(){ vec3 p = normalize(vP) * 2.4; float f = fbm(p + vec3(0.0, time*0.25, time*0.18) + fbm(p*1.7 - time*0.2)*1.4);
        float rim = pow(1.0 - abs(vN.z), 1.5); vec3 col = mix(colC, colB, smoothstep(0.25, 0.6, f)); col = mix(col, colA, smoothstep(0.55, 0.85, f));
        col *= (0.75 + 1.3 * heat) * (1.0 - 0.55 * rim); gl_FragColor = vec4(col, 1.0); }`,
  });
  const ball = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 64), mat); g.add(ball);
  const g1 = glow(o.glow ?? 0xff8a30, 5.2, 0.55, 0.1, 1.6), g2 = glow(0xffe0a0, 2.9, 0.5, 0.2, 2.2); g.add(g1, g2);
  g.userData = { mat, ball, g1, g2, update: (t, heat = 1) => { mat.uniforms.time.value = t; mat.uniforms.heat.value = heat; } };
  return g;
}

// ---- space-time grid (flat plane of lines, optionally dented by a mass) ----
export function gridPlane(o = {}) {
  const n = o.n || 40, size = o.size || 40, seg = o.seg || 80, pos = [];
  const zf = o.well ? ((x, z) => -o.well / (1 + (x * x + z * z) / (o.wr || 6))) : (() => 0);
  for (let i = 0; i <= n; i++) {
    const a = -size / 2 + size * i / n;
    for (let j = 0; j < seg; j++) {
      const b0 = -size / 2 + size * j / seg, b1 = -size / 2 + size * (j + 1) / seg;
      pos.push(a, zf(a, b0), b0, a, zf(a, b1), b1); pos.push(b0, zf(b0, a), a, b1, zf(b1, a), a);
    }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  return new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: o.color ?? 0x6fd8ff, transparent: true, opacity: o.opacity ?? 0.35, blending: THREE.AdditiveBlending, depthWrite: false }));
}

// ---- sphere textured with an equirect map (CMB etc.) ----
export function mapSphere(url, o = {}) {
  const m = new THREE.MeshBasicMaterial({ map: texture(url), side: o.inside ? THREE.BackSide : THREE.FrontSide, toneMapped: false, transparent: true, opacity: o.opacity ?? 1 });
  return new THREE.Mesh(new THREE.SphereGeometry(o.radius || 1, 96, 64), m);
}

// ---- image billboard (additive, for real galaxy photos on black) ----
export function billboard(url, w, h, o = {}) {
  const m = new THREE.MeshBasicMaterial({ map: texture(url), transparent: true, depthWrite: false, blending: o.normal ? THREE.NormalBlending : THREE.AdditiveBlending, toneMapped: false, opacity: o.opacity ?? 1, side: THREE.DoubleSide });
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
}

// standard space backdrop for a stage3d scene: skydome + two star layers. returns {dome, s1, s2, update(t)}
export function spaceBackdrop(st, o = {}) {
  const dome = skydome({ gain: (o.gain ?? 0.55) * 1.7, tint: o.tint ?? 0xffffff, rx: o.rx, ry: o.ry, rz: o.rz }); st.scene.add(dome);
  const s1 = starfield({ count: o.count ?? 5000, radius: 900, seed: o.seed ?? 11, px: o.px ?? 3.0, shell: true }); st.scene.add(s1);
  const s2 = starfield({ count: 900, radius: 700, seed: (o.seed ?? 11) + 7, px: (o.px ?? 3.0) * 1.9, shell: true }); st.scene.add(s2);
  return { dome, s1, s2, update(t, drift = 0.004) { dome.rotation.y = (o.ry ?? 0) + t * drift; s1.rotation.y = t * drift * 1.4; s2.rotation.y = t * drift * 1.9; s1.material.uniforms.time.value = t; s2.material.uniforms.time.value = t * 1.3; } };
}
export { glow, starfield, glowTexture };
