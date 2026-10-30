/**
 * mockupGeometry.js: geometry for the 3D wrap preview (units = inches, Y = up).
 *
 * The device is a rounded-rectangle block (W wide, T thick, H tall).
 * The sticker is a strip that wraps once around it. The sticker's horizontal
 * centre (where the notch sits) lands on the middle of the FRONT face (+Z),
 * so the notch shows where the device's arch is.
 */
import * as THREE from "three";

const clampR = (W, T, R) => Math.max(0, Math.min(R, W / 2 - 0.001, T / 2 - 0.001));

/** Length of the wrap path (one trip around the device). */
export function wrapLength(W, T, R) {
  const r = clampR(W, T, R);
  return 2 * W + 2 * T - (8 - 2 * Math.PI) * r;
}

/**
 * Walkable outline. s = 0 is the centre of the front face, increasing s goes
 * toward +X (to the right, as seen from the front), then around the back.
 */
function makePath(W, T, R) {
  const r = clampR(W, T, R);
  const segs = [];
  const line = (x0, z0, x1, z1, nx, nz) => {
    const len = Math.hypot(x1 - x0, z1 - z0);
    if (len > 1e-9)
      segs.push({ len, at: (t) => ({ x: x0 + (x1 - x0) * t, z: z0 + (z1 - z0) * t, nx, nz }) });
  };
  const arc = (cx, cz, a0, a1) => {
    const len = r * Math.abs(a1 - a0);
    if (len > 1e-9)
      segs.push({
        len,
        at: (t) => {
          const a = a0 + (a1 - a0) * t;
          return { x: cx + r * Math.cos(a), z: cz + r * Math.sin(a), nx: Math.cos(a), nz: Math.sin(a) };
        },
      });
  };
  const hw = W / 2;
  const ht = T / 2;
  line(0, ht, hw - r, ht, 0, 1); // front, right half
  arc(hw - r, ht - r, Math.PI / 2, 0); // front-right corner
  line(hw, ht - r, hw, -ht + r, 1, 0); // right side
  arc(hw - r, -ht + r, 0, -Math.PI / 2); // back-right corner
  line(hw - r, -ht, -hw + r, -ht, 0, -1); // back
  arc(-hw + r, -ht + r, -Math.PI / 2, -Math.PI); // back-left corner
  line(-hw, -ht + r, -hw, ht - r, -1, 0); // left side
  arc(-hw + r, ht - r, Math.PI, Math.PI / 2); // front-left corner
  line(-hw + r, ht, 0, ht, 0, 1); // front, left half

  const P = segs.reduce((a, s) => a + s.len, 0);
  const pointAt = (sIn) => {
    let s = ((sIn % P) + P) % P;
    for (const seg of segs) {
      if (s <= seg.len) return seg.at(seg.len === 0 ? 0 : s / seg.len);
      s -= seg.len;
    }
    return segs[segs.length - 1].at(1);
  };
  return { P, pointAt };
}

/** Solid black device body. */
export function buildBodyGeometry(W, T, R, H) {
  const r = clampR(W, T, R);
  const hw = W / 2;
  const ht = T / 2;
  const shape = new THREE.Shape();
  shape.moveTo(-hw + r, -ht);
  shape.lineTo(hw - r, -ht);
  shape.absarc(hw - r, -ht + r, r, -Math.PI / 2, 0, false);
  shape.lineTo(hw, ht - r);
  shape.absarc(hw - r, ht - r, r, 0, Math.PI / 2, false);
  shape.lineTo(-hw + r, ht);
  shape.absarc(-hw + r, ht - r, r, Math.PI / 2, Math.PI, false);
  shape.lineTo(-hw, -ht + r);
  shape.absarc(-hw + r, -ht + r, r, Math.PI, Math.PI * 1.5, false);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: H, bevelEnabled: false, curveSegments: 16 });
  geo.rotateX(-Math.PI / 2); // extrusion now points up (+Y)
  return geo;
}

/**
 * Sticker strip. SW x SH = sticker size in inches. UV u runs along the sticker
 * width, v up its height, so the printed canvas maps 1:1.
 * If the sticker is longer than the wrap path, the right end sits a hair above
 * the left end (overlap at the back seam); if shorter, a gap shows.
 */
export function buildStickerGeometry({ W, T, R, SW, SH, samples = 480 }) {
  const { P, pointAt } = makePath(W, T, R);
  const pos = new Float32Array((samples + 1) * 2 * 3);
  const nor = new Float32Array((samples + 1) * 2 * 3);
  const uv = new Float32Array((samples + 1) * 2 * 2);
  const idx = [];
  for (let i = 0; i <= samples; i++) {
    const x = (SW * i) / samples;
    const p = x - SW / 2; // p = 0 -> front centre
    const pt = pointAt(p);
    const off = 0.002 + (p > P / 2 ? 0.004 : 0);
    for (let k = 0; k < 2; k++) {
      const v = i * 2 + k;
      pos.set([pt.x + pt.nx * off, k === 0 ? 0 : SH, pt.z + pt.nz * off], v * 3);
      nor.set([pt.nx, 0, pt.nz], v * 3);
      uv.set([x / SW, k], v * 2);
    }
    if (i < samples) {
      const a = i * 2;
      idx.push(a, a + 2, a + 1, a + 2, a + 3, a + 1);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
  geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  geo.setIndex(idx);
  return geo;
}