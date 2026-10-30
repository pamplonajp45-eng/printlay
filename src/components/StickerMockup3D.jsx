import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { ChevronLeft, ChevronRight, RotateCw, Home } from "lucide-react";
import { cropToCanvas, loadImage } from "../lib/cropEngine";
import { PHOTO_PRESETS } from "../lib/presets";
import {
  buildBodyGeometry,
  buildStickerGeometry,
  wrapLength,
} from "../lib/mockupGeometry";

// W, H from your measurements (inches). T = 0.672 is the thickness that makes a 4.808 in
// sticker wrap exactly once; it is NOT measured. Replace it with the real thickness.
const DEFAULT_DEVICE = { W: 1.835, H: 3.178, T: 0.672, R: 0.12 };

const labelStyle = { fontSize: 12, fontWeight: 600, color: "#57536b", display: "flex", flexDirection: "column", gap: 3 };
const inputStyle = { width: 64, padding: "5px 8px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.12)", fontSize: 12, fontWeight: 700 };
const iconBtn = { border: "none", background: "rgba(143,127,224,0.14)", color: "#57536b", borderRadius: 999, padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700 };

export default function StickerMockup3D({ photos = [], photoPreset, frameBgColor = "#ffffff" }) {
  const mountRef = useRef(null);
  const threeRef = useRef(null);
  const [device, setDevice] = useState(DEFAULT_DEVICE);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [autoRotate, setAutoRotate] = useState(false);
  const [sticker, setSticker] = useState(null); // { canvas, sw, sh }

  const safeIndex = Math.min(photoIndex, Math.max(0, photos.length - 1));

  // 1) Render the selected photo as a sticker canvas (always wide, notch on the bottom)
  useEffect(() => {
    let cancelled = false;
    const photo = photos[safeIndex];
    if (!photo || !photoPreset) {
      setSticker(null);
      return undefined;
    }
    const sw = Math.max(photoPreset.wIn, photoPreset.hIn);
    const sh = Math.min(photoPreset.wIn, photoPreset.hIn);
    const basePreset = PHOTO_PRESETS.find((p) => p.id === photoPreset.id) || photoPreset;
    const wrapPreset = {
      ...photoPreset,
      wIn: sw,
      hIn: sh,
      aspectRatio: sw / sh,
      notch: photoPreset.notch ? { ...photoPreset.notch, edge: "bottom" } : undefined,
      hole: basePreset.hole || photoPreset.hole,
    };
    loadImage(photo.url || photo.dataUrl)
      .then((img) => {
        if (cancelled) return;
        const canvas = cropToCanvas(img, wrapPreset, {
          dpi: 200,
          cropSettings: photo.cropSettings,
          filter: photo.filter || "none",
          filterIntensity: typeof photo.filterIntensity === "number" ? photo.filterIntensity : 1,
          frameBgColor,
          textOverlays: photo.textOverlays || [],
        });
        setSticker({ canvas, sw, sh });
      })
      .catch(console.error);
    return () => {
      cancelled = true;
    };
  }, [photos, safeIndex, photoPreset, frameBgColor]);

  // 2) Scene, camera, lights, controls (created once)
  useEffect(() => {
    const mount = mountRef.current;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(2.8, 2.6, 7.5);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x6a6a80, 1.1));
    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(4, 6, 6);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xbfc8ff, 0.7);
    rim.position.set(-5, 3, -4);
    scene.add(rim);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = 3;
    controls.maxDistance = 14;
    controls.autoRotateSpeed = 2;

    const group = new THREE.Group();
    scene.add(group);

    const resize = () => {
      const w = mount.clientWidth || 300;
      const h = mount.clientHeight || 300;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      controls.update();
      renderer.render(scene, camera);
    };
    loop();

    threeRef.current = { renderer, camera, controls, group };
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      controls.dispose();
      group.traverse((o) => {
        o.geometry?.dispose?.();
        if (o.material) {
          o.material.map?.dispose?.();
          o.material.dispose();
        }
      });
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
      threeRef.current = null;
    };
  }, []);

  // 3) Rebuild the device + wrapped sticker when sizes or the sticker image change
  useEffect(() => {
    const t = threeRef.current;
    if (!t) return;
    const { group, controls, renderer } = t;
    group.traverse((o) => {
      o.geometry?.dispose?.();
      if (o.material) {
        o.material.map?.dispose?.();
        o.material.dispose();
      }
    });
    group.clear();

    const { W, H, T, R } = device;
    const body = new THREE.Mesh(
      buildBodyGeometry(W, T, R, H),
      new THREE.MeshStandardMaterial({ color: 0x141418, roughness: 0.45, metalness: 0.15 })
    );
    group.add(body);

    if (sticker) {
      const tex = new THREE.CanvasTexture(sticker.canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      const strip = new THREE.Mesh(
        buildStickerGeometry({ W, T, R, SW: sticker.sw, SH: sticker.sh }),
        new THREE.MeshStandardMaterial({ map: tex, roughness: 0.3, metalness: 0, alphaTest: 0.5 })
      );
      group.add(strip);
    }
    controls.target.set(0, H / 2, 0);
    controls.update();
  }, [device, sticker]);

  useEffect(() => {
    if (threeRef.current) threeRef.current.controls.autoRotate = autoRotate;
  }, [autoRotate]);

  const resetView = () => {
    const t = threeRef.current;
    if (!t) return;
    t.camera.position.set(0, device.H / 2 + 0.3, 8);
    t.controls.target.set(0, device.H / 2, 0);
    t.controls.update();
  };

  const setDim = (key) => (e) => {
    const v = parseFloat(e.target.value);
    if (Number.isFinite(v) && v > 0) setDevice((d) => ({ ...d, [key]: v }));
  };

  // Does the sticker fit around the device?
  const P = wrapLength(device.W, device.T, device.R);
  const diff = sticker ? sticker.sw - P : 0;
  const fitText = !sticker
    ? ""
    : Math.abs(diff) < 0.02
      ? "Wrap fits exactly."
      : diff > 0
        ? `Sticker is ${diff.toFixed(2)} in longer than the wrap. It overlaps at the back seam.`
        : `Sticker is ${(-diff).toFixed(2)} in shorter than the wrap. A gap shows at the back.`;

  return (
    <div className="glass-card" style={{ padding: 16, marginBottom: 20 }}>
      <div
        ref={mountRef}
        style={{
          width: "100%",
          height: 340,
          borderRadius: 16,
          overflow: "hidden",
          background: "radial-gradient(circle at 50% 35%, #ffffff 0%, #dcd9ee 100%)",
          cursor: "grab",
        }}
      />

      {photos.length === 0 && (
        <p style={{ fontSize: 12, color: "#7c7893", margin: "10px 0 0" }}>
          Upload a photo to see it wrapped on the device.
        </p>
      )}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginTop: 12 }}>
        {photos.length > 1 && (
          <>
            <button type="button" style={iconBtn} onClick={() => setPhotoIndex((safeIndex - 1 + photos.length) % photos.length)} title="Previous photo">
              <ChevronLeft size={14} />
            </button>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#3d3856" }}>
              {safeIndex + 1} / {photos.length}
            </span>
            <button type="button" style={iconBtn} onClick={() => setPhotoIndex((safeIndex + 1) % photos.length)} title="Next photo">
              <ChevronRight size={14} />
            </button>
          </>
        )}
        <button type="button" style={{ ...iconBtn, background: autoRotate ? "#8f7fe0" : iconBtn.background, color: autoRotate ? "#fff" : iconBtn.color }} onClick={() => setAutoRotate((v) => !v)}>
          <RotateCw size={13} /> Spin
        </button>
        <button type="button" style={iconBtn} onClick={resetView}>
          <Home size={13} /> Front
        </button>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
        {[
          ["T", "Thickness"],
          ["W", "Width"],
          ["H", "Height"],
          ["R", "Corner"],
        ].map(([key, label]) => (
          <label key={key} style={labelStyle}>
            {label} (in)
            <input type="number" step="0.005" min="0.05" value={device[key]} onChange={setDim(key)} style={inputStyle} />
          </label>
        ))}
      </div>

      <p style={{ fontSize: 12, color: "#57536b", margin: "10px 0 0", lineHeight: 1.5 }}>
        {fitText && <strong>{fitText} </strong>}
        Drag to rotate, scroll to zoom. Thickness is a guess until you measure the real device.
        {photoPreset && !photoPreset.notch && !photoPreset.hole && " Pick the Name Tag Decal size to see the real wrap."}
      </p>
    </div>
  );
}