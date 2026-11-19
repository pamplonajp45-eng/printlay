import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_BLEED_MM, MIN_BLEED_MM, MAX_BLEED_MM,
  DEFAULT_CUT_INSET_MM, MAX_CUT_INSET_MM, DEFAULT_MIN_GAP_MM,
} from "../lib/bleedGeometry";

const KEY = "printlay.bleedSettings.v1";

export const BLEED_DEFAULTS = {
  bleedMm: DEFAULT_BLEED_MM,
  cutInsetMm: DEFAULT_CUT_INSET_MM,
  gapMm: DEFAULT_MIN_GAP_MM,
  marginMm: 5,
  showBleed: false,
  showCutGuide: true,
  allowRotate: true,
  perPreset: {}, // { [presetId]: { bleedMm } }  optional override
};

const clamp = (v, lo, hi, fallback) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : fallback;
};

function sanitize(raw) {
  const s = { ...BLEED_DEFAULTS, ...(raw && typeof raw === "object" ? raw : {}) };
  s.bleedMm = clamp(s.bleedMm, MIN_BLEED_MM, MAX_BLEED_MM, BLEED_DEFAULTS.bleedMm);
  s.cutInsetMm = clamp(s.cutInsetMm, 0, MAX_CUT_INSET_MM, 0);
  s.gapMm = clamp(s.gapMm, 0, 10, BLEED_DEFAULTS.gapMm);
  s.marginMm = clamp(s.marginMm, 0, 20, BLEED_DEFAULTS.marginMm);
  s.showBleed = !!s.showBleed;
  s.showCutGuide = !!s.showCutGuide;
  s.allowRotate = !!s.allowRotate;
  const per = {};
  if (s.perPreset && typeof s.perPreset === "object") {
    for (const [id, v] of Object.entries(s.perPreset)) {
      if (v && Number.isFinite(Number(v.bleedMm))) per[id] = { bleedMm: clamp(v.bleedMm, MIN_BLEED_MM, MAX_BLEED_MM, 0) };
    }
  }
  s.perPreset = per;
  return s;
}

function load() {
  try {
    return sanitize(JSON.parse(localStorage.getItem(KEY)));
  } catch {
    return sanitize(null); // empty/blocked/corrupt storage -> defaults
  }
}

/** The bleed that applies to a given preset: its own override, else the global value. */
export function resolveBleedMm(settings, preset) {
  const own = preset?.id ? settings.perPreset?.[preset.id]?.bleedMm : undefined;
  return own ?? settings.bleedMm;
}

export function useBleedSettings() {
  const [settings, setSettings] = useState(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(settings));
    } catch {
      /* storage full or blocked: keep working in memory */
    }
  }, [settings]);

  const update = useCallback((patch) => setSettings((s) => sanitize({ ...s, ...patch })), []);

  const setPresetBleed = useCallback((presetId, mm) =>
    setSettings((s) => {
      const perPreset = { ...s.perPreset };
      if (mm === null || mm === undefined) delete perPreset[presetId];
      else perPreset[presetId] = { bleedMm: mm };
      return sanitize({ ...s, perPreset });
    }), []);

  return { settings, update, setPresetBleed };
}